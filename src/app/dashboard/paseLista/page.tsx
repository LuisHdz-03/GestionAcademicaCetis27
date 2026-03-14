"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { HiMagnifyingGlass, HiCheckCircle, HiArrowLeft } from "react-icons/hi2";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

const OPCIONES = [
  {
    valor: "PRESENTE",
    label: "Presente",
    color: "bg-green-500",
    ring: "ring-green-400",
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
    ring: "ring-red-400",
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
    ring: "ring-yellow-400",
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
    ring: "ring-blue-400",
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Cargar alumnos del grupo indicado en los query params
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
  }, [claseIdParam, grupoIdParam]);

  const cambiarEstatus = (idAlumno: number, estatus: string) => {
    setAsistencia((prev) => {
      // Si ya está seleccionado ese mismo, lo desmarca
      if (prev[idAlumno] === estatus) {
        const { [idAlumno]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [idAlumno]: estatus };
    });
  };

  // Alumnos ordenados alfabéticamente por apellido + nombre
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

  // Primer alumno sin marcar (el "activo" que sube al tope)
  const alumnoActivo = useMemo(() => {
    return (
      alumnosOrdenados.find((a: any) => !asistencia[a.idEstudiante || a.id]) ||
      null
    );
  }, [alumnosOrdenados, asistencia]);

  // Alumnos filtrados por búsqueda — si hay búsqueda, orden alfabético simple
  // Si no hay búsqueda: activo primero, luego pendientes, luego marcados
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
    // Sin búsqueda: activo al tope, luego pendientes, luego marcados
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

  // Estadísticas
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
    if (!claseSeleccionada) {
      toast({
        title: "Atención",
        description: "Debes seleccionar una clase primero",
        variant: "destructive",
      });
      return;
    }
    // Verificar que todos tengan estatus
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.bloqueado)
          throw new Error(
            "Ya se tomó la asistencia del día de hoy para esta clase.",
          );
        throw new Error(data.mensaje || "Error al guardar la asistencia");
      }

      toast({
        title: "Éxito",
        description: `Se registraron ${data.totalRegistros} asistencias correctamente.`,
        variant: "success",
      });
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Encabezado con botón de regreso */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/mis-clases")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Volver a mis clases"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pase de Lista</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {claseIdParam
              ? `${materiaNombre} — ${grupoNombre}`
              : "Registra la asistencia de tus alumnos"}
          </p>
        </div>
      </div>

      {/* Skeleton de carga */}
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

      {/* Sin clase seleccionada */}
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

      {/* Panel de asistencia */}
      {alumnos.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-md">
          {/* Header con info de clase */}
          <div className="bg-[#691C32] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-white">
              <h2 className="text-lg font-bold">{materiaNombre}</h2>
              <p className="text-[#F2D7D5] text-sm">
                Grupo: {grupoNombre || "—"} &nbsp;·&nbsp; {alumnos.length}{" "}
                alumnos
              </p>
            </div>
            {/* Stats rápidas */}
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  label: "Presentes",
                  val: stats.presentes,
                  cls: "bg-green-100 text-green-800",
                },
                {
                  label: "Faltas",
                  val: stats.faltas,
                  cls: "bg-red-100 text-red-800",
                },
                {
                  label: "Retardos",
                  val: stats.retardos,
                  cls: "bg-yellow-100 text-yellow-800",
                },
                {
                  label: "Justificados",
                  val: stats.justificados,
                  cls: "bg-blue-100 text-blue-800",
                },
              ].map((s) => (
                <span
                  key={s.label}
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${s.cls}`}
                >
                  {s.val} {s.label}
                </span>
              ))}
            </div>
          </div>

          <CardContent className="p-4 sm:p-6">
            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o matrícula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Progreso */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
              <HiCheckCircle className="w-4 h-4 text-[#691C32]" />
              <span>
                {stats.marcados} de {stats.total} alumnos marcados
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-[#691C32] rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.total ? (stats.marcados / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Lista de alumnos */}
            <div className="space-y-2">
              {alumnosFiltrados.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No se encontraron alumnos
                </p>
              ) : (
                alumnosFiltrados.map((alumno: any) => {
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

                  // Tarjeta ACTIVA (alumno actual a marcar)
                  if (esActivo) {
                    return (
                      <div
                        key={idAlum}
                        className="rounded-xl border-2 border-[#691C32] bg-[#691C32]/5 px-5 py-5 shadow-md transition-all duration-300 mb-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Datos grandes */}
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
                          {/* Opciones de asistencia grandes */}
                          <div className="flex items-center gap-5 flex-wrap">
                            {OPCIONES.map((op) => (
                              <div
                                key={op.valor}
                                role="button"
                                tabIndex={0}
                                onClick={() => cambiarEstatus(idAlum, op.valor)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  cambiarEstatus(idAlum, op.valor)
                                }
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all duration-150 ${
                                  estatusActual === op.valor
                                    ? `${op.bg} ${op.text} border-current font-bold scale-105 shadow`
                                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-400"
                                }`}
                              >
                                {/* Indicador visual circular en lugar de Checkbox */}
                                <span
                                  className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-all ${
                                    estatusActual === op.valor
                                      ? op.indicatorClass
                                      : "border-gray-300 bg-white"
                                  }`}
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

                  // Tarjeta normal
                  return (
                    <div
                      key={idAlum}
                      className={`rounded-lg border px-4 py-3 transition-all duration-150 ${
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
                          {opcionActual && (
                            <span
                              className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${opcionActual.bg} ${opcionActual.text}`}
                            >
                              {opcionActual.label}
                            </span>
                          )}
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
                                onCheckedChange={() =>
                                  cambiarEstatus(idAlum, op.valor)
                                }
                                className={op.checkboxClass}
                              />
                              <Label
                                htmlFor={`${op.valor}-${idAlum}`}
                                className={`cursor-pointer text-xs font-medium ${estatusActual === op.valor ? op.text : "text-gray-500"}`}
                              >
                                {op.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {stats.total - stats.marcados > 0
                  ? ` Faltan ${stats.total - stats.marcados} alumno(s) por marcar`
                  : " Todos los alumnos han sido marcados"}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#691C32] hover:bg-[#50172A] text-white px-8"
              >
                {loading ? "Guardando..." : "Guardar Asistencia"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
