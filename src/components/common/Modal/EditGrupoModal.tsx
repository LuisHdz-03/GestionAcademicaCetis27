"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddGrupoForm, {
  AddGrupoFormProps,
} from "@/components/common/Forms/AddGrupoForm";
import { GrupoFormData } from "@/types/modal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  idPeriodo: number;
  nombre: string;
  codigo: string;
}

interface Docente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

export interface AddGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GrupoFormData) => void;
  especialidades?: Especialidad[];
  docentes?: Docente[];
  materias?: Materia[];
  periodos?: any[];
  initialData?: Partial<GrupoFormData>;
  isEditing?: boolean;
}

export default function AddGrupoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  docentes = [],
  periodos = [],
  initialData,
  isEditing = false,
}: AddGrupoModalProps) {
  const [materiasFiltradas, setMateriasFiltradas] = useState<Materia[]>([]);

  useEffect(() => {
    if (!open) {
      setMateriasFiltradas([]);
    }
  }, [open]);

  const cargarMateriasPorEspecialidad = async (idEspecialidad: number) => {
    if (!idEspecialidad || idEspecialidad === 0) {
      setMateriasFiltradas([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const res = await fetch(
        `${API_URL}/materias/especialidad/${idEspecialidad}`,
        {
          headers,
        },
      );

      if (res.ok) {
        const data = await res.json();
        const materiasNuevas = data.map((m: any) => ({
          id: m.idMateria || m.id,
          nombre: m.nombre,
          codigo: m.codigo,
        }));
        setMateriasFiltradas(materiasNuevas);
      } else {
        setMateriasFiltradas([]);
      }
    } catch (error) {
      console.error("Error al cargar materias filtradas:", error);
      setMateriasFiltradas([]);
    }
  };

  const handleSubmit = (data: GrupoFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const periodosFormateados = periodos.map((p) => ({
    id: (p as any).id ?? (p as any).idPeriodo ?? 0,
    idPeriodo: (p as any).idPeriodo ?? (p as any).id ?? 0,
    nombre: (p as any).nombre ?? "",
    codigo: (p as any).codigo ?? "",
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Grupo" : "Agregar Grupo"}
          </DialogTitle>
        </DialogHeader>
        <AddGrupoForm
          onSubmit={handleSubmit}
          especialidades={especialidades}
          docentes={docentes}
          materias={materiasFiltradas} // MANDAMOS LAS FILTRADAS
          periodos={periodosFormateados}
          initialData={initialData}
          mode={isEditing ? "edit" : "create"}
          onChangeEspecialidad={cargarMateriasPorEspecialidad} // CONECTAMOS LÓGICA
        />
      </DialogContent>
    </Dialog>
  );
}
