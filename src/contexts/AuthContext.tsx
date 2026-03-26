"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export type UserRole =
  | "admin"
  | "docente"
  | "alumno"
  | "guardia"
  | "prefecto"
  | "administrativo";

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoUsuario: UserRole;
  cargo?: string;
}

interface LoginResponse {
  mensaje?: string;
  token: string;
  usuario: any;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isClient = typeof window !== "undefined";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isClient) {
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const usuarioGuardado = localStorage.getItem("usuario");

        if (!token || !usuarioGuardado) {
          setIsLoading(false);
          return;
        }

        let usuario: User;
        try {
          const parsedUser = JSON.parse(usuarioGuardado);

          if (!parsedUser || typeof parsedUser !== "object") {
            throw new Error("Formato de usuario inválido");
          }

          const requiredFields: (keyof User)[] = [
            "id",
            "email",
            "tipoUsuario",
            "nombre",
          ];

          const missingFields = requiredFields.filter((field) => {
            const value = parsedUser[field];
            return value === undefined || value === null || value === "";
          });

          if (missingFields.length > 0) {
            throw new Error(
              `Faltan campos requeridos: ${missingFields.join(", ")}`,
            );
          }

          usuario = parsedUser as User;

          // Si es administrativo y no tiene cargo guardado, obtenerlo
          if (usuario.tipoUsuario === "administrativo" && !usuario.cargo) {
            try {
              const adminRes = await fetch(`${API_URL}/administrativos`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(5000),
              });
              if (adminRes.ok) {
                const admins = await adminRes.json();
                const miPerfil = admins.find(
                  (a: any) => a.id === usuario.id || a.email === usuario.email,
                );
                if (miPerfil?.cargo) {
                  usuario.cargo = miPerfil.cargo;
                  // Actualizar localStorage con el cargo
                  localStorage.setItem("usuario", JSON.stringify(usuario));
                }
              }
            } catch {
              console.warn("No se pudo obtener el cargo del administrativo");
            }
          }

          setUser(usuario);
        } catch (error) {
          console.error("Error al validar usuario:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          setUser(null);
          setIsLoading(false);
          return;
        }

        try {
          // Verificamos expiración del token localmente sin llamar al servidor.
          // Así evitamos desloguear usuarios por endpoints que devuelven 403/404
          // según su rol (ej: prefecto no puede acceder a rutas de admin).
          const [, payloadB64] = token.split(".");
          if (payloadB64) {
            const decoded = JSON.parse(atob(payloadB64));
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              // Token expirado — limpiar sesión
              localStorage.removeItem("token");
              localStorage.removeItem("usuario");
              setUser(null);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Si no se puede decodificar el JWT, asumimos que sigue válido.
          // El servidor rechazará las peticiones si realmente expiró.
        }
      } catch (error) {
        console.error("Error inesperado en checkAuth:", error);
        if (isClient) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {};
  }, [isClient]);

  const login = async (email: string, password: string): Promise<void> => {
    if (!isClient) {
      throw new Error(
        "El inicio de sesión solo está disponible en el navegador",
      );
    }

    if (!email || !password) {
      throw new Error("El correo electrónico y la contraseña son requeridos");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Por favor ingresa un correo electrónico válido");
    }

    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          plataforma: "WEB",
        }),
        signal: controller.signal,
        //credentials: "include",
      });

      clearTimeout(timeoutId);
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      if (!contentType || !contentType.includes("application/json")) {
        console.error("Expected JSON response but got:", contentType);
        throw new Error("La respuesta del servidor no es un JSON válido");
      }

      let result: LoginResponse;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        const errorMessage =
          result.mensaje ||
          (result as any).error ||
          "Error en la autenticación";
        throw new Error(errorMessage);
      }

      if (!result.token || !result.usuario) {
        console.error("Invalid response format:", result);
        throw new Error(
          "La respuesta del servidor no contiene los datos esperados",
        );
      }

      const usuarioFormateado: User = {
        id: result.usuario.id,
        email: email.trim(),
        nombre: result.usuario.nombre,
        apellidoPaterno:
          result.usuario.apellidoPaterno ||
          result.usuario.datos?.apellidoPaterno ||
          "",
        tipoUsuario: result.usuario.rol.toLowerCase() as UserRole,
        cargo: result.usuario.cargo || result.usuario.datos?.cargo || "",
      };

      // Si es administrativo/prefecto y no vino cargo del login, buscarlo en /administrativos
      const tipoNorm = usuarioFormateado.tipoUsuario.toUpperCase();
      if (
        (tipoNorm === "ADMINISTRATIVO" || tipoNorm === "PREFECTO") &&
        !usuarioFormateado.cargo
      ) {
        try {
          const adminRes = await fetch(`${API_URL}/administrativos`, {
            headers: {
              Authorization: `Bearer ${result.token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000),
          });
          if (adminRes.ok) {
            const admins = await adminRes.json();
            // El perfil administrativo puede tener usuarioId o id distinto al idUsuario.
            // Buscamos primero por email, luego por usuarioId o por el id del usuario logeado.
            const miPerfil = admins.find(
              (a: any) =>
                a.email === usuarioFormateado.email ||
                a.usuarioId === usuarioFormateado.id ||
                a.idUsuario === usuarioFormateado.id,
            );
            if (miPerfil?.cargo) {
              usuarioFormateado.cargo = miPerfil.cargo;
            }
          }
        } catch {
          console.warn("No se pudo obtener el cargo del administrativo");
        }
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem("usuario", JSON.stringify(usuarioFormateado));
      setUser(usuarioFormateado);

      const esPrefecto =
        usuarioFormateado.tipoUsuario === "prefecto" ||
        (usuarioFormateado.tipoUsuario === "administrativo" &&
          (usuarioFormateado.cargo || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim() === "PREFECTO");

      const redirectPath =
        usuarioFormateado.tipoUsuario === "guardia" || esPrefecto
          ? "/dashboard/scan-qr"
          : "/dashboard";

      router.push(redirectPath);
      router.refresh();
      return;
    } catch (error: unknown) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    if (!isClient) return;

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    // Redirigir antes de limpiar el estado para evitar pantalla en blanco
    window.location.replace("/auth/login");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
