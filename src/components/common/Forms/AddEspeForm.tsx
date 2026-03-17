"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EspecialidadFormData } from "@/types/modal";

interface AddEspeFormProps {
  onSubmit: (data: EspecialidadFormData) => void;
  mode?: "create" | "edit";
  initialData?: Partial<EspecialidadFormData>;
}

export default function AddEspeForm({
  onSubmit,
  mode = "create",
  initialData,
}: AddEspeFormProps) {
  const [formData, setFormData] = useState<EspecialidadFormData>({
    nombre: initialData?.nombre || "",
    codigo: initialData?.codigo || "",
    descripcion: initialData?.descripcion || "",
    activo: initialData?.activo ?? true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        codigo: initialData.codigo || "",
        descripcion: initialData.descripcion || "",
        activo: initialData.activo ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <Label className="text-gray-700 mb-1">
          Nombre de la Especialidad *
        </Label>
        <Input
          name="nombre"
          placeholder="Ej: Ingeniería en Sistemas Computacionales"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Código *</Label>
        <Input
          name="codigo"
          placeholder="Ej: ISC"
          value={formData.codigo}
          onChange={handleChange}
          required
          maxLength={10}
        />
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Descripción</Label>
        <Input
          name="descripcion"
          placeholder="Ej: Tecnología e informática"
          value={formData.descripcion}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" className="w-full bg-[#691C32] text-white mt-4">
        {mode === "edit" ? "Actualizar Especialidad" : "Agregar Especialidad"}
      </Button>
    </form>
  );
}
