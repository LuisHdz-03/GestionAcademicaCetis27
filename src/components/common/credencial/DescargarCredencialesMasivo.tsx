import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useCredencialDownload,
  type AlumnoCredencial,
} from "@/contexts/CredencialDownloadContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function DescargarCredencialesMasivo() {
  const { iniciarDescarga, descargando } = useCredencialDownload();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<
    AlumnoCredencial[]
  >([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");

  const alumnosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return alumnosDisponibles;
    return alumnosDisponibles.filter((a) =>
      `${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno} ${a.noControl}`
        .toLowerCase()
        .includes(termino),
    );
  }, [alumnosDisponibles, busqueda]);

  const todosSeleccionados =
    alumnosFiltrados.length > 0 &&
    alumnosFiltrados.every((a) => seleccionados.has(a.noControl));

  const abrirModalSeleccion = async () => {
    setModalAbierto(true);
    setCargandoAlumnos(true);
    setBusqueda("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/estudiantes/credenciales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      setAlumnosDisponibles(data);
      setSeleccionados(new Set(data.map((a: AlumnoCredencial) => a.noControl)));
    } finally {
      setCargandoAlumnos(false);
    }
  };

  const alternarSeleccion = (noControl: string) => {
    setSeleccionados((prev) => {
      const sig = new Set(prev);
      if (sig.has(noControl)) sig.delete(noControl);
      else sig.add(noControl);
      return sig;
    });
  };

  const alternarTodos = () => {
    setSeleccionados((prev) => {
      const sig = new Set(prev);
      if (todosSeleccionados)
        alumnosFiltrados.forEach((a) => sig.delete(a.noControl));
      else alumnosFiltrados.forEach((a) => sig.add(a.noControl));
      return sig;
    });
  };

  const handleDescargar = () => {
    const seleccion = alumnosDisponibles.filter((a) =>
      seleccionados.has(a.noControl),
    );
    if (seleccion.length === 0) return;
    setModalAbierto(false);
    iniciarDescarga(seleccion);
  };

  return (
    <div>
      <Button onClick={abrirModalSeleccion} disabled={descargando}>
        {descargando ? "Procesando…" : "Descargar credenciales"}
      </Button>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar alumnos</DialogTitle>
            <DialogDescription>
              Elige los alumnos cuyas credenciales quieres descargar.
            </DialogDescription>
          </DialogHeader>

          {cargandoAlumnos ? (
            <p className="text-sm text-muted-foreground">Cargando alumnos…</p>
          ) : (
            <>
              <Input
                placeholder="Buscar por nombre o No. de control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <label className="flex items-center gap-2 border-b pb-2 text-sm font-medium">
                <Checkbox
                  checked={todosSeleccionados}
                  onCheckedChange={alternarTodos}
                />
                Seleccionar todos ({alumnosFiltrados.length})
              </label>

              <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
                {alumnosFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No se encontraron alumnos.
                  </p>
                ) : (
                  alumnosFiltrados.map((a) => (
                    <label
                      key={a.noControl}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      <Checkbox
                        checked={seleccionados.has(a.noControl)}
                        onCheckedChange={() => alternarSeleccion(a.noControl)}
                      />
                      {a.nombre} {a.apellidoPaterno} {a.apellidoMaterno} (
                      {a.noControl})
                    </label>
                  ))
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDescargar}
              disabled={seleccionados.size === 0 || cargandoAlumnos}
            >
              Descargar ({seleccionados.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
