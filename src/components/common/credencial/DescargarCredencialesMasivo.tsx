import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";
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

  // Obtener firmante solo una vez
  useEffect(() => {
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
          setFirmante({
            cargo: data.cargo || "DIRECTOR DEL PLANTEL",
            nombre: data.nombre || "NOMBRE NO ASIGNADO",
            firmaImagenUrl: data.firmaImagenUrl || undefined,
          });
        }
      } catch {
        setFirmante({
          cargo: "DIRECTOR DEL PLANTEL",
          nombre: "NOMBRE NO ASIGNADO",
          firmaImagenUrl: undefined,
        });
      }
    };
    obtenerDirector();
  }, []);

  // Paso 1: Al hacer clic, cargar alumnos y marcar pendiente descarga
  const handleDescargarTodas = async () => {
    setDescargando(true);
    setProgreso(0);
    setPendienteDescarga(false);
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

  // Paso 2: Cuando alumnos y pendienteDescarga cambian, generar ZIP
  useEffect(() => {
    const generarZip = async () => {
      if (!pendienteDescarga || !alumnos.length) return;
      // Esperar a que React renderice las credenciales ocultas
      await new Promise((resolve) => setTimeout(resolve, 400));
      const zip = new JSZip();
      for (let i = 0; i < alumnos.length; i++) {
        const alumno = alumnos[i];
        const ref = credencialRefs.current[i];
        if (!ref) continue;
        await new Promise((resolve) => setTimeout(resolve, 150));
        const imgData = await htmlToImage.toPng(ref, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 5,
        });
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "letter",
        });
        const ancho = 85.6;
        const alto = 54;
        const x = (pdf.internal.pageSize.getWidth() - ancho * 2) / 2;
        const y = 20;
        pdf.addImage(imgData, "PNG", x, y, ancho * 2, alto);
        const pdfBlob = pdf.output("blob");
        zip.file(`Credencial_${alumno.noControl}.pdf`, pdfBlob);
        setProgreso(i + 1);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Credenciales.zip";
      a.click();
      setDescargando(false);
      setPendienteDescarga(false);
    };
    generarZip();
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
