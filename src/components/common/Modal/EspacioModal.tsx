"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Espacio } from "@/types/community";

interface FormData {
  nombre: string;
  tipo: string;
  descripcion: string;
}

interface EspacioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  editing: Espacio | null;

  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;

  saving: boolean;

  onSave: () => Promise<boolean>;
}

export default function EspacioModal({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  saving,
  onSave,
}: EspacioModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await onSave();

    if (ok) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[#691C32] text-xl">
            {editing ? "Editar Espacio" : "Nuevo Espacio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombre: e.target.value,
                })
              }
              placeholder="Ej. Laboratorio 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Input
              id="tipo"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tipo: e.target.value,
                })
              }
              placeholder="Ej. Aula, Laboratorio, Sala audiovisual"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción (opcional)
            </Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  descripcion: e.target.value,
                })
              }
              placeholder="Ej. Edificio B, planta alta"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[#691C32] hover:bg-[#50172A] text-white"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}