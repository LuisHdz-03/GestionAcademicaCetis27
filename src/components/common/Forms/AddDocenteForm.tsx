"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DocenteFormData } from "@/types/modal";

interface AddDocenteFormProps {
  onSubmit: (data: DocenteFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  mode?: "create" | "edit";
  initialData?: Partial<DocenteFormData>;
}

export default function AddDocenteForm({
  onSubmit,
  especialidades = [],
  mode = "create",
  initialData,
}: AddDocenteFormProps) {
  // Solo limpiar "Sin Asignar", el resto se pasa directo
  const limpiarEsp = (nombre?: string) =>
    nombre && nombre !== "Sin Asignar" ? nombre : "";

  const [formData, setFormData] = useState<DocenteFormData>({
    nombre: initialData?.nombre || "",
    apellidoPaterno: initialData?.apellidoPaterno || "",
    apellidoMaterno: initialData?.apellidoMaterno || "",
    telefono: initialData?.telefono || "",
    curp: initialData?.curp || "",
    numeroEmpleado: initialData?.numeroEmpleado || "",
    especialidad: limpiarEsp(initialData?.especialidad),
    fechaContratacion: initialData?.fechaContratacion || "",
    activo: initialData?.activo ?? true,
  });

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData((prev) => ({
        ...prev,
        nombre: initialData.nombre || "",
        apellidoPaterno: initialData.apellidoPaterno || "",
        apellidoMaterno: initialData.apellidoMaterno || "",
        telefono: initialData.telefono || "",
        curp: initialData.curp || "",
        numeroEmpleado: initialData.numeroEmpleado || "",
        especialidad: limpiarEsp(initialData.especialidad),
        fechaContratacion: initialData.fechaContratacion
          ? String(initialData.fechaContratacion).substring(0, 10)
          : "",
        activo: initialData.activo ?? true,
      }));
    }
  }, [initialData, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const especialidadSeleccionada = especialidades.find(
      (esp) => esp.nombre === formData.especialidad,
    );
    const dataToSubmit = {
      ...formData,
      idEspecialidad: especialidadSeleccionada
        ? especialidadSeleccionada.id
        : null,
    };
    onSubmit(dataToSubmit as any);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Nombre *</Label>
          <Input
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Apellido Paterno *</Label>
          <Input
            name="apellidoPaterno"
            value={formData.apellidoPaterno}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Apellido Materno</Label>
        <Input
          name="apellidoMaterno"
          value={formData.apellidoMaterno}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Teléfono</Label>
          <Input
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            maxLength={10}
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">CURP *</Label>
          <Input
            name="curp"
            value={formData.curp}
            onChange={handleChange}
            required
            maxLength={18}
            className="uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Número de Empleado *</Label>
          <Input
            name="numeroEmpleado"
            value={formData.numeroEmpleado}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Fecha de Contratación *</Label>
          <Input
            type="date"
            name="fechaContratacion"
            value={formData.fechaContratacion}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Especialidad *</Label>
        <Select
          key={formData.especialidad || "__empty__"}
          value={formData.especialidad}
          onValueChange={(value) =>
            setFormData({ ...formData, especialidad: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una especialidad" />
          </SelectTrigger>
          <SelectContent>
            {especialidades.map((esp) => (
              <SelectItem key={esp.id} value={esp.nombre}>
                {esp.nombre} ({esp.codigo})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#4a1424] text-white mt-4"
      >
        {mode === "create" ? "Agregar Docente" : "Guardar cambios"}
      </Button>
    </form>
  );
}
