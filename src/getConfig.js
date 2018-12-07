import { success } from './utils/responses';

export default (event, context, callback) => {
  callback(
    ...success({
      frequencyIds: [
        {
          label: 'Daily',
          value: 1,
        },
        {
          label: 'Weekly',
          value: 2,
        },
        {
          label: 'Monthly',
          value: 3,
        },
      ],
    })
  );
};
