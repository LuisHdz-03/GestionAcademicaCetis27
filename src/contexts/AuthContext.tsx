"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export type UserRole =
  | "admin"
  | "docente"
  | "alumno"
  | "guardia"
  | "prefecto"
  | "administrativo"
  | "directivo";

export interface UserCapabilities {
  accesoInstitucionalCompleto?: boolean;
  puedeVerBitacoraCompleta?: boolean;
}

export interface User {
  id: number;
  idDocente?: number;
  email?: string;
  username?: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  tipoUsuario: UserRole;
  cargo?: string;
  capacidades?: UserCapabilities;
  passwordChangeRequired?: boolean;
}

export interface PeriodoActivo {
  idPeriodo: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

type AuthContextType = {
  user: User | null;
  periodoActivo: PeriodoActivo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoActivo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const sessionExpiredHandledRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  const isClient = typeof window !== "undefined";

  const logout = useCallback((): void => {
    if (!isClient) return;
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("sessionExpiresAt");
    setUser(null);
    setPeriodoActivo(null);
    window.location.replace("/auth/login");
  }, [isClient]);

  const handleSessionExpired = useCallback(
    (message?: string): void => {
      if (!isClient || sessionExpiredHandledRef.current) return;

      sessionExpiredHandledRef.current = true;
      toast({
        title: "Sesión Expirada",
        description: message || "Tu sesión ha expirado. Ingresa de nuevo.",
        variant: "destructive",
      });
      logout();
    },
    [isClient, logout, toast],
  );

  // (Mantenemos tu useEffect de checkAuth tal como estaba...)
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

        const parsedUser = JSON.parse(usuarioGuardado) as User;
        setUser(parsedUser);
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [isClient, logout]);

  useEffect(() => {
    if (!isClient) return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = await response.clone().json();
          if (
            payload?.code === "SESSION_EXPIRED" ||
            payload?.code === "INVALID_TOKEN"
          ) {
            handleSessionExpired(
              payload.error || payload.message || payload.mensaje,
            );
          }
        }
      } catch {
        // Ignorar respuestas no JSON o cuerpos no parseables.
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [handleSessionExpired, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const checkExpiracionAlVolver = () => {
      if (document.visibilityState !== "visible") return;

      const expiresAtStr = localStorage.getItem("sessionExpiresAt");
      if (!expiresAtStr) return;

      const expiresAt = new Date(expiresAtStr).getTime();
      if (Date.now() >= expiresAt) {
        handleSessionExpired("Tu sesión ha expirado. Ingresa de nuevo.");
      }
    };

    document.addEventListener("visibilitychange", checkExpiracionAlVolver);
    window.addEventListener("focus", checkExpiracionAlVolver);
    checkExpiracionAlVolver();

    return () => {
      document.removeEventListener("visibilitychange", checkExpiracionAlVolver);
      window.removeEventListener("focus", checkExpiracionAlVolver);
    };
  }, [isClient, handleSessionExpired]);

  const login = async (
    usernameInput: string,
    passwordInput: string,
  ): Promise<void> => {
    if (!isClient) return;
    setIsLoading(true);

    try {
      const payload = {
        username: usernameInput.trim(),
        password: passwordInput,
        plataforma: "WEB",
      };

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.mensaje || result.error || "Error en la autenticación",
        );
      }

      // Formateamos el usuario
      const usuarioFormateado: User = {
        id: result.usuario.idUsuario || result.usuario.id,
        nombre: result.usuario.nombre || result.usuario.datos?.nombre || "",
        apellidoPaterno:
          result.usuario.apellidoPaterno ||
          result.usuario.datos?.apellidoPaterno ||
          "",
        tipoUsuario: (
          result.usuario.rol ||
          result.usuario.tipoUsuario ||
          ""
        ).toLowerCase() as UserRole,
        cargo: result.usuario.cargo || result.usuario.datos?.cargo || "",
      };

      sessionExpiredHandledRef.current = false;
      localStorage.setItem("token", result.token);
      localStorage.setItem("usuario", JSON.stringify(usuarioFormateado));
      localStorage.setItem("sessionExpiresAt", result.session.expiresAt);
      setUser(usuarioFormateado);

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    periodoActivo,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}
