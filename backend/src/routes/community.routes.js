const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const communityController = require('../controllers/community.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// Rutas para docentes
router
  .route('/docentes')
  .get(communityController.getDocentes)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('apellidoPaterno', 'El apellido paterno es requerido').notEmpty(),
      check('email', 'El email es requerido').isEmail(),
      check('password', 'La contraseña es requerida').notEmpty(),
      check('numeroEmpleado', 'El número de empleado es requerido').notEmpty(),
      check('especialidad', 'La especialidad es requerida').notEmpty(),
      check('fechaContratacion', 'La fecha de contratación es requerida').isISO8601(),
    ],
    communityController.createDocente
  );

router
  .route('/docentes/:id')
  .get(communityController.getDocente)
  .put(communityController.updateDocente)
  .delete(communityController.deleteDocente);

// Rutas para alumnos
router
  .route('/alumnos')
  .get(communityController.getAlumnos)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('apellidoPaterno', 'El apellido paterno es requerido').notEmpty(),
      check('email', 'El email es requerido').isEmail(),
      check('password', 'La contraseña es requerida').notEmpty(),
      check('numeroControl', 'El número de control es requerido').notEmpty(),
      check('idEspecialidad', 'La especialidad es requerida').isInt(),
      check('curp', 'La CURP es requerida').notEmpty(),
      check('fechaNacimiento', 'La fecha de nacimiento es requerida').isISO8601(),
      check('semestreActual', 'El semestre actual es requerido').isInt({ min: 1, max: 12 }),
    ],
    communityController.createAlumno
  );

router
  .route('/alumnos/:id')
  .get(communityController.getAlumno)
  .put(communityController.updateAlumno)
  .delete(communityController.deleteAlumno);

// Rutas para administradores
router
  .route('/administradores')
  .get(communityController.getAdministradores)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('apellidoPaterno', 'El apellido paterno es requerido').notEmpty(),
      check('email', 'El email es requerido').isEmail(),
      check('password', 'La contraseña es requerida').notEmpty(),
      check('numeroEmpleado', 'El número de empleado es requerido').notEmpty(),
      check('cargo', 'El cargo es requerido').notEmpty(),
    ],
    communityController.createAdministrador
  );

router
  .route('/administradores/:id')
  .get(communityController.getAdministrador)
  .put(communityController.updateAdministrador)
  .delete(communityController.deleteAdministrador);

// Rutas para especialidades
router
  .route('/especialidades')
  .get(communityController.getEspecialidades)
  .post(
    [
      check('nombre', 'El nombre es requerido').notEmpty(),
      check('codigo', 'El código es requerido').notEmpty(),
    ],
    communityController.createEspecialidad
  );

router
  .route('/especialidades/:id')
  .put(communityController.updateEspecialidad)
  .delete(communityController.deleteEspecialidad);

// Rutas para grupos
router
  .route('/grupos')
  .get(communityController.getGrupos)
  .post(
    [
      check('codigo', 'El código es requerido').notEmpty(),
      check('semestre', 'El semestre es requerido').isInt({ min: 1, max: 12 }),
      check('idEspecialidad', 'La especialidad es requerida').isInt(),
      check('idPeriodo', 'El periodo es requerido').isInt(),
      check('idDocente', 'El docente es requerido').isInt(),
      check('idMateria', 'La materia es requerida').isInt(),
    ],
    communityController.createGrupo
  );

router
  .route('/grupos/:id')
  .get(communityController.getGrupo)
  .put(communityController.updateGrupo)
  .delete(communityController.deleteGrupo);

module.exports = router;
