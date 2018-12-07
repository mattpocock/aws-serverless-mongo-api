import Joi from 'joi';
import assert from 'assert';
import {
  clientError,
  success,
  serverError,
  singleClientError,
} from './utils/responses';
import getParams from './utils/getParams';
import connectToDb from './utils/connectToDb';

export default (event, context, callback) => {
  const schema = {
    goalId: Joi.string().required(),
    userId: Joi.string().required(),
  };

  Joi.validate(getParams(event), schema, async (err, { userId, goalId }) => {
    if (err) {
      callback(...clientError(err));
    } else {
      try {
        const client = await connectToDb();
        const collection = client.db().collection('users');
        const user = await collection.findOne({ id: userId });
        if (!user) {
          callback(
            ...singleClientError(`User could not be found with id ${userId}`)
          );
          client.close();
          return;
        }
        assert(user && user.goals && goalId);
        if (user.goals.findIndex(({ id }) => `${id}` === goalId) === -1) {
          callback(
            ...singleClientError(
              `Goal with id ${goalId} could not be found on user ${userId}`
            )
          );
          client.close();
          return;
        }
        await collection.updateOne(
          { id: userId },
          {
            $set: {
              goals: user.goals.filter(
                oldGoal => oldGoal.id && `${oldGoal.id}` !== goalId
              ),
            },
          }
        );
        callback(...success({ success: true }));
      } catch (e) {
        callback(...serverError(e));
      }
    }
  });
};
