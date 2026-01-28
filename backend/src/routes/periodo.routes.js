const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const periodoController = require('../controllers/periodo.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/activo', periodoController.getPeriodoActivo);

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(periodoController.getPeriodos)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty().trim(),
      check('fechaInicio', 'La fecha de inicio es requerida').notEmpty().isISO8601().withMessage('Formato de fecha inválido'),
      check('fechaFin', 'La fecha de fin es requerida').notEmpty().isISO8601().withMessage('Formato de fecha inválido'),
      validarCampos,
    ],
    periodoController.crearPeriodo
  );

router
  .route('/:id')
  .put(
    [
      check('nombre', 'El nombre no puede estar vacío').optional().notEmpty().trim(),
      check('fechaInicio', 'Formato de fecha inválido').optional().isISO8601(),
      check('fechaFin', 'Formato de fecha inválido').optional().isISO8601(),
      check('activo', 'El valor de activo debe ser booleano').optional().isBoolean(),
      validarCampos,
    ],
    periodoController.actualizarPeriodo
  )
  .delete(periodoController.eliminarPeriodo);

module.exports = router;
