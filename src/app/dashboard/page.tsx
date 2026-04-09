// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HiCalendar,
  HiPlus,
  HiUsers,
  HiBookOpen,
  HiAcademicCap,
  HiBriefcase,
} from "react-icons/hi2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CreatePeriodModal from "@/components/common/Modal/CreatePeriodModal";
import SuccessModal from "@/components/common/Modal/SuccessModal";
import { useToast } from "@/hooks/useToast";
import { useCommunity } from "@/hooks/useCommunity";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const {
    docentes,
    alumnos,
    administradores,
    materias,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchMaterias,
    fetchClases,
    cerrarPeriodo,
  } = useCommunity();
  const [hasActivePeriod, setHasActivePeriod] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false);

  const [activePeriod, setActivePeriod] = useState<{
    idPeriodo: number;
    codigo: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
  } | null>(null);

  const formatDateDisplay = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Función para traer período activo del backend
  const fetchActivePeriod = async () => {
    try {
      const res = await fetch(`${API_URL}/periodos`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setHasActivePeriod(false);
        setActivePeriod(null);
        return;
      }
      const data = await res.json();

      // Buscamos cuál es el activo de la lista que nos manda Prisma
      const periodos = Array.isArray(data) ? data : data.data || [];
      const periodoActivo = periodos.find((p: any) => p.activo === true);

      if (periodoActivo) {
        setHasActivePeriod(true);
        setActivePeriod(periodoActivo);
      } else {
        setHasActivePeriod(false);
      }
    } catch (err) {
      console.warn("No se pudo obtener el periodo activo", err);
      setHasActivePeriod(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const normalizarTexto = (texto: string) => {
      if (!texto) return "";
      return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
    };

    const tipoUsuario = normalizarTexto(
      user?.tipoUsuario || (user as any)?.rol || "",
    );
    const cargoUsuario = normalizarTexto(user?.cargo || "");

    const cargosDirectivos = [
      "DIRECTOR",
      "SUBDIRECTORA ACADEMICA",
      "COORDINADOR",
      "COORDINADOR ACADEMICO",
    ];

    const cargosAdministrativosGrales = [
      ...cargosDirectivos,
      "JEFE DE DEPARTAMENTO",
      "SECRETARIO",
    ];

    const tieneDashboardAcceso =
      tipoUsuario === "DIRECTIVO" ||
      (tipoUsuario === "ADMINISTRATIVO" &&
        cargosDirectivos.includes(cargoUsuario));

    if (!tieneDashboardAcceso) {
      setHasDashboardAccess(false);
      // Redirigir según rol/cargo a su primera opción disponible
      if (tipoUsuario === "DOCENTE") {
        router.push("/dashboard/mis-clases");
      } else if (tipoUsuario === "PREFECTO" || cargoUsuario === "PREFECTO") {
        router.push("/dashboard/scan-qr");
      } else if (cargosAdministrativosGrales.includes(cargoUsuario)) {
        router.push("/dashboard/comunidadEsc");
      } else {
        // Si no tiene ningún permiso específico, redirigir a una página por defecto
        router.push("/dashboard/reportes");
      }
    } else {
      // Tiene permiso, permitir ver el dashboard
      setHasDashboardAccess(true);
      setIsCheckingPermissions(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!hasDashboardAccess) return;
    fetchActivePeriod();
    fetchDocentes();
    fetchAlumnos();
    fetchAdministradores();
    fetchMaterias();
  }, [hasDashboardAccess]);

  // cosas para editar el periodo
  const handleCreatePeriod = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ESTADOS CORREGIDOS PARA TERMINAR EL PERIODO
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);
  const [isClosingPeriod, setIsClosingPeriod] = useState(false);

  const handleClosePeriodSubmit = async () => {
    if (!activePeriod) return;
    setIsClosingPeriod(true);

    const exito = await cerrarPeriodo(activePeriod.idPeriodo);

    if (exito) {
      setIsClosePeriodModalOpen(false);
      setActivePeriod(null);
      setHasActivePeriod(false);
      fetchAlumnos();
      fetchClases();
    }

    setIsClosingPeriod(false);
  };

  const handlePeriodSubmit = async (data: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  }) => {
    try {
      setIsModalOpen(false);

      const payload = { ...data, activo: true };

      const res = await fetch(`${API_URL}/periodos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Error al crear período:", result);
        toast({
          title: "Error al crear período",
          description:
            result.error ||
            result.mensaje ||
            "No se pudo crear el período. Intenta de nuevo.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      setActivePeriod(result);
      setHasActivePeriod(true);
      setShowSuccessModal(true);

      toast({
        title: "¡Período creado exitosamente!",
        description: `El período "${data.nombre}" ha sido creado correctamente.`,
        variant: "success",
        duration: 4000,
      });
    } catch (err) {
      console.error("Error en fetch:", err);
      toast({
        title: "Error de conexión",
        description:
          "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleEditPeriod = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleEditPeriodSubmit = async (data: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  }) => {
    if (!activePeriod) return;
    try {
      const res = await fetch(`${API_URL}/periodos/${activePeriod.idPeriodo}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, activo: true }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Error al actualizar período",
          description: result.error || "Intenta de nuevo",
          variant: "destructive",
        });
        return;
      }
      setActivePeriod(result);
      setIsEditModalOpen(false);
      toast({
        title: "Período actualizado",
        description: "Los cambios se guardaron correctamente",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error de conexión",
        description: "No se pudo actualizar el período",
        variant: "destructive",
      });
    }
  };

  const handleDeletePeriod = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/periodos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({
          title: "Error al eliminar período",
          description:
            result.error || "No se pudo eliminar el período. Intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }
      setActivePeriod(null);
      setHasActivePeriod(false);
      setIsEditModalOpen(false);
      toast({
        title: "Período eliminado",
        description: "El período ha sido eliminado correctamente",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error de conexión",
        description: "No se pudo eliminar el período",
        variant: "destructive",
      });
    }
  };

  if (hasActivePeriod === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );

  if (!hasActivePeriod) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-2xl w-full text-center border-dashed border-2">
            <CardHeader className="pb-6">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <HiCalendar className="w-8 h-8 text-gray-400" />
              </div>
              <CardTitle className="text-2xl text-gray-900 mb-4">
                No hay períodos activos
              </CardTitle>
              <p className="text-gray-600 text-lg">
                No se ha creado ningún período todavía. Crea tu primer período
                académico para comenzar.
              </p>
            </CardHeader>
            <CardContent className="pb-8">
              <Button
                onClick={handleCreatePeriod}
                className="bg-[#691C32] hover:bg-[#5a1829] text-white px-8 py-3 text-lg"
              >
                <HiPlus className="w-4 h-4 mr-2" />
                Crear período
              </Button>
            </CardContent>
          </Card>
        </div>

        <CreatePeriodModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handlePeriodSubmit}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </>
    );
  }

  const stats = [
    {
      title: "Alumnos activos",
      value: String(alumnos.length),
      icon: HiUsers,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Materias",
      value: String(materias.length),
      icon: HiBookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Docentes",
      value: String(docentes.length),
      icon: HiAcademicCap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Administradores",
      value: String(administradores.length),
      icon: HiBriefcase,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  const toDate = (value?: string) => {
    if (!value) return null;
    const hasTime = value.includes("T");
    const d = new Date(hasTime ? value : `${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const computeProgress = () => {
    if (!activePeriod)
      return {
        percent: 0,
        daysLeft: 0,
        totalDays: 0,
        phase: "unknown",
        daysToStart: 0,
      } as const;
    const startDate = toDate(activePeriod.fechaInicio);
    const endDate = toDate(activePeriod.fechaFin);
    if (!startDate || !endDate)
      return {
        percent: 0,
        daysLeft: 0,
        totalDays: 0,
        phase: "unknown",
        daysToStart: 0,
      } as const;
    const start = startDate.getTime();
    const end = endDate.getTime();
    const now = Date.now();
    const total = Math.max(end - start, 1);
    const MS_PER_DAY = 86400000;

    if (now < start) {
      const daysToStart = Math.max(Math.ceil((start - now) / MS_PER_DAY), 0);
      const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
      return {
        percent: 0,
        daysLeft: totalDays,
        totalDays,
        phase: "pre",
        daysToStart,
      } as const;
    }

    if (now > end) {
      const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
      return {
        percent: 100,
        daysLeft: 0,
        totalDays,
        phase: "post",
        daysToStart: 0,
      } as const;
    }

    const elapsed = Math.min(Math.max(now - start, 0), total);
    const percent = Math.round((elapsed / total) * 100);
    const daysLeft = Math.max(Math.ceil((end - now) / MS_PER_DAY), 0);
    const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
    return {
      percent,
      daysLeft,
      totalDays,
      phase: "in",
      daysToStart: 0,
    } as const;
  };

  const {
    percent: periodPercent,
    daysLeft: periodDaysLeft,
    totalDays: periodTotalDays,
    phase: periodPhase,
    daysToStart,
  } = computeProgress();

  // Mostrar loader mientras se verifican permisos
  if (isCheckingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
        <p className="text-gray-600 mt-2">
          Resumen general del sistema académico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="relative hover:shadow-lg transition-shadow"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-[#691C32] rounded-t-md" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white shadow-md rounded-lg flex flex-col mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Estado del periodo actual
            </CardTitle>
            <div className="m-3 flex gap-3">
              <Button variant="outline" size="sm" onClick={handleEditPeriod}>
                Editar período
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsClosePeriodModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                Terminar período
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Periodo:</span>{" "}
            {activePeriod?.nombre}
          </p>
          <p>
            <span className="font-semibold">Fecha de inicio:</span>{" "}
            {formatDateDisplay(activePeriod?.fechaInicio)}
          </p>
          <p>
            <span className="font-semibold">Fecha de fin:</span>{" "}
            {formatDateDisplay(activePeriod?.fechaFin)}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progreso del período</span>
              <span>{periodPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-[#691C32]"
                style={{
                  width: `${Math.min(Math.max(periodPercent, 0), 100)}%`,
                  minWidth: periodPercent > 0 ? 2 : 0,
                }}
              />
            </div>
            {periodPhase === "pre" && (
              <div className="text-xs text-gray-600 mt-1">
                Comienza en {daysToStart} día(s). Duración: {periodTotalDays}{" "}
                día(s).
              </div>
            )}
            {periodPhase === "in" && (
              <div className="text-xs text-gray-600 mt-1">
                Quedan {periodDaysLeft} día(s) de {periodTotalDays}
              </div>
            )}
            {periodPhase === "post" && (
              <div className="text-xs text-gray-600 mt-1">
                Período finalizado. Duración: {periodTotalDays} día(s).
              </div>
            )}
          </div>
          <p className="mt-2">
            <span className="font-semibold">Estado:</span>{" "}
            {periodPhase === "pre" && (
              <span className="text-amber-600 font-medium">Aún no inicia</span>
            )}
            {periodPhase === "in" && (
              <span className="text-green-600 font-medium">En curso</span>
            )}
            {periodPhase === "post" && (
              <span className="text-gray-600 font-medium">Finalizado</span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm rounded-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/dashboard/comunidadEsc">
            <Button variant="outline" className="gap-2">
              Gestionar comunidad
            </Button>
          </Link>
          <Link href="/dashboard/materias">
            <Button variant="outline" className="gap-2">
              Gestionar materias
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Docentes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-700 space-y-2">
              {docentes.slice(0, 5).map((d) => (
                <li
                  key={`${d.idDocente || d.id}-${d.usuario?.email || ""}`}
                  className="flex items-center justify-between"
                >
                  <span>
                    {d.usuario?.nombre} {d.usuario?.apellidoPaterno}
                  </span>
                  <span className="text-gray-500">{d.usuario?.email}</span>
                </li>
              ))}
              {docentes.length === 0 && (
                <li className="text-gray-500">Sin docentes para mostrar</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Alumnos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-700 space-y-2">
              {alumnos.slice(0, 5).map((a) => (
                <li
                  key={`${a.idEstudiante || a.id}-${a.usuario?.email || ""}`}
                  className="flex items-center justify-between"
                >
                  <span>
                    {a.usuario?.nombre} {a.usuario?.apellidoPaterno}
                  </span>
                  <span className="text-gray-500">{a.usuario?.email}</span>
                </li>
              ))}
              {alumnos.length === 0 && (
                <li className="text-gray-500">Sin alumnos para mostrar</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <CreatePeriodModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditPeriodSubmit}
        mode="edit"
        initialData={{
          nombre: activePeriod?.nombre || "",
          fechaInicio: activePeriod?.fechaInicio?.substring(0, 10) || "",
          fechaFin: activePeriod?.fechaFin?.substring(0, 10) || "",
        }}
        onDelete={handleDeletePeriod}
        periodoId={activePeriod?.idPeriodo}
      />

      <Dialog
        open={isClosePeriodModalOpen}
        onOpenChange={setIsClosePeriodModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 text-xl font-bold">
              ¡Advertencia Crítica!
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2 text-base">
              Estás a punto de cerrar el período académico{" "}
              <strong className="text-gray-900">
                "{activePeriod?.nombre}"
              </strong>
              . Esta acción provocará lo siguiente en la base de datos:
            </DialogDescription>
          </DialogHeader>

          {/* Sacamos la lista y el div fuera del DialogDescription */}
          <div className="text-gray-700">
            <ul className="list-disc ml-5 space-y-2 text-sm">
              <li>
                Los alumnos de <strong>1ro a 5to semestre</strong> subirán al
                siguiente semestre automáticamente.
              </li>
              <li>
                Se limpiarán los grupos de todos los alumnos para la nueva
                asignación.
              </li>
              <li>
                Los alumnos de <strong>6to semestre</strong> serán dados de baja
                (Egresados).
              </li>
              <li>Este período quedará inactivo.</li>
            </ul>
            <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm font-semibold">
              Esta acción es irreversible. ¿Estás completamente seguro de
              continuar?
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsClosePeriodModalOpen(false)}
              disabled={isClosingPeriod}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClosePeriodSubmit}
              disabled={isClosingPeriod}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClosingPeriod
                ? "Procesando cambios..."
                : "Sí, cerrar período y promover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
