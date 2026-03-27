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
}

interface EditGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  especialidades?: Especialidad[];
  periodos?: Periodo[];
  initialData?: any;
}

export default function EditGrupoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  periodos = [],
  initialData,
}: EditGrupoModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    grado: 1,
    turno: "",
    aula: "",
    periodoId: 0,
    especialidadId: 0,
  });

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nombre: initialData.codigo || initialData.nombre || "",
        grado: initialData.semestre || initialData.grado || 1,
        turno: initialData.turno || "",
        aula: initialData.aula || "",
        periodoId: initialData.idPeriodo || initialData.periodoId || 0,
        especialidadId:
          initialData.idEspecialidad || initialData.especialidadId || 0,
      });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "grado" ? parseInt(value) || 1 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: isNaN(parseInt(value)) ? value : parseInt(value),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre ||
      !formData.grado ||
      !formData.turno ||
      !formData.periodoId ||
      !formData.especialidadId
    ) {
      alert(
        "Por favor completa todos los campos requeridos (El aula es opcional)",
      );
      return;
    }

    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
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
                onValueChange={(value) => handleSelectChange("turno", value)}
                value={formData.turno || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona turno" />
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
                onValueChange={(value) =>
                  handleSelectChange("periodoId", value)
                }
                value={
                  formData.periodoId ? formData.periodoId.toString() : undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id.toString()}>
                      {periodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 mb-1">Especialidad *</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("especialidadId", value)
                }
                value={
                  formData.especialidadId
                    ? formData.especialidadId.toString()
                    : undefined
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona especialidad" />
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

          <Button
            type="submit"
            className="w-full bg-[#691C32] hover:bg-[#501526] text-white mt-4 transition-colors"
          >
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
