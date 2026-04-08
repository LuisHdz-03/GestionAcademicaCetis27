// Tipos para la comunidad escolar

export interface UsuarioBase {
  idUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  curp?: string;
  activo?: boolean;
}

export interface Tutor {
  idTutor?: number;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  email?: string;
  parentesco?: string;
  direccion?: string;
}

export interface Alumno {
  id: number;
  idEstudiante: number;
  idUsuario?: number;
  usuario: UsuarioBase;
  matricula: string;
  especialidad?: string;
  semestre: number;
  idGrupo?: number;
  grupo?: string | { idGrupo?: number; nombre?: string };
  activo: boolean;
  direccion?: string;
  fechaIngreso?: string;
  credencialFechaEmision?: string | null;
  credencialFechaExpiracion?: string | null;
  tutor?: Tutor | null;
  fotoUrl?: string;
  datosVerificados?: boolean;
  idEspecialidad?: number;
}

export interface Docente {
  id: number;
  idDocente: number;
  idUsuario?: number;
  usuario: UsuarioBase;
  numeroEmpleado: string;
  especialidad: string;
  activo: boolean;
  fechaContratacion?: string;
}

export interface Admin {
  id: number;
  idAdministrativo: number;
  idUsuario?: number;
  usuario: UsuarioBase;
  numeroEmpleado: string;
  cargo: string;
  area?: string;
  activo: boolean;
  firmaImagenUrl?: string;
}

export interface Grupo {
  id: number;
  idGrupo: number;
  codigo: string;
  semestre: number;
  turno?: string;
  aula: string;
  idEspecialidad: number;
  especialidad?: { idEspecialidad?: number; nombre?: string; codigo?: string };
  especialidadNombre?: string;
  especialidadCodigo?: string;
  idPeriodo: number;
  idDocente: number;
  docenteNombre?: string;
  docenteTutorId?: number;
  idMateria?: number;
  idMaterias?: number[];
  materiaNombre?: string;
  activo: boolean;
  integrantes?: number;
  fechaCreacion?: string;
  fechaEdicion?: string;
}

export type CommunityMember = Alumno | Docente | Admin | Grupo;
