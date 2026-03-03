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
}

export default function AddClaseModal({
  isOpen,
  onClose,
  grupos,
  materias,
  docentes,
  onSubmit,
}: AddClaseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#691C32]">
            Vincular Nueva Clase
          </DialogTitle>
          <DialogDescription>
            Asigna un docente a un grupo y especifica la materia que va a
            impartir.
          </DialogDescription>
        </DialogHeader>

        <AsignarClaseForm
          grupos={grupos}
          materias={materias}
          docentes={docentes}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
