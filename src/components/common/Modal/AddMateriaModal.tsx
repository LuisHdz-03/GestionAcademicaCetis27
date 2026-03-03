"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddMateriaForm from "@/components/common/Forms/AddMateriaForm";
import { MateriaFormData } from "@/types/modal";

interface AddMateriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MateriaFormData) => Promise<boolean> | boolean | void;
  especialidades?: Array<{ id: number; nombre: string; codigo: string }>;
  initialData?: Partial<MateriaFormData>;
  isEditing?: boolean;
}

export default function AddMateriaModal({
  open,
  onOpenChange,
  onSubmit,
  especialidades = [],
  initialData,
  isEditing = false,
}: AddMateriaModalProps) {
  const handleSubmit = (data: MateriaFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Materia" : "Agregar Materia"}
          </DialogTitle>
        </DialogHeader>
        <AddMateriaForm
          onSubmit={handleSubmit}
          especialidades={especialidades}
          initialData={initialData}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
}
