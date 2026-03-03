"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddGrupoForm from "@/components/common/Forms/AddGrupoForm";
import { GrupoFormData } from "@/types/modal";

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

interface AddGrupoModalProps {
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
  materias = [],
  periodos = [],
  initialData,
  isEditing = false,
}: AddGrupoModalProps) {
  const handleSubmit = (data: GrupoFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  // Mapear periodos al formato esperado por el formulario
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
          <DialogTitle>Agregar Grupo</DialogTitle>
        </DialogHeader>
        <AddGrupoForm
          onSubmit={handleSubmit}
          especialidades={especialidades}
          docentes={docentes}
          materias={materias}
          periodos={periodosFormateados}
          initialData={initialData}
          mode={isEditing ? "edit" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}
