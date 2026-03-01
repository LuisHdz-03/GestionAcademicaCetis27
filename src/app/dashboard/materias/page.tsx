"use client";
import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import EspecialidadesList from "./components/EspecialidadesList";
import MateriasTabs from "./components/MateriasTabs";
import { useCommunity } from "@/hooks/useCommunity";
import { useAcademico } from "@/hooks/useAcademico";

// Se eliminan datos mock y se conectan a la API

export default function GestionEspecialidadesPage() {
  const {
    especialidades,
    fetchEspecialidades,
    periodos,
    fetchPeriodos,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad,
    docentes,
    fetchDocentes,
  } = useCommunity();
  const {
    materias,
    grupos,
    fetchMaterias,
    fetchGrupos,
    createMateria,
    createGrupo,
    updateMateria,
    deleteMateria,
    updateGrupo,
    deleteGrupo,
  } = useAcademico();

  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>("");

  useEffect(() => {
    fetchEspecialidades();
    fetchDocentes();
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (especialidades.length > 0 && !selectedEspecialidad) {
      // seleccionar la primera por defecto
      setSelectedEspecialidad(especialidades[0].codigo);
    }
  }, [especialidades]);

  useEffect(() => {
    if (selectedEspecialidad) {
      const active = especialidades.find(
        (e) => e.codigo === selectedEspecialidad,
      );
      const activeId = active ? active.id : undefined;
      fetchMaterias(activeId);
      fetchGrupos(activeId as any);
    }
  }, [selectedEspecialidad]);

  const activeEspecialidad = useMemo(
    () => especialidades.find((e) => e.codigo === selectedEspecialidad),
    [especialidades, selectedEspecialidad],
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <TopBar
        onAddEspecialidad={async (data) => {
          const ok = await createEspecialidad(data);
          if (!selectedEspecialidad) {
            // si no hay seleccion previa, selecciona la primera tras refrescar
            setTimeout(() => {
              if (especialidades.length > 0)
                setSelectedEspecialidad(especialidades[0].codigo);
            }, 0);
          }
          return ok;
        }}
      />

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        <EspecialidadesList
          especialidades={especialidades.map((e) => ({
            nombre: e.nombre,
            codigo: e.codigo,
          }))}
          selectedEspecialidad={selectedEspecialidad}
          setSelectedEspecialidad={setSelectedEspecialidad}
        />

        <div className="flex-1 min-w-0">
          <MateriasTabs
            materiasData={materias as any}
            gruposData={grupos as any}
            especialidadNombre={activeEspecialidad?.nombre}
            activeEspecialidadId={activeEspecialidad?.id}
            materiasOptions={(materias as any)?.map((m: any) => ({
              id: m.id,
              nombre: m.nombre,
              codigo: m.codigo,
            }))}
            especialidades={especialidades as any}
            docentes={docentes as any}
            periodos={periodos}
            onUpdateEspecialidad={async (id, data) => {
              const wasActive = activeEspecialidad?.id === id;
              const ok = await updateEspecialidad(id, data);
              if (ok) {
                await fetchEspecialidades();
                // Si se desactivó la especialidad activa, limpiar selección
                // El useEffect se encargará de seleccionar la primera disponible
                if (data.activo === false && wasActive) {
                  setSelectedEspecialidad("");
                }
              }
              return ok;
            }}
            onDeleteEspecialidad={async (id) => {
              const wasActive = activeEspecialidad?.id === id;
              const ok = await deleteEspecialidad(id);
              if (ok) {
                await fetchEspecialidades();
                // Si se eliminó la especialidad activa, limpiar selección
                // El useEffect se encargará de seleccionar la primera disponible
                if (wasActive) {
                  setSelectedEspecialidad("");
                }
              }
              return ok;
            }}
            onCreateMateria={async (data) => {
              const ok = await createMateria({
                nombre: data.nombre,
                codigo: data.codigo,
                horas: (data as any).horas ?? 0,
                semestre: data.semestre,
                idEspecialidad: activeEspecialidad
                  ? (activeEspecialidad as any).id
                  : undefined,
                activo: true,
              });
              if (ok) await fetchMaterias(selectedEspecialidad);
              return ok;
            }}
            onCreateGrupo={async (data) => {
              const ok = await createGrupo({
                codigo: (data as any).codigo,
                semestre: data.semestre,
                aula: (data as any).aula,
                idEspecialidad:
                  (data as any).idEspecialidad ||
                  (activeEspecialidad
                    ? (activeEspecialidad as any).id
                    : undefined),
                idPeriodo: (data as any).idPeriodo,
                idDocente: (data as any).idDocente,
                idMateria: (data as any).idMateria,
                activo: true,
              });
              if (ok) await fetchGrupos(selectedEspecialidad);
              return ok;
            }}
            onUpdateMateria={async (id, data) => {
              const ok = await updateMateria(id, data);
              if (ok) await fetchMaterias(selectedEspecialidad);
              return ok;
            }}
            onDeleteMateria={async (id) => {
              const ok = await deleteMateria(id);
              if (ok) await fetchMaterias(selectedEspecialidad);
              return ok;
            }}
            onUpdateGrupo={async (id, data) => {
              const ok = await updateGrupo(id, data);
              if (ok) await fetchGrupos(selectedEspecialidad);
              return ok;
            }}
            onDeleteGrupo={async (id) => {
              const ok = await deleteGrupo(id);
              if (ok) await fetchGrupos(selectedEspecialidad);
              return ok;
            }}
          />
        </div>
      </div>
    </div>
  );
}
