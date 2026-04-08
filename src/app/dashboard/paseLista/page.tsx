"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  HiMagnifyingGlass,
  HiCheckCircle,
  HiArrowLeft,
  HiClipboardDocumentList,
  HiLockClosed,
  HiExclamationTriangle,
} from "react-icons/hi2";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

const OPCIONES = [
  {
    valor: "PRESENTE",
    label: "Presente",
    color: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    checkboxClass:
      "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500",
    indicatorClass: "bg-green-500 border-green-500",
  },
  {
    valor: "FALTA",
    label: "Falta",
    color: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    checkboxClass:
      "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500",
    indicatorClass: "bg-red-500 border-red-500",
  },
  {
    valor: "RETARDO",
    label: "Retardo",
    color: "bg-yellow-500",
    text: "text-yellow-700",
    bg: "bg-yellow-50",
    checkboxClass:
      "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500",
    indicatorClass: "bg-yellow-500 border-yellow-500",
  },
  {
    valor: "JUSTIFICADO",
    label: "Justificado",
    color: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    checkboxClass:
      "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500",
    indicatorClass: "bg-blue-500 border-blue-500",
  },
];

export default function PaseDeListaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const claseIdParam = searchParams.get("claseId");
  const grupoIdParam = searchParams.get("grupoId");
  const materiaNombre = searchParams.get("materia") || "Clase";
  const grupoNombre = searchParams.get("grupo") || "Grupo";

  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [asistencia, setAsistencia] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [cargandoClase, setCargandoClase] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [asistenciaBloqueada, setAsistenciaBloqueada] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState<number | null>(null);

  // NUEVA VARIABLE: Guarda la fecha exacta si estamos editando
  const [sesionActivaFecha, setSesionActivaFecha] = useState<string | null>(
    null,
  );

  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [sesionDetalle, setSesionDetalle] = useState<any | null>(null);

  const LIMITE_MINUTOS = 30;

  const agruparPorFechaExacta = (registros: any[]) => {
    const mapa = new Map<string, any[]>();
    registros.forEach((r) => {
      const fechaKey = r.fecha;
      if (!fechaKey) return;
      if (!mapa.has(fechaKey)) mapa.set(fechaKey, []);
      mapa.get(fechaKey)!.push(r);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([fecha, regs]) => ({ fecha, registros: regs }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    if (!grupoIdParam || !claseIdParam) return;

    const cargarAlumnos = async () => {
      setCargandoClase(true);
      setBusqueda("");
      setAsistencia({});
      setClaseSeleccionada(claseIdParam);
      try {
        const res = await fetch(
          `${API_URL}/estudiantes/grupo/${grupoIdParam}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        if (res.ok) {
          setAlumnos(Array.isArray(data) ? data : []);
        } else {
          throw new Error(data.mensaje || "No se pudieron cargar los alumnos");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setCargandoClase(false);
      }
    };
    cargarAlumnos();

    const cargarHistorial = async () => {
      setCargandoHistorial(true);
      setAsistenciaBloqueada(false);
      setMinutosRestantes(null);
      setSesionActivaFecha(null);

      try {
        const res = await fetch(
          `${API_URL}/asistencias/historial?claseId=${claseIdParam}`,
          { headers: getAuthHeaders() },
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const agrupado = agruparPorFechaExacta(data);
            setHistorial(agrupado);

            const ultimaSesion = agrupado[0];

            if (ultimaSesion && ultimaSesion.registros.length > 0) {
              const horaRegistro = new Date(ultimaSesion.fecha);
              const ahora = new Date();
              const diffMinutos = Math.floor(
                (ahora.getTime() - horaRegistro.getTime()) / 60000,
              );

              if (diffMinutos < LIMITE_MINUTOS) {
                // Modo Edición
                const asistenciaPrevia: Record<number, string> = {};
                ultimaSesion.registros.forEach((r: any) => {
                  asistenciaPrevia[r.alumnoId] = r.estatus;
                });
                setAsistencia(asistenciaPrevia);
                setSesionActivaFecha(ultimaSesion.fecha); // GUARDAMOS LA FECHA
                setAsistenciaBloqueada(false);
                setMinutosRestantes(LIMITE_MINUTOS - diffMinutos);
              } else {
                // Modo Nueva Lista
                setAsistencia({});
                setSesionActivaFecha(null);
                setAsistenciaBloqueada(false);
                setMinutosRestantes(null);
              }
            }
          } else {
            setHistorial([]);
          }
        }
      } catch {
        setHistorial([]);
      } finally {
        setCargandoHistorial(false);
      }
    };
    cargarHistorial();
  }, [claseIdParam, grupoIdParam]);

  useEffect(() => {
    if (minutosRestantes === null || asistenciaBloqueada) return;
    const timer = setTimeout(() => {
      setMinutosRestantes((prev) => {
        if (prev === null || prev <= 1) {
          setAsistenciaBloqueada(true);
          return null;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearTimeout(timer);
  }, [minutosRestantes, asistenciaBloqueada]);

  const cambiarEstatus = (idAlumno: number, estatus: string) => {
    setAsistencia((prev) => {
      if (prev[idAlumno] === estatus) {
        const { [idAlumno]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [idAlumno]: estatus };
    });
  };

  const alumnosOrdenados = useMemo(() => {
    return [...alumnos].sort((a, b) => {
      const apA = (
        a.apellidoPaterno ||
        a.usuario?.apellidoPaterno ||
        ""
      ).toLowerCase();
      const apB = (
        b.apellidoPaterno ||
        b.usuario?.apellidoPaterno ||
        ""
      ).toLowerCase();
      const nA = (a.nombre || a.usuario?.nombre || "").toLowerCase();
      const nB = (b.nombre || b.usuario?.nombre || "").toLowerCase();
      return apA !== apB ? apA.localeCompare(apB) : nA.localeCompare(nB);
    });
  }, [alumnos]);

  const alumnoActivo = useMemo(() => {
    return (
      alumnosOrdenados.find((a: any) => !asistencia[a.idEstudiante || a.id]) ||
      null
    );
  }, [alumnosOrdenados, asistencia]);

  const alumnosFiltrados = useMemo(() => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return alumnosOrdenados.filter((a: any) => {
        const nombre =
          `${a.nombre || a.usuario?.nombre || ""} ${a.apellidoPaterno || a.usuario?.apellidoPaterno || ""}`.toLowerCase();
        const matricula = String(a.matricula || "").toLowerCase();
        return nombre.includes(q) || matricula.includes(q);
      });
    }
    const activoId = alumnoActivo
      ? alumnoActivo.idEstudiante || alumnoActivo.id
      : null;
    const pendientes = alumnosOrdenados.filter((a: any) => {
      const id = a.idEstudiante || a.id;
      return !asistencia[id] && id !== activoId;
    });
    const marcados = alumnosOrdenados.filter(
      (a: any) => !!asistencia[a.idEstudiante || a.id],
    );
    return [
      ...(alumnoActivo ? [alumnoActivo] : []),
      ...pendientes,
      ...marcados,
    ];
  }, [alumnosOrdenados, asistencia, alumnoActivo, busqueda]);

  const stats = useMemo(() => {
    const total = alumnos.length;
    const marcados = Object.keys(asistencia).length;
    const presentes = Object.values(asistencia).filter(
      (v) => v === "PRESENTE",
    ).length;
    const faltas = Object.values(asistencia).filter(
      (v) => v === "FALTA",
    ).length;
    const retardos = Object.values(asistencia).filter(
      (v) => v === "RETARDO",
    ).length;
    const justificados = Object.values(asistencia).filter(
      (v) => v === "JUSTIFICADO",
    ).length;
    return { total, marcados, presentes, faltas, retardos, justificados };
  }, [asistencia, alumnos]);

  const handleSubmit = async () => {
    if (!claseSeleccionada) return;

    const sinMarcar = alumnos.filter((a: any) => {
      const id = a.idEstudiante || a.id;
      return !asistencia[id];
    });

    if (sinMarcar.length > 0) {
      toast({
        title: "Atención",
        description: `${sinMarcar.length} alumno(s) sin marcar asistencia`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const listaAlumnosFormateada = alumnos.map((alumno) => {
        const idAlum = alumno.idEstudiante || alumno.id;
        return { alumnoId: idAlum, estatus: asistencia[idAlum] };
      });

      const res = await fetch(`${API_URL}/asistencias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          claseId: parseInt(claseSeleccionada),
          listaAlumnos: listaAlumnosFormateada,
          metodo: "MANUAL",
          fecha: sesionActivaFecha, // <--- SE LA ENVIAMOS AL BACKEND PARA QUE NO ADIVINE
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.bloqueado) {
          setAsistenciaBloqueada(true);
          setMinutosRestantes(null);
          throw new Error(data.mensaje);
        }
        throw new Error(data.mensaje || "Error al guardar la asistencia");
      }

      toast({
        title: "Éxito",
        description: `Se registraron ${data.totalRegistros} asistencias correctamente.`,
        variant: "success",
      });

      // Recargar historial
      try {
        const resH = await fetch(
          `${API_URL}/asistencias/historial?claseId=${claseSeleccionada}`,
          { headers: getAuthHeaders() },
        );
        if (resH.ok) {
          const dataH = await resH.json();
          if (Array.isArray(dataH) && dataH.length > 0) {
            const agrupado = agruparPorFechaExacta(dataH);
            setHistorial(agrupado);

            // Lo actualizamos para que si guardan de nuevo, re-edite esta misma
            const ultimaSesion = agrupado[0];
            setSesionActivaFecha(ultimaSesion.fecha);

            const horaRegistro = new Date(ultimaSesion.fecha);
            const ahora = new Date();
            const diffMinutos = Math.floor(
              (ahora.getTime() - horaRegistro.getTime()) / 60000,
            );
            if (diffMinutos >= LIMITE_MINUTOS) {
              setAsistenciaBloqueada(true);
              setMinutosRestantes(null);
            } else {
              setMinutosRestantes(LIMITE_MINUTOS - diffMinutos);
              setAsistenciaBloqueada(false);
            }
          }
        }
      } catch {
        /* silencioso */
      }
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/dashboard/mis-clases")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 flex-shrink-0"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Pase de Lista
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm truncate">
            {claseIdParam
              ? `${materiaNombre} — ${grupoNombre}`
              : "Registra la asistencia de tus alumnos"}
          </p>
        </div>
        {asistenciaBloqueada && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-gray-600 text-sm font-semibold flex-shrink-0">
            <HiLockClosed className="w-4 h-4" />
            Edición cerrada (Más de {LIMITE_MINUTOS} min)
          </div>
        )}
        {!asistenciaBloqueada && minutosRestantes !== null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-full text-amber-700 text-sm font-semibold flex-shrink-0">
            <HiExclamationTriangle className="w-4 h-4" />
            {minutosRestantes} min para editar
          </div>
        )}
      </div>

      {cargandoClase && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!claseIdParam && !cargandoClase && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-400">
            Selecciona una clase desde
            <button
              onClick={() => router.push("/dashboard/mis-clases")}
              className="ml-1 text-[#691C32] font-semibold hover:underline"
            >
              Mis Clases
            </button>
          </p>
        </div>
      )}

      {alumnos.length > 0 && (
        <>
          {/* ─── Stats cards ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">
                {stats.presentes}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1 uppercase tracking-wide">
                Presentes
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{stats.faltas}</p>
              <p className="text-xs text-red-600 font-medium mt-1 uppercase tracking-wide">
                Faltas
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">
                {stats.retardos}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-1 uppercase tracking-wide">
                Retardos
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">
                {stats.justificados}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1 uppercase tracking-wide">
                Justificados
              </p>
            </div>
          </div>

          {/* ─── Main card ─── */}
          <Card
            className={cn(
              "overflow-hidden border-0 shadow-md transition-all duration-500",
              asistenciaBloqueada && "ring-1 ring-gray-200 opacity-80",
            )}
          >
            <div
              className={cn(
                "px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-500",
                asistenciaBloqueada ? "bg-gray-500" : "bg-[#691C32]",
              )}
            >
              <div className="text-white">
                <h2 className="text-lg font-bold">{materiaNombre}</h2>
                <p className="text-white/70 text-sm">
                  Grupo: {grupoNombre || "—"} &nbsp;·&nbsp; {alumnos.length}{" "}
                  alumnos
                </p>
              </div>
              {asistenciaBloqueada && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-semibold">
                    <HiLockClosed className="w-4 h-4" />
                    Vista de solo lectura
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-black"
                    onClick={() => {
                      setAsistencia({});
                      setSesionActivaFecha(null);
                      setAsistenciaBloqueada(false);
                      setMinutosRestantes(null);
                    }}
                  >
                    Tomar Nueva Asistencia
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="p-4 sm:p-6">
              <div className="relative mb-4">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o matrícula..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                  disabled={asistenciaBloqueada}
                />
              </div>

              <div className="flex items-center gap-2 mb-5 text-sm text-gray-500">
                <HiCheckCircle
                  className={cn(
                    "w-4 h-4",
                    asistenciaBloqueada ? "text-gray-400" : "text-[#691C32]",
                  )}
                />
                <span>
                  {stats.marcados} de {stats.total} alumnos marcados
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden ml-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      asistenciaBloqueada ? "bg-gray-400" : "bg-[#691C32]",
                    )}
                    style={{
                      width: `${stats.total ? (stats.marcados / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  "space-y-2 transition-all duration-500",
                  asistenciaBloqueada &&
                    "grayscale opacity-70 pointer-events-none select-none",
                )}
              >
                {alumnosFiltrados.map((alumno: any) => {
                  const idAlum = alumno.idEstudiante || alumno.id;
                  const matricula = alumno.matricula || "N/A";
                  const nombre = alumno.nombre || alumno.usuario?.nombre || "";
                  const apellido =
                    alumno.apellidoPaterno ||
                    alumno.usuario?.apellidoPaterno ||
                    "";
                  const estatusActual = asistencia[idAlum];
                  const opcionActual = OPCIONES.find(
                    (o) => o.valor === estatusActual,
                  );
                  const esActivo =
                    !busqueda &&
                    alumnoActivo &&
                    (alumnoActivo.idEstudiante || alumnoActivo.id) === idAlum;

                  const opacityClass = "";

                  if (esActivo && !asistenciaBloqueada) {
                    return (
                      <div
                        key={idAlum}
                        className="rounded-xl border-2 border-[#691C32] bg-[#691C32]/5 px-5 py-5 shadow-md transition-all duration-300 mb-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[#691C32] flex items-center justify-center flex-shrink-0 shadow">
                              <span className="text-white text-lg font-bold">
                                {nombre?.[0]}
                                {apellido?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-lg leading-tight">
                                {apellido} {nombre}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Matrícula: {matricula}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5 flex-wrap">
                            {OPCIONES.map((op) => (
                              <div
                                key={op.valor}
                                role="button"
                                onClick={() => cambiarEstatus(idAlum, op.valor)}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all duration-150 ${
                                  estatusActual === op.valor
                                    ? `${op.bg} ${op.text} border-current font-bold scale-105 shadow`
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-400"
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all ${estatusActual === op.valor ? op.indicatorClass : "border-gray-300 bg-white"}`}
                                >
                                  {estatusActual === op.valor && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      viewBox="0 0 12 12"
                                      fill="none"
                                    >
                                      <path
                                        d="M2 6l3 3 5-5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <span className="text-xs font-semibold">
                                  {op.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idAlum}
                      className={`rounded-lg border px-4 py-3 transition-all duration-150 ${opacityClass} ${
                        opcionActual
                          ? `${opcionActual.bg} border-l-4 ${opcionActual.color.replace("bg-", "border-")}`
                          : "bg-white border-gray-200 border-l-4 border-l-gray-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#691C32]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#691C32] text-xs font-bold">
                              {nombre?.[0]}
                              {apellido?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {apellido} {nombre}
                            </p>
                            <p className="text-xs text-gray-500">{matricula}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {OPCIONES.map((op) => (
                            <div
                              key={op.valor}
                              className="flex items-center gap-1.5"
                            >
                              <Checkbox
                                id={`${op.valor}-${idAlum}`}
                                checked={estatusActual === op.valor}
                                disabled={asistenciaBloqueada}
                                onCheckedChange={() =>
                                  cambiarEstatus(idAlum, op.valor)
                                }
                                className={op.checkboxClass}
                              />
                              <Label
                                htmlFor={`${op.valor}-${idAlum}`}
                                className={`text-xs font-medium ${asistenciaBloqueada ? "" : "cursor-pointer"} ${estatusActual === op.valor ? op.text : "text-gray-500"}`}
                              >
                                {op.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── Footer ─── */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
                <div>
                  {asistenciaBloqueada ? (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <HiLockClosed className="w-4 h-4" />
                      El tiempo de edición expiró, pero puedes tomar una lista
                      nueva.
                    </p>
                  ) : minutosRestantes !== null ? (
                    <p className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
                      <HiExclamationTriangle className="w-4 h-4" />
                      Tiempo restante para editar: {minutosRestantes} min
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {stats.total - stats.marcados > 0
                        ? `Faltan ${stats.total - stats.marcados} alumno(s) por marcar`
                        : "Todos los alumnos han sido marcados ✓"}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || asistenciaBloqueada || stats.total === 0}
                  className={cn(
                    "px-8 text-white transition-colors",
                    asistenciaBloqueada
                      ? "hidden"
                      : "bg-[#691C32] hover:bg-[#50172A]",
                  )}
                >
                  {loading
                    ? "Guardando..."
                    : minutosRestantes !== null
                      ? "Actualizar Asistencia"
                      : "Guardar Nueva Asistencia"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Historial de asistencias */}
      {claseIdParam && (
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gray-800 px-6 py-4 flex items-center gap-3">
            <HiClipboardDocumentList className="text-white w-5 h-5" />
            <h2 className="text-white font-bold text-lg">
              Historial de Asistencias
            </h2>
          </div>
          <CardContent className="p-0">
            {cargandoHistorial ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <HiClipboardDocumentList className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">
                  Aún no hay sesiones registradas para esta clase
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead className="text-center text-green-700">
                      Presentes
                    </TableHead>
                    <TableHead className="text-center text-red-700">
                      Faltas
                    </TableHead>
                    <TableHead className="text-center text-yellow-700">
                      Retardos
                    </TableHead>
                    <TableHead className="text-center text-blue-700">
                      Justificados
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((sesion: any, idx: number) => {
                    const registros: any[] = sesion.registros || [];
                    const presentes = registros.filter(
                      (r: any) =>
                        (r.estatus || r.status || r.estado) === "PRESENTE",
                    ).length;
                    const faltas = registros.filter(
                      (r: any) =>
                        (r.estatus || r.status || r.estado) === "FALTA",
                    ).length;
                    const retardos = registros.filter(
                      (r: any) =>
                        (r.estatus || r.status || r.estado) === "RETARDO",
                    ).length;
                    const justificados = registros.filter(
                      (r: any) =>
                        (r.estatus || r.status || r.estado) === "JUSTIFICADO",
                    ).length;
                    const total = registros.length;
                    const fechaRaw = sesion.fecha || "";

                    const fechaFormateada = fechaRaw
                      ? new Date(fechaRaw).toLocaleString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : `Sesión ${idx + 1}`;

                    return (
                      <TableRow
                        key={fechaRaw || idx}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-medium capitalize">
                          {fechaFormateada}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            {presentes}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            {faltas}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                            {retardos}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {justificados}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-gray-500 text-sm">
                          {total}
                        </TableCell>
                        <TableCell className="text-right">
                          {registros.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() =>
                                setSesionDetalle({
                                  ...sesion,
                                  fechaFormateada,
                                  registros,
                                  presentes,
                                  faltas,
                                  retardos,
                                  justificados,
                                })
                              }
                            >
                              Ver lista
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal detalle de sesión */}
      <Dialog
        open={!!sesionDetalle}
        onOpenChange={(open) => !open && setSesionDetalle(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HiClipboardDocumentList className="w-5 h-5 text-[#691C32]" />
              Asistencia — {sesionDetalle?.fechaFormateada}
            </DialogTitle>
          </DialogHeader>
          {sesionDetalle && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                {
                  label: "Presentes",
                  val: sesionDetalle.presentes,
                  bg: "bg-green-100",
                  text: "text-green-700",
                },
                {
                  label: "Faltas",
                  val: sesionDetalle.faltas,
                  bg: "bg-red-100",
                  text: "text-red-700",
                },
                {
                  label: "Retardos",
                  val: sesionDetalle.retardos,
                  bg: "bg-yellow-100",
                  text: "text-yellow-700",
                },
                {
                  label: "Justificados",
                  val: sesionDetalle.justificados,
                  bg: "bg-blue-100",
                  text: "text-blue-700",
                },
              ].map((s) => (
                <span
                  key={s.label}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.text}`}
                >
                  {s.label}: {s.val}
                </span>
              ))}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Alumno</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead className="text-center">Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sesionDetalle?.registros || []).map((r: any, i: number) => {
                const estatus = r.estatus || r.status || r.estado || "—";
                const nombre =
                  r.alumno?.usuario?.nombre ||
                  r.estudiante?.usuario?.nombre ||
                  r.nombre ||
                  `Alumno ${i + 1}`;
                const apellido =
                  r.alumno?.usuario?.apellidoPaterno ||
                  r.estudiante?.usuario?.apellidoPaterno ||
                  r.apellidoPaterno ||
                  "";
                const matricula =
                  r.alumno?.matricula ||
                  r.estudiante?.matricula ||
                  r.matricula ||
                  "—";
                const colorMap: Record<string, string> = {
                  PRESENTE: "bg-green-100 text-green-700",
                  FALTA: "bg-red-100 text-red-700",
                  RETARDO: "bg-yellow-100 text-yellow-700",
                  JUSTIFICADO: "bg-blue-100 text-blue-700",
                };
                return (
                  <TableRow key={r.idAsistencia || r.id || i}>
                    <TableCell className="font-medium">
                      {apellido} {nombre}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {matricula}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-semibold ${colorMap[estatus] || "bg-gray-100 text-gray-600"}`}
                      >
                        {estatus}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
