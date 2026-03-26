"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { HiChevronUpDown, HiCheck, HiMagnifyingGlass } from "react-icons/hi2";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

function Combobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  error,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(
    () =>
      options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel || "").toLowerCase().includes(query.toLowerCase()),
      ),
    [options, query],
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((p) => !p);
          setQuery("");
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-colors",
          error ? "border-red-400 ring-1 ring-red-400" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled &&
            "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#691C32]/40",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <HiChevronUpDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {/* Búsqueda */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <HiMagnifyingGlass className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
              placeholder={searchPlaceholder || "Buscar..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {/* Lista */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 text-center">
                Sin resultados
              </li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-[#691C32]/8 hover:text-[#691C32]",
                    o.value === value &&
                      "bg-[#691C32]/10 text-[#691C32] font-semibold",
                  )}
                >
                  <div>
                    <p className="leading-tight">{o.label}</p>
                    {o.sublabel && (
                      <p className="text-xs text-gray-400">{o.sublabel}</p>
                    )}
                  </div>
                  {o.value === value && (
                    <HiCheck className="h-4 w-4 flex-shrink-0" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Formulario principal ─────────────────────────────────────────────────────
interface AsignarClaseFormProps {
  grupos: any[];
  materias: any[];
  docentes: any[];
  onSubmit: (data: any) => void;
  mode?: "create" | "edit";
  initialData?: {
    grupoId?: number;
    materiaId?: number;
    docenteId?: number;
    horario?: string;
  };
}

export default function AsignarClaseForm({
  grupos,
  materias,
  docentes,
  onSubmit,
  mode = "create",
  initialData,
}: AsignarClaseFormProps) {
  const [formData, setFormData] = useState({
    grupoId: initialData?.grupoId ? String(initialData.grupoId) : "",
    materiaId: initialData?.materiaId ? String(initialData.materiaId) : "",
    docenteId: initialData?.docenteId ? String(initialData.docenteId) : "",
    horario: initialData?.horario || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Grupo seleccionado para filtrar materias
  const grupoSeleccionado = useMemo(
    () => grupos.find((g) => String(g.idGrupo || g.id) === formData.grupoId),
    [grupos, formData.grupoId],
  );

  // Materias filtradas por especialidad del grupo seleccionado
  const materiasFiltradas = useMemo(() => {
    if (!grupoSeleccionado?.idEspecialidad) return materias;
    return materias.filter(
      (m) =>
        m.especialidadId === grupoSeleccionado.idEspecialidad ||
        m.idEspecialidad === grupoSeleccionado.idEspecialidad ||
        !m.especialidadId, // incluir materias sin especialidad (tronco común)
    );
  }, [materias, grupoSeleccionado]);

  // Si cambia el grupo y la materia ya no aplica, limpiarla
  useEffect(() => {
    if (
      formData.materiaId &&
      !materiasFiltradas.find(
        (m) => String(m.idMateria || m.id) === formData.materiaId,
      )
    ) {
      setFormData((prev) => ({ ...prev, materiaId: "" }));
    }
  }, [materiasFiltradas]);

  // Opciones para comboboxes
  const grupoOpts: Option[] = grupos.map((g) => ({
    value: String(g.idGrupo || g.id),
    label: `${g.codigo} — ${g.turno || ""}`,
    sublabel: g.especialidadNombre || "Tronco común",
  }));

  const materiaOpts: Option[] = materiasFiltradas.map((m) => ({
    value: String(m.idMateria || m.id),
    label: m.nombre,
    sublabel: m.codigo,
  }));

  const docenteOpts: Option[] = docentes.map((d) => ({
    value: String(d.id),
    label: `${d.nombre || ""} ${d.apellidoPaterno || ""}`.trim(),
    sublabel: d.especialidad || d.cargo || "",
  }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.grupoId) e.grupoId = "Selecciona un grupo";
    if (!formData.materiaId) e.materiaId = "Selecciona una materia";
    if (!formData.docenteId) e.docenteId = "Selecciona un docente";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        grupoId: Number(formData.grupoId),
        materiaId: Number(formData.materiaId),
        docenteId: Number(formData.docenteId),
        horario: formData.horario.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string) => (val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Resumen de la selección actual
  const resumen = useMemo(() => {
    const grupo = grupos.find(
      (g) => String(g.idGrupo || g.id) === formData.grupoId,
    );
    const materia = materias.find(
      (m) => String(m.idMateria || m.id) === formData.materiaId,
    );
    const docente = docentes.find((d) => String(d.id) === formData.docenteId);
    return { grupo, materia, docente };
  }, [formData, grupos, materias, docentes]);

  const hayResumen = resumen.grupo || resumen.materia || resumen.docente;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Grupo */}
      <div className="space-y-1.5">
        <Label className="text-gray-700 font-medium">
          Grupo <span className="text-red-500">*</span>
        </Label>
        <Combobox
          options={grupoOpts}
          value={formData.grupoId}
          onChange={set("grupoId")}
          placeholder="Selecciona un grupo"
          searchPlaceholder="Buscar grupo..."
          error={errors.grupoId}
        />
      </div>

      {/* Materia */}
      <div className="space-y-1.5">
        <Label className="text-gray-700 font-medium">
          Materia <span className="text-red-500">*</span>
        </Label>
        {grupoSeleccionado && materiasFiltradas.length < materias.length && (
          <p className="text-xs text-[#691C32] font-medium -mb-0.5">
            Mostrando {materiasFiltradas.length} materia(s) de la especialidad
            del grupo
          </p>
        )}
        <Combobox
          options={materiaOpts}
          value={formData.materiaId}
          onChange={set("materiaId")}
          placeholder={
            formData.grupoId
              ? "Selecciona una materia"
              : "Primero selecciona un grupo"
          }
          searchPlaceholder="Buscar materia..."
          error={errors.materiaId}
        />
      </div>

      {/* Docente */}
      <div className="space-y-1.5">
        <Label className="text-gray-700 font-medium">
          Docente titular <span className="text-red-500">*</span>
        </Label>
        <Combobox
          options={docenteOpts}
          value={formData.docenteId}
          onChange={set("docenteId")}
          placeholder="Selecciona un docente"
          searchPlaceholder="Buscar por nombre..."
          error={errors.docenteId}
        />
      </div>

      {/* Horario */}
      <div className="space-y-1.5">
        <Label className="text-gray-700 font-medium">
          Horario{" "}
          <span className="text-gray-400 font-normal text-xs">(opcional)</span>
        </Label>
        <Input
          placeholder="Ej. Lun y Mié 7:00–9:00"
          value={formData.horario}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, horario: e.target.value }))
          }
        />
      </div>

      {/* Resumen de selección */}
      {hayResumen && (
        <div className="rounded-lg border border-[#691C32]/20 bg-[#691C32]/5 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-[#691C32] uppercase tracking-wide mb-1">
            Resumen
          </p>
          {resumen.grupo && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Grupo:</span> {resumen.grupo.codigo}{" "}
              — {resumen.grupo.turno}{" "}
              <span className="text-gray-400">
                ({resumen.grupo.especialidadNombre || "Tronco común"})
              </span>
            </p>
          )}
          {resumen.materia && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Materia:</span>{" "}
              {resumen.materia.nombre}
            </p>
          )}
          {resumen.docente && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Docente:</span>{" "}
              {resumen.docente.nombre} {resumen.docente.apellidoPaterno}
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#691C32] hover:bg-[#4a1424] text-white mt-1"
      >
        {submitting
          ? "Guardando..."
          : mode === "edit"
            ? "Guardar Cambios"
            : "Vincular Docente a Grupo"}
      </Button>
    </form>
  );
}
