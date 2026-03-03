// components/MateriasTabs.tsx
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import MateriasTable from "./MateriasTable";
import GruposTable from "./GruposTable";
import { HiArrowDownTray } from "react-icons/hi2";
import AddMateriaModal from "@/components/common/Modal/AddMateriaModal";
import AddGrupoModal from "@/components/common/Modal/AddGrupoModal";
import { MateriaFormData, GrupoFormData } from "@/types/modal";
import EditEspecialidadModal from "@/components/common/Modal/EditEspecialidadModal";

interface Materia {
  id?: number;
  nombre: string;
  codigo: string;
  totalHoras: number;
  semestre: number;
  idEspecialidad?: number;
}

interface Grupo {
  id?: number;
  codigo: string;
  semestre: number;
  integrantes: number;
  aula?: string;
  idEspecialidad?: number;
  idPeriodo?: number;
  idDocente?: number;
  idMateria?: number;
}

interface Props {
  materiasData?: Materia[];
  gruposData?: Grupo[];
  especialidadNombre?: string;
  activeEspecialidadId?: number;
  onCreateMateria?: (data: any) => Promise<boolean> | boolean;
  onCreateGrupo?: (data: any) => Promise<boolean> | boolean;
  onUpdateMateria?: (id: number, data: any) => Promise<boolean> | boolean;
  onDeleteMateria?: (id: number) => Promise<boolean> | boolean;
  onUpdateGrupo?: (id: number, data: any) => Promise<boolean> | boolean;
  onDeleteGrupo?: (id: number) => Promise<boolean> | boolean;
  onUpdateEspecialidad?: (id: number, data: any) => Promise<boolean> | boolean;
  onDeleteEspecialidad?: (id: number) => Promise<boolean> | boolean;
  especialidades?: Array<{
    id: number;
    nombre: string;
    codigo: string;
    activo?: boolean;
  }>;
  docentes?: Array<{
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
  }>;
  periodos?: Array<{ id: number; nombre: string; activo: boolean }>;
  materiasOptions?: Array<{ id: number; nombre: string; codigo: string }>;
}

