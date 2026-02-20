// Tipos para la comunidad escolar

export interface Alumno {
  id: number;
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
}

export interface Grupo {
  id: number;
  codigo: string;
  semestre: number;
  aula: string;
  idEspecialidad: number;
  especialidadNombre?: string;
  especialidadCodigo?: string;
  idPeriodo: number;
  idDocente: number;
  docenteNombre?: string;
  idMateria: number;
  materiaNombre?: string;
  activo: boolean;
  integrantes?: number;
  fechaCreacion?: string;
  fechaEdicion?: string;
}

export type CommunityMember = Alumno | Docente | Admin | Grupo;
