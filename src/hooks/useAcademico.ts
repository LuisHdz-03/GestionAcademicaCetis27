import { useState } from 'react';
import { useToast } from './useToast';

export interface MateriaDTO {
  id: number;
  nombre: string;
  codigo: string;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  totalHoras?: number;
  semestre?: number;
  especialidadNombre?: string;
  especialidadCodigo?: string;
  activo: boolean;
}

export interface GrupoDTO {
  id: number;
  nombre: string;
  codigo: string;
  semestre?: number;
  especialidadNombre?: string;
  especialidadCodigo?: string;
  integrantes?: number;
  activo: boolean;
}

export interface CreateMateriaInput {
  nombre: string;
  codigo: string;
  // Compatibilidad: permitir enviar horas directamente o desglosadas
  horas?: number;
  horasTeoria?: number;
  horasPractica?: number;
  semestre?: number;
  idEspecialidad?: number;
  activo?: boolean;
}

export interface CreateGrupoInput {
  codigo: string;
  semestre?: number;
  idEspecialidad?: number;
  idPeriodo?: number;
  idDocente?: number;
  idMateria?: number;
  aula?: string;
  activo?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useAcademico() {
  const { toast } = useToast();
  const [materias, setMaterias] = useState<MateriaDTO[]>([]);
  const [grupos, setGrupos] = useState<GrupoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    } as HeadersInit;
  };

  const fetchMaterias = async (especialidadCode?: string) => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/v1/academico/materias`);
      if (especialidadCode) url.searchParams.set('especialidad', especialidadCode);
      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al obtener materias');
      setMaterias(json.data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGrupos = async (especialidadCode?: string) => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/api/v1/academico/grupos`);
      if (especialidadCode) url.searchParams.set('especialidad', especialidadCode);
      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al obtener grupos');
      setGrupos(json.data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createMateria = async (data: CreateMateriaInput) => {
    try {
      setLoading(true);
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo,
        semestre: data.semestre,
        idEspecialidad: data.idEspecialidad,
        activo: data.activo,
        horas: typeof data.horas === 'number'
          ? data.horas
          : (Number(data.horasTeoria || 0) + Number(data.horasPractica || 0)),
      };

      const res = await fetch(`${API_URL}/api/v1/academico/materias`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al crear materia');
      toast({ title: 'Éxito', description: 'Materia creada', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createGrupo = async (data: CreateGrupoInput) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/academico/grupos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al crear grupo');
      toast({ title: 'Éxito', description: 'Grupo creado', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateMateria = async (id: number, data: Partial<CreateMateriaInput>) => {
    try {
      setLoading(true);
      const payload: any = { ...data };
      if (typeof data.horas === 'number' || data.horasTeoria || data.horasPractica) {
        payload.horas = typeof data.horas === 'number'
          ? data.horas
          : (Number(data.horasTeoria || 0) + Number(data.horasPractica || 0));
      }

      const res = await fetch(`${API_URL}/api/v1/academico/materias/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar materia');
      toast({ title: 'Éxito', description: 'Materia actualizada', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMateria = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/academico/materias/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar materia');
      toast({ title: 'Éxito', description: 'Materia eliminada', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateGrupo = async (id: number, data: Partial<CreateGrupoInput>) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/academico/grupos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al actualizar grupo');
      toast({ title: 'Éxito', description: 'Grupo actualizado', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteGrupo = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/academico/grupos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar grupo');
      toast({ title: 'Éxito', description: 'Grupo eliminado', variant: 'success' });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    materias,
    grupos,
    loading,
    error,
    fetchMaterias,
    fetchGrupos,
    createMateria,
    createGrupo,
    updateMateria,
    deleteMateria,
    updateGrupo,
    deleteGrupo,
  };
}


