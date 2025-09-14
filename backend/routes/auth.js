const express = require('express');
const authController = require('../controllers/authController');
const { 
  signupValidation, 
  loginValidation, 
  changePasswordValidation, 
  handleValidationErrors 
} = require('../utils/validation');

const router = express.Router();

// Routes
router.post('/signup', signupValidation, handleValidationErrors, authController.signup);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.post('/change-password', changePasswordValidation, handleValidationErrors, authController.changePassword);

module.exports = router;
