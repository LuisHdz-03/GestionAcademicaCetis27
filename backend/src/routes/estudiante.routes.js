const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { validarCampos } = require("../middlewares/validar-campos");
const { validarJWT, esGuardia } = require("../middlewares/validar-jwt");
const estudianteController = require("../controllers/estudiante.controller");

// Ruta para buscar un estudiante por número de control
router.get(
  "/buscar/:numeroControl",
  [
    validarJWT,
    esGuardia,
    check("numeroControl", "El número de control es requerido").not().isEmpty(),
    validarCampos,
  ],
  estudianteController.buscarPorNumeroControl,
);

// Ruta para registrar la asistencia de un estudiante
router.post(
  "/:idEstudiante/asistencia",
  [
    validarJWT,
    esGuardia,
    check("idUsuarioRegistro", "El ID del usuario que registra es requerido")
      .not()
      .isEmpty(),
    check("tipo", "El tipo de registro es requerido").isIn([
      "entrada",
      "salida",
    ]),
    validarCampos,
  ],
  estudianteController.registrarAsistencia,
);

// Ruta para carga masiva de estudiantes desde CSV
router.post(
  "/carga-masiva",
  [
    validarJWT,
    check("alumnos", "El array de alumnos es requerido").isArray(),
    check("alumnos", "El array de alumnos no puede estar vacío")
      .not()
      .isEmpty(),
    validarCampos,
  ],
  estudianteController.cargaMasiva,
);

module.exports = router;
