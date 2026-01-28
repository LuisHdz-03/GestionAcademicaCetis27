"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface MateriaFormData {
  nombre: string;
  codigo: string;
  semestre: number;
  horas: number;
  idEspecialidad: number;
  activo: boolean;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
}

interface AddMateriaFormProps {
  onSubmit: (data: MateriaFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  initialData?: Partial<MateriaFormData>;
  isEditing?: boolean;
}

export default function AddMateriaForm({ onSubmit, especialidades = [], initialData, isEditing = false }: AddMateriaFormProps) {
  const [formData, setFormData] = useState<MateriaFormData>({
    nombre: initialData?.nombre || "",
    codigo: initialData?.codigo || "",
    semestre: initialData?.semestre || 1,
    horas: initialData?.horas || 0,
    idEspecialidad: initialData?.idEspecialidad || 0,
    activo: initialData?.activo ?? true,
    creditos: initialData?.creditos || 0,
    horasTeoria: initialData?.horasTeoria || 0,
    horasPractica: initialData?.horasPractica || 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        codigo: initialData.codigo || "",
        semestre: initialData.semestre || 1,
        horas: initialData.horas || 0,
        idEspecialidad: initialData.idEspecialidad || 0,
        activo: initialData.activo ?? true,
        creditos: initialData.creditos || 0,
        horasTeoria: initialData.horasTeoria || 0,
        horasPractica: initialData.horasPractica || 0,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'semestre' || name === 'horas' ? parseInt(value) || 0 : value 
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <Label className="text-gray-700 mb-1">Nombre de la Materia *</Label>
        <Input name="nombre" value={formData.nombre} onChange={handleChange} required />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Código *</Label>
          <Input name="codigo" value={formData.codigo} onChange={handleChange} required />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Semestre *</Label>
          <Input 
            type="number" 
            name="semestre" 
            value={formData.semestre} 
            onChange={handleChange} 
            min="1" 
            max="12" 
            required 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Total de Horas *</Label>
          <Input 
            type="number" 
            name="horas" 
            value={formData.horas} 
            onChange={handleChange} 
            min="1" 
            max="200" 
            required 
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Especialidad *</Label>
          <Select onValueChange={(value) => handleSelectChange('idEspecialidad', value)} value={formData.idEspecialidad?.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una especialidad" />
            </SelectTrigger>
            <SelectContent>
              {especialidades.map((esp) => (
                <SelectItem key={esp.id} value={esp.id.toString()}>
                  {esp.nombre} ({esp.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-[#691C32] text-white mt-4">
        {isEditing ? 'Actualizar Materia' : 'Agregar Materia'}
      </Button>
    </form>
  );
}
