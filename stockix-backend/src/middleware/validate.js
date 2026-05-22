const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(function(e) {
        return { field: e.path, message: e.msg };
      })
    });
  }
  next();
}

module.exports = validate;