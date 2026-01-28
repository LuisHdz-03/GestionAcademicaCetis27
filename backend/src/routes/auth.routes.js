const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Rutas públicas
router.post(
  '/login',
  [
    check('email', 'Por favor ingrese un email válido').isEmail(),
    check('password', 'La contraseña es requerida').notEmpty(),
  ],
  authController.login
);

// Rutas protegidas
router.get('/me', protect, authController.getMe);

module.exports = router;
