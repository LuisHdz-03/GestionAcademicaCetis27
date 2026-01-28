"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddDocenteForm from "@/components/common/Forms/AddDocenteForm";
import { DocenteFormData } from "@/types/modal";

interface EditDocenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<DocenteFormData>) => void;
  initialData: Partial<DocenteFormData>;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
}

export default function EditDocenteModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  especialidades = [],
}: EditDocenteModalProps) {
  const handleSubmit = (data: DocenteFormData) => {
    onSubmit({ ...data, password: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Docente</DialogTitle>
        </DialogHeader>
        <AddDocenteForm onSubmit={handleSubmit} especialidades={especialidades} mode="edit" initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}


