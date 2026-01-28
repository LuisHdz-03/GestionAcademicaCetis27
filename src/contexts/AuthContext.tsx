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

type ApiResponse<T> = {
  data?: T;
  message?: string;
  error?: string;
};

export type UserRole = "admin" | "docente" | "alumno" | "guardia" | "prefecto";

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoUsuario: UserRole;
}

interface LoginResponse {
  success: boolean;
  token: string;
  usuario: User;
  message?: string;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
            "apellidoPaterno",
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
          const response = await fetch(`${API_URL}/api/v1/health`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            // Evitar caché para asegurar que verificamos el token real
            cache: "no-store",
            // Timeout para la petición
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            throw new Error(
              `Error en la verificación del token: ${response.statusText}`,
            );
          }
        } catch (error) {
          console.error("Error al verificar token:", error);
          // Si hay un error de red o el token es inválido, cerramos sesión
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          setUser(null);
        }
      } catch (error) {
        console.error("Error inesperado en checkAuth:", error);
        // En caso de cualquier otro error, limpiamos todo por seguridad
        if (isClient) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar la verificación de autenticación
    checkAuth();

    // Limpieza en caso de que el componente se desmonte
    return () => {
      // Aquí podríamos cancelar la petición fetch si está pendiente
      // usando AbortController si fuera necesario
    };
  }, [isClient]); // Añadimos isClient como dependencia

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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
        signal: controller.signal,
        credentials: "include",
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
        console.error(
          "Login failed with status:",
          response.status,
          "Response:",
          result,
        );
        const errorMessage = result?.message || "Error en la autenticación";
        throw new Error(
          errorMessage.includes("inválid") || errorMessage.includes("incorrect")
            ? "El email o contraseña son incorrectos. Verifica tus datos e intenta de nuevo."
            : errorMessage.includes("requerido")
              ? "Por favor, completa todos los campos requeridos."
              : errorMessage,
        );
      }

      // Validar la respuesta
      if (!result.success || !result.token || !result.usuario) {
        console.error("Invalid response format:", result);
        throw new Error(
          "La respuesta del servidor no contiene los datos esperados",
        );
      }

      const { token, usuario } = result;

      // Validar el objeto de usuario
      if (!usuario.id || !usuario.email || !usuario.tipoUsuario) {
        throw new Error("Datos de usuario incompletos");
      }

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      setUser(usuario);

      // Redirigir según el rol del usuario
      const redirectPath =
        usuario.tipoUsuario === "guardia" ? "/dashboard/scan-qr" : "/dashboard";

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
    if (!isClient) {
      console.warn("Intento de cierre de sesión en el servidor");
      return;
    }

    const performLogout = async () => {
      try {
        // Opcional: Llamar al endpoint de logout del servidor si es necesario
        try {
          await fetch(`${API_URL}/api/v1/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (serverError) {
          console.warn(
            "No se pudo notificar al servidor del cierre de sesión:",
            serverError,
          );
        }

        // Limpiar el almacenamiento local
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        // Limpiar el estado
        setUser(null);

        // Redirigir a la página de login
        router.push("/auth/login");
        router.refresh();
      } catch (error) {
        console.error("Error durante el cierre de sesión:", error);
        // Forzar redirección incluso si hay un error
        router.push("/auth/login");
      }
    };

    performLogout();
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
