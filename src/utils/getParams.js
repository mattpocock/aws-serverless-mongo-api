export default ({
  queryStringParameters = {},
  pathParameters = {},
  body = '{}',
}) => ({
  ...queryStringParameters,
  ...pathParameters,
  ...(body ? JSON.parse(body) : {}),
});
