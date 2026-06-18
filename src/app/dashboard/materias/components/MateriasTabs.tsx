// components/MateriasTabs.tsx
"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Plus, Download } from "lucide-react";
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
import BlockingLoader from "@/components/common/BlockingLoader";
import {
  MateriaFormData,
  GrupoFormData,
  EspecialidadFormData,
} from "@/types/modal";
import EditEspecialidadModal from "@/components/common/Modal/EditEspecialidadModal";
import { downloadTemplate, uploadCsv } from "@/lib/upload";

interface MateriaRow {
  id?: number;
  idMateria?: number;
  nombre: string;
  codigo: string;
  totalHoras: number;
  semestre: number;
  idEspecialidad?: number;
  espacioId?: number;
  espacioNombre?: string;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  activo?: boolean;
}

interface GrupoRow {
  id?: number;
  idGrupo?: number;
  codigo: string;
  semestre: number;
  integrantes: number;
  turno?: GrupoFormData["turno"];
  aula?: string;
  materiasNombres?: string[];
  idEspecialidad?: number;
  idPeriodo?: number;
  idDocente?: number;
  docenteTutorId?: number;
  idMaterias?: number[];
  activo?: boolean;
}

type UploadTarget = "materias" | "grupos" | null;

interface Props {
  materiasData?: MateriaRow[];
  gruposData?: GrupoRow[];
  especialidadNombre?: string;
  activeEspecialidadId?: number;
  onCreateMateria?: (data: MateriaFormData) => Promise<boolean> | boolean;
  onCreateGrupo?: (data: GrupoFormData) => Promise<boolean> | boolean;
  onUpdateMateria?: (
    id: number,
    data: MateriaFormData,
  ) => Promise<boolean> | boolean;
  onDeleteMateria?: (id: number) => Promise<boolean> | boolean;
  onUpdateGrupo?: (
    id: number,
    data: GrupoFormData,
  ) => Promise<boolean> | boolean;
  onDeleteGrupo?: (id: number) => Promise<boolean> | boolean;
  onUpdateEspecialidad?: (
    id: number,
    data: Partial<EspecialidadFormData>,
  ) => Promise<boolean> | boolean;
  onDeleteEspecialidad?: (id: number) => Promise<boolean> | boolean;
  especialidades?: Array<{
    id: number;
    idEspecialidad?: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    activo?: boolean;
  }>;
  docentes?: Array<{
    id: number;
    idDocente?: number;
    usuario?: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
    };
  }>;
  periodos?: Array<{
    id: number;
    idPeriodo?: number;
    nombre: string;
    codigo: string;
    activo: boolean;
  }>;
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);

  // Función centralizada para subir CSV con overlay de carga
  const enviarArchivoAlBackend = async (file: File, endpoint: string) => {
    setIsUploading(true);
    setUploadTarget(endpoint === "grupos" ? "grupos" : "materias");
    try {
      const { ok, data } = await uploadCsv(file, endpoint);
      if (ok) {
        const insertados =
          data?.insertados ?? data?.inserted ?? data?.successCount ?? 0;
        const fallidos = data?.fallidos ?? data?.failed ?? 0;
        alert(`Éxito: Se procesaron ${insertados} registros.`);
        if (fallidos > 0) {
          console.warn(
            "Registros fallidos:",
            data?.detalles ?? data?.errors ?? data?.failedDetails,
          );
          alert(`Hubo ${fallidos} registros fallidos. Revisa la consola.`);
        }
        window.location.reload();
      } else {
        alert(
          `Error: ${data?.msg || data?.message || "Hubo un problema con el archivo"}`,
        );
      }
    } catch (error) {
      console.error("Error al enviar archivo:", error);
      alert("Error de conexión con el servidor.");
    } finally {
      setIsUploading(false);
      setUploadTarget(null);
    }
  };
  const [materiaVisibleColumns, setMateriaVisibleColumns] = useState<string[]>([
    "Nombre",
    "Código",
    "Total de horas",
    "Semestre",
    "Espacio",
  ]);

  const [grupoVisibleColumns, setGrupoVisibleColumns] = useState<string[]>([
    "Código",
    "Semestre",
    "Turno",
    "Aula",
    "Materias",
    "Alumnos",
  ]);

  const [openMateriaModal, setOpenMateriaModal] = useState(false);
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [editingMateria, setEditingMateria] = useState<
    (Partial<MateriaFormData> & { id?: number }) | null
  >(null);
  const [editingGrupo, setEditingGrupo] = useState<
    (Partial<GrupoFormData> & { id?: number; idGrupo?: number }) | null
  >(null);

  // Paginación
  const [materiaPage, setMateriaPage] = useState(1);
  const [grupoPage, setGrupoPage] = useState(1);
  const pageSize = 10;

  const toggleMateriaColumn = (column: string) => {
    setMateriaVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const toggleGrupoColumn = (column: string) => {
    setGrupoVisibleColumns((prev) =>
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
        const ok = await onUpdateMateria(editingMateria.id, data);
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
        const ok = await onUpdateGrupo(editingGrupo.id, data);
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

  const handleEditMateria = async (m: MateriaRow) => {
    const materiaData: Partial<MateriaFormData> & { id?: number } = {
      id: m.id,
      nombre: m.nombre,
      codigo: m.codigo,
      horas: m.totalHoras ?? m.horasTeoria ?? 0,
      creditos: m.creditos ?? 0,
      horasTeoria: m.horasTeoria ?? 0,
      horasPractica: m.horasPractica ?? 0,
      espacioId: m.espacioId ?? 0,
      idEspecialidad: m.idEspecialidad ?? 0,
      activo: m.activo ?? true,
    };
    setEditingMateria(materiaData);
    setOpenMateriaModal(true);
  };

  const handleDeleteMateria = async (m: MateriaRow) => {
    if (confirm(`¿Estás seguro de eliminar la materia "${m.nombre}"?`)) {
      if (m.id && onDeleteMateria) {
        await onDeleteMateria(m.id);
      }
    }
  };

  const handleEditGrupo = async (g: GrupoRow) => {
    const grupoData: Partial<GrupoFormData> & {
      id?: number;
      idGrupo?: number;
    } = {
      id: g.idGrupo || g.id,
      idGrupo: g.idGrupo || g.id,
      codigo: g.codigo,
      semestre: g.semestre,
      turno: g.turno ?? "MATUTINO",
      aula: g.aula ?? "",
      idEspecialidad: g.idEspecialidad ?? 0,
      docenteTutorId: g.docenteTutorId ?? 0,
      activo: g.activo ?? true,
    };
    setEditingGrupo(grupoData);
    setOpenGrupoModal(true);
  };

  const handleDeleteGrupo = async (g: GrupoRow) => {
    if (confirm(`¿Estás seguro de eliminar el grupo "${g.codigo}"?`)) {
      const grupoId = g.idGrupo || g.id;
      if (grupoId && onDeleteGrupo) {
        await onDeleteGrupo(grupoId);
      }
    }
  };

  const handleDescargarMachote = async (tipo: "materias" | "grupos") => {
    try {
      await downloadTemplate(tipo);
    } catch (error) {
      console.error(`Error al descargar plantilla de ${tipo}:`, error);
      alert("Error de conexión al descargar la plantilla.");
    }
  };

  return (
    <Tabs defaultValue="materias" className="h-full flex flex-col">
      <BlockingLoader
        open={isUploading}
        title={
          uploadTarget === "grupos"
            ? "Cargando grupos..."
            : "Cargando materias..."
        }
        description="Espera mientras se procesa la carga masiva."
      />

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
                  {[
                    "Nombre",
                    "Código",
                    "Total de horas",
                    "Semestre",
                    "Espacio",
                  ].map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={materiaVisibleColumns.includes(col)}
                      onCheckedChange={() => toggleMateriaColumn(col)}
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
                type="button"
                className="flex items-center gap-2"
                onClick={() => void handleDescargarMachote("materias")}
              >
                <Download className="w-4 h-4" />
                Descargar Machote
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isUploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv, .xlsx";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file && confirm(`¿Cargar archivo de materias?`)) {
                      enviarArchivoAlBackend(file, "materias");
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
              visibleColumns={materiaVisibleColumns}
              onEdit={handleEditMateria}
              onDelete={handleDeleteMateria}
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
                  {[
                    "Código",
                    "Semestre",
                    "Turno",
                    "Aula",
                    "Materias",
                    "Alumnos",
                  ].map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={grupoVisibleColumns.includes(col)}
                      onCheckedChange={() => toggleGrupoColumn(col)}
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
                type="button"
                className="flex items-center gap-2"
                onClick={() => void handleDescargarMachote("grupos")}
              >
                <Download className="w-4 h-4" />
                Descargar Machote
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isUploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv, .xlsx";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file && confirm(`¿Cargar archivo de grupos?`)) {
                      enviarArchivoAlBackend(file, "grupos");
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
              visibleColumns={grupoVisibleColumns}
              onEdit={handleEditGrupo}
              onDelete={handleDeleteGrupo}
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
