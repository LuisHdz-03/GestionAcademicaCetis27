"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

interface EditGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  especialidades?: any[];
  periodos?: any[];
  materias?: any[];
  initialData?: any;
  onChangeEspecialidad?: (id: number) => void;
  // 👇 AÑADIMOS ESTO PARA LA AUTO-DETECCIÓN
  activeEspecialidadId?: number;
}

const initialFormState = {
  nombre: "",
  grado: 1,
  turno: "MATUTINO",
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
  activeEspecialidadId,
}: EditGrupoModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [selectMateriaKey, setSelectMateriaKey] = useState(0);

  useEffect(() => {
    if (open) {
      if (initialData) {
        // MODO EDICIÓN
        setFormData({
          nombre: initialData.nombre || initialData.codigo || "",
          grado: initialData.grado || initialData.semestre || 1,
          turno: initialData.turno || "MATUTINO",
          aula: initialData.aula || "",
          periodoId: initialData.periodoId || initialData.idPeriodo || 0,
          especialidadId:
            initialData.especialidadId || initialData.idEspecialidad || 0,
          materiasIds: initialData.clases
            ? initialData.clases.map((c: any) => c.materiaId)
            : [],
        });
      } else {
        // MODO CREACIÓN: Auto-detección
        const defEspId = Number(activeEspecialidadId) || 0;
        setFormData({ ...initialFormState, especialidadId: defEspId });
        if (defEspId > 0 && onChangeEspecialidad)
          onChangeEspecialidad(defEspId);
      }
    } else {
      setFormData(initialFormState);
    }
  }, [open, initialData, activeEspecialidadId]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que no enviemos ceros o NaNs al hook
    if (!formData.nombre || !formData.periodoId || !formData.especialidadId) {
      alert("Por favor rellena el nombre, período y especialidad.");
      return;
    }
    onSubmit(formData);
  };

  const periodosVisibles = periodos.filter(
    (p) => p.activo === true || p.id === formData.periodoId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#691C32] font-bold">
            {initialData ? "✏️ Editar Grupo" : "➕ Registrar Nuevo Grupo"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario de grupos
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
              />
            </div>
            <div>
              <Label>Grado / Semestre *</Label>
              <Input
                type="number"
                value={formData.grado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    grado: parseInt(e.target.value) || 1,
                  })
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
                  <SelectValue />
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Período *</Label>
              <Select
                onValueChange={(v) => handleSelectChange("periodoId", v)}
                value={
                  formData.periodoId > 0 ? formData.periodoId.toString() : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
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
                onValueChange={(v) => handleSelectChange("especialidadId", v)}
                value={
                  formData.especialidadId > 0
                    ? formData.especialidadId.toString()
                    : ""
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
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

          <div className="border-t pt-4 space-y-4">
            <Label className="font-bold">Materias</Label>
            <Select
              key={selectMateriaKey}
              onValueChange={(v) => {
                const id = parseInt(v);
                if (!formData.materiasIds.includes(id))
                  setFormData({
                    ...formData,
                    materiasIds: [...formData.materiasIds, id],
                  });
                setSelectMateriaKey((k) => k + 1);
              }}
              disabled={!formData.especialidadId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Añadir materia..." />
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

            <div className="flex flex-wrap gap-2">
              {formData.materiasIds.map((id) => (
                <div
                  key={id}
                  className="bg-[#691C32] text-white px-2 py-1 rounded-md text-xs flex gap-2"
                >
                  {materias.find((m) => m.id === id)?.nombre || id}
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
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#691C32]">
            {initialData ? "Guardar Cambios" : "Crear Grupo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
