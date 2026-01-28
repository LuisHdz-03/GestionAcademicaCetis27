"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddDocenteForm from "@/components/common/Forms/AddDocenteForm";
import { DocenteFormData } from "@/types/modal";

interface AddDocenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DocenteFormData) => void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
}

export default function AddDocenteModal({ 
  open, 
  onOpenChange, 
  onSubmit,
  especialidades = []
}: AddDocenteModalProps) {
  const handleSubmit = (data: DocenteFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Docente</DialogTitle>
        </DialogHeader>
        <AddDocenteForm onSubmit={handleSubmit} especialidades={especialidades} />
      </DialogContent>
    </Dialog>
  );
}