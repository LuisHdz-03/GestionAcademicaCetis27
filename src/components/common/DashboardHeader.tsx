"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  nombreUsuario: string;
  tipoUsuario: string;
  avatarUrl: string;
}

export default function DashboardHeader({
  nombreUsuario,
  tipoUsuario,
  avatarUrl,
}: DashboardHeaderProps) {
  const { logout } = useAuth();

  const headerBg = "#691C32";
  const textColor = "#FFFFFF";
  const mutedTextColor = "#F2D7D5";
  const hoverBg = "#50172A";
  const dangerBg = "#801C2C";

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b px-5 py-1" style={{ backgroundColor: headerBg }}>
      <div className="flex items-center justify-between">
        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            Gestión Académica
          </h1>
          <p className="text-sm mt-1" style={{ color: mutedTextColor }}>
            {tipoUsuario}
          </p>
        </div>

        {/* Área derecha con perfil y dropdown */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:bg-[#50172A] rounded-md"
                style={{ color: textColor }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback style={{ backgroundColor: mutedTextColor, color: headerBg }}>
                    {nombreUsuario.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium" style={{ color: textColor }}>
                    {nombreUsuario}
                  </p>
                  <p className="text-xs" style={{ color: mutedTextColor }}>
                    {tipoUsuario}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-md shadow-lg"
              style={{
                backgroundColor: headerBg,
                color: textColor,
                border: `1px solid ${hoverBg}`,
              }}
            >
              <DropdownMenuItem
                className="text-sm rounded-md cursor-pointer hover:bg-[#801C2C]"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
