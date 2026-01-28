"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddMateriaForm from "@/components/common/Forms/AddMateriaForm";

interface MateriaFormData {
  nombre: string;
  codigo: string;
  semestre: number;
  horas: number;
  idEspecialidad: number;
  activo: boolean;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
}

interface AddMateriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MateriaFormData) => void;
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
          <DialogTitle>{isEditing ? 'Editar Materia' : 'Agregar Materia'}</DialogTitle>
        </DialogHeader>
        <AddMateriaForm onSubmit={handleSubmit} especialidades={especialidades} initialData={initialData} isEditing={isEditing} />
      </DialogContent>
    </Dialog>
  );
}