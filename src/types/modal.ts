export interface AlumnoFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  numeroControl: string;
  idEspecialidad: number;
  idGrupo?: number;
  direccion?: string;
  semestreActual: number;
  fechaIngreso?: string;
  activo: boolean;
  password: string;
}

export interface DocenteFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  numeroEmpleado: string;
  especialidad: string;
  fechaContratacion: string;
  activo: boolean;
  password: string;
}

export interface AdminFormData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  numeroEmpleado: string;
  cargo: string;
  activo: boolean;
  password: string;
}

export interface GrupoFormData {
  codigo: string;
  semestre: number;
  aula: string;
  idEspecialidad: number;
  idPeriodo: number;
  idDocente: number;
  idMateria: number;
  activo: boolean;
}

export interface MateriaFormData {
  nombre: string;
  codigo: string;
  creditos: number;
  horasTeoria: number;
  horasPractica: number;
  idEspecialidad: number;
  activo: boolean;
}

export interface EspecialidadFormData {
  nombre: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}
