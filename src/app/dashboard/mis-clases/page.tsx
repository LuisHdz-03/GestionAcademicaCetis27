"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import {
  HiBookOpen,
  HiUserGroup,
  HiArrowRight,
  HiClock,
} from "react-icons/hi2";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

const COLORES = [
  {
    bg: "bg-[#691C32]",
    light: "bg-[#691C32]/10",
    text: "text-[#691C32]",
    border: "border-[#691C32]/20",
  },
  {
    bg: "bg-blue-600",
    light: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  {
    bg: "bg-emerald-600",
    light: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  {
    bg: "bg-violet-600",
    light: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  {
    bg: "bg-amber-600",
    light: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  {
    bg: "bg-rose-600",
    light: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
];

export default function MisClasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [clases, setClases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    const cargarClases = async () => {
      const idUsuario = user?.id || (user as any)?.idUsuario;
      if (!idUsuario) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/clases/docente/${idUsuario}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (res.ok) setClases(Array.isArray(data) ? data : []);
        else throw new Error(data.mensaje || "Error al cargar clases");
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
    if (user) cargarClases();
  }, [user]);

  const irAPaseLista = (clase: any) => {
    const idClase = clase.idClase || clase.id;
    const grupoId =
      clase.grupoId || clase.grupo?.idGrupo || clase.grupo?.id || "";
    const materia = encodeURIComponent(
      clase.materias?.nombre || clase.materia?.nombre || "",
    );
    const grupo = encodeURIComponent(clase.grupo?.nombre || "");
    router.push(
      `/dashboard/paseLista?claseId=${idClase}&grupoId=${grupoId}&materia=${materia}&grupo=${grupo}`,
    );
  };

  const hoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Clases</h1>
        <p className="text-gray-500 mt-1 capitalize">{hoy}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : clases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <HiBookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            Sin clases asignadas
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            No tienes clases registradas en este período.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {clases.length} clase{clases.length !== 1 ? "s" : ""} asignada
            {clases.length !== 1 ? "s" : ""} — selecciona una para pasar lista
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clases.map((clase: any, idx: number) => {
              const idClase = clase.idClase || clase.id;
              const nombreMateria =
                clase.materias?.nombre || clase.materia?.nombre || "Materia";
              const nombreGrupo = clase.grupo?.nombre || "Grupo";
              const semestre =
                clase.grupo?.semestre || clase.grupo?.grado || "";
              const turno = clase.grupo?.turno || "";
              const color = COLORES[idx % COLORES.length];

              return (
                <button
                  key={idClase}
                  onClick={() => irAPaseLista(clase)}
                  className={`group text-left rounded-xl border-2 ${color.border} bg-white hover:shadow-lg transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#691C32]`}
                >
                  {/* Franja superior de color */}
                  <div className={`${color.bg} px-5 py-4`}>
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center`}
                      >
                        <HiBookOpen className="w-5 h-5 text-white" />
                      </div>
                      <HiArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-150" />
                    </div>
                    <h2 className="text-white font-bold text-lg leading-tight mt-3">
                      {nombreMateria}
                    </h2>
                  </div>

                  {/* Datos del grupo */}
                  <div className={`${color.light} px-5 py-3 space-y-1.5`}>
                    <div className="flex items-center gap-2">
                      <HiUserGroup
                        className={`w-4 h-4 ${color.text} flex-shrink-0`}
                      />
                      <span className={`text-sm font-semibold ${color.text}`}>
                        {nombreGrupo}
                      </span>
                      {semestre && (
                        <span className="text-xs text-gray-400">
                          · {semestre}° sem.
                        </span>
                      )}
                    </div>
                    {turno && (
                      <div className="flex items-center gap-2">
                        <HiClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 capitalize">
                          {turno.toLowerCase()}
                        </span>
                      </div>
                    )}
                    <p className={`text-xs font-semibold ${color.text} pt-1`}>
                      Pasar lista →
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
