"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddAlumnoForm from "@/components/common/Forms/AddAlumnoForm";
import { AlumnoFormData } from "@/types/modal";

interface Grupo {
  id: number;
  codigo: string;
  semestre: number;
  idEspecialidad: number;
  especialidadId: number;
}

interface AddAlumnoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlumnoFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  grupos?: Grupo[];
}

export default function AddAlumnoModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  grupos = [],
}: AddAlumnoModalProps) {
  const handleSubmit = (data: AlumnoFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Alumno</DialogTitle>
        </DialogHeader>
        <AddAlumnoForm
          onSubmit={handleSubmit}
          especialidades={especialidades}
          grupos={grupos}
        />
      </DialogContent>
    </Dialog>
  );
}
