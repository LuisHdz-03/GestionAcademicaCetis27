import { useState } from "react";
import { useToast } from "./useToast";

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
  especialidadId?: number | null;
  integrantes?: number;
  activo: boolean;
  idEspecialidad?: number | null;
}

export interface CreateMateriaInput {
  nombre: string;
  codigo: string;
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
  idMaterias?: number[];
  turno?: string;
  aula?: string;
  activo?: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export function useAcademico() {
  const { toast } = useToast();
  const [materias, setMaterias] = useState<MateriaDTO[]>([]);
  const [grupos, setGrupos] = useState<GrupoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    } as HeadersInit;
  };

  const fetchMaterias = async (especialidadFilter?: string | number) => {
    try {
      setLoading(true);
      //rutas
      const url = new URL(`${API_URL}/materias`);
      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Error al obtener materias");

      const json = await res.json();

      // traemos los datos con esto
      const materiasMapeadas: MateriaDTO[] = json.map((m: any) => ({
        id: m.idMateria,
        nombre: m.nombre,
        codigo: m.codigo || m.nombre.substring(0, 3).toUpperCase(),
        totalHoras: m.horasSemana || 0,
        horasTeoria: m.horasSemana || 0,
        horasPractica: 0,
        semestre: m.semestre || 1,
        especialidadNombre: m.especialidad?.nombre || "General",
        especialidadCodigo:
          m.especialidad?.codigo ||
          (m.especialidadId ? String(m.especialidadId) : "GEN"),
        activo: true,
      }));

      // Si el frontend pidió filtrar por especialidad
      let materiasFiltradas = materiasMapeadas;
      if (typeof especialidadFilter === "string") {
        materiasFiltradas = materiasMapeadas.filter(
          (m) => m.especialidadCodigo === especialidadFilter,
        );
      } else if (typeof especialidadFilter === "number") {
        materiasFiltradas = materiasMapeadas.filter(
          (m: any) => Number(m.especialidadCodigo) === especialidadFilter,
        );
      }

      setMaterias(materiasFiltradas);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchGrupos = async (especialidadCode?: string) => {
    try {
      setLoading(true);
      const url = new URL(`${API_URL}/grupos`);
      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Error al obtener grupos");

      const json = await res.json();

      const gruposMapeados: GrupoDTO[] = json.map((g: any) => ({
        id: g.idGrupo,
        nombre: g.nombre,
        codigo: g.nombre,
        semestre: g.grado,
        especialidadNombre: g.especialidad?.nombre || "General",
        especialidadCodigo:
          g.especialidad?.codigo ||
          (g.especialidadId ? String(g.especialidadId) : "GEN"),
        especialidadId: g.especialidadId ?? g.especialidad?.id ?? null,
        idEspecialidad: g.especialidadId ?? g.especialidad?.id ?? null,
        integrantes: g._count?.estudiantes || 0,
        activo: true,
      }));

      // aceptar filtro por código (string) o por id (number)
      let gruposFiltrados = gruposMapeados;
      if (typeof especialidadCode === "string") {
        gruposFiltrados = gruposMapeados.filter(
          (g) => g.especialidadCodigo === especialidadCode,
        );
      } else if (typeof especialidadCode === "number") {
        gruposFiltrados = gruposMapeados.filter(
          (g: any) =>
            Number(g.especialidadId) === especialidadCode ||
            Number(g.especialidadCodigo) === especialidadCode,
        );
      }
      // permitir filtro por código (string) o por id (number o string convertible)
      if (especialidadCode !== undefined && especialidadCode !== null) {
        if (typeof especialidadCode === "string") {
          const maybeNum = Number(especialidadCode);
          if (!Number.isNaN(maybeNum)) {
            gruposFiltrados = gruposMapeados.filter(
              (g: any) =>
                Number(g.idEspecialidad) === maybeNum ||
                Number(g.especialidadId) === maybeNum ||
                g.especialidadCodigo === especialidadCode,
            );
          } else {
            gruposFiltrados = gruposMapeados.filter(
              (g: any) =>
                g.especialidadCodigo === especialidadCode ||
                String(g.idEspecialidad) === especialidadCode,
            );
          }
        } else if (typeof especialidadCode === "number") {
          gruposFiltrados = gruposMapeados.filter(
            (g: any) =>
              Number(g.idEspecialidad) === especialidadCode ||
              Number(g.especialidadId) === especialidadCode ||
              Number(g.especialidadCodigo) === especialidadCode,
          );
        }
      }

      setGrupos(gruposFiltrados);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
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
        horasSemana:
          typeof data.horas === "number"
            ? data.horas
            : Number(data.horasTeoria || 0) + Number(data.horasPractica || 0),
        especialidadId: data.idEspecialidad,
      };

      const res = await fetch(`${API_URL}/materias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear materia");

      toast({
        title: "Éxito",
        description: "Materia creada",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createGrupo = async (
    data: CreateGrupoInput & { idMaterias?: number[] },
  ) => {
    try {
      setLoading(true);
      const payload = {
        nombre: data.codigo,
        grado: data.semestre,
        turno: data.turno || "MATUTINO", // Tomamos el turno si viene en la data
        aula: data.aula,
        periodoId: data.idPeriodo,
        especialidadId: data.idEspecialidad,
        // 👇 AGREGAMOS EL DOCENTE Y LAS MATERIAS AL PAYLOAD 👇
        docenteId: data.idDocente,
        materiasIds:
          data.idMaterias || (data.idMateria ? [data.idMateria] : []),
      };

      const res = await fetch(`${API_URL}/grupos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al crear grupo");

      toast({
        title: "Éxito",
        description: "Grupo creado exitosamente",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateMateria = async (
    id: number,
    data: Partial<CreateMateriaInput>,
  ) => {
    try {
      setLoading(true);
      const payload: any = {
        nombre: data.nombre,
        codigo: data.codigo,
        semestre: data.semestre,
        especialidadId: data.idEspecialidad,
      };

      if (
        typeof data.horas === "number" ||
        data.horasTeoria ||
        data.horasPractica
      ) {
        payload.horasSemana =
          typeof data.horas === "number"
            ? data.horas
            : Number(data.horasTeoria || 0) + Number(data.horasPractica || 0);
      }

      const res = await fetch(`${API_URL}/materias/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al actualizar materia");

      toast({
        title: "Éxito",
        description: "Materia actualizada",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMateria = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/materias/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al eliminar materia");

      toast({
        title: "Éxito",
        description: "Materia eliminada",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateGrupo = async (id: number, data: Partial<CreateGrupoInput>) => {
    try {
      setLoading(true);
      const payload = {
        nombre: data.codigo,
        grado: data.semestre,
        aula: data.aula,
        periodoId: data.idPeriodo,
        especialidadId: data.idEspecialidad,
      };

      const res = await fetch(`${API_URL}/grupos/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error al actualizar grupo");

      toast({
        title: "Éxito",
        description: "Grupo actualizado",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteGrupo = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/grupos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al eliminar grupo");

      toast({
        title: "Éxito",
        description: "Grupo eliminado",
        variant: "success",
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast({ title: "Error", description: msg, variant: "destructive" });
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
