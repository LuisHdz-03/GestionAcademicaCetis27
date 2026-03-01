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
  activo: boolean;
}
interface Periodo {
  id: number;
  nombre: string;
  codigo: string;
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
  loading: boolean;
  error: string | null;

  fetchDocentes: () => Promise<void>;
  fetchAlumnos: () => Promise<void>;
  fetchAdministradores: () => Promise<void>;
  fetchGrupos: () => Promise<void>;
  fetchEspecialidades: () => Promise<void>;
  fetchPeriodos: () => Promise<void>;
  createEspecialidad: (data: {
    nombre: string;
    codigo: string;
  }) => Promise<boolean>;
  updateEspecialidad: (
    id: number,
    data: { nombre?: string; codigo?: string; activo?: boolean },
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
      const docentesMapeados = result.map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        apellidoPaterno: d.apellidoPaterno,
        apellidoMaterno: d.apellidoMaterno,
        email: d.email,
        telefono: d.telefono,
        fechaNacimiento: d.fechaNacimiento,
        curp: d.curp,
        numeroEmpleado: d.numeroEmpleado,
        especialidad: d.especialidad,
        activo: d.activo,
      }));

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

      // Traductor: De Prisma a React
      const alumnosMapeados = result.map((a: any) => ({
        id: a.id,
        nombre: a.nombre,
        apellidoPaterno: a.apellidoPaterno,
        apellidoMaterno: a.apellidoMaterno,
        email: a.email,
        telefono: a.telefono || "N/A",
        fechaNacimiento: a.fechaNacimiento || "N/A",
        curp: a.curp || "N/A",
        matricula: a.matricula || "S/N",
        especialidad: a.especialidad || "Sin Asignar",
        semestre: a.semestre || 1,
        idGrupo: a.idGrupo,
        grupo: a.grupo || "Sin Grupo",
        activo: a.activo ?? true,
        direccion: a.direccion || "N/A",
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
        apellidoPaterno: "",
        apellidoMaterno: "",
        email: a.email,
        telefono: a.telefono || "N/A",
        fechaNacimiento: a.fechaNacimiento || "N/A",
        curp: a.curp || "N/A",
        numeroEmpleado: a.numEmpleado,
        cargo: a.cargo,
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

      const espeMapeadas = result.map((e: any) => ({
        id: e.idEspecialidad,
        nombre: e.nombre,
        codigo: e.codigo || e.nombre.substring(0, 3).toUpperCase(),
        activo: true,
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

  // --- MÉTODOS DE CREACIÓN, EDICIÓN Y ELIMINACIÓN  ---

  const createEspecialidad = async (data: {
    nombre: string;
    codigo: string;
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

  const deleteDocente = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/docentes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al eliminar");
      await fetchDocentes();
      return true;
    } catch (err) {
      return false;
    }
  };

  const createAlumno = async (data: AlumnoFormData) => {
    try {
      const response = await fetch(`${API_URL}/estudiantes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear");
      await fetchAlumnos();
      toast({
        title: "Éxito",
        description: "Alumno creado",
        variant: "success",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateAlumno = async (id: number, data: Partial<AlumnoFormData>) => {
    try {
      const response = await fetch(`${API_URL}/estudiantes/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      await fetchAlumnos();
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteAlumno = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/estudiantes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al eliminar");
      await fetchAlumnos();
      return true;
    } catch (err) {
      return false;
    }
  };

  const createAdministrador = async (data: AdminFormData) => {
    try {
      const response = await fetch(`${API_URL}/administrativos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear");
      await fetchAdministradores();
      toast({
        title: "Éxito",
        description: "Admin creado",
        variant: "success",
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateAdministrador = async (
    id: number,
    data: Partial<AdminFormData>,
  ) => {
    try {
      const response = await fetch(`${API_URL}/administrativos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      await fetchAdministradores();
      return true;
    } catch (err) {
      return false;
    }
  };

  const deleteAdministrador = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/administrativos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Error al eliminar");
      await fetchAdministradores();
      return true;
    } catch (err) {
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

  const refreshData = async () => {
    await Promise.all([
      fetchDocentes(),
      fetchAlumnos(),
      fetchAdministradores(),
      fetchGrupos(),
      fetchPeriodos(),
      fetchEspecialidades(),
    ]);
  };

  return {
    docentes,
    alumnos,
    administradores,
    grupos,
    especialidades,
    periodos,
    loading,
    error,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchGrupos,
    fetchEspecialidades,
    fetchPeriodos,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad,
    createDocente,
    updateDocente,
    deleteDocente,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    createAdministrador,
    updateAdministrador,
    deleteAdministrador,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    refreshData,
  };
}
