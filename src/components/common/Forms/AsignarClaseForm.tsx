"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState } from "react";

interface AsignarClaseFormProps {
  grupos: any[];
  materias: any[];
  docentes: any[];
  onSubmit: (data: any) => void;
}

export default function AsignarClaseForm({
  grupos,
  materias,
  docentes,
  onSubmit,
}: AsignarClaseFormProps) {
  const [formData, setFormData] = useState({
    grupoId: "",
    materiaId: "",
    docenteId: "",
    horario: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      grupoId: Number(formData.grupoId),
      materiaId: Number(formData.materiaId),
      docenteId: Number(formData.docenteId),
      horario: formData.horario,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-gray-700 mb-1">Selecciona un grupos</Label>
        <Select
          value={formData.grupoId}
          onValueChange={(val) => setFormData({ ...formData, grupoId: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ej. 1A Matutino" />
          </SelectTrigger>
          <SelectContent>
            {grupos.map((g) => (
              <SelectItem
                key={g.idGrupo || g.id}
                value={String(g.idGrupo || g.id)}
              >
                {g.nombre}-{g.turno} ({g.especialidadNombre || "Tronco comun"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-gray-700 mb-1">Selecciona una materia</Label>
        <Select
          value={formData.materiaId}
          onValueChange={(val) => setFormData({ ...formData, materiaId: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ej. Álgebra" />
          </SelectTrigger>
          <SelectContent>
            {materias.map((m) => (
              <SelectItem
                key={m.idMateria || m.id}
                value={String(m.idMateria || m.id)}
              >
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-700 mb-1">Asigna un Docente</Label>
        <Select
          value={formData.docenteId}
          onValueChange={(val) => setFormData({ ...formData, docenteId: val })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Buscar profesor..." />
          </SelectTrigger>
          <SelectContent>
            {docentes.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.nombre} {d.apellidoPaterno} - Especialidad:{" "}
                {d.especialidad || "General"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-gray-700 mb-1">Horario (Opcional)</Label>
        <Input
          placeholder="Ej. Lunes 7:00-9:00, Jueves 10:00-11:00"
          value={formData.horario}
          onChange={(e) =>
            setFormData({ ...formData, horario: e.target.value })
          }
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#4a1424] text-white"
      >
        Vincular Docente a Grupo
      </Button>
    </form>
  );
}
