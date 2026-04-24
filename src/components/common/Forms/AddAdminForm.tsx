"use client";
import { useState } from "react";
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
import { AdminFormData } from "@/types/modal";
import { useToast } from "@/hooks/useToast";

interface AddAdminFormProps {
  onSubmit: (data: AdminFormData) => void;
  mode?: "create" | "edit";
  initialData?: Partial<AdminFormData>;
}

export default function AddAdminForm({
  onSubmit,
  mode = "create",
  initialData,
}: AddAdminFormProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<AdminFormData>({
    nombre: initialData?.nombre || "",
    apellidoPaterno: initialData?.apellidoPaterno || "",
    apellidoMaterno: initialData?.apellidoMaterno || "",
    telefono: initialData?.telefono || "",
    curp: initialData?.curp || "",
    numeroEmpleado: initialData?.numeroEmpleado || "",
    cargo: initialData?.cargo || "",
    area: initialData?.area || "",
    activo: initialData?.activo ?? true,
  });

  const cargosDisponibles = [
    "Director",
    "Subdirectora Académica",
    "Coordinador",
    "Jefe de Departamento",
    "Secretario",
    "Prefecto",
    "Guardia",
  ];

  const cargoActual = formData.cargo;
  const todosLosCargos =
    cargoActual && !cargosDisponibles.includes(cargoActual)
      ? [cargoActual, ...cargosDisponibles]
      : cargosDisponibles;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    // Siempre guardar el cargo con mayúscula inicial
    let cargoFormateado = value;
    if (name === "cargo") {
      cargoFormateado = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    setFormData({ ...formData, [name]: cargoFormateado });
  };

  // 3. ACTUALIZAMOS EL HANDLESUBMIT CON VALIDACIONES
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar longitud exacta del Teléfono (si es que puso algo)
    if (formData.telefono && formData.telefono.length !== 10) {
      toast({
        title: "Teléfono inválido",
        description: "El número de teléfono debe tener exactamente 10 dígitos.",
        variant: "destructive",
      });
      return;
    }

    // Validar longitud exacta de la CURP
    if (formData.curp && formData.curp.length !== 18) {
      toast({
        title: "CURP inválida",
        description: "La CURP debe tener exactamente 18 caracteres.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
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
          {/* 4. INPUT BLINDADO DE TELÉFONO */}
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
          {/* 5. INPUT BLINDADO DE CURP */}
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
          <Label className="text-gray-700 mb-1">Cargo *</Label>
          <Select
            key={formData.cargo || "__empty__"}
            value={formData.cargo}
            onValueChange={(value) => handleSelectChange("cargo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cargo" />
            </SelectTrigger>
            <SelectContent>
              {todosLosCargos.map((cargo) => (
                <SelectItem key={cargo} value={cargo}>
                  {cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Área</Label>
        <Input
          name="area"
          value={formData.area || ""}
          onChange={handleChange}
          placeholder="Ej. Área General"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#4a1424] text-white mt-4"
      >
        {mode === "create" ? "Agregar Personal Escolar" : "Guardar cambios"}
      </Button>
    </form>
  );
}
