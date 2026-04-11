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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HiBars3 } from "react-icons/hi2";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

const API_URL = "http://localhost:4000/api/web";

interface DashboardHeaderProps {
  nombreUsuario: string;
  tipoUsuario: string;
  avatarUrl: string;
  onOpenMobileSidebar?: () => void;
}

export default function DashboardHeader({
  nombreUsuario,
  tipoUsuario,
  avatarUrl,
  onOpenMobileSidebar,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [uploadingFirma, setUploadingFirma] = useState(false);
  const [firmaFile, setFirmaFile] = useState<File | null>(null);
  const [perfilCompleto, setPerfilCompleto] = useState<boolean>(false);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);
  const [perfilInicial, setPerfilInicial] = useState({
    email: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
  });
  const [perfilFormData, setPerfilFormData] = useState({
    email: "",
    telefono: "",
    direccion: "",
    fechaNacimiento: "",
  });
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "").slice(0, 10);
      setPerfilFormData({ ...perfilFormData, telefono: soloDigitos });
      return;
    }

    setPerfilFormData({ ...perfilFormData, [name]: value });
  };

  const cargarPerfilEditable = async () => {
    setLoadingPerfil(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/auth/perfil-editable`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el perfil editable");
      }

      const data = await response.json();
      const asObject = (v: any) => {
        if (Array.isArray(v)) return v[0] || {};
        return v && typeof v === "object" ? v : {};
      };

      const sources = [
        asObject(data),
        asObject(data?.data),
        asObject(data?.datos),
        asObject(data?.data?.datos),
        asObject(data?.usuario),
        asObject(data?.data?.usuario),
        asObject(data?.perfil),
        asObject(data?.data?.perfil),
        asObject(data?.datosActuales),
        asObject(data?.data?.datosActuales),
        asObject(data?.usuario?.perfil),
        asObject(data?.data?.usuario?.perfil),
      ];

      const pickByAliases = (aliases: string[]) => {
        for (const src of sources) {
          for (const key of aliases) {
            const value = src?.[key];
            if (
              value !== undefined &&
              value !== null &&
              String(value).trim() !== ""
            ) {
              return value;
            }
          }
        }
        return "";
      };

      const perfil = {
        email: String(
          pickByAliases(["email", "correo", "correoElectronico", "mail"]) ||
            user?.email ||
            "",
        ).trim(),
        telefono: String(
          pickByAliases([
            "telefono",
            "telefonoCelular",
            "celular",
            "numeroTelefono",
            "phone",
            "movil",
          ]),
        )
          .toString()
          .replace(/\D/g, "")
          .slice(0, 10),
        direccion: String(
          pickByAliases(["direccion", "domicilio", "calle", "address"]),
        ).trim(),
        fechaNacimiento: String(
          pickByAliases([
            "fechaNacimiento",
            "fecha_nacimiento",
            "birthDate",
            "nacimiento",
          ]),
        )
          .toString()
          .substring(0, 10),
      };

      setPerfilInicial(perfil);
      setPerfilFormData(perfil);
      setPerfilCompleto(!!data?.perfilCompleto);
      setCamposFaltantes(
        Array.isArray(data?.camposFaltantes) ? data.camposFaltantes : [],
      );
      setIsProfileModalOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el perfil editable.",
        variant: "destructive",
      });
    } finally {
      setLoadingPerfil(false);
    }
  };

  const actualizarUsuarioLocal = (usuarioActualizado: any) => {
    const guardado = localStorage.getItem("usuario");
    if (!guardado) return;

    try {
      const actual = JSON.parse(guardado);
      const merged = {
        ...actual,
        email: usuarioActualizado?.email || actual.email,
      };
      localStorage.setItem("usuario", JSON.stringify(merged));
    } catch {
      // Ignorar error de parseo de sesión local
    }
  };

  const handleSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay sesión activa.");

      const perfilPayload: Record<string, string> = {};
      (
        Object.keys(perfilFormData) as Array<keyof typeof perfilFormData>
      ).forEach((key) => {
        const valorNuevo = (perfilFormData[key] || "").trim();
        const valorAnterior = (perfilInicial[key] || "").trim();
        if (valorNuevo !== valorAnterior) {
          perfilPayload[key] = valorNuevo;
        }
      });

      const quiereCambiarPassword =
        passwords.actual.trim() ||
        passwords.nueva.trim() ||
        passwords.confirmar.trim();

      if (
        quiereCambiarPassword &&
        (!passwords.actual.trim() ||
          !passwords.nueva.trim() ||
          !passwords.confirmar.trim())
      ) {
        throw new Error(
          "Para cambiar contraseña debes completar los 3 campos.",
        );
      }

      if (quiereCambiarPassword && passwords.nueva !== passwords.confirmar) {
        throw new Error("Las contraseñas nuevas no coinciden.");
      }

      if (quiereCambiarPassword && passwords.nueva.length < 8) {
        throw new Error(
          "La nueva contraseña debe tener al menos 8 caracteres.",
        );
      }

      const hayPerfilParaActualizar = Object.keys(perfilPayload).length > 0;

      if (
        Object.prototype.hasOwnProperty.call(perfilPayload, "telefono") &&
        perfilPayload.telefono.length !== 10
      ) {
        throw new Error("El teléfono debe tener exactamente 10 dígitos.");
      }

      if (!hayPerfilParaActualizar && !quiereCambiarPassword) {
        throw new Error("No hay cambios para actualizar.");
      }

      if (hayPerfilParaActualizar) {
        const responsePerfil = await fetch(`${API_URL}/auth/completar-perfil`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(perfilPayload),
        });

        const dataPerfil = await responsePerfil.json().catch(() => ({}));
        if (!responsePerfil.ok) {
          throw new Error(
            dataPerfil.error ||
              dataPerfil.mensaje ||
              "No se pudo actualizar el perfil.",
          );
        }

        const usuarioActualizado = dataPerfil?.usuario || dataPerfil;
        actualizarUsuarioLocal(usuarioActualizado);
        setPerfilCompleto(!!dataPerfil?.perfilCompleto);
        setCamposFaltantes(
          Array.isArray(dataPerfil?.camposFaltantes)
            ? dataPerfil.camposFaltantes
            : [],
        );
        setPerfilInicial({ ...perfilFormData });
      }

      if (quiereCambiarPassword) {
        const resPassword = await fetch(`${API_URL}/auth/cambiar-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passwordActual: passwords.actual,
            passwordNueva: passwords.nueva,
          }),
        });

        const dataPassword = await resPassword.json().catch(() => ({}));
        if (!resPassword.ok) {
          throw new Error(
            dataPassword.error || "Error al cambiar la contraseña",
          );
        }
      }

      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente.",
        variant: "success",
      });

      setIsProfileModalOpen(false);
      setPasswords({ actual: "", nueva: "", confirmar: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolverIdAdministrativo = async (): Promise<number | null> => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[FIRMA][ADMIN] No hay token");
      return null;
    }

    const response = await fetch(`${API_URL}/administrativos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.log(
        "[FIRMA][ADMIN] Respuesta no OK al obtener administrativos",
        response.status,
      );
      return null;
    }
    const admins = await response.json();
    console.log("[FIRMA][ADMIN] Lista de administrativos:", admins);
    console.log("[FIRMA][ADMIN] Usuario actual:", user);

    // Buscar coincidencia por todos los posibles campos de id
    const admin = (Array.isArray(admins) ? admins : []).find((a: any) => {
      const posiblesIds = [
        a.id,
        a.idUsuario,
        a.usuarioId,
        a.usuario?.id,
        a.idAdministrativo,
      ];
      const userId = Number(user?.id);
      const idMatch = posiblesIds.some((id) => Number(id) === userId);
      const emailMatch = a.email && user?.email && a.email === user.email;
      // Coincidencia por nombre y apellidos (ignorando mayúsculas/minúsculas)
      const nombreMatch =
        a.nombre?.toLowerCase() === user?.nombre?.toLowerCase();
      const apPatMatch =
        a.apellidoPaterno?.toLowerCase() ===
          user?.apellidoPaterno?.toLowerCase() ||
        a.apellido_paterno?.toLowerCase() ===
          user?.apellidoPaterno?.toLowerCase();
      const apMatMatch =
        a.apellidoMaterno?.toLowerCase() ===
          user?.apellidoMaterno?.toLowerCase() ||
        a.apellido_materno?.toLowerCase() ===
          user?.apellidoMaterno?.toLowerCase();
      const nombreCompletoMatch = nombreMatch && apPatMatch && apMatMatch;
      if (idMatch || emailMatch || nombreCompletoMatch) {
        console.log("[FIRMA][ADMIN] Coincidencia encontrada:", a);
      }
      return idMatch || emailMatch || nombreCompletoMatch;
    });

    if (!admin) {
      // Log extra de todos los ids y nombres para depuración
      (Array.isArray(admins) ? admins : []).forEach((a: any) => {
        console.log("[FIRMA][ADMIN][DEBUG] Administrativo:", {
          id: a.id,
          idUsuario: a.idUsuario,
          usuarioId: a.usuarioId,
          usuario_id: a.usuario?.id,
          idAdministrativo: a.idAdministrativo,
          nombre: a.nombre,
          apellidoPaterno: a.apellidoPaterno,
          apellido_paterno: a.apellido_paterno,
          apellidoMaterno: a.apellidoMaterno,
          apellido_materno: a.apellido_materno,
          email: a.email,
        });
      });
      console.log(
        "[FIRMA][ADMIN] No se encontró coincidencia para el usuario actual",
      );
    }

    return admin
      ? Number(
          admin.idAdministrativo ??
            admin.id ??
            admin.idUsuario ??
            admin.usuarioId ??
            admin.usuario?.id ??
            0,
        )
      : null;
  };

  const handleUploadFirma = async () => {
    if (!firmaFile) {
      console.log("[FIRMA] No hay archivo seleccionado");
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
      console.log("[FIRMA] Token:", token);
      if (!token) throw new Error("No hay sesión activa");

      const idAdministrativo = await resolverIdAdministrativo();
      console.log("[FIRMA] idAdministrativo:", idAdministrativo);
      if (!idAdministrativo) {
        throw new Error("No se pudo identificar el administrativo asociado.");
      }

      const formData = new FormData();
      formData.append("firma", firmaFile);
      formData.append("idAdministrativo", String(idAdministrativo));
      console.log("[FIRMA] formData keys:", Array.from(formData.keys()));
      console.log(
        "[FIRMA] formData idAdministrativo:",
        formData.get("idAdministrativo"),
      );
      console.log("[FIRMA] formData firma:", formData.get("firma"));

      const response = await fetch(`${API_URL}/administrativos/firma/subir`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      console.log("[FIRMA] response status:", response.status);

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
      console.error("[FIRMA] Error:", error);
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
        className="border-b px-3 py-2 sm:px-4 lg:px-5"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenMobileSidebar}
              className="lg:hidden h-9 w-9 p-0 hover:bg-[#50172A]"
              style={{ color: textColor }}
              aria-label="Abrir menú"
            >
              <HiBars3 className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl lg:text-2xl font-bold truncate"
                style={{ color: textColor }}
              >
                Gestión Académica
              </h1>
              <p
                className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate"
                style={{ color: mutedTextColor }}
              >
                {tipoUsuario}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 hover:bg-[#50172A] rounded-md max-w-[60vw]"
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
                {user?.tipoUsuario !== "padre" && (
                  <DropdownMenuItem
                    className="text-sm rounded-md cursor-pointer hover:bg-[#50172A]"
                    onSelect={(e) => {
                      e.preventDefault();
                      cargarPerfilEditable();
                    }}
                  >
                    Actualizar Perfil
                  </DropdownMenuItem>
                )}
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

      {/* Modal para actualizar perfil + contraseña opcional */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#691C32] text-xl">
              Actualizar Perfil
            </DialogTitle>
            <DialogDescription>
              Completa o corrige tus datos obligatorios. También puedes cambiar
              la contraseña aquí.
            </DialogDescription>
          </DialogHeader>

          {loadingPerfil ? (
            <div className="py-6 text-sm text-gray-600">Cargando perfil...</div>
          ) : (
            <form onSubmit={handleSubmitPerfil} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={perfilFormData.email}
                    onChange={handlePerfilChange}
                    className={
                      camposFaltantes.includes("email")
                        ? "border-amber-500"
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={perfilFormData.telefono}
                    onChange={handlePerfilChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className={
                      camposFaltantes.includes("telefono")
                        ? "border-amber-500"
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                  <Input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={perfilFormData.fechaNacimiento}
                    onChange={handlePerfilChange}
                    className={
                      camposFaltantes.includes("fechaNacimiento")
                        ? "border-amber-500"
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={perfilFormData.direccion}
                    onChange={handlePerfilChange}
                    className={
                      camposFaltantes.includes("direccion")
                        ? "border-amber-500"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                Estado del perfil:{" "}
                <strong>{perfilCompleto ? "Completo" : "Incompleto"}</strong>
                {camposFaltantes.length > 0 && (
                  <p className="mt-1">
                    Campos faltantes: {camposFaltantes.join(", ")}
                  </p>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-[#691C32] text-sm">
                  Cambiar contraseña (opcional)
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="actual">Contraseña actual</Label>
                  <Input
                    id="actual"
                    name="actual"
                    type="password"
                    value={passwords.actual}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nueva">Nueva contraseña</Label>
                  <Input
                    id="nueva"
                    name="nueva"
                    type="password"
                    value={passwords.nueva}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmar"
                    name="confirmar"
                    type="password"
                    value={passwords.confirmar}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#691C32] hover:bg-[#50172A] text-white"
                >
                  {loading ? "Actualizando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFirmaModalOpen} onOpenChange={setIsFirmaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#691C32] text-xl">
              Subir Firma de Dirección
            </DialogTitle>
            <DialogDescription>
              Sube la imagen de la firma del director para las credenciales
              oficiales.
            </DialogDescription>
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
