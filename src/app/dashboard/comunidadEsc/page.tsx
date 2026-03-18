"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import TabsSelector from "./components/TabsSelector";
import TopBar from "./components/TopBar";
import DataTable from "./components/DataTable";
import Pagination from "./components/Pagination";
import AddDocenteModal from "@/components/common/Modal/AddDocenteModal";
import AddAlumnoModal from "@/components/common/Modal/AddAlumnoModal";
import AddAdminModal from "@/components/common/Modal/AddAdminModal";
// AddGrupoModal removed
import EditDocenteModal from "@/components/common/Modal/EditDocenteModal";
import EditAlumnoModal from "@/components/common/Modal/EditAlumnoModal";
import EditAdminModal from "@/components/common/Modal/EditAdminModal";
// EditGrupoModal removed
import {
  CommunityMember,
  Docente,
  Alumno,
  Admin as Administrador,
} from "@/types/community";
import { DocenteFormData, AlumnoFormData, AdminFormData } from "@/types/modal";
import { useCommunity } from "@/hooks/useCommunity";

type TabType = "docentes" | "alumnos" | "administradores";

export default function CommunityManagementPage() {
  // --- Hook de datos ---
  const {
    docentes,
    alumnos,
    administradores,
    especialidades,
    grupos,
    loading,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchEspecialidades,
    fetchGrupos,
    createDocente,
    deleteDocente,
    updateDocente,
    createAlumno,
    deleteAlumno,
    updateAlumno,
    updateAlumnoExtra,
    createAdministrador,
    deleteAdministrador,
    updateAdministrador,
  } = useCommunity();

  // --- UI States ---
  const [activeTab, setActiveTab] = useState<TabType>("docentes");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Modal States ---
  const [openDocenteModal, setOpenDocenteModal] = useState(false);
  const [openAlumnoModal, setOpenAlumnoModal] = useState(false);
  const [openAdminModal, setOpenAdminModal] = useState(false);
  const [openEditDocente, setOpenEditDocente] = useState(false);
  const [openEditAlumno, setOpenEditAlumno] = useState(false);
  const [openEditAdmin, setOpenEditAdmin] = useState(false);
  const [openEditAlumnoExtra, setOpenEditAlumnoExtra] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommunityMember | null>(
    null,
  );

  // Estado para el formulario de info adicional
  const [extraFormData, setExtraFormData] = useState({
    fotoUrl: "",
    datosVerificados: false,
    credencialFechaEmision: "",
    credencialFechaExpiracion: "",
    tutorNombre: "",
    tutorApellidoPaterno: "",
    tutorApellidoMaterno: "",
    tutorTelefono: "",
    tutorEmail: "",
    tutorParentesco: "",
    tutorDireccion: "",
  });

  const formatDate = (value?: string) => {
    if (!value) return "";
    // Asegurar formato YYYY-MM-DD para inputs type=date
    return value.substring(0, 10);
  };

  // --- Cargar datos al montar el componente ---
  useEffect(() => {
    fetchDocentes();
    fetchAlumnos();
    fetchAdministradores();
    fetchEspecialidades();
    fetchGrupos();
  }, []);

  // --- Filters (dinámicos con base en BD) ---
  const docentesFilters = [
    "Todas las especialidades",
    ...Array.from(new Set((especialidades || []).map((e) => e.nombre))).filter(
      Boolean,
    ),
  ];
  const alumnosFilters = [
    "Todas las especialidades",
    ...Array.from(new Set((especialidades || []).map((e) => e.nombre))).filter(
      Boolean,
    ),
  ];
  const administradoresFilters = [
    "Todos los cargos",
    ...Array.from(new Set((administradores || []).map((a) => a.cargo))).filter(
      Boolean,
    ),
  ];
  // gruposFilters removed

  const getCurrentData = () => {
    switch (activeTab) {
      case "docentes":
        return docentes;
      case "alumnos":
        return alumnos;
      case "administradores":
        return administradores;
    }
  };

  const getCurrentFilters = () => {
    switch (activeTab) {
      case "docentes":
        return docentesFilters;
      case "alumnos":
        return alumnosFilters;
      case "administradores":
        return administradoresFilters;
    }
  };

  // --- Visible columns state ---
  const defaultVisibleColumns = (tab: TabType) => {
    switch (tab) {
      case "docentes":
        return ["Nombre", "Email", "Especialidad", "N° Empleado"];
      case "alumnos":
        return ["Nombre", "Email", "Matrícula", "Especialidad", "Grupo"];
      case "administradores":
        return ["Nombre", "Email", "Cargo", "N° Empleado"];
      default:
        return [];
    }
  };
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns(activeTab),
  );

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  // --- Filtered Data ---
  const filteredData = getCurrentData()!.filter((item: CommunityMember) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      ("nombre" in item &&
        (item.nombre || "").toLowerCase().includes(searchLower)) ||
      ("email" in item &&
        (item.email || "").toLowerCase().includes(searchLower)) ||
      ("codigo" in item &&
        (item.codigo || "").toLowerCase().includes(searchLower)) ||
      ("matricula" in item &&
        (item.matricula || "").toLowerCase().includes(searchLower)) ||
      ("numeroEmpleado" in item &&
        (item.numeroEmpleado || "").toLowerCase().includes(searchLower));

    const matchesFilter =
      !selectedFilter ||
      selectedFilter.startsWith("Todas") ||
      selectedFilter.startsWith("Todos") ||
      ("especialidad" in item && item.especialidad === selectedFilter) ||
      ("especialidadNombre" in item &&
        item.especialidadNombre === selectedFilter) ||
      ("cargo" in item && item.cargo === selectedFilter);

    const matchesStatus =
      !statusFilter ||
      statusFilter === "todos" ||
      (statusFilter === "activos" &&
        "activo" in item &&
        (item as any).activo === true) ||
      (statusFilter === "inactivos" &&
        "activo" in item &&
        (item as any).activo === false);

    return matchesSearch && matchesFilter && matchesStatus;
  });

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // --- Actions ---
  const handleEdit = (item: CommunityMember) => {
    setSelectedItem(item);
    if (activeTab === "docentes") setOpenEditDocente(true);
    if (activeTab === "alumnos") setOpenEditAlumno(true);
    if (activeTab === "administradores") setOpenEditAdmin(true);
  };

  const handleEditExtra = (item: CommunityMember) => {
    setSelectedItem(item);

    // Cargar datos existentes del alumno
    const alumno = item as any;

    

    setExtraFormData({
      fotoUrl: alumno.fotoUrl || "",
      datosVerificados: alumno.datosVerificados || false,
      credencialFechaEmision: formatDate(alumno.credencialFechaEmision),
      credencialFechaExpiracion: formatDate(alumno.credencialFechaExpiracion),
      tutorNombre: alumno.tutor?.nombre || "",
      tutorApellidoPaterno: alumno.tutor?.apellidoPaterno || "",
      tutorApellidoMaterno: alumno.tutor?.apellidoMaterno || "",
      tutorTelefono: alumno.tutor?.telefono || "",
      tutorEmail: alumno.tutor?.email || "",
      tutorParentesco: alumno.tutor?.parentesco || "",
      tutorDireccion: alumno.tutor?.direccion || "",
    });

    setOpenEditAlumnoExtra(true);
  };

  const handleDelete = async (item: CommunityMember) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    let ok = false;
    if (activeTab === "docentes") ok = await deleteDocente((item as any).id);
    if (activeTab === "alumnos") ok = await deleteAlumno((item as any).id);
    if (activeTab === "administradores")
      ok = await deleteAdministrador((item as any).id);
    if (ok) {
      // refresh se hace dentro de los métodos delete*
    }
  };

  // --- Handlers para crear nuevos registros ---
  const handleCreateDocente = async (data: DocenteFormData) => {
    const success = await createDocente(data);
    if (success) {
      setOpenDocenteModal(false);
    }
  };

  const handleCreateAlumno = async (data: AlumnoFormData) => {
    const success = await createAlumno(data);
    if (success) {
      setOpenAlumnoModal(false);
    }
  };

  const handleCreateAdministrador = async (data: AdminFormData) => {
    const success = await createAdministrador(data);
    if (success) {
      setOpenAdminModal(false);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (
    loading &&
    docentes.length === 0 &&
    alumnos.length === 0 &&
    administradores.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#691C32] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Card className="flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Gestión de comunidad escolar
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col space-y-6 p-6">
          {/* Tabs */}
          <TabsSelector
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab as TabType);
              setSearchTerm("");
              setSelectedFilter("");
              setStatusFilter("");
              setCurrentPage(1);
              setVisibleColumns(defaultVisibleColumns(tab as TabType));
            }}
          />

          {/* TopBar */}
          <TopBar
            activeTab={activeTab}
            visibleColumns={visibleColumns}
            toggleColumn={toggleColumn}
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            selectedFilter={selectedFilter}
            onFilterChange={(val) => {
              setSelectedFilter(val);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
            filters={getCurrentFilters()!}
            onAddClick={() => {
              if (activeTab === "docentes") setOpenDocenteModal(true);
              if (activeTab === "alumnos") setOpenAlumnoModal(true);
              if (activeTab === "administradores") setOpenAdminModal(true);
            }}
          />

          {/* DataTable */}
          <DataTable
            activeTab={activeTab}
            data={currentData}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleEditExtra={handleEditExtra}
            visibleColumns={visibleColumns}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between flex-shrink-0 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1}-
              {Math.min(endIndex, filteredData.length)} de {filteredData.length}{" "}
              {activeTab}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <AddDocenteModal
        open={openDocenteModal}
        onOpenChange={setOpenDocenteModal}
        onSubmit={handleCreateDocente}
        especialidades={especialidades}
      />
      <AddAlumnoModal
        open={openAlumnoModal}
        onOpenChange={setOpenAlumnoModal}
        onSubmit={handleCreateAlumno}
        especialidades={especialidades}
        grupos={grupos}
      />
      <AddAdminModal
        open={openAdminModal}
        onOpenChange={setOpenAdminModal}
        onSubmit={handleCreateAdministrador}
      />

      {/* Modales de edición */}
      {selectedItem && (
        <>
          <EditDocenteModal
            open={openEditDocente}
            onOpenChange={setOpenEditDocente}
            especialidades={especialidades}
            initialData={
              {
                ...(selectedItem as any),
                fechaNacimiento: formatDate(
                  (selectedItem as any).fechaNacimiento,
                ),
                fechaContratacion: formatDate(
                  (selectedItem as any).fechaContratacion,
                ),
              } as any
            }
            onSubmit={async (data) => {
              const id = (selectedItem as any).id;
              const ok = await updateDocente(id, data);
              if (ok) setOpenEditDocente(false);
            }}
          />
          <EditAlumnoModal
            open={openEditAlumno}
            onOpenChange={setOpenEditAlumno}
            especialidades={especialidades}
            grupos={grupos}
            initialData={
              {
                ...(selectedItem as any),
                // Mapear campo de lista a estructura del formulario
                semestreActual: (selectedItem as any).semestre,
                // idEspecialidad se resuelve por nombre si es posible
                idEspecialidad: (() => {
                  const nombre = (selectedItem as any).especialidad;
                  const found = especialidades.find((e) => e.nombre === nombre);
                  return found ? found.id : 0;
                })(),
                // idGrupo ya viene del backend
                idGrupo: (selectedItem as any).idGrupo,
                numeroControl: (selectedItem as any).matricula,
                fechaNacimiento: formatDate(
                  (selectedItem as any).fechaNacimiento,
                ),
                fechaIngreso: formatDate((selectedItem as any).fechaIngreso),
              } as any
            }
            onSubmit={async (data) => {
              const id = (selectedItem as any).id;
              const ok = await updateAlumno(id, data as any);
              if (ok) setOpenEditAlumno(false);
            }}
          />
          <EditAdminModal
            open={openEditAdmin}
            onOpenChange={setOpenEditAdmin}
            initialData={
              {
                ...(selectedItem as any),
                fechaNacimiento: formatDate(
                  (selectedItem as any).fechaNacimiento,
                ),
              } as any
            }
            onSubmit={async (data) => {
              const id = (selectedItem as any).id;
              const ok = await updateAdministrador(id, data);
              if (ok) setOpenEditAdmin(false);
            }}
          />

          {/* Modal para editar información adicional del alumno */}
          <Dialog
            open={openEditAlumnoExtra}
            onOpenChange={setOpenEditAlumnoExtra}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-[#691C32]">
                  Información Adicional del Alumno
                </DialogTitle>
                <DialogDescription>
                  Edita datos complementarios como foto, credencial y tutor.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-md">
                  <p>
                    <strong>Alumno:</strong>{" "}
                    {selectedItem &&
                      `${(selectedItem as any).nombre} ${(selectedItem as any).apellidoPaterno}`}
                  </p>
                  <p>
                    <strong>Matrícula:</strong>{" "}
                    {(selectedItem as any)?.matricula}
                  </p>
                </div>

                {/* Fechas de credencial */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credencialEmision">
                      Fecha emisión credencial
                    </Label>
                    <Input
                      id="credencialEmision"
                      type="date"
                      value={extraFormData.credencialFechaEmision}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          credencialFechaEmision: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="credencialExpiracion">
                      Fecha expiración credencial
                    </Label>
                    <Input
                      id="credencialExpiracion"
                      type="date"
                      value={extraFormData.credencialFechaExpiracion}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          credencialFechaExpiracion: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Información del Tutor
                  </h3>
                </div>

                {/* Nombre del tutor */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="tutorNombre">Nombre</Label>
                    <Input
                      id="tutorNombre"
                      value={extraFormData.tutorNombre}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          tutorNombre: e.target.value,
                        })
                      }
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tutorApellidoPaterno">
                      Apellido Paterno
                    </Label>
                    <Input
                      id="tutorApellidoPaterno"
                      value={extraFormData.tutorApellidoPaterno}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          tutorApellidoPaterno: e.target.value,
                        })
                      }
                      placeholder="Apellido Paterno"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tutorApellidoMaterno">
                      Apellido Materno
                    </Label>
                    <Input
                      id="tutorApellidoMaterno"
                      value={extraFormData.tutorApellidoMaterno}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          tutorApellidoMaterno: e.target.value,
                        })
                      }
                      placeholder="Apellido Materno"
                    />
                  </div>
                </div>

                {/* Contacto del tutor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tutorTelefono">Teléfono</Label>
                    <Input
                      id="tutorTelefono"
                      value={extraFormData.tutorTelefono}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          tutorTelefono: e.target.value,
                        })
                      }
                      placeholder="Teléfono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tutorEmail">Email</Label>
                    <Input
                      id="tutorEmail"
                      type="email"
                      value={extraFormData.tutorEmail}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          tutorEmail: e.target.value,
                        })
                      }
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tutorParentesco">Parentesco</Label>
                  <Input
                    id="tutorParentesco"
                    value={extraFormData.tutorParentesco}
                    onChange={(e) =>
                      setExtraFormData({
                        ...extraFormData,
                        tutorParentesco: e.target.value,
                      })
                    }
                    placeholder="Padre, Madre, Tutor, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="tutorDireccion">Dirección</Label>
                  <Input
                    id="tutorDireccion"
                    value={extraFormData.tutorDireccion}
                    onChange={(e) =>
                      setExtraFormData({
                        ...extraFormData,
                        tutorDireccion: e.target.value,
                      })
                    }
                    placeholder="Dirección completa"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenEditAlumnoExtra(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#691C32] hover:bg-[#8E2B4B]"
                  onClick={async () => {
                    if (!selectedItem) return;

                    const alumnoId = (selectedItem as any).id;

                    // Preparar datos del tutor solo si hay al menos un campo
                    const hasTutorData =
                      extraFormData.tutorNombre ||
                      extraFormData.tutorApellidoPaterno ||
                      extraFormData.tutorTelefono;

                    const tutorData = hasTutorData
                      ? {
                          nombre: extraFormData.tutorNombre,
                          apellidoPaterno: extraFormData.tutorApellidoPaterno,
                          apellidoMaterno: extraFormData.tutorApellidoMaterno,
                          telefono: extraFormData.tutorTelefono,
                          email: extraFormData.tutorEmail,
                          parentesco: extraFormData.tutorParentesco,
                          direccion: extraFormData.tutorDireccion,
                        }
                      : undefined;

                    const success = await updateAlumnoExtra(alumnoId, {
                      credencialFechaEmision:
                        extraFormData.credencialFechaEmision || undefined,
                      credencialFechaExpiracion:
                        extraFormData.credencialFechaExpiracion || undefined,
                      tutor: tutorData,
                    });

                    if (success) {
                      setOpenEditAlumnoExtra(false);
                    }
                  }}
                >
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
