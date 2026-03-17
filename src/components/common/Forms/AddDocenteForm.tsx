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
import { useToast } from "@/hooks/useToast"; // IMPORTACIÓN DEL TOAST

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
  const { toast } = useToast(); // INICIALIZAR EL TOAST

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

  // NUEVO HANDLESUBMIT CON VALIDACIONES
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar longitud exacta del Teléfono (si es que puso algo)
    if (formData.telefono && formData.telefono.length !== 10) {
      toast({
        title: "Teléfono inválido",
        description: "El número de teléfono debe tener exactamente 10 dígitos.",
        variant: "destructive",
      });
      return;
    }

    // 2. Validar longitud exacta de la CURP
    if (formData.curp && formData.curp.length !== 18) {
      toast({
        title: "CURP inválida",
        description: "La CURP debe tener exactamente 18 caracteres.",
        variant: "destructive",
      });
      return;
    }

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
          {/* INPUT BLINDADO DE TELÉFONO */}
          <Input
            name="telefono"
            value={formData.telefono}
            onChange={(e) => {
              const valorLimpio = e.target.value
                .replace(/\D/g, "")
                .slice(0, 10);
              setFormData({ ...formData, telefono: valorLimpio });
            }}
            maxLength={10}
            placeholder="Ej. 4521234567"
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">CURP *</Label>
          {/* INPUT BLINDADO DE CURP */}
          <Input
            name="curp"
            value={formData.curp}
            onChange={(e) => {
              const valorLimpio = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 18);
              setFormData({ ...formData, curp: valorLimpio });
            }}
            required
            maxLength={18}
            placeholder="18 caracteres alfanuméricos"
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
