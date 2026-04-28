// src/middleware/request-logger.middleware.js
export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();

  req.logger.info(
    {
      method: req.method,
      url: req.originalUrl,
    },
    "Request received",
  );

  res.on("finish", () => {
    req.logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: Date.now() - start,
      },
      "Request completed",
    );
  });

  next();
};


// export const requestLoggerMiddleware = (req, res, next) => {
//   const start = Date.now();

//   req.logger.info(
//     {
//       module: "REQUEST",
//       metadata: {
//         method: req.method,
//         url: req.originalUrl,
//       },
//     },
//     "Request received"
//   );

//   const logCompletion = () => {
//     req.logger.info(
//       {
//         module: "REQUEST",
//         metadata: {
//           method: req.method,
//           url: req.originalUrl,
//           statusCode: res.statusCode,
//           responseTime: Date.now() - start,
//         },
//       },
//       "Request completed"
//     );
//   };

//   res.on("finish", logCompletion);
//   res.on("close", logCompletion); // fallback for aborted requests

//   next();
// };