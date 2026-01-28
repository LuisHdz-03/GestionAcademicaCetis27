// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HiCalendar, HiPlus, HiUsers, HiBookOpen, HiAcademicCap } from "react-icons/hi2";
import Link from "next/link";
import CreatePeriodModal from "@/components/common/Modal/CreatePeriodModal";
import SuccessModal from "@/components/common/Modal/SuccessModal";
import { useToast } from "@/hooks/useToast";
import { useCommunity } from "@/hooks/useCommunity";

export default function DashboardPage() {
  const { toast } = useToast();
  const { docentes, alumnos, administradores, fetchDocentes, fetchAlumnos, fetchAdministradores } = useCommunity();
  const [hasActivePeriod, setHasActivePeriod] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  // Función para traer período activo del backend
  const fetchActivePeriod = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/v1/periodos/activo");
      if (!res.ok) throw new Error("Error al obtener período activo");
      const data = await res.json();

      if (data.success && data.data) {
        setHasActivePeriod(true);
        setActivePeriod(data.data);
      } else {
        setHasActivePeriod(false);
      }
    } catch (err) {
      console.error(err);
      setHasActivePeriod(false);
    }
  };

  useEffect(() => {
    fetchActivePeriod();
    // cargar conteos reales
    fetchDocentes();
    fetchAlumnos();
    fetchAdministradores();
  }, []);

  const handleCreatePeriod = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handlePeriodSubmit = async (data: { nombre: string; fechaInicio: string; fechaFin: string }) => {
    try {
      setIsModalOpen(false);
  
      const token = localStorage.getItem('token');
      
      const res = await fetch("http://localhost:4000/api/v1/periodos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
  
      const result = await res.json();
  
      if (!res.ok || !result.success) {
        console.error("Error al crear período:", result.message || result);
        toast({
          title: "Error al crear período",
          description: result.message || "No se pudo crear el período. Intenta de nuevo.",
          variant: "destructive",
          duration: 5000
        });
        return;
      }
  
      setActivePeriod(result.data);
      setHasActivePeriod(true);
      setShowSuccessModal(true);
      
      toast({
        title: "¡Período creado exitosamente!",
        description: `El período "${data.nombre}" ha sido creado correctamente.`,
        variant: "success",
        duration: 4000
      });
    } catch (err) {
      console.error("Error en fetch:", err);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  const handleEditPeriod = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleEditPeriodSubmit = async (data: { nombre: string; fechaInicio: string; fechaFin: string }) => {
    if (!activePeriod) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/v1/periodos/${activePeriod.idPeriodo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...data, activo: true }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast({ title: 'Error al actualizar período', description: result.message || 'Intenta de nuevo', variant: 'destructive' });
        return;
      }
      setActivePeriod(result.data);
      setIsEditModalOpen(false);
      toast({ title: 'Período actualizado', description: 'Los cambios se guardaron correctamente', variant: 'success' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error de conexión', description: 'No se pudo actualizar el período', variant: 'destructive' });
    }
  };

  const handleDeletePeriod = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/v1/periodos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast({ 
          title: 'Error al eliminar período', 
          description: result.message || 'No se pudo eliminar el período. Intenta de nuevo.', 
          variant: 'destructive' 
        });
        return;
      }
      setActivePeriod(null);
      setHasActivePeriod(false);
      setIsEditModalOpen(false);
      toast({ 
        title: 'Período eliminado', 
        description: 'El período ha sido eliminado correctamente', 
        variant: 'success' 
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: 'Error de conexión', 
        description: 'No se pudo eliminar el período', 
        variant: 'destructive' 
      });
    }
  };
  

  // Loading
  if (hasActivePeriod === null) return <p className="text-center mt-20">Cargando dashboard...</p>;

  // Empty State
  if (!hasActivePeriod) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-2xl w-full text-center">
            <CardHeader className="pb-6">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <HiCalendar className="w-8 h-8 text-gray-400" />
              </div>
              <CardTitle className="text-2xl text-gray-900 mb-4">No hay períodos activos</CardTitle>
              <p className="text-gray-600 text-lg">
                No se ha creado ningún período todavía. Crea tu primer período académico para comenzar.
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

  // Dashboard normal
  const stats = [
    { title: "Alumnos activos", value: String(alumnos.length), icon: HiUsers, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Materias", value: "0", icon: HiBookOpen, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Docentes", value: String(docentes.length), icon: HiAcademicCap, color: "text-purple-600", bgColor: "bg-purple-100" },
    { title: "Administradores", value: String(administradores.length), icon: HiAcademicCap, color: "text-amber-600", bgColor: "bg-amber-100" },
  ];

  // Normalizar fecha (maneja 'YYYY-MM-DD' sin zona horaria)
  const toDate = (value?: string) => {
    if (!value) return null;
    const hasTime = value.includes('T');
    const d = new Date(hasTime ? value : `${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  // Progreso del período
  const computeProgress = () => {
    if (!activePeriod) return { percent: 0, daysLeft: 0, totalDays: 0, phase: 'unknown', daysToStart: 0 } as const;
    const startDate = toDate(activePeriod.fechaInicio);
    const endDate = toDate(activePeriod.fechaFin);
    if (!startDate || !endDate) return { percent: 0, daysLeft: 0, totalDays: 0, phase: 'unknown', daysToStart: 0 } as const;
    const start = startDate.getTime();
    const end = endDate.getTime();
    const now = Date.now();
    const total = Math.max(end - start, 1);
    const MS_PER_DAY = 86400000;

    if (now < start) {
      const daysToStart = Math.max(Math.ceil((start - now) / MS_PER_DAY), 0);
      const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
      return { percent: 0, daysLeft: totalDays, totalDays, phase: 'pre', daysToStart } as const;
    }

    if (now > end) {
      const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
      return { percent: 100, daysLeft: 0, totalDays, phase: 'post', daysToStart: 0 } as const;
    }

    const elapsed = Math.min(Math.max(now - start, 0), total);
    const percent = Math.round((elapsed / total) * 100);
    const daysLeft = Math.max(Math.ceil((end - now) / MS_PER_DAY), 0);
    const totalDays = Math.max(Math.ceil((end - start) / MS_PER_DAY), 0);
    return { percent, daysLeft, totalDays, phase: 'in', daysToStart: 0 } as const;
  };
  const { percent: periodPercent, daysLeft: periodDaysLeft, totalDays: periodTotalDays, phase: periodPhase, daysToStart } = computeProgress();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
        <p className="text-gray-600 mt-2">Resumen general del sistema académico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-0 w-full h-3 bg-[#691C32] rounded-t-md" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Período activo */}
      <Card className="bg-white shadow-md rounded-lg flex flex-col mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Estado del periodo actual</CardTitle>
            <Button variant="outline" size="sm" onClick={handleEditPeriod}>Editar período</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm text-gray-700">
          <p><span className="font-semibold">Periodo:</span> {activePeriod?.nombre}</p>
          <p><span className="font-semibold">Fecha de inicio:</span> {formatDateDisplay(activePeriod?.fechaInicio)}</p>
          <p><span className="font-semibold">Fecha de fin:</span> {formatDateDisplay(activePeriod?.fechaFin)}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progreso del período</span>
              <span>{periodPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-[#691C32]" style={{ width: `${Math.min(Math.max(periodPercent, 0), 100)}%`, minWidth: periodPercent > 0 ? 2 : 0 }} />
            </div>
            {periodPhase === 'pre' && (
              <div className="text-xs text-gray-600 mt-1">Comienza en {daysToStart} día(s). Duración: {periodTotalDays} día(s).</div>
            )}
            {periodPhase === 'in' && (
              <div className="text-xs text-gray-600 mt-1">Quedan {periodDaysLeft} día(s) de {periodTotalDays}</div>
            )}
            {periodPhase === 'post' && (
              <div className="text-xs text-gray-600 mt-1">Período finalizado. Duración: {periodTotalDays} día(s).</div>
            )}
          </div>
          <p className="mt-2"><span className="font-semibold">Estado:</span> {periodPhase === 'pre' && <span className="text-amber-600 font-medium">Aún no inicia</span>}{periodPhase === 'in' && <span className="text-green-600 font-medium">En curso</span>}{periodPhase === 'post' && <span className="text-gray-600 font-medium">Finalizado</span>}</p>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card className="bg-white shadow-sm rounded-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-800">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/dashboard/comunidadEsc">
            <Button variant="outline" className="gap-2">Gestionar comunidad</Button>
          </Link>
          <Link href="/dashboard/materias">
            <Button variant="outline" className="gap-2">Gestionar materias</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-700 space-y-2">
              {(docentes.slice(0, 5)).map((d) => (
                <li key={`${d.id}-${d.email}`} className="flex items-center justify-between">
                  <span>{d.nombre} {d.apellidoPaterno}</span>
                  <span className="text-gray-500">{d.email}</span>
                </li>
              ))}
              {docentes.length === 0 && <li className="text-gray-500">Sin docentes para mostrar</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Alumnos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-700 space-y-2">
              {(alumnos.slice(0, 5)).map((a) => (
                <li key={`${a.id}-${a.email}`} className="flex items-center justify-between">
                  <span>{a.nombre} {a.apellidoPaterno}</span>
                  <span className="text-gray-500">{a.email}</span>
                </li>
              ))}
              {alumnos.length === 0 && <li className="text-gray-500">Sin alumnos para mostrar</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
      <CreatePeriodModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditPeriodSubmit}
        mode="edit"
        initialData={{
          nombre: activePeriod?.nombre || '',
          fechaInicio: activePeriod?.fechaInicio?.substring(0,10) || '',
          fechaFin: activePeriod?.fechaFin?.substring(0,10) || '',
        }}
        onDelete={handleDeletePeriod}
        periodoId={activePeriod?.idPeriodo}
      />
    </div>
  );
}
