"use client";
import { Button } from "@/components/ui/button";
import { HiPlus, HiTableCells, HiArrowDownTray } from "react-icons/hi2";

interface ActionsBarProps {
  activeTab: string;
}

export default function ActionsBar({ activeTab }: ActionsBarProps) {
  const getAddButtonText = () => {
    switch (activeTab) {
      case "docentes":
        return "Agregar docente";
      case "alumnos":
        return "Agregar alumno";
      case "administradores":
        return "Agregar administrador";
      default:
        return "Agregar";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" className="flex items-center gap-2">
        <HiTableCells className="w-4 h-4" />
        Mostrar columnas
      </Button>

      <Button variant="outline" className="flex items-center gap-2">
        <HiArrowDownTray className="w-4 h-4" />
        Cargar CSV
      </Button>

      <Button className="bg-[#691C32] hover:bg-[#5a1829] text-white flex items-center gap-2">
        <HiPlus className="w-4 h-4" />
        {getAddButtonText()}
      </Button>
    </div>
  );
}
