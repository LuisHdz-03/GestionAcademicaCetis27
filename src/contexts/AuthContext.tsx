"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
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
  username: string;
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
  login: (username: string, password: string) => Promise<void>;
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

  const logout = useCallback((): void => {
    if (!isClient) return;
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUser(null);
    window.location.replace("/auth/login");
  }, [isClient]);

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
            "username",
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
                  (a: any) =>
                    a.usuarioId === usuario.id ||
                    a.idUsuario === usuario.id ||
                    a.id === usuario.id ||
                    a.email === usuario.email,
                );
                if (miPerfil?.cargo) {
                  usuario.cargo = miPerfil.cargo;
                  localStorage.setItem("usuario", JSON.stringify(usuario));
                }
              }
            } catch (err) {
              console.warn(
                "No se pudo obtener el cargo del administrativo:",
                err,
              );
            }
          }

          setUser(usuario);
        } catch (error) {
          console.error("Error al validar usuario:", error);
          logout();
          setIsLoading(false);
          return;
        }

        try {
          const [, payloadB64] = token.split(".");
          if (payloadB64) {
            const decoded = JSON.parse(atob(payloadB64));
            if (decoded.exp && decoded.exp * 1000 < Date.now()) {
              toast({
                title: "Sesión expirada",
                description:
                  "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
                variant: "destructive",
              });
              logout();
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Ignorar error de decodificación
        }
      } catch (error) {
        console.error("Error inesperado en checkAuth:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isClient, logout, toast]);

  // 3. NUEVO: useEffect para monitorear activamente la expiración del token
  useEffect(() => {
    // Si no hay usuario logueado o no estamos en el cliente, no hacemos nada
    if (!isClient || !user) return;

    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logout();
        return;
      }

      try {
        const [, payloadB64] = token.split(".");
        if (payloadB64) {
          const decoded = JSON.parse(atob(payloadB64));
          // Revisamos si el token ya caducó
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            toast({
              title: "Sesión caducada",
              description: "Por seguridad, tu sesión de 8 horas ha terminado.",
              variant: "destructive",
            });
            logout();
          }
        }
      } catch (error) {
        logout();
      }
    };

    // Ejecuta la revisión cada 60 segundos (60000 milisegundos)
    const intervalId = setInterval(checkTokenExpiration, 60000);

    // Limpia el intervalo cuando el componente se desmonta
    return () => clearInterval(intervalId);
  }, [isClient, user, logout, toast]);

  const login = async (username: string, password: string): Promise<void> => {
    if (!isClient) {
      throw new Error(
        "El inicio de sesión solo está disponible en el navegador",
      );
    }

    if (!username || !password) {
      throw new Error("El nombre de usuario y la contraseña son requeridos");
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
          username: username.trim(),
          password: password,
          plataforma: "WEB",
        }),
        signal: controller.signal,
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

      const perfilEstudiante = Array.isArray(result.usuario.perfilEstudiante)
        ? result.usuario.perfilEstudiante[0]
        : result.usuario.perfilEstudiante;
      const perfilDocente = Array.isArray(result.usuario.perfilDocente)
        ? result.usuario.perfilDocente[0]
        : result.usuario.perfilDocente;
      const perfilAdministrativo = Array.isArray(
        result.usuario.perfilAdministrativo,
      )
        ? result.usuario.perfilAdministrativo[0]
        : result.usuario.perfilAdministrativo;

      const usuarioFormateado: User = {
        id: result.usuario.idUsuario || result.usuario.id,
        email: result.usuario.email || result.usuario.correo || "",
        username:
          result.usuario.username || result.usuario.usuario || username.trim(),
        nombre:
          result.usuario.nombre ||
          perfilEstudiante?.usuario?.nombre ||
          perfilDocente?.usuario?.nombre ||
          perfilAdministrativo?.usuario?.nombre ||
          "",
        apellidoPaterno:
          result.usuario.apellidoPaterno ||
          result.usuario.datos?.apellidoPaterno ||
          perfilEstudiante?.usuario?.apellidoPaterno ||
          perfilDocente?.usuario?.apellidoPaterno ||
          perfilAdministrativo?.usuario?.apellidoPaterno ||
          "",
        apellidoMaterno:
          result.usuario.apellidoMaterno ||
          result.usuario.datos?.apellidoMaterno ||
          perfilEstudiante?.usuario?.apellidoMaterno ||
          perfilDocente?.usuario?.apellidoMaterno ||
          perfilAdministrativo?.usuario?.apellidoMaterno ||
          "",
        tipoUsuario: (
          result.usuario.rol ||
          result.usuario.tipoUsuario ||
          ""
        ).toLowerCase() as UserRole,
        cargo:
          result.usuario.cargo ||
          result.usuario.datos?.cargo ||
          perfilAdministrativo?.cargo ||
          "",
      };

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
