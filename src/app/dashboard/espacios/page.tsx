"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { downloadTemplate, uploadCsv } from "@/lib/upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EspacioTipo = string;

interface Espacio {
  idEspacio?: number;
  id?: number;
  nombre: string;
  tipo: EspacioTipo;
  descripcion?: string;
  activo?: boolean;
}

const API_URL =
  "http://localhost:4000/api/web";

const initialForm = {
  nombre: "",
  tipo: "",
  descripcion: "",
};

export default function EspaciosPage() {
  const { toast } = useToast();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Espacio | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const normalizeEspacio = (e: any): Espacio => ({
    id: Number(e.idEspacio ?? e.id ?? 0),
    idEspacio: Number(e.idEspacio ?? e.id ?? 0),
    nombre: e.nombre || "",
    tipo: e.tipo,
    descripcion: e.descripcion || "",
    activo: e.activo ?? true,
  });

  const fetchEspacios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tipoFiltro.trim()) params.set("tipo", tipoFiltro.trim());
      if (incluirInactivos) params.set("incluirInactivos", "true");

      const query = params.toString();
      const url = `${API_URL}/espacios${query ? `?${query}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("No se pudieron obtener los espacios");
      }

      const data = await response.json();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setEspacios(arr.map(normalizeEspacio));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar espacios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEspacios();
  }, [tipoFiltro, incluirInactivos]);

  const espaciosFiltrados = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return espacios;

    return espacios.filter((e) => {
      return (
        e.nombre.toLowerCase().includes(s) ||
        (e.descripcion || "").toLowerCase().includes(s) ||
        e.tipo.toLowerCase().includes(s)
      );
    });
  }, [espacios, search]);

  const openCreate = () => {
    setEditing(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleDescargarMachote = async () => {
    try {
      await downloadTemplate("espacios");
      toast({
        title: "Éxito",
        description: "Descarga iniciada.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo descargar el machote.",
        variant: "destructive",
      });
    }
  };

  const handleCargarExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";

    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const result = await uploadCsv(file, "espacios");
        const backendMessage =
          result.data?.message || result.data?.mensaje || result.data?.error;

        if (!result.ok) {
          throw new Error(backendMessage || "No se pudo procesar el archivo.");
        }

        toast({
          title: "Éxito",
          description: backendMessage || "Archivo cargado correctamente.",
          variant: "success",
        });

        await fetchEspacios();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo subir el archivo.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    };

    input.click();
  };

  const openEdit = (espacio: Espacio) => {
    setEditing(espacio);
    setFormData({
      nombre: espacio.nombre || "",
      tipo: espacio.tipo,
      descripcion: espacio.descripcion || "",
    });
    setModalOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast({
        title: "Dato requerido",
        description: "El nombre del espacio es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.tipo.trim()) {
      toast({
        title: "Dato requerido",
        description: "El tipo del espacio es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editing;
      const id = editing?.idEspacio || editing?.id;

      const payload: Record<string, any> = {
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
        throw new Error(result.error || result.mensaje || "No se pudo guardar el espacio");
      }

      toast({
        title: "Éxito",
        description: isEdit
          ? "Espacio actualizado correctamente."
          : "Espacio creado correctamente.",
        variant: "success",
      });

      setModalOpen(false);
      setFormData(initialForm);
      setEditing(null);
      fetchEspacios();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el espacio.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (espacio: Espacio) => {
    const id = espacio.idEspacio || espacio.id;
    if (!id) return;

    if (!confirm(`¿Deseas desactivar el espacio "${espacio.nombre}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/espacios/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.mensaje || "No se pudo desactivar el espacio");
      }

      toast({
        title: "Espacio desactivado",
        description: "El espacio fue marcado como inactivo.",
        variant: "success",
      });

      fetchEspacios();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar el espacio.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 p-3 sm:p-4 lg:p-6">
      <Card>
        <CardHeader className="border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Espacios
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleDescargarMachote}>
                Descargar Machote
              </Button>
              <Button
                variant="outline"
                onClick={handleCargarExcel}
                disabled={uploading}
              >
                {uploading ? "Cargando..." : "Cargar Excel"}
              </Button>
              <Button
                onClick={openCreate}
                className="bg-[#691C32] hover:bg-[#4a1424] text-white"
              >
                Nuevo Espacio
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar por nombre o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:col-span-2"
            />

            <Input
              placeholder="Filtrar por tipo"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={incluirInactivos}
                onChange={(e) => setIncluirInactivos(e.target.checked)}
              />
              Incluir inactivos
            </label>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <div className="overflow-hidden rounded-md border">
            <div className="overflow-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-[#691C32]">
                    <TableHead className="bg-[#691C32] text-white">Nombre</TableHead>
                    <TableHead className="bg-[#691C32] text-white">Tipo</TableHead>
                    <TableHead className="bg-[#691C32] text-white">Descripción</TableHead>
                    <TableHead className="bg-[#691C32] text-white">Estado</TableHead>
                    <TableHead className="bg-[#691C32] text-white text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Cargando espacios...
                      </TableCell>
                    </TableRow>
                  ) : espaciosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No hay espacios registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    espaciosFiltrados.map((espacio) => (
                      <TableRow key={espacio.idEspacio || espacio.id}>
                        <TableCell className="font-medium">{espacio.nombre}</TableCell>
                        <TableCell>{espacio.tipo || "-"}</TableCell>
                        <TableCell>{espacio.descripcion || "-"}</TableCell>
                        <TableCell>
                          {espacio.activo === false ? "Inactivo" : "Activo"}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => openEdit(espacio)}
                          >
                            Editar
                          </Button>
                          {(espacio.activo ?? true) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(espacio)}
                            >
                              Desactivar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[#691C32] text-xl">
              {editing ? "Editar Espacio" : "Nuevo Espacio"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={onSave} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej. Laboratorio 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ej. Aula, Laboratorio, Sala audiovisual"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                placeholder="Ej. Edificio B, planta alta"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#691C32] hover:bg-[#50172A] text-white"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

