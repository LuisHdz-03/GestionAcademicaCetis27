import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import CredencialCard from "./CredencialCard";

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

export default function DescargarCredencialesMasivo() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [descargando, setDescargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [pendienteDescarga, setPendienteDescarga] = useState(false);
  const credencialRefs = useRef<(HTMLDivElement | null)[]>([]);
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
      const res = await fetch(
        "http://localhost:4000/api/web/administrativos/director",
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
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

  const handleDescargarTodas = async () => {
    setDescargando(true);
    setProgreso(0);
    setPendienteDescarga(false);

    const directorActualizado = await obtenerDirector();
    setFirmante(directorActualizado);

    const token = localStorage.getItem("token");
    const res = await fetch(
      "http://localhost:4000/api/web/estudiantes/credenciales",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    let data = await res.json();
    if (!Array.isArray(data)) {
      data = [];
    }
    setAlumnos(data);
    setPendienteDescarga(true);
  };

  // Paso 2: Cuando alumnos y pendienteDescarga cambian, generar PDF múltiple
  useEffect(() => {
    const generarPdf = async () => {
      if (!pendienteDescarga || !alumnos.length) return;

      await new Promise((resolve) => setTimeout(resolve, 400));

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

      for (let i = 0; i < alumnos.length; i++) {
        const ref = credencialRefs.current[i];
        if (!ref) continue;

        await new Promise((resolve) => setTimeout(resolve, 150));

        const imgData = await htmlToImage.toPng(ref, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 5,
        });

        if (i > 0 && i % cardsPerPage === 0) {
          pdf.addPage("letter", "landscape");
        }

        const positionInPage = i % cardsPerPage;
        const y = startY + positionInPage * (cardHeight + verticalGap);

        pdf.addImage(imgData, "PNG", startX, y, cardWidth, cardHeight);
        setProgreso(i + 1);
      }

      pdf.save("Credenciales.pdf");
      setDescargando(false);
      setPendienteDescarga(false);
    };

    generarPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnos, pendienteDescarga]);

  return (
    <div>
      <Button onClick={handleDescargarTodas} disabled={descargando}>
        {descargando
          ? `Procesando... (${progreso})`
          : "Descargar todas las credenciales"}
      </Button>
      {/* Renderiza cada credencial oculta para capturarla */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {alumnos.map((alumno, idx) => (
          <div
            key={alumno.noControl}
            ref={(el) => {
              credencialRefs.current[idx] = el;
            }}
          >
            <CredencialCard estudiante={alumno} firmante={firmante} />
          </div>
        ))}
      </div>
    </div>
  );
}
