// Tipos para la comunidad escolar

export interface Alumno {
  id: number;
  idEstudiante?: number;
  idUsuario?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  matricula: string; 
  especialidad: string;
  semestre: number;
  idGrupo?: number;
  grupo?: string;
  activo: boolean;
  direccion?: string;
  fechaIngreso?: string;
}

export interface Docente {
  id: number;
  idDocente?: number;
  idUsuario?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  numeroEmpleado: string;
  especialidad: string;
  activo: boolean;
  fechaContratacion?: string;
}

export interface Admin {
  id: number;
  idAdministrativo?: number;
  idUsuario?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  curp: string;
  numeroEmpleado: string;
  cargo: string;
  area?: string;
  activo: boolean;
}

export interface Grupo {
  id: number;
  idGrupo?: number;
  codigo: string;
  semestre: number;
  turno?: string;
  aula: string;
  idEspecialidad: number;
  especialidadNombre?: string;
  especialidadCodigo?: string;
  idPeriodo: number;
  idDocente: number;
  docenteNombre?: string;
  idMateria?: number;
  idMaterias?: number[];
  materiaNombre?: string;
  activo: boolean;
  integrantes?: number;
  fechaCreacion?: string;
  fechaEdicion?: string;
}

export type CommunityMember = Alumno | Docente | Admin | Grupo;
