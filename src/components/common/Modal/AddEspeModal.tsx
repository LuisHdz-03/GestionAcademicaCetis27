// components/common/Modal/AddEspecialidadModal.tsx
"use client";

import { DialogContent } from "@/components/ui/dialog";
import AddEspeForm from "../Forms/AddEspeForm";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HiPlus } from "react-icons/hi2";

interface AddEspecialidadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nombre: string; codigo: string }) => void;
}

export default function AddEspecialidadModal({
  open,
  onOpenChange,
  onSubmit,
}: AddEspecialidadModalProps) {
  const handleSubmit = (data: { nombre: string; codigo: string }) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Especialidad</DialogTitle>
        </DialogHeader>
        <AddEspeForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
