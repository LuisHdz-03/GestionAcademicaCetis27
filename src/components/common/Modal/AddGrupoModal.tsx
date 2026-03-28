"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  nombre: string;
  codigo: string;
}

interface Periodo {
  id: number;
  nombre: string;
  codigo: string;
  activo?: boolean;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

interface EditGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  especialidades?: Especialidad[];
  periodos?: Periodo[];
  materias?: Materia[];
  initialData?: any;
  onChangeEspecialidad?: (id: number) => void;
  activeEspecialidadId?: number;
}

// Valor inicial para reutilizar en el reset
const initialFormState = {
  nombre: "",
  grado: 1,
  turno: "",
  aula: "",
  periodoId: 0,
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
  initialData,
  onChangeEspecialidad,
}: EditGrupoModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [selectMateriaKey, setSelectMateriaKey] = useState(0);

  // EFECTO DE CONTROL DE APERTURA/CIERRE Y CARGA DE DATOS
  useEffect(() => {
    if (open) {
      if (initialData) {
        // MODO EDICIÓN: Cargar datos recibidos
        const idsExistentes = initialData.clases
          ? initialData.clases.map((c: any) => c.materiaId)
          : initialData.materiasIds || [];

        const currentEspId =
          initialData.idEspecialidad || initialData.especialidadId || 0;

        setFormData({
          nombre: initialData.codigo || initialData.nombre || "",
          grado: initialData.semestre || initialData.grado || 1,
          turno: initialData.turno || "",
          aula: initialData.aula || "",
          periodoId: initialData.idPeriodo || initialData.periodoId || 0,
          especialidadId: currentEspId,
          materiasIds: idsExistentes,
        });

        if (currentEspId > 0 && onChangeEspecialidad) {
          onChangeEspecialidad(currentEspId);
        }
      } else {
        // MODO CREACIÓN (o apertura limpia): Resetear al estado inicial
        setFormData(initialFormState);
      }
    } else {
      // AL CERRAR: Opcionalmente podemos resetear aquí también para evitar "flashes" de datos viejos la próxima vez
      setFormData(initialFormState);
      setSelectMateriaKey((prev) => prev + 1);
    }
  }, [open, initialData]); // Se dispara cada vez que el modal se abre/cierra o cambian los datos base

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "grado" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    const intValue = parseInt(value);
    setFormData((prev) => {
      const newData = { ...prev, [name]: isNaN(intValue) ? value : intValue };

      if (name === "especialidadId") {
        newData.materiasIds = [];
        if (onChangeEspecialidad) onChangeEspecialidad(intValue);
      }
      return newData;
    });
  };

  const handleAgregarMateria = (value: string) => {
    const id = parseInt(value);
    if (!isNaN(id) && !formData.materiasIds.includes(id)) {
      setFormData((prev) => ({
        ...prev,
        materiasIds: [...prev.materiasIds, id],
      }));
    }
    setSelectMateriaKey((prev) => prev + 1);
  };

  const handleQuitarMateria = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      materiasIds: prev.materiasIds.filter((mId) => mId !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre ||
      !formData.grado ||
      !formData.turno ||
      !formData.periodoId ||
      !formData.especialidadId ||
      formData.materiasIds.length === 0
    ) {
      alert(
        "Por favor completa todos los campos y selecciona al menos una materia.",
      );
      return;
    }

    onSubmit(formData);
    // El onOpenChange(false) lo maneja el componente padre tras el submit exitoso generalmente,
    // pero lo dejamos para asegurar el cierre.
    onOpenChange(false);
  };

  const periodosVisibles = periodos.filter(
    (p) => p.activo === true || p.id === formData.periodoId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Grupo" : "Registrar Nuevo Grupo"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 mb-1">Nombre del Grupo *</Label>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: 1A, 2B"
              />
            </div>
            <div>
              <Label className="text-gray-700 mb-1">Semestre / Grado *</Label>
              <Input
                type="number"
                name="grado"
                value={formData.grado}
                onChange={handleChange}
                min="1"
                max="6"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 mb-1">Turno *</Label>
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
              <Label className="text-gray-700 mb-1">Aula</Label>
              <Input
                name="aula"
                value={formData.aula}
                onChange={handleChange}
                placeholder="Ej: A-101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 mb-1">Período *</Label>
              <Select
                onValueChange={(v) => handleSelectChange("periodoId", v)}
                value={
                  formData.periodoId > 0
                    ? formData.periodoId.toString()
                    : undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona período" />
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
              <Label className="text-gray-700 mb-1">Especialidad *</Label>
              <Select
                onValueChange={(v) => handleSelectChange("especialidadId", v)}
                value={
                  formData.especialidadId > 0
                    ? formData.especialidadId.toString()
                    : undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Especialidad" />
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
            <div className="w-full">
              <Label className="text-gray-700 mb-1">Agregar Materia *</Label>
              <Select
                key={selectMateriaKey}
                onValueChange={handleAgregarMateria}
                disabled={!formData.especialidadId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Materia" />
                </SelectTrigger>
                <SelectContent>
                  {materias
                    .filter((m) => !formData.materiasIds.includes(m.id))
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 mb-2 block">
                Materias asignadas:
              </Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 min-h-[50px]">
                {formData.materiasIds.length === 0 && (
                  <span className="text-gray-400 text-sm">
                    Sin materias asignadas
                  </span>
                )}
                {formData.materiasIds.map((id) => {
                  const materia = materias.find((m) => m.id === id);
                  return (
                    <div
                      key={id}
                      className="bg-white border border-[#691C32]/30 rounded-full px-3 py-1 text-xs flex items-center gap-2 text-[#691C32] font-medium shadow-sm"
                    >
                      {materia?.nombre || `ID: ${id}`}
                      <button
                        type="button"
                        onClick={() => handleQuitarMateria(id)}
                        className="hover:text-red-600 font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#691C32] hover:bg-[#501526] text-white mt-4 transition-colors"
          >
            {initialData ? "Guardar Cambios" : "Crear Grupo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
