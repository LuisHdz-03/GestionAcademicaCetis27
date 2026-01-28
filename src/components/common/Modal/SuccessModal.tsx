// components/common/SuccessModal.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HiCheckCircle } from "react-icons/hi2";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function SuccessModal({ 
  isOpen, 
  onClose,
  title = "¡Período creado exitosamente!",
  message = "Tu entorno de trabajo está listo para usarse."
}: SuccessModalProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          {/* Ícono de check verde */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <HiCheckCircle className="w-10 h-10 text-green-600" />
          </div>

          

          {/* Mensaje */}
          <p className="text-gray-600">
            {message}
          </p>

          {/* Botón Aceptar */}
          <Button 
            onClick={onClose}
            className="bg-[#691C32] hover:bg-[#5a1829] text-white px-8"
          >
            Aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}