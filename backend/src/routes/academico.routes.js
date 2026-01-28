const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const controller = require('../controllers/academico.controller');

// proteger todas las rutas
router.use(protect);

// Materias
router
  .route('/materias')
  .get(controller.getMaterias)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('codigo', 'El código es requerido').notEmpty(),
    ],
    controller.createMateria
  );

router
  .route('/materias/:id')
  .put(controller.updateMateria)
  .delete(controller.deleteMateria);

// Grupos
router
  .route('/grupos')
  .get(controller.getGrupos)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('codigo', 'El código es requerido').notEmpty(),
    ],
    controller.createGrupo
  );

router
  .route('/grupos/:id')
  .put(controller.updateGrupo)
  .delete(controller.deleteGrupo);

module.exports = router;


