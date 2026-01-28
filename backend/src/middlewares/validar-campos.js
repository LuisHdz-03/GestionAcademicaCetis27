const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors.mapped(),
    });
  }
  next();
};

module.exports = {
  validarCampos,
};
