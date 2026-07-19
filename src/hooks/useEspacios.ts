import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { Espacio, EspacioApi, EspacioPayload } from "@/types/community";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialForm = {
  nombre: "",
  tipo: "",
  descripcion: "",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const normalizeEspacio = (e: EspacioApi): Espacio => ({
  id: Number(e.idEspacio ?? e.id ?? 0),
  idEspacio: Number(e.idEspacio ?? e.id ?? 0),
  nombre: e.nombre || "",
  tipo: e.tipo || "",
  descripcion: e.descripcion || "",
  activo: e.activo ?? true,
});

const useEspacios = (tipoFiltro: string, incluirInactivos: boolean) => {
  const { toast } = useToast();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Espacio | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const [pagina, setPagina] = useState(1);
  const [limite] = useState(20);

  const [paginacion, setPaginacion] = useState({
    totalRegistros: 0,
    paginasTotales: 1,
    paginaActual: 1,
    limite: 20,
  });

  const fetchEspacios = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (tipoFiltro.trim()) {
        params.set("tipo", tipoFiltro.trim());
      }

      if (incluirInactivos) {
        params.set("incluirInactivos", "true");
      }

      params.set("pagina", pagina.toString());
      params.set("limite", limite.toString());

      const response = await fetch(
        `${API_URL}/espacios${params.toString() ? `?${params}` : ""}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudieron obtener los espacios");
      }

      const data = await response.json();

      setPaginacion(
        data.paginacion ?? {
          totalRegistros: 0,
          paginasTotales: 1,
          paginaActual: 1,
          limite,
        },
      );

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];

      setEspacios(arr.map(normalizeEspacio));
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Error al cargar espacios."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagina, limite, tipoFiltro, incluirInactivos, toast]);

  useEffect(() => {
    void fetchEspacios();
  }, [fetchEspacios]);

  const onSave = async () => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Dato requerido",
        description: "El nombre del espacio es obligatorio.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.tipo.trim()) {
      toast({
        title: "Dato requerido",
        description: "El tipo del espacio es obligatorio.",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);

    try {
      const isEdit = !!editing;
      const id = editing?.idEspacio ?? editing?.id;

      const payload: EspacioPayload = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo.trim(),
      };

      if (formData.descripcion.trim()) {
        payload.descripcion = formData.descripcion.trim();
      }

      const response = await fetch(
        isEdit ? `${API_URL}/espacios/${id}` : `${API_URL}/espacios`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? result.mensaje ?? "No se pudo guardar el espacio",
        );
      }

      toast({
        title: "Éxito",
        description: isEdit
          ? "Espacio actualizado correctamente."
          : "Espacio creado correctamente.",
        variant: "success",
      });

      setEditing(null);
      setFormData(initialForm);

      await fetchEspacios();

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "No se pudo guardar el espacio."),
        variant: "destructive",
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (espacio: Espacio) => {
    const id = espacio.idEspacio ?? espacio.id;

    if (!id) return false;

    if (!confirm(`¿Deseas desactivar el espacio "${espacio.nombre}"?`)) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/espacios/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ?? result.mensaje ?? "No se pudo desactivar el espacio",
        );
      }

      toast({
        title: "Espacio desactivado",
        description: "El espacio fue marcado como inactivo.",
        variant: "success",
      });

      await fetchEspacios();

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(
          error,
          "No se pudo desactivar el espacio.",
        ),
        variant: "destructive",
      });

      return false;
    }
  };

  return {
    espacios,
    loading,
    saving,
    editing,
    formData,
    pagina,
    paginacion,
    setPagina,
    setEditing,
    setFormData,

    fetchEspacios,
    onSave,
    onDelete,
  };
};

export default useEspacios;
