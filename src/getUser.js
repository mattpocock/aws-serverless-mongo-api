import Joi from 'joi';
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
    userId: Joi.string().required(),
  };

  Joi.validate(getParams(event), schema, async (err, { userId }) => {
    if (err) {
      callback(...clientError(err));
    } else {
      try {
        const client = await connectToDb();
        const user = await client
          .db()
          .collection('users')
          .findOne({ id: userId });
        if (!user) {
          callback(...singleClientError(`User could not be found`));
          client.close();
          return;
        }
        const { id, goals, events, email } = user;
        callback(...success({ id, goals, events, email }));
        client.close();
      } catch (e) {
        callback(...serverError(e));
      }
    }
  });
};
