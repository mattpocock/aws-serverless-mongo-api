import Joi from 'joi';
import { ObjectID } from 'mongodb';
import {
  clientError,
  success,
  serverError,
  singleClientError,
} from './utils/responses';
import getParams from './utils/getParams';
import connectToDb from './utils/connectToDb';

export default (event, context, callback) => {
  const eventArraySchema = Joi.array()
    .items(
      Joi.object().keys({
        date: Joi.string()
          .regex(
            /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/,
            `YYYY-MM-DD`
          )
          .required(),
        goalId: Joi.string().required(),
      })
    )
    .required();
  const schema = {
    userId: Joi.string().required(),
    eventsToAdd: eventArraySchema,
    eventIdsToRemove: Joi.array()
      .items(Joi.string())
      .required(),
  };

  Joi.validate(
    getParams(event),
    schema,
    async (err, { userId, eventsToAdd = [], eventIdsToRemove = [] }) => {
      if (err) {
        callback(...clientError(err));
      } else {
        try {
          const client = await connectToDb();
          const users = client.db().collection('users');
          const user = await users.findOne({ id: userId });
          if (!user) {
            callback(...singleClientError(`Could not find user`));
            client.close();
            return;
          }

          if (!user.goals || user.goals.length === 0) {
            callback(...singleClientError(`User has no goals configured`));
            client.close();
            return;
          }

          const goalIds = user.goals.map(({ id }) => `${id}`);

          const errors = eventsToAdd.filter(
            ({ goalId }) => !goalIds.includes(goalId)
          );

          if (errors.length > 0) {
            callback(
              ...singleClientError(
                `Goal id ${errors[0].goalId} does not exist on this user`
              )
            );
            client.close();
            return;
          }

          const newEvents = [
            ...user.events,
            ...eventsToAdd.map(eventToAdd => ({
              ...eventToAdd,
              id: ObjectID(),
            })),
          ];

          const update = await users.updateOne(
            { id: userId },
            {
              $set: {
                events: newEvents.filter(
                  ({ id, goalId }) =>
                    id &&
                    !eventIdsToRemove.includes(`${id}`) &&
                    goalIds.includes(goalId)
                ),
              },
            }
          );

          if (update.result.ok !== 1) {
            callback(...serverError());
            return;
          }

          callback(...success({ success: true }));
        } catch (e) {
          callback(...serverError(e));
        }
      }
    }
  );
};
