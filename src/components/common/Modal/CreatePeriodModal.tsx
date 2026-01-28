// components/common/CreatePeriodModal.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; fechaInicio: string; fechaFin: string }) => void;
  mode?: 'create' | 'edit';
  initialData?: { nombre: string; fechaInicio: string; fechaFin: string };
  onDelete?: (id: number) => Promise<void> | void;
  periodoId?: number;
}

export default function CreatePeriodModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  mode = 'create',
  initialData,
  onDelete,
  periodoId
}: CreatePeriodModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ nombre: "", fechaInicio: "", fechaFin: "" });
    onClose();
  };

  // Cargar datos iniciales en modo edición o resetear al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData({ nombre: "", fechaInicio: "", fechaFin: "" });
    } else if (mode === 'edit' && initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        fechaInicio: initialData.fechaInicio || "",
        fechaFin: initialData.fechaFin || "",
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Crear Nuevo Período' : 'Editar Período'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensaje informativo */}
          {mode === 'create' && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm text-gray-700">
                Para comenzar a usar el sistema, debes crear un período. Ingresa la información correspondiente.
              </p>
            </div>
          )}

          {/* Nombre del período */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
              Nombre del período:
            </Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Ej: 2025-1, Semestre Enero-Junio 2025"
              className="w-full"
              required
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700">
                Fecha de inicio:
              </Label>
              <Input
                id="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange("fechaInicio", e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin" className="text-sm font-medium text-gray-700">
                Fecha de fin:
              </Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) => handleInputChange("fechaFin", e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-between items-center pt-4">
            {mode === 'edit' && onDelete && periodoId && (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  if (confirm('¿Estás seguro de eliminar este período? Esta acción es irreversible y puede afectar datos relacionados.')) {
                    if (confirm('Esta acción es muy peligrosa. ¿Realmente deseas continuar?')) {
                      await onDelete(periodoId);
                      handleClose();
                    }
                  }
                }}
                className="px-6"
              >
                Eliminar período
              </Button>
            )}
            {mode === 'create' && <div />}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#691C32] hover:bg-[#5a1829] text-white px-6"
              >
                {mode === 'create' ? 'Crear período' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}