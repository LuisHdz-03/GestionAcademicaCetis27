export interface TutorFamiliar {
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  telefono?: string;
  parentesco?: string;
  email?: string;
  direccion?: string;
}

export interface Alumno {
  id: number;
  idEstudiante?: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  matricula: string;
  especialidad: string;
  semestre: number;
  idGrupo?: number;
  grupo?: string;
  idEspecialidad: number;
  telefono?: string;
  nombreTutor?: string;
  nombrePapaMamaTutor?: string;
  tutor?: TutorFamiliar | null;
  usuario?: {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    email?: string;
  };
}

export interface Reporte {
  idReporte: number;
  nombreEstudiante: string;
  matriculaEstudiante: string;
  especialidadEstudiante: string;
  grupoEstudiante: string | null;
  tipo: string;
  titulo: string;
  descripcion: string;
  acciones: string;
  gravedad: string;
  fechaReporte: string;
  estatus: string;
  reportadoPor?: string;
  tutorHistorico?: any;
}
