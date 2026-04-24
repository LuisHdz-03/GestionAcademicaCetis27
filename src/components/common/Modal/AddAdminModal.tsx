"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AddAdminForm from "@/components/common/Forms/AddAdminForm";
import { AdminFormData } from "@/types/modal";

interface AddAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AdminFormData) => void;
}

export default function AddAdminModal({ 
  open, 
  onOpenChange, 
  onSubmit 
}: AddAdminModalProps) {
  const handleSubmit = (data: AdminFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Personal Escolar</DialogTitle>
        </DialogHeader>
        <AddAdminForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
