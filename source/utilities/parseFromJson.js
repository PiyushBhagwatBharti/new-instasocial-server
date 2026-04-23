export const jsonParser = (...fields) => {
  return (req, res, next) => {
    try {
      fields.forEach((field) => {
        if (req.body?.[field]) {
          // Only parse if it's a string
          if (typeof req.body[field] === "string") {
            req.body[field] = JSON.parse(req.body[field]);
          }
        }
      });

      // console.log(req.body);
      next();
    } catch (err) {
      return res.status(400).json({
        message: "Invalid JSON in form-data",
        error: err.message,
      });
    }
  };
};
