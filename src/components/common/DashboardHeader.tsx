"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

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
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFirma, setUploadingFirma] = useState(false);
  const [firmaFile, setFirmaFile] = useState<File | null>(null);
  const [passwords, setPasswords] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const normalizarTexto = (texto: string) =>
    (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();

  const cargoUsuario = normalizarTexto(
    (user as any)?.cargo || tipoUsuario || "",
  );
  const esDirectivo = [
    "DIRECTOR",
    "SUBDIRECTORA ACADEMICA",
    "COORDINADOR",
    "COORDINADOR ACADEMICO",
  ].includes(cargoUsuario);

  const headerBg = "#691C32";
  const textColor = "#FFFFFF";
  const mutedTextColor = "#F2D7D5";
  const hoverBg = "#50172A";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.nueva !== passwords.confirmar) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.nueva.length < 8) {
      toast({
        title: "Atención",
        description: "La nueva contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/cambiar-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          passwordActual: passwords.actual,
          passwordNueva: passwords.nueva,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      toast({
        title: "Éxito",
        description: "Tu contraseña ha sido actualizada correctamente.",
        variant: "success",
      });

      setIsModalOpen(false);
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolverIdAdministrativo = async (): Promise<number | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await fetch(`${API_URL}/administrativos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const admins = await response.json();
    const admin = (Array.isArray(admins) ? admins : []).find(
      (a: any) =>
        Number(a.idUsuario ?? a.usuarioId ?? a.usuario?.id ?? 0) ===
          Number(user?.id) || a.email === user?.email,
    );

    return admin ? Number(admin.idAdministrativo ?? admin.id ?? 0) : null;
  };

  const handleUploadFirma = async () => {
    if (!firmaFile) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona una imagen de firma para continuar.",
        variant: "destructive",
      });
      return;
    }

    setUploadingFirma(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay sesión activa");

      const idAdministrativo = await resolverIdAdministrativo();
      if (!idAdministrativo) {
        throw new Error("No se pudo identificar el administrativo asociado.");
      }

      const formData = new FormData();
      formData.append("firma", firmaFile);
      formData.append("idAdministrativo", String(idAdministrativo));

      const response = await fetch(`${API_URL}/admins/firma/subir`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const statusMessage: Record<number, string> = {
          400: "Datos inválidos para subir la firma.",
          403: "No tienes permisos para subir firma.",
          404: "No se encontró el administrativo para subir firma.",
          500: "Error interno al procesar la firma.",
        };
        const fallback =
          statusMessage[response.status] || "No se pudo subir la firma.";
        throw new Error(fallback);
      }

      toast({
        title: "Firma actualizada",
        description: "La firma fue subida correctamente.",
        variant: "success",
      });
      setIsFirmaModalOpen(false);
      setFirmaFile(null);
    } catch (error: any) {
      toast({
        title: "Error al subir firma",
        description: error.message || "Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setUploadingFirma(false);
    }
  };

  return (
    <>
      <header
        className="border-b px-5 py-1"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textColor }}>
              Gestión Académica
            </h1>
            <p className="text-sm mt-1" style={{ color: mutedTextColor }}>
              {tipoUsuario}
            </p>
          </div>

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
                    <AvatarFallback
                      style={{
                        backgroundColor: mutedTextColor,
                        color: headerBg,
                      }}
                    >
                      {nombreUsuario
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p
                      className="text-sm font-medium"
                      style={{ color: textColor }}
                    >
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
                {/* Usamos onSelect en lugar de onClick. 
                  e.preventDefault() evita que Radix cierre el dropdown antes de que React abra el modal.
                */}
                <DropdownMenuItem
                  className="text-sm rounded-md cursor-pointer hover:bg-[#50172A]"
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                  }}
                >
                  Cambiar Contraseña
                </DropdownMenuItem>
                {esDirectivo && (
                  <DropdownMenuItem
                    className="text-sm rounded-md cursor-pointer hover:bg-[#50172A]"
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsFirmaModalOpen(true);
                    }}
                  >
                    Subir Firma
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#50172A]" />
                <DropdownMenuItem
                  className="text-sm rounded-md cursor-pointer hover:bg-[#801C2C]"
                  onSelect={() => logout()}
                >
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Modal para cambiar contraseña movido FUERA del dropdown */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#691C32] text-xl">
              Cambiar Contraseña
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="actual">Contraseña Actual</Label>
              <Input
                id="actual"
                name="actual"
                type="password"
                required
                value={passwords.actual}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nueva">Nueva Contraseña</Label>
              <Input
                id="nueva"
                name="nueva"
                type="password"
                required
                value={passwords.nueva}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmar"
                name="confirmar"
                type="password"
                required
                value={passwords.confirmar}
                onChange={handleChange}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#691C32] hover:bg-[#50172A] text-white"
              >
                {loading ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFirmaModalOpen} onOpenChange={setIsFirmaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#691C32] text-xl">
              Subir Firma de Dirección
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="firma">Archivo de firma (imagen)</Label>
              <Input
                id="firma"
                type="file"
                accept="image/*"
                onChange={(e) => setFirmaFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500">
                Formato recomendado: PNG con fondo transparente o firma clara en
                JPG.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFirmaModalOpen(false);
                  setFirmaFile(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={uploadingFirma}
                onClick={handleUploadFirma}
                className="bg-[#691C32] hover:bg-[#50172A] text-white"
              >
                {uploadingFirma ? "Subiendo..." : "Subir Firma"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
