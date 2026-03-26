"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { XCircle, UserCheck, LogOut, QrCode } from "lucide-react";

// Interfaces que coinciden con la respuesta de tu backend
interface AccesoResponse {
  mensaje: string;
  tipo: "ENTRADA" | "SALIDA";
  alumno: string;
  matricula: string;
  hora: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export default function ScanQRPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [resultadoAcceso, setResultadoAcceso] = useState<AccesoResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bufferRef = useRef<string>("");

  // Captura teclas directamente en el documento — sin <input> visible,
  // así ninguna extensión de contraseñas puede inyectar su botón.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un campo de formulario real
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        const codigo = bufferRef.current.trim();
        if (codigo) registrarAcceso(codigo);
        bufferRef.current = "";
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Enviamos el código al backend para validar
  const registrarAcceso = async (tokenQR: string) => {
    if (!tokenQR || isLoading) return;

    setResultadoAcceso(null);
    setError(null);
    setIsLoading(true);

    try {
      const tokenAuth = localStorage.getItem("token");

      if (!tokenAuth) {
        toast({
          title: "Sesión Expirada",
          description: "Inicia sesión nuevamente",
          variant: "destructive",
        });
        logout();
        return;
      }

      const response = await fetch(`${API_URL}/accesos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenQR }),
      });

      const data = await response.json();

      if (response.status === 401 && data.error === "Token inválido") {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || data.mensaje || "Error al registrar el acceso",
        );
      }

      setResultadoAcceso(data as AccesoResponse);

      const esEntrada = data.tipo === "ENTRADA";
      toast({
        title: esEntrada ? "Entrada Registrada" : "Salida Registrada",
        description: data.mensaje,
        variant: "success",
      });
    } catch (err) {
      console.error("Error:", err);
      const errMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errMsg);

      toast({
        title: "Error de Escaneo",
        description: errMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      bufferRef.current = "";
    }
  };

  // El handleKeyDown ya no es necesario — se captura en el useEffect de document

  const esPrefecto =
    user?.tipoUsuario === "prefecto" ||
    (user?.tipoUsuario === "administrativo" &&
      (user?.cargo || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim() === "PREFECTO");

  if (
    user?.tipoUsuario !== "guardia" &&
    user?.tipoUsuario !== "admin" &&
    !esPrefecto
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6">
            Solo el personal de seguridad puede usar el escáner.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            Volver al panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Control de Accesos
            </h1>
            <p className="text-gray-600">Pistola Lectora de QR Activada</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-800 text-sm font-medium rounded-full">
            {user?.cargo
              ? user.cargo.charAt(0).toUpperCase() +
                user.cargo.slice(1).toLowerCase()
              : user?.tipoUsuario
                ? user.tipoUsuario.charAt(0).toUpperCase() +
                  user.tipoUsuario.slice(1).toLowerCase()
                : "Oficial"}
            : {user?.nombre}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Zona de resultados */}
          <div className="p-8 min-h-[300px] flex flex-col items-center justify-center bg-gray-50">
            {isLoading ? (
              <div className="text-center">
                <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[#691C32]/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#691C32] border-t-transparent animate-spin"></div>
                  <QrCode
                    className="h-8 w-8 text-[#691C32]"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-[#691C32] font-semibold text-lg">
                  Validando acceso...
                </p>
                <p className="text-gray-400 text-sm mt-1">Por favor espere</p>
              </div>
            ) : error ? (
              <div className="text-center w-full max-w-sm">
                <div className="mx-auto flex items-center justify-center mb-4">
                  <XCircle
                    className="h-20 w-20 text-red-500"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-xl font-bold text-red-700 mb-2">
                  Acceso Rechazado
                </h3>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            ) : resultadoAcceso ? (
              <div className="text-center w-full max-w-sm">
                <div className="mx-auto flex items-center justify-center mb-4">
                  {resultadoAcceso.tipo === "ENTRADA" ? (
                    <UserCheck
                      className="h-24 w-24 text-green-500"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <LogOut
                      className="h-24 w-24 text-orange-500"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {resultadoAcceso.alumno}
                </h3>
                <p className="text-gray-500 mb-6">
                  Matrícula: {resultadoAcceso.matricula}
                </p>

                <div
                  className={`inline-block px-6 py-2 rounded-full font-bold text-lg tracking-wide ${
                    resultadoAcceso.tipo === "ENTRADA"
                      ? "bg-green-500 text-white shadow-green-200"
                      : "bg-orange-500 text-white shadow-orange-200"
                  } shadow-lg`}
                >
                  {resultadoAcceso.tipo} AUTORIZADA
                </div>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <div className="mx-auto flex items-center justify-center mb-4">
                  <QrCode className="h-24 w-24 text-gray-400" strokeWidth={1} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Sistema en Espera
                </h3>
                <p className="text-sm">
                  Apunte la pistola lectora al código QR de la credencial.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
