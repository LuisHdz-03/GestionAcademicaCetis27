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
import { AlumnoFormData } from "@/types/modal";
import { useToast } from "@/hooks/useToast";

interface Grupo {
  id: number;
  codigo: string;
  semestre: number;
  idEspecialidad: number;
}

interface AddAlumnoFormProps {
  onSubmit: (data: AlumnoFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  grupos?: Grupo[];
  mode?: "create" | "edit";
  initialData?: Partial<AlumnoFormData>;
}

export default function AddAlumnoForm({
  onSubmit,
  especialidades = [],
  grupos = [],
  mode = "create",
  initialData,
}: AddAlumnoFormProps) {
  const { toast } = useToast(); // 2. INICIALIZAMOS EL TOAST

  const [formData, setFormData] = useState<AlumnoFormData>({
    nombre: initialData?.nombre || "",
    apellidoPaterno: initialData?.apellidoPaterno || "",
    apellidoMaterno: initialData?.apellidoMaterno || "",
    telefono: initialData?.telefono || "",
    curp: initialData?.curp || "",
    numeroControl: initialData?.numeroControl || "",
    idEspecialidad: initialData?.idEspecialidad ?? 0,
    idGrupo: initialData?.idGrupo
      ? Number(initialData.idGrupo as any)
      : undefined,
    direccion: initialData?.direccion || "",
    semestreActual: initialData?.semestreActual ?? 1,
    fechaIngreso: initialData?.fechaIngreso || "",
    activo: initialData?.activo ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "semestreActual") {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 1,
        idGrupo: undefined,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "idEspecialidad" || name === "idGrupo") {
      if (name === "idGrupo" && value === "0") {
        setFormData({ ...formData, [name]: undefined });
      } else if (name === "idEspecialidad") {
        setFormData({
          ...formData,
          [name]: parseInt(value) || 0,
          idGrupo: undefined,
        });
      } else {
        const found = grupos.find((gr) => String(gr.id) === value);
        if (found) {
          setFormData({ ...formData, [name]: found.id });
        } else {
          const maybeNum = Number(value);
          setFormData({
            ...formData,
            [name]: Number.isNaN(maybeNum) ? undefined : maybeNum,
          });
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefono && formData.telefono.length !== 10) {
      toast({
        title: "Teléfono inválido",
        description: "El número de teléfono debe tener exactamente 10 dígitos.",
        variant: "destructive",
      });
      return;
    }
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

  useEffect(() => {
    if (!formData.idEspecialidad || formData.idEspecialidad === 0) {
      if (especialidades.length === 1) {
        setFormData((fd) => ({
          ...fd,
          idEspecialidad: especialidades[0].id,
          idGrupo: undefined,
        }));
        return;
      }

      if (grupos && grupos.length > 0) {
        const first = grupos[0] as any;
        const espId =
          first.idEspecialidad ??
          first.especialidadId ??
          first.especialidad?.id ??
          null;
        if (espId) {
          setFormData((fd) => ({
            ...fd,
            idEspecialidad: Number(espId),
            idGrupo: undefined,
          }));
        }
      }
    }
  }, [especialidades, grupos]);

  const gruposFiltrados = grupos.filter((g: any) => {
    const espId = g.idEspecialidad || g.especialidadId;
    return Number(espId) === Number(formData.idEspecialidad);
  });

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
            onChange={(e) => {
              const valorLimpio = e.target.value
                .replace(/\D/g, "")
                .slice(0, 10);
              setFormData({ ...formData, telefono: valorLimpio });
            }}
            maxLength={10}
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">CURP *</Label>
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
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-700 mb-1">Número de Control *</Label>
          <Input
            name="numeroControl"
            value={formData.numeroControl}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label className="text-gray-700 mb-1">Semestre Actual *</Label>
          <Input
            type="number"
            name="semestreActual"
            value={formData.semestreActual}
            onChange={handleChange}
            min="1"
            max="12"
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Especialidad *</Label>
        <Select
          value={
            formData.idEspecialidad
              ? String(formData.idEspecialidad)
              : undefined
          }
          onValueChange={(value) => handleSelectChange("idEspecialidad", value)}
        >
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

      <div>
        <Label className="text-gray-700 mb-1">
          Grupo {gruposFiltrados.length > 0 && "(opcional)"}
        </Label>
        <Select
          value={formData.idGrupo ? String(formData.idGrupo) : "0"}
          onValueChange={(value) => handleSelectChange("idGrupo", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un grupo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sin grupo</SelectItem>
            {gruposFiltrados.map((grupo) => (
              <SelectItem key={grupo.id} value={grupo.id.toString()}>
                {grupo.codigo} - Semestre {grupo.semestre}°
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {gruposFiltrados.length === 0 &&
          formData.semestreActual > 0 &&
          formData.idEspecialidad > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              No hay grupos disponibles para el semestre{" "}
              {formData.semestreActual}° de esta especialidad
            </p>
          )}
        {gruposFiltrados.length === 0 &&
          (!formData.idEspecialidad || formData.idEspecialidad === 0) && (
            <p className="text-sm text-blue-600 mt-1">
              Selecciona una especialidad primero para ver los grupos
              disponibles
            </p>
          )}
        {gruposFiltrados.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {gruposFiltrados.length} grupo(s) disponible(s) para el semestre{" "}
            {formData.semestreActual}° de esta especialidad
          </p>
        )}
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Dirección</Label>
        <Input
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Fecha de Ingreso</Label>
        <Input
          type="date"
          name="fechaIngreso"
          value={formData.fechaIngreso}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#4a1424] text-white mt-4"
      >
        {mode === "create" ? "Agregar Alumno" : "Guardar cambios"}
      </Button>
    </form>
  );
}
