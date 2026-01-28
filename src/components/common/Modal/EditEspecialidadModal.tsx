"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddEspeForm from "@/components/common/Forms/AddEspeForm";
import { EspecialidadFormData } from "@/types/modal";

interface EditEspecialidadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<EspecialidadFormData>) => void;
  initialData: Partial<EspecialidadFormData>;
}

export default function EditEspecialidadModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EditEspecialidadModalProps) {
  const handleSubmit = (data: EspecialidadFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Especialidad</DialogTitle>
        </DialogHeader>
        <AddEspeForm onSubmit={handleSubmit} mode="edit" initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}

