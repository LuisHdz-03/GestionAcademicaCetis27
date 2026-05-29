"use client";
import { useState, useEffect } from "react";
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

const API_URL = "http://localhost:4000/api/web";

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
  espacioId?: number;
}

interface EspacioOption {
  id: number;
  nombre: string;
}

interface AddMateriaFormProps {
  onSubmit: (data: MateriaFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  initialData?: Partial<MateriaFormData>;
  isEditing?: boolean;
}

export default function AddMateriaForm({
  onSubmit,
  especialidades = [],
  initialData,
  isEditing = false,
}: AddMateriaFormProps) {
  const [espacios, setEspacios] = useState<EspacioOption[]>([]);
  const [formData, setFormData] = useState<MateriaFormData>({
    nombre: initialData?.nombre || "",
    codigo: initialData?.codigo || "",
    semestre: initialData?.semestre || 1,
    horas:
      initialData?.horas ??
      (initialData?.horasTeoria || 0) + (initialData?.horasPractica || 0),
    idEspecialidad: initialData?.idEspecialidad || 0,
    activo: initialData?.activo ?? true,
    creditos: initialData?.creditos || 0,
    horasTeoria: initialData?.horasTeoria || 0,
    horasPractica: initialData?.horasPractica || 0,
    espacioId: initialData?.espacioId || 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        codigo: initialData.codigo || "",
        semestre: initialData.semestre || 1,
        horas:
          initialData.horas ??
          (initialData.horasTeoria || 0) + (initialData.horasPractica || 0),
        idEspecialidad: initialData.idEspecialidad || 0,
        activo: initialData.activo ?? true,
        creditos: initialData.creditos || 0,
        horasTeoria: initialData.horasTeoria || 0,
        horasPractica: initialData.horasPractica || 0,
        espacioId: initialData.espacioId || 0,
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchEspacios = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/espacios`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.espacios)
              ? data.espacios
              : [];

        setEspacios(
          arr
            .map((esp: any) => ({
              id: Number(esp.idEspacio ?? esp.id ?? 0),
              nombre: String(esp.nombre || "").trim(),
            }))
            .filter((esp: EspacioOption) => esp.id > 0 && !!esp.nombre),
        );
      } catch {
        setEspacios([]);
      }
    };

    fetchEspacios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      "semestre",
      "horas",
      "creditos",
      "horasTeoria",
      "horasPractica",
    ];
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? parseInt(value) || 0 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: parseInt(value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedEspecialidadLabel = especialidades.find(
    (esp) => esp.id === formData.idEspecialidad,
  );
  const totalHoras =
    Number(formData.horasTeoria || 0) + Number(formData.horasPractica || 0);

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <Label className="text-gray-700 mb-1">Nombre de la Materia *</Label>
        <Input
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Código *</Label>
          <Input
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
          />
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
          <Label className="text-gray-700 mb-1">Horas Teóricas *</Label>
          <Input
            type="number"
            name="horasTeoria"
            value={formData.horasTeoria}
            onChange={handleChange}
            min="0"
            max="200"
            required
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Horas Prácticas *</Label>
          <Input
            type="number"
            name="horasPractica"
            value={formData.horasPractica}
            onChange={handleChange}
            min="0"
            max="200"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Total de Horas</Label>
          <Input
            type="number"
            value={totalHoras}
            readOnly
            className="bg-gray-50"
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Créditos</Label>
          <Input
            type="number"
            name="creditos"
            value={formData.creditos}
            onChange={handleChange}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Especialidad *</Label>
        <Select
          onValueChange={(value) => handleSelectChange("idEspecialidad", value)}
          value={formData.idEspecialidad?.toString()}
        >
          <SelectTrigger
            className="w-full"
            title={
              selectedEspecialidadLabel
                ? `${selectedEspecialidadLabel.nombre} (${selectedEspecialidadLabel.codigo})`
                : ""
            }
          >
            <SelectValue
              placeholder="Selecciona una especialidad"
              className="block max-w-[calc(100%-1.5rem)] truncate"
            />
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

      <div>
        <Label className="text-gray-700 mb-1">Espacio</Label>
        <Select
          onValueChange={(value) => handleSelectChange("espacioId", value)}
          value={formData.espacioId ? formData.espacioId.toString() : ""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un espacio" />
          </SelectTrigger>
          <SelectContent>
            {espacios.map((espacio) => (
              <SelectItem key={espacio.id} value={espacio.id.toString()}>
                {espacio.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full bg-[#691C32] text-white mt-4">
        {isEditing ? "Actualizar Materia" : "Agregar Materia"}
      </Button>
    </form>
  );
}
