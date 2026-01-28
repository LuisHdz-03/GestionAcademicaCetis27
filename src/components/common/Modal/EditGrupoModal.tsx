"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddGrupoForm from "@/components/common/Forms/AddGrupoForm";
import { GrupoFormData } from "@/types/modal";
import { Grupo } from "@/types/community";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  idPeriodo: number;
  nombre: string;
  codigo: string;
}

interface Docente {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

interface Materia {
  id: number;
  nombre: string;
  codigo: string;
}

interface EditGrupoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<GrupoFormData>) => void;
  grupo: Grupo | null;
  especialidades?: Especialidad[];
  periodos?: Periodo[];
  docentes?: Docente[];
  materias?: Materia[];
}

export default function EditGrupoModal({ 
  open, 
  onOpenChange, 
  onSubmit,
  grupo,
  especialidades = [],
  periodos = [],
  docentes = [],
  materias = []
}: EditGrupoModalProps) {
  const handleSubmit = (data: GrupoFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  if (!grupo) return null;

  const initialData: Partial<GrupoFormData> = {
    codigo: grupo.codigo,
    semestre: grupo.semestre,
    aula: grupo.aula,
    idEspecialidad: grupo.idEspecialidad,
    idPeriodo: grupo.idPeriodo,
    idDocente: grupo.idDocente,
    idMateria: grupo.idMateria,
    activo: grupo.activo,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Grupo</DialogTitle>
        </DialogHeader>
        <AddGrupoForm 
          onSubmit={handleSubmit} 
          especialidades={especialidades}
          periodos={periodos}
          docentes={docentes}
          materias={materias}
          mode="edit"
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}
