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

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface UseCommunityReturn {
  // Estados
  docentes: Docente[];
  alumnos: Alumno[];
  administradores: Admin[];
  grupos: Grupo[];
  especialidades: Especialidad[];
  loading: boolean;
  error: string | null;

  // Funciones
  fetchDocentes: () => Promise<void>;
  fetchAlumnos: () => Promise<void>;
  fetchAdministradores: () => Promise<void>;
  fetchGrupos: () => Promise<void>;
  fetchEspecialidades: () => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el token de autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Obtener docentes
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/docentes`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener docentes");
      }

      const result = await response.json();
      setDocentes(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudieron cargar los docentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener alumnos
  const fetchAlumnos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/alumnos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener alumnos");
      }

      const result = await response.json();
      setAlumnos(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudieron cargar los alumnos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener administradores
  const fetchAdministradores = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/administradores`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Error al obtener administradores");
      }

      const result = await response.json();
      setAdministradores(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudieron cargar los administradores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener especialidades
  const fetchEspecialidades = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/especialidades`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Error al obtener especialidades");
      }

      const result = await response.json();
      setEspecialidades(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudieron cargar las especialidades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear especialidad
  const createEspecialidad = async (data: {
    nombre: string;
    codigo: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/especialidades`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error al crear especialidad");
      }

      await fetchEspecialidades();
      toast({
        title: "Éxito",
        description: "Especialidad creada correctamente",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar especialidad
  const updateEspecialidad = async (
    id: number,
    data: { nombre?: string; codigo?: string; activo?: boolean },
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/especialidades/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar especialidad");
      }

      await fetchEspecialidades();
      toast({
        title: "Éxito",
        description: "Especialidad actualizada correctamente",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar especialidad
  const deleteEspecialidad = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/especialidades/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error al eliminar especialidad");
      }

      await fetchEspecialidades();
      toast({
        title: "Éxito",
        description: "Especialidad eliminada correctamente",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Crear docente
  const createDocente = async (data: DocenteFormData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/docentes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear docente");
      }

      // Actualizar la lista de docentes
      await fetchDocentes();

      toast({
        title: "Éxito",
        description: "Docente creado correctamente",
        variant: "success",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDocente = async (
    id: number,
    data: Partial<DocenteFormData>,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/docentes/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al actualizar docente");
      await fetchDocentes();
      toast({
        title: "Éxito",
        description: "Docente actualizado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocente = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/docentes/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al eliminar docente");
      await fetchDocentes();
      toast({
        title: "Éxito",
        description: "Docente eliminado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Crear alumno
  const createAlumno = async (data: AlumnoFormData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/alumnos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear alumno");
      }

      // Actualizar la lista de alumnos
      await fetchAlumnos();

      toast({
        title: "Éxito",
        description: "Alumno creado correctamente",
        variant: "success",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAlumno = async (
    id: number,
    data: Partial<AlumnoFormData>,
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/v1/community/alumnos/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();

      if (!response.ok)
        throw new Error(result.message || "Error al actualizar alumno");
      await fetchAlumnos();
      toast({
        title: "Éxito",
        description: "Alumno actualizado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAlumno = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/alumnos/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al eliminar alumno");
      await fetchAlumnos();
      toast({
        title: "Éxito",
        description: "Alumno eliminado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Crear administrador
  const createAdministrador = async (data: AdminFormData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/administradores`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear administrador");
      }

      // Actualizar la lista de administradores
      await fetchAdministradores();

      toast({
        title: "Éxito",
        description: "Administrador creado correctamente",
        variant: "success",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAdministrador = async (
    id: number,
    data: Partial<AdminFormData>,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/administradores/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al actualizar administrador");
      await fetchAdministradores();
      toast({
        title: "Éxito",
        description: "Administrador actualizado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAdministrador = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/community/administradores/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al eliminar administrador");
      await fetchAdministradores();
      toast({
        title: "Éxito",
        description: "Administrador eliminado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  // Refrescar todos los datos
  const refreshData = async () => {
    await Promise.all([
      fetchDocentes(),
      fetchAlumnos(),
      fetchAdministradores(),
      fetchGrupos(),
      fetchEspecialidades(),
    ]);
  };

  // Obtener grupos
  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/grupos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener grupos");
      }

      const result = await response.json();
      setGrupos(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear grupo
  const createGrupo = async (data: GrupoFormData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/grupos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear grupo");
      }

      await fetchGrupos();

      toast({
        title: "Éxito",
        description: "Grupo creado correctamente",
        variant: "success",
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar grupo
  const updateGrupo = async (
    id: number,
    data: Partial<GrupoFormData>,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/grupos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al actualizar grupo");

      await fetchGrupos();
      toast({
        title: "Éxito",
        description: "Grupo actualizado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar grupo
  const deleteGrupo = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/community/grupos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Error al eliminar grupo");

      await fetchGrupos();
      toast({
        title: "Éxito",
        description: "Grupo eliminado",
        variant: "success",
      });
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    docentes,
    alumnos,
    administradores,
    grupos,
    especialidades,
    loading,
    error,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchGrupos,
    fetchEspecialidades,
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
