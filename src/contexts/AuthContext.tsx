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
  | "administrativo"
  | "directivo";

export interface UserCapabilities {
  accesoInstitucionalCompleto?: boolean;
  puedeVerBitacoraCompleta?: boolean;
}

export interface User {
  id: number;
  idDocente?: number;
  email: string;
  username: string;
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

interface LoginResponse {
  mensaje?: string;
  token: string;
  usuario: any;
  passwordChangeRequired?: boolean;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoActivo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const isClient = typeof window !== "undefined";

  const logout = useCallback((): void => {
    if (!isClient) return;
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUser(null);
    setPeriodoActivo(null);
    window.location.replace("/auth/login");
  }, [isClient]);

  const obtenerMiPerfil = useCallback(async (token: string) => {
    const endpoints = ["/auth/mi-perfil"];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(30000), // Aumentado a 30s
        });

        if (res.status === 401) {
          throw new Error("UNAUTHORIZED");
        }

        if (res.status === 403) {
          throw new Error("FORBIDDEN");
        }

        if (!res.ok) {
          continue;
        }

        const data = await res.json();
        if (data?.usuario) {
          return data;
        }
      } catch (error: any) {
        if (
          error?.message === "UNAUTHORIZED" ||
          error?.message === "FORBIDDEN"
        ) {
          throw error;
        }
      }
    }

    return null;
  }, []);

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

          usuario = parsedUser as User;

          if (
            (usuario.tipoUsuario === "administrativo" ||
              usuario.tipoUsuario === "directivo") &&
            !usuario.cargo
          ) {
            try {
              const adminRes = await fetch(`${API_URL}/administrativos`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                signal: AbortSignal.timeout(30000), // Aumentado a 30s
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

          try {
            const perfilPayload = await obtenerMiPerfil(token);
            if (perfilPayload?.usuario) {
              usuario = {
                ...usuario,
                email: perfilPayload.usuario.email || usuario.email,
                tipoUsuario: (
                  perfilPayload.usuario.rol || usuario.tipoUsuario
                ).toLowerCase() as UserRole,
                cargo: perfilPayload.usuario.perfil?.cargo || usuario.cargo,
                capacidades: {
                  accesoInstitucionalCompleto:
                    !!perfilPayload.capacidades?.accesoInstitucionalCompleto,
                  puedeVerBitacoraCompleta:
                    !!perfilPayload.capacidades?.puedeVerBitacoraCompleta,
                },
              };
              localStorage.setItem("usuario", JSON.stringify(usuario));
            }
          } catch (error: any) {
            if (error?.message === "UNAUTHORIZED") {
              toast({
                title: "Sesión inválida",
                description: "Tu sesión expiró. Inicia sesión nuevamente.",
                variant: "destructive",
              });
              logout();
              setIsLoading(false);
              return;
            }
          }

          // BUSCAMOS TODOS LOS PERIODOS Y FILTRAMOS EL ACTIVO
          try {
            const resPeriodos = await fetch(`${API_URL}/periodos`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: AbortSignal.timeout(30000),
            });
            if (resPeriodos.ok) {
              const dataPeriodos = await resPeriodos.json();
              const periodos = Array.isArray(dataPeriodos)
                ? dataPeriodos
                : Array.isArray(dataPeriodos?.data)
                  ? dataPeriodos.data
                  : [];
              const periodoActual = periodos.find((p: any) => p.activo === true);
              setPeriodoActivo(periodoActual || null);
            } else {
              setPeriodoActivo(null);
            }
          } catch (error) {
            console.warn("No se pudo cargar el periodo activo global", error);
            setPeriodoActivo(null);
          }

          setUser(usuario);
        } catch (error) {
          console.error("Error al validar usuario:", error);
          logout();
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error inesperado en checkAuth:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isClient, logout, obtenerMiPerfil, toast]);

  useEffect(() => {
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
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            toast({
              title: "Sesión caducada",
              description: "Por seguridad, tu sesión ha terminado.",
              variant: "destructive",
            });
            logout();
          }
        }
      } catch (error) {
        logout();
      }
    };

    const intervalId = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(intervalId);
  }, [isClient, user, logout, toast]);

  const login = async (username: string, password: string): Promise<void> => {
    if (!isClient)
      throw new Error(
        "El inicio de sesión solo está disponible en el navegador",
      );
    if (!username || !password)
      throw new Error("El usuario/correo y la contraseña son requeridos");

    setIsLoading(true);

    try {
      const identificador = username.trim();
      const payloads = [
        { username: identificador, password, plataforma: "WEB" },
        { email: identificador, password, plataforma: "WEB" },
        { correo: identificador, password, plataforma: "WEB" },
        { usuario: identificador, password, plataforma: "WEB" },
      ];

      let response: Response | null = null;
      let result: LoginResponse | null = null;
      let ultimoError = "Error en la autenticación";

      for (const payload of payloads) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout para el login también

        try {
          const intento = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const contentType = intento.headers.get("content-type");
          const responseText = await intento.text();

          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La respuesta del servidor no es un JSON válido");
          }

          const parsed = JSON.parse(responseText);

          if (intento.ok) {
            response = intento;
            result = parsed;
            break;
          }

          ultimoError =
            parsed.mensaje || parsed.error || "Error en la autenticación";

          if ([400, 401].includes(intento.status)) continue;
          throw new Error(ultimoError);
        } finally {
          clearTimeout(timeoutId);
        }
      }

      if (!response || !result) throw new Error(ultimoError);

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
        idDocente:
          Number(perfilDocente?.idDocente ?? perfilDocente?.id ?? 0) ||
          undefined,
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
          perfilEstudiante?.usuario?.apellidoPaterno ||
          perfilDocente?.usuario?.apellidoPaterno ||
          perfilAdministrativo?.usuario?.apellidoPaterno ||
          "",
        apellidoMaterno:
          result.usuario.apellidoMaterno ||
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
        passwordChangeRequired: !!result.passwordChangeRequired,
      };

      const tipoNorm = usuarioFormateado.tipoUsuario.toUpperCase();
      if (
        (tipoNorm === "ADMINISTRATIVO" ||
          tipoNorm === "DIRECTIVO" ||
          tipoNorm === "PREFECTO") &&
        !usuarioFormateado.cargo
      ) {
        try {
          const adminRes = await fetch(`${API_URL}/administrativos`, {
            headers: {
              Authorization: `Bearer ${result.token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(30000), // Aumentado a 30s
          });
          if (adminRes.ok) {
            const admins = await adminRes.json();
            const miPerfil = admins.find(
              (a: any) =>
                a.email === usuarioFormateado.email ||
                a.usuarioId === usuarioFormateado.id,
            );
            if (miPerfil?.cargo) usuarioFormateado.cargo = miPerfil.cargo;
          }
        } catch {
          console.warn("No se pudo obtener el cargo del administrativo");
        }
      }

      try {
        const perfilPayload = await obtenerMiPerfil(result.token);
        if (perfilPayload?.usuario) {
          usuarioFormateado.email =
            perfilPayload.usuario.email || usuarioFormateado.email;
          usuarioFormateado.tipoUsuario = (
            perfilPayload.usuario.rol || usuarioFormateado.tipoUsuario
          ).toLowerCase() as UserRole;
          usuarioFormateado.cargo =
            perfilPayload.usuario.perfil?.cargo || usuarioFormateado.cargo;
          usuarioFormateado.capacidades = {
            accesoInstitucionalCompleto:
              !!perfilPayload.capacidades?.accesoInstitucionalCompleto,
            puedeVerBitacoraCompleta:
              !!perfilPayload.capacidades?.puedeVerBitacoraCompleta,
          };
        }
      } catch (error) {
        console.warn("No se pudo sincronizar mi perfil tras login");
      }

      // BUSCAMOS TODOS LOS PERIODOS Y FILTRAMOS EL ACTIVO AL LOGUEARNOS
      try {
        const resPeriodos = await fetch(`${API_URL}/periodos`, {
          headers: {
            Authorization: `Bearer ${result.token}`,
          },
          signal: AbortSignal.timeout(30000),
        });
        if (resPeriodos.ok) {
          const dataPeriodos = await resPeriodos.json();
          const periodos = Array.isArray(dataPeriodos)
            ? dataPeriodos
            : Array.isArray(dataPeriodos?.data)
              ? dataPeriodos.data
              : [];
          const periodoActual = periodos.find((p: any) => p.activo === true);
          setPeriodoActivo(periodoActual || null);
        }
      } catch (error) {
        console.warn("No se pudo cargar el periodo activo durante el login");
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

      if (usuarioFormateado.passwordChangeRequired) {
        toast({
          title: "Cambio de contraseña requerido",
          description:
            "Por seguridad debes actualizar tu contraseña al ingresar.",
          variant: "destructive",
        });
      }

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
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
