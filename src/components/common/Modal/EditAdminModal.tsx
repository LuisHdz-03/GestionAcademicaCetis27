"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddAdminForm from "@/components/common/Forms/AddAdminForm";
import { AdminFormData } from "@/types/modal";

interface EditAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<AdminFormData>) => void;
  initialData: Partial<AdminFormData>;
}

export default function EditAdminModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EditAdminModalProps) {
  const handleSubmit = (data: AdminFormData) => {
    onSubmit({ ...data, password: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Administrador</DialogTitle>
        </DialogHeader>
        <AddAdminForm onSubmit={handleSubmit} mode="edit" initialData={initialData} />
      </DialogContent>
    </Dialog>
  );
}


