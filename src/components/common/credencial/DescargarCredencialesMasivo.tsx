import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
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
  const capturaRef = useRef<HTMLDivElement>(null);
  const [firmante, setFirmante] = useState({
    cargo: "DIRECTOR DEL PLANTEL",
    nombre: "NOMBRE NO ASIGNADO",
    firmaImagenUrl: undefined as string | undefined,
  });

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
      // Usar valores por defecto cuando no se pueda obtener el firmante.
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

  const capturarAlumno = async (alumno: Alumno): Promise<string> => {
    setAlumnoActual(alumno);
    await esperaraSiguienteFrame();

    if (!capturaRef.current) {
      throw new Error("No se pudo preparar la credencial para captura.");
    }

    await esperarImagenes(capturaRef.current);

    return htmlToImage.toPng(capturaRef.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2.5,
    });
  };

  const handleDescargarTodas = async () => {
    setDescargando(true);
    setProgreso(0);
    const directorActualizado = await obtenerDirector();
    setFirmante(directorActualizado);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/estudiantes/credenciales`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let data = await res.json();
    if (!Array.isArray(data)) {
      data = [];
    }
    setAlumnos(data);

    if (data.length === 0) {
      setDescargando(false);
      return;
    }
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter",
    });

    const cardWidth = 171.2;
    const cardHeight = 54;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const cardsPerPage = 3;
    const verticalGap = 6;
    const totalHeight =
      cardsPerPage * cardHeight + (cardsPerPage - 1) * verticalGap;
    const startX = (pageWidth - cardWidth) / 2;
    const startY = (pageHeight - totalHeight) / 2;

    for (let i = 0; i < data.length; i++) {
      try {
        const imgData = await capturarAlumno(data[i]);

        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage("letter", "landscape");
        }

        const positionInPage = i % cardsPerPage;
        const y = startY + positionInPage * (cardHeight + verticalGap);

        pdf.addImage(imgData, "PNG", startX, y, cardWidth, cardHeight);
      } catch (error) {
        console.error(
          `Error al generar credencial de ${data[i].noControl}:`,
          error,
        );
      }
      setProgreso(i + 1);

      if (i % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    pdf.save("Credenciales.pdf");
    setDescargando(false);
    setAlumnoActual(null);
  };

  return (
    <div>
      <Button onClick={handleDescargarTodas} disabled={descargando}>
        {descargando
          ? `Procesando... (${progreso})`
          : "Descargar todas las credenciales"}
      </Button>
      {/* Renderiza cada credencial oculta para capturarla */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {alumnoActual && (
          <div ref={capturaRef}>
            <CredencialCard estudiante={alumnoActual} firmante={firmante} />
          </div>
        )}
      </div>
    </div>
  );
}
