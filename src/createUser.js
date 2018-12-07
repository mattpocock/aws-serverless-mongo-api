import Joi from 'joi';
import { ObjectID } from 'mongodb';
import { clientError, success, serverError } from './utils/responses';
import getParams from './utils/getParams';
import connectToDb from './utils/connectToDb';

const defaultUser = params => ({
  goals: [],
  events: [],
  ...params,
});

export default (event, context, callback) => {
  const schema = {
    email: Joi.string()
      .email()
      .required(),
    id: Joi.string().required(),
  };

  Joi.validate(getParams(event), schema, (validationError, body) => {
    if (validationError) {
      callback(...clientError(validationError));
    } else {
      connectToDb()
        .then(client => {
          const db = client.db();
          const users = db.collection('users');
          const id = ObjectID();
          users.insertOne(defaultUser({ ...body, id }), insertError => {
            if (insertError) {
              callback(...serverError(insertError));
            } else {
              callback(...success({ userId: id, success: true }));
            }
            client.close();
          });
        })
        .catch(connectionError => {
          callback(connectionError);
        });
    }
  });
};
