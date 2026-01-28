"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddAlumnoForm from "@/components/common/Forms/AddAlumnoForm";
import { AlumnoFormData } from "@/types/modal";

interface Grupo {
  id: number;
  codigo: string;
  semestre: number;
}

interface EditAlumnoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<AlumnoFormData>) => void;
  initialData: Partial<AlumnoFormData>;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  grupos?: Grupo[];
}

export default function EditAlumnoModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  especialidades = [],
  grupos = [],
}: EditAlumnoModalProps) {
  const handleSubmit = (data: AlumnoFormData) => {
    onSubmit({ ...data, password: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Alumno</DialogTitle>
        </DialogHeader>
        <AddAlumnoForm onSubmit={handleSubmit} especialidades={especialidades} grupos={grupos} mode="edit" initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}


