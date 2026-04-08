export interface AlumnoFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string;
  telefono: string;
  fechaNacimiento?: string;
  curp: string;
  numeroControl: string;
  idEspecialidad: number;
  idGrupo?: number;
  direccion?: string;
  semestreActual: number;
  fechaIngreso?: string;
  credencialFechaEmision?: string;
  credencialFechaExpiracion?: string;
  tutor?: {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    email?: string;
    parentesco?: string;
    direccion?: string;
  };
  activo: boolean;
  password?: string;
}

export interface DocenteFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string;
  telefono: string;
  fechaNacimiento?: string;
  curp: string;
  numeroEmpleado: string;
  especialidad: string;
  fechaContratacion?: string;
  activo: boolean;
  password?: string;
}

export interface AdminFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string;
  telefono: string;
  fechaNacimiento?: string;
  curp: string;
  numeroEmpleado: string;
  cargo: string;
  area?: string;
  activo: boolean;
  password?: string;
}

export interface GrupoFormData {
  codigo: string;
  semestre: number;
  turno: "MATUTINO" | "VESPERTINO" | "MIXTO";
  aula: string;
  idEspecialidad: number;
  idPeriodo: number;
  idDocente: number;
  docenteTutorId?: number;
  idMaterias: number[]; // Cambiado para soportar varias materias
  activo: boolean;
}

export interface MateriaFormData {
  nombre: string;
  codigo: string;
  semestre?: number;
  horas?: number;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  idEspecialidad: number;
  activo: boolean;
}

export interface EspecialidadFormData {
  nombre: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}
