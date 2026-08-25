import React, { useRef, useState, useEffect, useMemo } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
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
import CredencialCard from "./CredencialCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Alumno {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  noControl: string;
  fotoUrl?: string;
  grupo: string;
  especialidad: string;
  turno?: string;
  emision?: string;
  vigencia?: string;
}

const esperarImagenes = (container: HTMLElement): Promise<void> => {
  const imgs = Array.from(container.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();

  return Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }),
  ).then(() => undefined);
};

const esperaraSiguienteFrame = (): Promise<void> =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

export default function DescargarCredencialesMasivo() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [descargando, setDescargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [alumnoActual, setAlumnoActual] = useState<Alumno | null>(null);
  const frenteRef = useRef<HTMLDivElement>(null);
  const reversoRef = useRef<HTMLDivElement>(null);
  const [firmante, setFirmante] = useState({
    cargo: "DIRECTOR DEL PLANTEL",
    nombre: "NOMBRE NO ASIGNADO",
    firmaImagenUrl: undefined as string | undefined,
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Alumno[]>([]);
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

  const agregarCacheBust = (url?: string) => {
    if (!url) return undefined;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${Date.now()}`;
  };

  const obtenerDirector = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_URL}/administrativos/director`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data && (data.nombre || data.cargo)) {
        return {
          cargo: data.cargo || "DIRECTOR DEL PLANTEL",
          nombre: data.nombre || "NOMBRE NO ASIGNADO",
          firmaImagenUrl: agregarCacheBust(data.firmaImagenUrl || undefined),
        };
      }
    } catch {
    }

    return {
      cargo: "DIRECTOR DEL PLANTEL",
      nombre: "NOMBRE NO ASIGNADO",
      firmaImagenUrl: undefined,
    };
  };

  useEffect(() => {
    const cargarDirectorInicial = async () => {
      setFirmante(await obtenerDirector());
    };

    cargarDirectorInicial();
  }, []);

  const capturarCara = async (
    ref: React.RefObject<HTMLDivElement | null>,
  ): Promise<string> => {
    if (!ref.current) throw new Error("Ref no disponible para captura.");
    await esperarImagenes(ref.current);
    return htmlToImage.toPng(ref.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2.5,
    });
  };

  const capturarAlumno = async (
    alumno: Alumno,
  ): Promise<{ frente: string; reverso: string }> => {
    setAlumnoActual(alumno);
    await esperaraSiguienteFrame();
    const frente = await capturarCara(frenteRef);
    const reverso = await capturarCara(reversoRef);
    return { frente, reverso };
  };

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
      if (!Array.isArray(data)) {
        data = [];
      }
      setAlumnosDisponibles(data);
      setSeleccionados(new Set(data.map((a: Alumno) => a.noControl)));
    } finally {
      setCargandoAlumnos(false);
    }
  };

  const alternarSeleccion = (noControl: string) => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(noControl)) {
        siguiente.delete(noControl);
      } else {
        siguiente.add(noControl);
      }
      return siguiente;
    });
  };

  const alternarSeleccionarTodos = () => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev);
      if (todosSeleccionados) {
        alumnosFiltrados.forEach((a) => siguiente.delete(a.noControl));
      } else {
        alumnosFiltrados.forEach((a) => siguiente.add(a.noControl));
      }
      return siguiente;
    });
  };

  const handleDescargarSeleccionados = async () => {
    const data = alumnosDisponibles.filter((a) =>
      seleccionados.has(a.noControl),
    );
    if (data.length === 0) return;

    setModalAbierto(false);
    setDescargando(true);
    setProgreso(0);
    const directorActualizado = await obtenerDirector();
    setFirmante(directorActualizado);
    setAlumnos(data);

    // Capturar ambas caras de cada alumno
    const frentesImg: string[] = [];
    const reversosImg: string[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const { frente, reverso } = await capturarAlumno(data[i]);
        frentesImg.push(frente);
        reversosImg.push(reverso);
      } catch (error) {
        console.error(`Error al capturar credencial de ${data[i].noControl}:`, error);
        frentesImg.push("");
        reversosImg.push("");
      }
      setProgreso(i + 1);
      if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const cardW = 85.6;
    const cardH = 54;
    const cols = 2;
    const rows = 4;
    const cardsPerPage = cols * rows;
    const marginX = (pageW - cols * cardW) / (cols + 1);
    const marginY = (pageH - rows * cardH) / (rows + 1);

    const posX = (pos: number) => marginX + (pos % cols) * (cardW + marginX);
    const posY = (pos: number) => marginY + Math.floor(pos / cols) * (cardH + marginY);
    const backPosX = (pos: number) =>
      marginX + (cols - 1 - (pos % cols)) * (cardW + marginX);

    let primeraPagina = true;

    for (let inicio = 0; inicio < frentesImg.length; inicio += cardsPerPage) {
      const lotFrente = frentesImg.slice(inicio, inicio + cardsPerPage);
      const lotReverso = reversosImg.slice(inicio, inicio + cardsPerPage);

      if (!primeraPagina) pdf.addPage("letter", "portrait");
      primeraPagina = false;

      lotFrente.forEach((img, i) => {
        if (img) pdf.addImage(img, "PNG", posX(i), posY(i), cardW, cardH);
      });

      pdf.addPage("letter", "portrait");
      lotReverso.forEach((img, i) => {
        if (img) pdf.addImage(img, "PNG", backPosX(i), posY(i), cardW, cardH);
      });
    }

    pdf.save("Credenciales.pdf");
    setDescargando(false);
    setAlumnoActual(null);
  };

  return (
    <div>
      <Button onClick={abrirModalSeleccion} disabled={descargando}>
        {descargando
          ? `Procesando... (${progreso})`
          : "Descargar credenciales"}
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
            <p className="text-sm text-muted-foreground">
              Cargando alumnos...
            </p>
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
                  onCheckedChange={alternarSeleccionarTodos}
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
                        onCheckedChange={() =>
                          alternarSeleccion(a.noControl)
                        }
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
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDescargarSeleccionados}
              disabled={seleccionados.size === 0 || cargandoAlumnos}
            >
              Descargar ({seleccionados.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renders ocultos para captura de cada cara por separado */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {alumnoActual && (
          <>
            <div ref={frenteRef}>
              <CredencialCard
                estudiante={alumnoActual}
                firmante={firmante}
                lado="frente"
              />
            </div>
            <div ref={reversoRef}>
              <CredencialCard
                estudiante={alumnoActual}
                firmante={firmante}
                lado="reverso"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
