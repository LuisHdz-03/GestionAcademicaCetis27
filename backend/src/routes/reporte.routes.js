const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reporteController = require('../controllers/reporte.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Rutas para reportes
router
  .route('/')
  .get(reporteController.getReportes)
  .post(
    [
      check('idEstudiante', 'El ID del estudiante es requerido').isInt(),
      check('tipo', 'El tipo de reporte es requerido').notEmpty(),
      check('titulo', 'El título es requerido').notEmpty(),
      check('descripcion', 'La descripción es requerida').notEmpty(),
    ],
    reporteController.createReporte
  );

router
  .route('/:id')
  .get(reporteController.getReporte)
  .put(reporteController.updateReporte)
  .delete(reporteController.deleteReporte);

module.exports = router;
