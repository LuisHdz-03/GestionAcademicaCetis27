"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TabsSelector from "./components/TabsSelector";
import TopBar from "./components/TopBar";
import DataTable from "./components/DataTable";
import Pagination from "./components/Pagination";
import AddDocenteModal from "@/components/common/Modal/AddDocenteModal";
import AddAlumnoModal from "@/components/common/Modal/AddAlumnoModal";
import AddAdminModal from "@/components/common/Modal/AddAdminModal";
import AddGrupoModal from "@/components/common/Modal/AddGrupoModal";
import EditDocenteModal from "@/components/common/Modal/EditDocenteModal";
import EditAlumnoModal from "@/components/common/Modal/EditAlumnoModal";
import EditAdminModal from "@/components/common/Modal/EditAdminModal";
import EditGrupoModal from "@/components/common/Modal/EditGrupoModal";
import {
  CommunityMember,
  Docente,
  Alumno,
  Admin as Administrador,
  Grupo,
} from "@/types/community";
import {
  DocenteFormData,
  AlumnoFormData,
  AdminFormData,
  GrupoFormData,
} from "@/types/modal";
import { useCommunity } from "@/hooks/useCommunity";

type TabType = "docentes" | "alumnos" | "administradores" | "grupos";

export default function CommunityManagementPage() {
  // --- Hook de datos ---
  const {
    docentes,
    alumnos,
    administradores,
    grupos,
    especialidades,
    loading,
    fetchDocentes,
    fetchAlumnos,
    fetchAdministradores,
    fetchGrupos,
    fetchEspecialidades,
    createDocente,
    deleteDocente,
    updateDocente,
    createAlumno,
    deleteAlumno,
    updateAlumno,
    createAdministrador,
    deleteAdministrador,
    updateAdministrador,
    createGrupo,
    deleteGrupo,
    updateGrupo,
  } = useCommunity();

  // --- UI States ---
  const [activeTab, setActiveTab] = useState<TabType>("docentes");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- Modal States ---
  const [openDocenteModal, setOpenDocenteModal] = useState(false);
  const [openAlumnoModal, setOpenAlumnoModal] = useState(false);
  const [openAdminModal, setOpenAdminModal] = useState(false);
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [openEditDocente, setOpenEditDocente] = useState(false);
  const [openEditAlumno, setOpenEditAlumno] = useState(false);
  const [openEditAdmin, setOpenEditAdmin] = useState(false);
  const [openEditGrupo, setOpenEditGrupo] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommunityMember | null>(
    null,
  );

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
    fetchGrupos();
    fetchEspecialidades();
  }, []);

  // Estados para datos adicionales necesarios para grupos
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";
  // Cargar periodos y materias
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_URL, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await res.json();
        if (data.success) setPeriodos(data.data || []);
      } catch (error) {
        console.error("Error al cargar periodos:", error);
      }
    };

    const fetchMaterias = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_URL, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const data = await res.json();
        if (data.success) setMaterias(data.data || []);
      } catch (error) {
        console.error("Error al cargar materias:", error);
      }
    };

    fetchPeriodos();
    fetchMaterias();
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
  const gruposFilters = [
    "Todas las especialidades",
    ...Array.from(new Set((especialidades || []).map((e) => e.nombre))).filter(
      Boolean,
    ),
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case "docentes":
        return docentes;
      case "alumnos":
        return alumnos;
      case "administradores":
        return administradores;
      case "grupos":
        return grupos;
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
      case "grupos":
        return gruposFilters;
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
      case "grupos":
        return [
          "Código",
          "Semestre",
          "Aula",
          "Especialidad",
          "Docente",
          "Materia",
          "Integrantes",
        ];
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
    const matchesSearch =
      ("nombre" in item &&
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ("email" in item &&
        item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ("codigo" in item &&
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ("matricula" in item &&
        item.matricula.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ("numeroEmpleado" in item &&
        item.numeroEmpleado.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      !selectedFilter ||
      selectedFilter.startsWith("Todas") ||
      selectedFilter.startsWith("Todos") ||
      ("especialidad" in item && item.especialidad === selectedFilter) ||
      ("especialidadNombre" in item &&
        item.especialidadNombre === selectedFilter) ||
      ("cargo" in item && item.cargo === selectedFilter);

    return matchesSearch && matchesFilter;
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
    if (activeTab === "grupos") setOpenEditGrupo(true);
  };
  const handleDelete = async (item: CommunityMember) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    let ok = false;
    if (activeTab === "docentes") ok = await deleteDocente((item as any).id);
    if (activeTab === "alumnos") ok = await deleteAlumno((item as any).id);
    if (activeTab === "administradores")
      ok = await deleteAdministrador((item as any).id);
    if (activeTab === "grupos") ok = await deleteGrupo((item as any).id);
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

  const handleCreateGrupo = async (data: GrupoFormData) => {
    const success = await createGrupo(data);
    if (success) {
      setOpenGrupoModal(false);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (
    loading &&
    docentes.length === 0 &&
    alumnos.length === 0 &&
    administradores.length === 0 &&
    grupos.length === 0
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
            itemsPerPage={itemsPerPage}
            setItemsPerPage={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
            filters={getCurrentFilters()!}
            especialidades={especialidades}
            grupos={grupos}
            onAddClick={() => {
              if (activeTab === "docentes") setOpenDocenteModal(true);
              if (activeTab === "alumnos") setOpenAlumnoModal(true);
              if (activeTab === "administradores") setOpenAdminModal(true);
              if (activeTab === "grupos") setOpenGrupoModal(true);
            }}
          />

          {/* DataTable */}
          <DataTable
            activeTab={activeTab}
            data={currentData}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
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
      <AddGrupoModal
        open={openGrupoModal}
        onOpenChange={setOpenGrupoModal}
        onSubmit={handleCreateGrupo}
        especialidades={especialidades}
        periodos={periodos}
        docentes={docentes}
        materias={materias}
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
          <EditGrupoModal
            open={openEditGrupo}
            onOpenChange={setOpenEditGrupo}
            grupo={selectedItem as Grupo}
            especialidades={especialidades}
            periodos={periodos}
            docentes={docentes}
            materias={materias}
            onSubmit={async (data) => {
              const id = (selectedItem as any).id;
              const ok = await updateGrupo(id, data);
              if (ok) setOpenEditGrupo(false);
            }}
          />
        </>
      )}
    </div>
  );
}
