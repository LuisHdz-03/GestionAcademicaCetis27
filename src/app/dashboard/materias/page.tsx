"use client";
import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import EspecialidadesList from "./components/EspecialidadesList";
import MateriasTabs from "./components/MateriasTabs";
import { useCommunity } from "@/hooks/useCommunity";
import { useAcademico } from "@/hooks/useAcademico";

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
              id: m.idMateria || m.id,
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
              if (ok) await fetchMaterias(activeEspecialidad?.id);
              return ok;
            }}
            onCreateGrupo={async (data) => {
              // 👇 Traducimos del Modal -> a TypeScript
              const ok = await createGrupo({
                codigo: (data as any).nombre,
                semestre: (data as any).grado,
                turno: (data as any).turno,
                aula: (data as any).aula,
                idEspecialidad:
                  (data as any).especialidadId ||
                  (activeEspecialidad
                    ? (activeEspecialidad as any).id
                    : undefined),
                idPeriodo: (data as any).periodoId,
                idDocente: (data as any).docenteId,
                docenteTutorId: (data as any).docenteTutorId,
                idMaterias: (data as any).materiasIds,
                activo: true,
              });
              if (ok) await fetchGrupos(activeEspecialidad?.id as any);
              return ok;
            }}
            onUpdateMateria={async (id, data) => {
              const ok = await updateMateria(id, data);
              if (ok) await fetchMaterias(activeEspecialidad?.id);
              return ok;
            }}
            onDeleteMateria={async (id) => {
              const ok = await deleteMateria(id);
              if (ok) await fetchMaterias(activeEspecialidad?.id);
              return ok;
            }}
            onUpdateGrupo={async (id, data) => {
              // 👇 Traducimos del Modal -> a TypeScript
              const ok = await updateGrupo(id, {
                codigo: (data as any).nombre,
                semestre: (data as any).grado,
                turno: (data as any).turno,
                aula: (data as any).aula,
                idEspecialidad: (data as any).especialidadId,
                idPeriodo: (data as any).periodoId,
                idDocente: (data as any).docenteId,
                docenteTutorId: (data as any).docenteTutorId,
                idMaterias: (data as any).materiasIds,
              });
              if (ok) await fetchGrupos(activeEspecialidad?.id as any);
              return ok;
            }}
            onDeleteGrupo={async (id) => {
              const ok = await deleteGrupo(id);
              if (ok) await fetchGrupos(activeEspecialidad?.id as any);
              return ok;
            }}
          />
        </div>
      </div>
    </div>
  );
}
