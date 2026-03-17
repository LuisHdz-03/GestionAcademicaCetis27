import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AsignarClaseForm from "../Forms/AsignarClaseForm";

interface AddClaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupos: any[];
  materias: any[];
  docentes: any[];
  onSubmit: (data: any) => void;
  mode?: "create" | "edit";
  claseEditar?: any;
}

export default function AddClaseModal({
  isOpen,
  onClose,
  grupos,
  materias,
  docentes,
  onSubmit,
  mode = "create",
  claseEditar,
}: AddClaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#691C32]">
            {mode === "edit" ? "Editar Clase" : "Vincular Nueva Clase"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Modifica los datos de la clase asignada."
              : "Asigna un docente a un grupo y especifica la materia que va a impartir."}
          </DialogDescription>
        </DialogHeader>

        <AsignarClaseForm
          grupos={grupos}
          materias={materias}
          docentes={docentes}
          onSubmit={onSubmit}
          mode={mode}
          initialData={
            claseEditar
              ? {
                  grupoId: claseEditar.grupoId || claseEditar.grupo?.idGrupo,
                  materiaId:
                    claseEditar.materiaId || claseEditar.materias?.idMateria,
                  docenteId: claseEditar.docenteId || claseEditar.docente?.id,
                  horario: claseEditar.horario || "",
                }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}
