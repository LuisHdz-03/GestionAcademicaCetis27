"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Importado
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Especialidad {
  id?: number;
  idEspecialidad?: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id?: number;
  idPeriodo?: number;
  nombre: string;
  codigo: string;
  activo?: boolean;
}

interface Materia {
  id: number;
  idMateria?: number;
  nombre: string;
  codigo: string;
}

interface Docente {
  id: number;
  idDocente?: number;
  usuario?: {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  };
}

interface Espacio {
  id?: number;
  idEspacio?: number;
  nombre?: string;
  tipo?: string;
  activo?: boolean;
}

const API_URL = "http://localhost:4000/api/web";

interface EditGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  especialidades?: Especialidad[];
  periodos?: Periodo[];
  materias?: Materia[];
  docentes?: Docente[];
  initialData?: any;
  isEditing?: boolean;
  onChangeEspecialidad?: (id: number) => void;
  activeEspecialidadId?: number; // Prop para auto-detección
}

const initialFormState = {
  nombre: "",
  grado: 1,
  turno: "MATUTINO",
  aula: "",
  docenteTutorId: 0,
  especialidadId: 0,
};

export default function EditGrupoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  docentes = [],
  initialData,
  onChangeEspecialidad,
  activeEspecialidadId, // Recibido del padre
}: EditGrupoModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [aulas, setAulas] = useState<string[]>([]);
  const [especialidadesApi, setEspecialidadesApi] = useState<Especialidad[]>(
    [],
  );
  const [loadingAulas, setLoadingAulas] = useState(false);
  const especialidadesFuente =
    (especialidades || []).length > 0 ? especialidades : especialidadesApi;
  const especialidadesNormalizadas = Array.from(
    new Map(
      [...especialidadesFuente]
        .map((esp) => ({
          id: Number(esp.id ?? esp.idEspecialidad ?? 0),
          nombre: esp.nombre,
        }))
        .filter((esp) => esp.id > 0)
        .map((esp) => [esp.id, esp]),
    ).values(),
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const toArray = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.datos)) return payload.datos;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.espacios)) return payload.espacios;
    if (Array.isArray(payload?.especialidades)) return payload.especialidades;
    if (Array.isArray(payload?.data?.datos)) return payload.data.datos;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data?.espacios)) return payload.data.espacios;
    if (Array.isArray(payload?.data?.especialidades)) {
      return payload.data.especialidades;
    }
    return [];
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        const currentEspId = Number(
          initialData.idEspecialidad || initialData.especialidadId || 0,
        );

        setFormData({
          nombre: initialData.nombre || initialData.codigo || "",
          grado: initialData.grado || initialData.semestre || 1,
          turno: initialData.turno || "MATUTINO",
          aula: initialData.aula || "",
          docenteTutorId: Number(
            initialData.docenteTutorId || initialData.idDocenteTutor || 0,
          ),
          especialidadId: currentEspId,
        });

        if (currentEspId > 0 && onChangeEspecialidad)
          onChangeEspecialidad(currentEspId);
      } else {
        // MODO CREACIÓN: Auto-detectar especialidad
        const defId = activeEspecialidadId || 0;
        setFormData({ ...initialFormState, especialidadId: defId });
        if (defId > 0 && onChangeEspecialidad) onChangeEspecialidad(defId);
      }
    } else {
      setFormData(initialFormState);
    }
  }, [open, initialData, activeEspecialidadId]);

  useEffect(() => {
    if (!open) return;

    const fetchAulas = async () => {
      setLoadingAulas(true);
      try {
        const response = await fetch(`${API_URL}/espacios`, {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const arr = toArray(data);

        const aulasFromBd: string[] = arr
          .map((e: Espacio) => (e.nombre || "").trim())
          .filter((nombre: string) => !!nombre);

        const uniqueAulas = Array.from(new Set<string>(aulasFromBd));
        setAulas(uniqueAulas.sort((a, b) => a.localeCompare(b)));
      } catch {
        // Mantener el estado previo para no vaciar opciones por fallos temporales
      } finally {
        setLoadingAulas(false);
      }
    };

    const fetchEspecialidades = async () => {
      if ((especialidades || []).length > 0) return;

      try {
        const response = await fetch(`${API_URL}/especialidades`, {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const arr = toArray(data);

        const normalizadas: Especialidad[] = arr
          .map((e: any) => ({
            id: Number(e.id ?? e.idEspecialidad ?? 0),
            idEspecialidad: Number(e.idEspecialidad ?? e.id ?? 0),
            nombre: String(e.nombre || "").trim(),
            codigo: String(e.codigo || ""),
          }))
          .filter(
            (e: Especialidad) =>
              Number(e.id ?? e.idEspecialidad ?? 0) > 0 && !!e.nombre,
          );

        setEspecialidadesApi(normalizadas);
      } catch {
        // Mantener respaldo previo para evitar que desaparezcan opciones
      }
    };

    fetchAulas();
    fetchEspecialidades();
  }, [open, especialidades]);

  const handleSelectChange = (name: string, value: string) => {
    let newValue: any = value;
    // Solo parsear a número si el campo es uno de los siguientes
    if (["especialidadId", "grado", "docenteTutorId"].includes(name)) {
      newValue = parseInt(value, 10);
      if (isNaN(newValue)) newValue = 0;
    }
    setFormData((prev) => {
      const newData = { ...prev, [name]: newValue };
      if (name === "especialidadId") {
        if (onChangeEspecialidad) onChangeEspecialidad(newValue);
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nombre ||
      typeof formData.nombre !== "string" ||
      formData.nombre.trim() === "" ||
      !formData.grado ||
      isNaN(formData.grado) ||
      !formData.especialidadId ||
      isNaN(formData.especialidadId) ||
      !formData.docenteTutorId ||
      isNaN(formData.docenteTutorId)
    ) {
      console.warn(
        "[AddGrupoModal] Error: Datos inválidos en el formulario",
        formData,
      );
      alert("Por favor completa nombre, grado, especialidad y docente tutor.");
      return;
    }
    onSubmit(formData);
  };
  const selectedEspecialidad = especialidadesNormalizadas.find(
    (esp) => esp.id === formData.especialidadId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#691C32] font-bold">
            {initialData ? " Editar Grupo" : " Registrar Nuevo Grupo"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para la gestión de grupos.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Grupo *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
                placeholder="Ej: 1A"
              />
            </div>
            <div>
              <Label>Grado / Semestre *</Label>
              <Input
                type="number"
                value={formData.grado}
                onChange={(e) =>
                  setFormData({ ...formData, grado: parseInt(e.target.value) })
                }
                min="1"
                max="6"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Turno *</Label>
              <Select
                onValueChange={(v) => handleSelectChange("turno", v)}
                value={formData.turno}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MATUTINO">Matutino</SelectItem>
                  <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                  <SelectItem value="MIXTO">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aula</Label>
              <Select
                onValueChange={(v) => setFormData({ ...formData, aula: v })}
                value={formData.aula || ""}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingAulas ? "Cargando aulas..." : "Selecciona un aula"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {formData.aula && !aulas.includes(formData.aula) && (
                    <SelectItem value={formData.aula}>
                      {formData.aula} (actual)
                    </SelectItem>
                  )}
                  {aulas.map((aula) => (
                    <SelectItem key={aula} value={aula}>
                      {aula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Especialidad *</Label>
              <Select
                onValueChange={(v) => {
                  handleSelectChange("especialidadId", v);
                }}
                value={
                  formData.especialidadId > 0
                    ? formData.especialidadId.toString()
                    : ""
                }
              >
                <SelectTrigger
                  className="w-full"
                  title={selectedEspecialidad?.nombre || ""}
                >
                  <SelectValue
                    placeholder="Especialidad"
                    className="block max-w-[calc(100%-1.5rem)] truncate"
                  />
                </SelectTrigger>
                <SelectContent>
                  {especialidadesNormalizadas.map((esp) => (
                    <SelectItem key={esp.id} value={esp.id.toString()}>
                      {esp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Docente tutor *</Label>
              <Select
                onValueChange={(v) => handleSelectChange("docenteTutorId", v)}
                value={
                  formData.docenteTutorId > 0
                    ? formData.docenteTutorId.toString()
                    : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tutor" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map((d) => (
                    <SelectItem
                      key={`tutor-${d.idDocente || d.id}`}
                      value={String(d.idDocente || d.id)}
                    >
                      {d.usuario?.nombre || ""}{" "}
                      {d.usuario?.apellidoPaterno || ""}{" "}
                      {d.usuario?.apellidoMaterno || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#691C32] hover:bg-[#501526] text-white mt-4"
          >
            {initialData ? "Actualizar Grupo" : "Crear Grupo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
