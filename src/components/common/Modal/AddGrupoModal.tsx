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
  id: number;
  idEspecialidad?: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id: number;
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
  periodoId: 0,
  docenteId: 0,
  docenteTutorId: 0,
  especialidadId: 0,
  materiasIds: [] as number[],
};

export default function EditGrupoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  periodos = [],
  materias = [],
  docentes = [],
  initialData,
  onChangeEspecialidad,
  activeEspecialidadId, // Recibido del padre
}: EditGrupoModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [selectMateriaKey, setSelectMateriaKey] = useState(0);
  const materiasUnicas = Array.from(
    new Map((materias || []).map((m) => [m.id, m])).values(),
  );

  useEffect(() => {
    if (open) {
      if (initialData) {
        const getNum = (value: any): number | null => {
          const n = Number(value);
          return Number.isFinite(n) && n > 0 ? n : null;
        };

        const idsFromClases = Array.isArray(initialData.clases)
          ? initialData.clases
              .map(
                (c: any) =>
                  getNum(c.materiaId) ??
                  getNum(c.idMateria) ??
                  getNum(c.materiasId) ??
                  getNum(c.idMaterias) ??
                  getNum(c.materia?.idMateria) ??
                  getNum(c.materia?.id) ??
                  getNum(c.materias?.idMateria) ??
                  getNum(c.materias?.id),
              )
              .filter((id: any) => id !== null)
          : [];

        const idsFromRootRaw = Array.isArray(initialData.idMaterias)
          ? initialData.idMaterias
          : Array.isArray(initialData.materiasIds)
            ? initialData.materiasIds
            : [];

        const idsFromRoot = idsFromRootRaw.length
          ? idsFromRootRaw
              .map((id: any) => getNum(id))
              .filter((id: any) => id !== null)
          : [];

        const idsExistentesRaw =
          idsFromClases.length > 0 ? idsFromClases : idsFromRoot;
        const idsExistentes = Array.from(new Set(idsExistentesRaw as number[]));
        const currentEspId =
          initialData.idEspecialidad || initialData.especialidadId || 0;

        setFormData({
          nombre: initialData.nombre || initialData.codigo || "",
          grado: initialData.grado || initialData.semestre || 1,
          turno: initialData.turno || "MATUTINO",
          aula: initialData.aula || "",
          periodoId: initialData.periodoId || initialData.idPeriodo || 0,
          docenteId: initialData.docenteId || initialData.idDocente || 0,
          docenteTutorId:
            initialData.docenteTutorId || initialData.idDocenteTutor || 0,
          especialidadId: currentEspId,
          materiasIds: idsExistentes,
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
      setSelectMateriaKey((prev) => prev + 1);
    }
  }, [open, initialData, activeEspecialidadId]);

  const handleSelectChange = (name: string, value: string) => {
    let newValue: any = value;
    // Solo parsear a número si el campo es uno de los siguientes
    if (
      ["periodoId", "especialidadId", "grado", "docenteId", "docenteTutorId"].includes(
        name,
      )
    ) {
      newValue = parseInt(value, 10);
      if (isNaN(newValue)) newValue = 0;
    }
    setFormData((prev) => {
      const newData = { ...prev, [name]: newValue };
      if (name === "especialidadId") {
        newData.materiasIds = [];
        if (onChangeEspecialidad) onChangeEspecialidad(newValue);
      }
      return newData;
    });
  };

  const handleAgregarMateria = (v: string) => {
    const id = parseInt(v);
    if (!formData.materiasIds.includes(id)) {
      setFormData((prev) => ({
        ...prev,
        materiasIds: Array.from(new Set([...prev.materiasIds, id])),
      }));
    }
    setSelectMateriaKey((k) => k + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación estricta para detectar NaN, undefined o valores vacíos
    if (
      !formData.nombre ||
      typeof formData.nombre !== "string" ||
      formData.nombre.trim() === "" ||
      !formData.grado ||
      isNaN(formData.grado) ||
      !formData.periodoId ||
      isNaN(formData.periodoId) ||
      !formData.especialidadId ||
      isNaN(formData.especialidadId) ||
      !Array.isArray(formData.materiasIds) ||
      formData.materiasIds.length === 0
    ) {
      // Log de advertencia para depuración
      console.warn(
        "[AddGrupoModal] Error: Datos inválidos en el formulario",
        formData,
      );
      alert(
        "Por favor completa todos los campos obligatorios y selecciona al menos una materia.",
      );
      return;
    }
    onSubmit(formData);
  };

  const periodosVisibles = periodos.filter(
    (p) => p.activo === true || p.id === formData.periodoId,
  );
  const selectedEspecialidad = especialidades.find(
    (esp) => esp.id === formData.especialidadId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#691C32] font-bold">
            {initialData ? " Editar Grupo" : " Registrar Nuevo Grupo"}
          </DialogTitle>
          {/* Solución al Warning de Description */}
          <DialogDescription className="sr-only">
            Formulario para la gestión de grupos y asignación de materias.
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
              <Input
                value={formData.aula}
                onChange={(e) =>
                  setFormData({ ...formData, aula: e.target.value })
                }
                placeholder="Ej: A-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Período *</Label>
              <Select
                onValueChange={(v) => {
                  handleSelectChange("periodoId", v);
                }}
                value={
                  formData.periodoId > 0 ? formData.periodoId.toString() : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodosVisibles.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
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
                  {especialidades.map((esp) => (
                    <SelectItem key={esp.id} value={esp.id.toString()}>
                      {esp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Docente</Label>
              <Select
                onValueChange={(v) => handleSelectChange("docenteId", v)}
                value={
                  formData.docenteId > 0 ? formData.docenteId.toString() : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map((d) => (
                    <SelectItem
                      key={d.idDocente || d.id}
                      value={String(d.idDocente || d.id)}
                    >
                      {d.usuario?.nombre || ""} {d.usuario?.apellidoPaterno || ""}{" "}
                      {d.usuario?.apellidoMaterno || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Docente tutor</Label>
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
                      {d.usuario?.nombre || ""} {d.usuario?.apellidoPaterno || ""}{" "}
                      {d.usuario?.apellidoMaterno || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <Label className="text-[#691C32] font-bold">
              Materias del Grupo
            </Label>
            <Select
              key={selectMateriaKey}
              onValueChange={handleAgregarMateria}
              disabled={!formData.especialidadId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Materia" />
              </SelectTrigger>
              <SelectContent>
                {materiasUnicas
                  .filter((m) => !formData.materiasIds.includes(m.id))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50">
              {formData.materiasIds.length === 0 && (
                <span className="text-gray-400 text-xs">
                  Sin materias asignadas
                </span>
              )}
              {formData.materiasIds.map((id) => {
                const mat = materiasUnicas.find((m) => m.id === id);
                return (
                  <div
                    key={id}
                    className="bg-[#691C32] text-white rounded-full px-3 py-1 text-xs flex items-center gap-2"
                  >
                    {mat?.nombre || `ID: ${id}`}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          materiasIds: formData.materiasIds.filter(
                            (mid) => mid !== id,
                          ),
                        })
                      }
                      className="font-bold"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
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
