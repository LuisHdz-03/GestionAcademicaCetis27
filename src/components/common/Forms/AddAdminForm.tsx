"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminFormData } from "@/types/modal";

interface AddAdminFormProps {
  onSubmit: (data: AdminFormData) => void;
  mode?: 'create' | 'edit';
  initialData?: Partial<AdminFormData>;
}

export default function AddAdminForm({ onSubmit, mode = 'create', initialData }: AddAdminFormProps) {
  const [formData, setFormData] = useState<AdminFormData>({
    nombre: initialData?.nombre || "",
    apellidoPaterno: initialData?.apellidoPaterno || "",
    apellidoMaterno: initialData?.apellidoMaterno || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    fechaNacimiento: initialData?.fechaNacimiento || "",
    curp: initialData?.curp || "",
    numeroEmpleado: initialData?.numeroEmpleado || "",
    cargo: initialData?.cargo || "",
    activo: initialData?.activo ?? true,
    password: "",
  });

  const cargosDisponibles = [
    "Director",
    "Subdirectora Académica", 
    "Coordinador",
    "Jefe de Departamento",
    "Secretario",
    "Tesorero",
    "Prefecto"
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Nombre *</Label>
          <Input name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Apellido Paterno *</Label>
          <Input name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} required />
        </div>
      </div>
      
      <div>
        <Label className="text-gray-700 mb-1">Apellido Materno</Label>
        <Input name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Email *</Label>
          <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Teléfono</Label>
          <Input name="telefono" value={formData.telefono} onChange={handleChange} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Fecha de Nacimiento *</Label>
          <Input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">CURP *</Label>
          <Input name="curp" value={formData.curp} onChange={handleChange} required maxLength={18} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Número de Empleado *</Label>
          <Input name="numeroEmpleado" value={formData.numeroEmpleado} onChange={handleChange} required />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Cargo *</Label>
          <Select onValueChange={(value) => handleSelectChange('cargo', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cargo" />
            </SelectTrigger>
            <SelectContent>
              {cargosDisponibles.map((cargo) => (
                <SelectItem key={cargo} value={cargo}>
                  {cargo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {mode === 'create' && (
        <div>
          <Label className="text-gray-700 mb-1">Contraseña *</Label>
          <Input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
      )}

      <Button type="submit" className="w-full bg-[#691C32] text-white mt-4">
        {mode === 'create' ? 'Agregar Administrador' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
