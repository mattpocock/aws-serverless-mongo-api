export const clientError = err => [
  null,
  {
    statusCode: 400,
    body: JSON.stringify({
      errors: err.details,
    }),
  },
];
export const singleClientError = err => [
  null,
  {
    statusCode: 400,
    body: JSON.stringify({
      errors: [
        {
          message: err,
        },
      ],
    }),
  },
];

export const success = body => [
  null,
  {
    statusCode: 200,
    body: JSON.stringify(body),
  },
];

export const serverError = err => [
  err,
  {
    statusCode: 500,
    body: JSON.stringify(err),
  },
];
