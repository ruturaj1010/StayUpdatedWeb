const { body, validationResult } = require('express-validator');

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
  .isLength({ min: 8, max: 16 })
  .withMessage('Password must be between 8 and 16 characters')
  .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/)
  .withMessage('Password must contain at least one uppercase letter and one special character');

const nameValidation = body('name')
  .isLength({ min: 20, max: 60 })
  .withMessage('Name must be between 20 and 60 characters')
  .trim()
  .escape();

const addressValidation = body('address')
  .isLength({ max: 400 })
  .withMessage('Address must not exceed 400 characters')
  .trim()
  .escape();

const roleValidation = body('role')
  .isIn(['USER', 'STORE_OWNER', 'ADMIN'])
  .withMessage('Role must be one of: USER, STORE_OWNER, ADMIN');

// Validation rule sets
const signupValidation = [
  emailValidation,
  passwordValidation,
  nameValidation,
  addressValidation
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation
];

const userUpdateValidation = [
  nameValidation,
  addressValidation,
  roleValidation
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  signupValidation,
  loginValidation,
  changePasswordValidation,
  userUpdateValidation,
  handleValidationErrors
};
