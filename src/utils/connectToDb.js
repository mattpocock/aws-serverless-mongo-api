import { MongoClient } from 'mongodb';
import { user, password, suffix } from '../../secrets.json';

const url = `mongodb://${user}:${password}${suffix}`;

export default () =>
  new Promise((resolve, reject) => {
    MongoClient.connect(
      url,
      async (err, client) => {
        if (err) {
          reject(err);
        } else {
          resolve(client);
        }
      }
    );
  });
