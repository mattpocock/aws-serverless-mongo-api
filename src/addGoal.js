import Joi from 'joi';
import { ObjectID } from 'mongodb';
import { clientError, success, serverError } from './utils/responses';
import getParams from './utils/getParams';
import connectToDb from './utils/connectToDb';

export default (event, context, callback) => {
  const schema = {
    userId: Joi.string().required(),
    goal: Joi.object()
      .keys({
        name: Joi.string().required(),
        frequencyId: Joi.number()
          .integer()
          .min(1)
          .max(3)
          .required(),
      })
      .required(),
  };

  Joi.validate(getParams(event), schema, async (err, { userId, goal }) => {
    if (err) {
      callback(...clientError(err));
    } else {
      try {
        const client = await connectToDb();
        const collection = client.db().collection('users');
        const user = await collection.findOne({ id: userId });
        if (!user) {
          callback(
            ...clientError({
              details: [
                { message: `User could not be found with id ${userId}` },
              ],
            })
          );
          return;
        }
        await collection.updateOne(
          { id: userId },
          { $set: { goals: [...user.goals, { ...goal, id: ObjectID() }] } }
        );

        callback(...success({ success: true }));
      } catch (e) {
        callback(...serverError(e));
      }
    }
  });
};
