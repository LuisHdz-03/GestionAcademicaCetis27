import { useState, useEffect } from "react";
import { useToast } from "./useToast";
import {
  CommunityMember,
  Docente,
  Alumno,
  Admin,
  Grupo,
} from "@/types/community";
import {
  DocenteFormData,
  AlumnoFormData,
  AdminFormData,
  GrupoFormData,
} from "@/types/modal";
import { headers } from "next/headers";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
}
interface Periodo {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
  semestre?: number;
  totalHoras: number;
  idEspecialidad?: number;
  especialidadNombre?: string;
  activo: boolean;
}
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

interface UseCommunityReturn {
  docentes: Docente[];
  alumnos: Alumno[];
  administradores: Admin[];
  grupos: Grupo[];
  especialidades: Especialidad[];
  periodos: Periodo[];
  materias: Materia[];
  clases: any[];
  loading: boolean;
  error: string | null;

  fetchDocentes: () => Promise<void>;
  fetchAlumnos: () => Promise<void>;
  fetchAdministradores: () => Promise<void>;
  fetchGrupos: () => Promise<void>;
  fetchEspecialidades: () => Promise<void>;
  fetchPeriodos: () => Promise<void>;
  fetchMaterias: () => Promise<void>;
  fetchClases: () => Promise<void>;
  createEspecialidad: (data: {
    nombre: string;
    codigo: string;
    descripcion: string;
  }) => Promise<boolean>;
  updateEspecialidad: (
    id: number,
    data: {
      nombre?: string;
      codigo?: string;
      descripcion?: string;
      activo?: boolean;
    },
  ) => Promise<boolean>;
  deleteEspecialidad: (id: number) => Promise<boolean>;
  createDocente: (data: DocenteFormData) => Promise<boolean>;
  updateDocente: (
    id: number,
    data: Partial<DocenteFormData>,
  ) => Promise<boolean>;
  deleteDocente: (id: number) => Promise<boolean>;
  createAlumno: (data: AlumnoFormData) => Promise<boolean>;
  updateAlumno: (id: number, data: Partial<AlumnoFormData>) => Promise<boolean>;
  updateAlumnoExtra: (
    id: number,
    data: {
      fotoUrl?: string;
      datosVerificados?: boolean;
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
    },
  ) => Promise<boolean>;
  deleteAlumno: (id: number) => Promise<boolean>;
  createAdministrador: (data: AdminFormData) => Promise<boolean>;
  updateAdministrador: (
    id: number,
    data: Partial<AdminFormData>,
  ) => Promise<boolean>;
  deleteAdministrador: (id: number) => Promise<boolean>;
  createGrupo: (data: GrupoFormData) => Promise<boolean>;
  updateGrupo: (id: number, data: Partial<GrupoFormData>) => Promise<boolean>;
  deleteGrupo: (id: number) => Promise<boolean>;
  asignarClase: (data: {
    grupoId: number;
    materiaId: number;
    docenteId: number;
    horario: string;
  }) => Promise<boolean>;
  editarClase: (
    id: number,
    data: {
      grupoId: number;
      materiaId: number;
      docenteId: number;
      horario: string;
    },
  ) => Promise<boolean>;
  eliminarClase: (id: number) => Promise<boolean>;
  cerrarPeriodo: (idPeriodo: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

export function useCommunity(): UseCommunityReturn {
  const { toast } = useToast();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [administradores, setAdministradores] = useState<Admin[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // 1. Obtener Docentes
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/docentes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener docentes");

      const result = await response.json();

      // Ajustamos el mapeo para leer los datos aplanados del back
      const docentesMapeados = result.map((d: any) => {
        const rawEsp = d.especialidad ?? d.especialidadNombre ?? d.Especialidad;
        const espNombre =
          typeof rawEsp === "string" ? rawEsp : (rawEsp?.nombre ?? "");

        return {
          id: d.id,
          nombre: d.nombre,
          apellidoPaterno: d.apellidoPaterno,
          apellidoMaterno: d.apellidoMaterno,
          email: d.email,
          telefono: d.telefono,
          fechaNacimiento: d.fechaNacimiento,
          curp: d.curp,
          numeroEmpleado: d.numeroEmpleado,
          especialidad:
            espNombre && espNombre !== "General" ? espNombre : "Sin Asignar",
          fechaContratacion: d.fechaContratacion,
          activo: d.activo,
        };
      });

      setDocentes(docentesMapeados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 2. Obtener Alumnos
  const fetchAlumnos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/estudiantes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener alumnos");

      const result = await response.json();

      const alumnosMapeados = result.map((a: any) => ({
        id: a.idEstudiante || a.id,
        nombre: a.nombre || a.usuario?.nombre || "",
        apellidoPaterno: a.apellidoPaterno || a.usuario?.apellidoPaterno || "",
        apellidoMaterno: a.apellidoMaterno || a.usuario?.apellidoMaterno || "",
        email: a.email || a.usuario?.email || "",
        telefono: a.telefono || a.usuario?.telefono || "",
        fechaNacimiento: a.fechaNacimiento || a.usuario?.fechaNacimiento || "",
        curp: a.curp || a.usuario?.curp || "",
        matricula: a.matricula || "",
        semestre: a.semestre || 1,
        fechaIngreso: a.fechaIngreso || "",
        idEspecialidad:
          a.especialidad?.idEspecialidad || a.grupo?.especialidadId || 0,

        especialidad:
          a.especialidad?.nombre ||
          a.grupo?.especialidad?.nombre ||
          "Sin Asignar",
        idGrupo: a.grupoId || a.idGrupo || 0,
        grupo: a.grupo?.nombre || "Sin Grupo",
        activo: a.activo ?? a.usuario?.activo ?? true,
        direccion: a.direccion || a.usuario?.direccion || "",
        fotoUrl: a.fotoUrl || "",
        datosVerificados: a.datosVerificados || false,
        credencialFechaEmision: a.credencialFechaEmision || null,
        credencialFechaExpiracion: a.credencialFechaExpiracion || null,
        tutor: a.tutor || null,
      }));

      setAlumnos(alumnosMapeados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 3. Obtener Administradores
  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/administrativos`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener administradores");

      const result = await response.json();

      const adminMapeados = result.map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        apellidoPaterno: a.apellidoPaterno || "",
        apellidoMaterno: a.apellidoMaterno || "",
        email: a.email,
        telefono: a.telefono || "N/A",
        fechaNacimiento: a.fechaNacimiento || "N/A",
        curp: a.curp || "N/A",
        numeroEmpleado: a.numeroEmpleado,
        cargo: a.cargo,
        area: a.area,
        activo: a.activo,
      }));

      setAdministradores(adminMapeados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 4. Obtener Especialidades
  const fetchEspecialidades = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/especialidades`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener especialidades");

      const result = await response.json();
      const especialidadesRaw = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const espeMapeadas = especialidadesRaw.map((e: any) => ({
        id: e.idEspecialidad ?? e.id,
        nombre: e.nombre,
        codigo: e.codigo || e.clave || e.nombre.substring(0, 3).toUpperCase(),
        descripcion: e.descripcion ?? e.detalle ?? "",
        activo: e.activo ?? true,
      }));

      setEspecialidades(espeMapeadas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 5. Obtener Grupos
  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/grupos`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener grupos");

      const result = await response.json();

      const gruposMapeados = result.map((g: any) => ({
        id: g.idGrupo,
        codigo: g.nombre,
        semestre: g.grado,
        turno: g.turno,
        aula: g.aula || "Por definir",
        idEspecialidad: g.especialidadId,
        especialidadNombre: g.especialidad?.nombre || "N/A",
        idPeriodo: g.periodoId,
        idDocente: 0,
        idMateria: 0,
        activo: true,
      }));

      setGrupos(gruposMapeados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 6. obtener Periodos
  const fetchPeriodos = async () => {
    try {
      const response = await fetch(`${API_URL}/periodos`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      const periodosMapeados = result.map((p: any) => ({
        id: p.idPeriodo || p.id,
        idPeriodo: p.idPeriodo || p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        activo: p.activo,
      }));

      setPeriodos(periodosMapeados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 7. obtener materias
  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/materias`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener materias");

      const result = await response.json();

      // Soporta distintos nombres de campos del backend para horas y especialidad.
      const materiasMapeadas = result.map((m: any) => {
        const rawEspecialidad = m.especialidad ?? m.Especialidad;
        const especialidadNombre =
          typeof rawEspecialidad === "string"
            ? rawEspecialidad
            : (rawEspecialidad?.nombre ?? "General");
        const totalHoras =
          Number(m.horaSemana ?? m.horasSemana ?? m.totalHoras) ||
          Number(m.horasTeoria || 0) + Number(m.horasPractica || 0);

        return {
          id: m.idMateria || m.id,
          nombre: m.nombre,
          codigo: m.codigo || m.clave || "N/A",
          semestre: m.semestre || 1,
          totalHoras,
          idEspecialidad:
            m.especialidadId || m.idEspecialidad || rawEspecialidad?.id || 0,
          especialidadNombre,
          activo: m.activo ?? true,
        };
      });

      setMaterias(materiasMapeadas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // 8. Obtener Clases
  const fetchClases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/clases`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al obtener clases");

      const result = await response.json();

      const clasesArray = result.data ? result.data : result;

      setClases(clasesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // --- MÉTODOS DE CREACIÓN, EDICIÓN Y ELIMINACIÓN  ---

  const createEspecialidad = async (data: {
    nombre: string;
    codigo: string;
    descripcion: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/especialidades`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear especialidad");
      await fetchEspecialidades();
      toast({
        title: "Éxito",
        description: "Especialidad creada",
        variant: "success",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateEspecialidad = async (id: number, data: any) => {
    try {
      const response = await fetch(`${API_URL}/especialidades/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      await fetchEspecialidades();
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteEspecialidad = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/especialidades/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al eliminar");
      await fetchEspecialidades();
      return true;
    } catch (err) {
      return false;
    }
  };

  const createDocente = async (data: DocenteFormData) => {
    try {
      const response = await fetch(`${API_URL}/docentes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear");
      await fetchDocentes();
      toast({
        title: "Éxito",
        description: "Docente creado",
        variant: "success",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateDocente = async (id: number, data: Partial<DocenteFormData>) => {
    try {
      const response = await fetch(`${API_URL}/docentes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      await fetchDocentes();
      return true;
    } catch (err) {
      return false;
    }
  };

  // --- ELIMINAR DOCENTE  ---
  const deleteDocente = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/docentes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.mensaje ||
            "Error desconocido al eliminar el docente",
        );
      }

      await fetchDocentes();
      toast({
        title: "Eliminado",
        description: "El docente ha sido eliminado exitosamente.",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      console.error("Fallo al eliminar docente:", err);
      toast({
        title: "Error al eliminar",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createAlumno = async (data: AlumnoFormData) => {
    try {
      const payload = {
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        curp: data.curp,
        telefono: data.telefono,
        direccion: data.direccion,
        matricula: data.numeroControl,
        semestre: data.semestreActual,
        grupoId: data.idGrupo,
      };

      const response = await fetch(`${API_URL}/estudiantes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al crear alumno");

      await fetchAlumnos();
      toast({
        title: "Éxito",
        description: "Alumno creado",
        variant: "success",
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateAlumno = async (id: number, data: Partial<AlumnoFormData>) => {
    try {
      const payload = {
        nombre: data.nombre,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        curp: data.curp,
        telefono: data.telefono,
        direccion: data.direccion,
        matricula: data.numeroControl,
        semestre: data.semestreActual,
        grupoId: data.idGrupo,
      };

      const response = await fetch(`${API_URL}/estudiantes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      await fetchAlumnos();
      return true;
    } catch (err) {
      return false;
    }
  };

  // --- ACTUALIZAR INFO ADICIONAL ALUMNO ---
  const updateAlumnoExtra = async (
    id: number,
    data: {
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
    },
  ) => {
    try {
      const payload: any = {};

      // Solo agregar campos que tengan valor
      if (data.credencialFechaEmision)
        payload.credencialFechaEmision = data.credencialFechaEmision;
      if (data.credencialFechaExpiracion)
        payload.credencialFechaExpiracion = data.credencialFechaExpiracion;
      if (data.tutor) payload.tutor = data.tutor;

      const response = await fetch(`${API_URL}/estudiantes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al actualizar información adicional",
        );
      }

      await fetchAlumnos();
      toast({
        title: "Éxito",
        description: "Información adicional actualizada correctamente",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // --- ELIMINAR ALUMNO  ---
  const deleteAlumno = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/estudiantes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.mensaje ||
            "Error desconocido al eliminar el alumno",
        );
      }

      await fetchAlumnos();
      toast({
        title: "Eliminado",
        description: "El alumno ha sido eliminado exitosamente.",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      console.error("Fallo al eliminar alumno:", err);
      toast({
        title: "Error al eliminar",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createAdministrador = async (data: AdminFormData) => {
    try {
      // Normalizar cargo para coincidir con cargosPermitidos del backend (sin acentos, mayúsculas)
      const payload = {
        ...data,
        cargo: data.cargo
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .trim(),
      };
      const response = await fetch(`${API_URL}/administrativos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear administrador");
      }
      await fetchAdministradores();
      toast({
        title: "Éxito",
        description: "Administrador creado",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateAdministrador = async (
    id: number,
    data: Partial<AdminFormData>,
  ) => {
    try {
      const payload: Partial<AdminFormData> = { ...data };
      if (data.cargo) {
        payload.cargo = data.cargo
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .trim();
      }
      const response = await fetch(`${API_URL}/administrativos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar administrador");
      }
      await fetchAdministradores();
      toast({
        title: "Éxito",
        description: "Administrador actualizado",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // --- ELIMINAR ADMINISTRADOR  ---
  const deleteAdministrador = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/administrativos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.mensaje ||
            "Error desconocido al eliminar el administrador",
        );
      }

      await fetchAdministradores();
      toast({
        title: "Eliminado",
        description: "El administrador ha sido eliminado exitosamente.",
        variant: "success",
      });
      return true;
    } catch (err: any) {
      console.error("Fallo al eliminar administrador:", err);
      toast({
        title: "Error al eliminar",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createGrupo = async (data: GrupoFormData) => {
    try {
      const response = await fetch(`${API_URL}/grupos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear");
      await fetchGrupos();
      toast({
        title: "Éxito",
        description: "Grupo creado",
        variant: "success",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateGrupo = async (id: number, data: Partial<GrupoFormData>) => {
    try {
      const response = await fetch(`${API_URL}/grupos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      await fetchGrupos();
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteGrupo = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/grupos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al eliminar");
      await fetchGrupos();
      return true;
    } catch (err) {
      return false;
    }
  };
  // -- METODO PARA ASIGNAR CLASES --
  const asignarClase = async (data: {
    grupoId: number;
    materiaId: number;
    docenteId: number;
    horario: string;
  }) => {
    try {
      // buscamos el periodo
      const periodoActivo = periodos.find((p) => p.activo);
      if (!periodoActivo)
        throw new Error("No hay periodo activo para asignar una clase");

      const payload = {
        ...data,
        periodoId: periodoActivo.id,
      };

      const response = await fetch(`${API_URL}/clases`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.msg || errorData.error || "Error al asignar las clases",
        );
      }

      toast({
        title: "Exito!",
        description: "Docente asignado al grupo exitosamente",
        variant: "success",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // -- METODO PARA EDITAR CLASES --
  const editarClase = async (
    id: number,
    data: {
      grupoId: number;
      materiaId: number;
      docenteId: number;
      horario: string;
    },
  ) => {
    try {
      const response = await fetch(`${API_URL}/clases/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.msg || errorData.error || "Error al editar la clase",
        );
      }

      toast({
        title: "Éxito!",
        description: "Clase actualizada correctamente",
        variant: "success",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // -- METODO PARA ELIMINAR CLASES --
  const eliminarClase = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/clases/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Error al eliminar la clase");

      toast({
        title: "Éxito!",
        description: "Clase eliminada correctamente",
        variant: "success",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // -- METODO PARA CERRAR PERIODO Y PROMOVER ALUMNOS --
  const cerrarPeriodo = async (idPeriodo: number) => {
    try {
      const response = await fetch(`${API_URL}/periodos/${idPeriodo}/cerrar`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || result.mensaje || "Error al cerrar el periodo",
        );
      }

      toast({
        title: "Periodo cerrado exitosamente",
        description:
          result.mensaje || "Los alumnos han sido promovidos correctamente.",
        variant: "success",
        duration: 6000,
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
        duration: 6000,
      });
      return false;
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchDocentes(),
      fetchAlumnos(),
      fetchAdministradores(),
      fetchGrupos(),
      fetchPeriodos(),
      fetchEspecialidades(),
      fetchMaterias(),
    ]);
  };

  return {
    docentes,
    alumnos,
    administradores,
    grupos,
    especialidades,
    periodos,
    materias,
    clases,
    loading,
    error,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchGrupos,
    fetchEspecialidades,
    fetchPeriodos,
    fetchMaterias,
    fetchClases,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad,
    createDocente,
    updateDocente,
    deleteDocente,
    createAlumno,
    updateAlumno,
    updateAlumnoExtra,
    deleteAlumno,
    createAdministrador,
    updateAdministrador,
    deleteAdministrador,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    asignarClase,
    editarClase,
    eliminarClase,
    cerrarPeriodo,
    refreshData,
  };
}