export default function MateriasTabs({
  materiasData,
  gruposData,
  especialidadNombre,
  activeEspecialidadId,
  onCreateMateria,
  onCreateGrupo,
  onUpdateMateria,
  onDeleteMateria,
  onUpdateGrupo,
  onDeleteGrupo,
  onUpdateEspecialidad,
  onDeleteEspecialidad,
  especialidades = [],
  docentes = [],
  periodos = [],
  materiasOptions = [],
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditEspecialidad, setOpenEditEspecialidad] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "Nombre",
    "Código",
    "Total de horas",
    "Semestre",
  ]);

  const [openMateriaModal, setOpenMateriaModal] = useState(false);
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [editingMateria, setEditingMateria] = useState<
    (Partial<MateriaFormData> & { id?: number }) | null
  >(null);
  const [editingGrupo, setEditingGrupo] = useState<
    (Partial<GrupoFormData> & { id?: number }) | null
  >(null);

  // Paginación
  const [materiaPage, setMateriaPage] = useState(1);
  const [grupoPage, setGrupoPage] = useState(1);
  const pageSize = 10;

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  // Resetear página al cambiar búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setMateriaPage(1);
    setGrupoPage(1);
  };

  const filteredMaterias = (materiasData ?? []).filter((m) =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredGrupos = (gruposData ?? []).filter((g) =>
    (g.codigo || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const materiaTotal = filteredMaterias.length;
  const grupoTotal = filteredGrupos.length;
  const materiaPageCount = Math.max(1, Math.ceil(materiaTotal / pageSize));
  const grupoPageCount = Math.max(1, Math.ceil(grupoTotal / pageSize));

  const pagedMaterias = filteredMaterias.slice(
    (materiaPage - 1) * pageSize,
    materiaPage * pageSize,
  );
  const pagedGrupos = filteredGrupos.slice(
    (grupoPage - 1) * pageSize,
    grupoPage * pageSize,
  );

  const handleAddMateria = async (data: MateriaFormData): Promise<boolean> => {
    try {
      if (editingMateria && editingMateria.id && onUpdateMateria) {
        const ok = await onUpdateMateria(editingMateria.id, data as any);
        if (!ok) return false;
      } else if (onCreateMateria) {
        const ok = await onCreateMateria(data);
        if (!ok) return false;
      }
      return true;
    } finally {
      setOpenMateriaModal(false);
      setEditingMateria(null);
    }
  };

  const handleAddGrupo = async (data: GrupoFormData): Promise<boolean> => {
    try {
      if (editingGrupo && editingGrupo.id && onUpdateGrupo) {
        const ok = await onUpdateGrupo(editingGrupo.id, data as any);
        if (!ok) return false;
      } else if (onCreateGrupo) {
        const ok = await onCreateGrupo(data);
        if (!ok) return false;
      }
      return true;
    } finally {
      setOpenGrupoModal(false);
      setEditingGrupo(null);
    }
  };

  return (
    <Tabs defaultValue="materias" className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          {/* Izquierda: título y descripción */}
          <div className="flex flex-col">
            <CardTitle className="text-xl font-semibold">
              Materias y grupos – {especialidadNombre}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Administra aquí todas las materias y grupos de la especialidad
            </p>
          </div>

          {/* Derecha: botón de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-8 min-w-[150px] whitespace-nowrap bg-[#691C32] text-white hover:bg-[#50172A]"
              >
                Mostrar acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem
                onClick={() => {
                  if (activeEspecialidadId) {
                    setOpenEditEspecialidad(true);
                  }
                }}
                disabled={!activeEspecialidadId}
              >
                Editar Especialidad
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  if (activeEspecialidadId && onDeleteEspecialidad) {
                    if (
                      confirm(
                        `¿Estás seguro de eliminar la especialidad "${especialidadNombre}"?`,
                      )
                    ) {
                      const ok =
                        await onDeleteEspecialidad(activeEspecialidadId);
                      if (ok) {
                        // El parent debería refrescar los datos
                      }
                    }
                  }
                }}
                disabled={!activeEspecialidadId || !onDeleteEspecialidad}
                className="text-red-600 focus:text-red-600"
              >
                Eliminar Especialidad
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* Tabs Content */}
        <CardContent className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4 w-full grid grid-cols-2 gap-2 flex-shrink-0">
            <TabsTrigger
              value="materias"
              className="data-[state=active]:bg-[#691C32] data-[state=active]:text-white
                data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700"
            >
              Materias
            </TabsTrigger>
            <TabsTrigger
              value="grupos"
              className="data-[state=active]:bg-[#691C32] data-[state=active]:text-white
                data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700"
            >
              Grupos
            </TabsTrigger>
          </TabsList>

          {/* Tab Materias */}
          <TabsContent
            value="materias"
            className="flex-1 flex flex-col space-y-4 min-h-0"
          >
            {/* Barra de herramientas */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-shrink-0">
              <div className="relative flex-1 max-w-3xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar materia..."
                  className="pl-9 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filtros / Columnas */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-8 min-w-[150px] whitespace-nowrap"
                  >
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuLabel>Selecciona columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Nombre", "Código", "Total de horas", "Semestre"].map(
                    (col) => (
                      <DropdownMenuCheckboxItem
                        key={col}
                        checked={visibleColumns.includes(col)}
                        onCheckedChange={() => toggleColumn(col)}
                      >
                        {col}
                      </DropdownMenuCheckboxItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Botones */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv, .xlsx";
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!confirm(`¿Cargar archivo de materias?`)) return;
                    try {
                      const { ok, data } = await import("@/lib/upload").then(
                        (m) => m.uploadCsv(file, "materias"),
                      );
                      if (ok && data) {
                        alert(
                          `✅ Éxito: Se procesaron ${data.insertados ?? 0} registros.`,
                        );
                        if ((data.fallidos ?? 0) > 0) {
                          console.warn("Registros fallidos:", data.detalles);
                          alert(
                            `Hubo ${data.fallidos} registros fallidos. Revisa la consola.`,
                          );
                        }
                        window.location.reload();
                      } else {
                        alert(
                          `❌ Error: ${data?.msg || "Hubo un problema con el archivo"}`,
                        );
                      }
                    } catch (err) {
                      console.error(err);
                      alert("❌ Error al enviar archivo.");
                    }
                  };
                  input.click();
                }}
              >
                <HiArrowDownTray className="w-4 h-4" />
                Cargar Materias
              </Button>
              <Button
                onClick={() => setOpenMateriaModal(true)}
                className="bg-[#691C32] text-white hover:bg-[#691C32]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar materia
              </Button>
            </div>

            {/* Tabla */}
            <MateriasTable
              materias={pagedMaterias}
              visibleColumns={visibleColumns}
              onEdit={async (m) => {
                const materiaData: Partial<MateriaFormData> & { id?: number } =
                  {
                    id: m.id,
                    nombre: m.nombre,
                    codigo: m.codigo,
                    creditos: (m as any).creditos ?? 0,
                    horasTeoria: (m as any).horasTeoria ?? 0,
                    horasPractica: (m as any).horasPractica ?? 0,
                    idEspecialidad: (m as any).idEspecialidad ?? 0,
                    activo: (m as any).activo ?? true,
                  };
                setEditingMateria(materiaData as any);
                setOpenMateriaModal(true);
              }}
              onDelete={async (m) => {
                if (
                  confirm(`¿Estás seguro de eliminar la materia "${m.nombre}"?`)
                ) {
                  if (m.id && onDeleteMateria) {
                    const ok = await onDeleteMateria(m.id);
                    // El parent debería refrescar los datos
                  }
                }
              }}
            />

            {/* Paginación Materias */}
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando{" "}
                {materiaTotal === 0 ? 0 : (materiaPage - 1) * pageSize + 1}-
                {Math.min(materiaPage * pageSize, materiaTotal)} de{" "}
                {materiaTotal}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={materiaPage <= 1}
                  onClick={() => setMateriaPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {materiaPage} / {materiaPageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={materiaPage >= materiaPageCount}
                  onClick={() =>
                    setMateriaPage((p) => Math.min(materiaPageCount, p + 1))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab Grupos */}
          <TabsContent
            value="grupos"
            className="flex-1 flex flex-col space-y-4 min-h-0"
          >
            {/* Barra de herramientas */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-shrink-0">
              <div className="relative flex-1 max-w-3xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar grupo..."
                  className="pl-9 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filtros / Columnas */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-8 min-w-[150px] whitespace-nowrap"
                  >
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                  <DropdownMenuLabel>Selecciona columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Código", "Semestre", "Alumnos"].map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={visibleColumns.includes(col)}
                      onCheckedChange={() => toggleColumn(col)}
                    >
                      {col}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Botones */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv, .xlsx";
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!confirm(`¿Cargar archivo de grupos?`)) return;
                    try {
                      const { ok, data } = await import("@/lib/upload").then(
                        (m) => m.uploadCsv(file, "grupos"),
                      );
                      if (ok && data) {
                        alert(
                          ` Éxito: Se procesaron ${data.insertados ?? 0} registros.`,
                        );
                        if ((data.fallidos ?? 0) > 0) {
                          console.warn("Registros fallidos:", data.detalles);
                          alert(
                            `Hubo ${data.fallidos} registros fallidos. Revisa la consola.`,
                          );
                        }
                        window.location.reload();
                      } else {
                        alert(
                          ` Error: ${data?.msg || "Hubo un problema con el archivo"}`,
                        );
                      }
                    } catch (err) {
                      console.error(err);
                      alert(" Error al enviar archivo.");
                    }
                  };
                  input.click();
                }}
              >
                <HiArrowDownTray className="w-4 h-4" />
                Cargar Grupos
              </Button>
              <Button
                onClick={() => setOpenGrupoModal(true)}
                className="bg-[#691C32] text-white hover:bg-[#691C32]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar grupo
              </Button>
            </div>

            {/* Tabla */}
            <GruposTable
              grupos={pagedGrupos}
              visibleColumns={visibleColumns}
              onEdit={async (g) => {
                const grupoData: Partial<GrupoFormData> & { id?: number } = {
                  id: g.id,
                  codigo: g.codigo,
                  semestre: g.semestre,
                  idEspecialidad: (g as any).idEspecialidad ?? 0,
                  idPeriodo: (g as any).idPeriodo ?? 0,
                  idDocente: (g as any).idDocente ?? 0,
                  idMateria: (g as any).idMateria ?? 0,
                  activo: (g as any).activo ?? true,
                };
                setEditingGrupo(grupoData as any);
                setOpenGrupoModal(true);
              }}
              onDelete={async (g) => {
                if (
                  confirm(`¿Estás seguro de eliminar el grupo "${g.codigo}"?`)
                ) {
                  if (g.id && onDeleteGrupo) {
                    const ok = await onDeleteGrupo(g.id);
                    // El parent debería refrescar los datos
                  }
                }
              }}
            />

            {/* Paginación Grupos */}
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando{" "}
                {grupoTotal === 0 ? 0 : (grupoPage - 1) * pageSize + 1}-
                {Math.min(grupoPage * pageSize, grupoTotal)} de {grupoTotal}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={grupoPage <= 1}
                  onClick={() => setGrupoPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {grupoPage} / {grupoPageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={grupoPage >= grupoPageCount}
                  onClick={() =>
                    setGrupoPage((p) => Math.min(grupoPageCount, p + 1))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      {/* Modales */}
      <AddMateriaModal
        open={openMateriaModal}
        onOpenChange={(open) => {
          setOpenMateriaModal(open);
          if (!open) setEditingMateria(null);
        }}
        onSubmit={handleAddMateria}
        especialidades={especialidades}
        initialData={editingMateria || undefined}
        isEditing={!!editingMateria}
      />
      <AddGrupoModal
        open={openGrupoModal}
        onOpenChange={(open) => {
          setOpenGrupoModal(open);
          if (!open) setEditingGrupo(null);
        }}
        onSubmit={handleAddGrupo}
        especialidades={especialidades}
        docentes={docentes}
        materias={materiasOptions}
        periodos={periodos}
        initialData={editingGrupo || undefined}
        isEditing={!!editingGrupo}
      />
      {activeEspecialidadId && onUpdateEspecialidad && (
        <EditEspecialidadModal
          open={openEditEspecialidad}
          onOpenChange={setOpenEditEspecialidad}
          initialData={
            especialidades.find((e) => e.id === activeEspecialidadId) || {}
          }
          onSubmit={async (data) => {
            if (activeEspecialidadId && onUpdateEspecialidad) {
              const ok = await onUpdateEspecialidad(activeEspecialidadId, data);
              if (ok) {
                setOpenEditEspecialidad(false);
              }
            }
          }}
        />
      )}
    </Tabs>
  );
}
