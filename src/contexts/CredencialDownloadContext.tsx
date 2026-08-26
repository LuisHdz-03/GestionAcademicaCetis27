"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import CredencialCard from "@/components/common/credencial/CredencialCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface AlumnoCredencial {
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

interface Firmante {
  cargo: string;
  nombre: string;
  firmaImagenUrl?: string;
}

type Fase = "capturando" | "generando" | null;

interface DownloadState {
  descargando: boolean;
  fase: Fase;
  progreso: number;
  total: number;
}

interface CredencialDownloadContextValue extends DownloadState {
  iniciarDescarga: (alumnos: AlumnoCredencial[], filename?: string) => void;
}

const CredencialDownloadContext =
  createContext<CredencialDownloadContextValue | null>(null);

export function useCredencialDownload() {
  const ctx = useContext(CredencialDownloadContext);
  if (!ctx)
    throw new Error(
      "useCredencialDownload debe usarse dentro de CredencialDownloadProvider",
    );
  return ctx;
}

const esperarImagenes = (container: HTMLElement): Promise<void> => {
  const imgs = Array.from(container.querySelectorAll("img"));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  ).then(() => undefined);
};

const esperarFrame = (): Promise<void> =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

// Cede el hilo principal entre operaciones pesadas
const cederHilo = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

const obtenerDirector = async (): Promise<Firmante> => {
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
      const cacheBust = (url?: string) => {
        if (!url) return undefined;
        return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      };
      return {
        cargo: data.cargo || "DIRECTOR DEL PLANTEL",
        nombre: data.nombre || "NOMBRE NO ASIGNADO",
        firmaImagenUrl: cacheBust(data.firmaImagenUrl || undefined),
      };
    }
  } catch {
    // usar defaults
  }
  return {
    cargo: "DIRECTOR DEL PLANTEL",
    nombre: "NOMBRE NO ASIGNADO",
    firmaImagenUrl: undefined,
  };
};

// Constantes de layout PDF
const PDF_LAYOUT = {
  cardW: 85.6,
  cardH: 54,
  cols: 2,
  rows: 4,
} as const;

export function CredencialDownloadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const frenteRef = useRef<HTMLDivElement>(null);
  const reversoRef = useRef<HTMLDivElement>(null);

  const [alumnoRender, setAlumnoRender] = useState<AlumnoCredencial | null>(
    null,
  );
  const [firmanteRender, setFirmanteRender] = useState<Firmante>({
    cargo: "DIRECTOR DEL PLANTEL",
    nombre: "NOMBRE NO ASIGNADO",
    firmaImagenUrl: undefined,
  });
  const [estado, setEstado] = useState<DownloadState>({
    descargando: false,
    fase: null,
    progreso: 0,
    total: 0,
  });

  const capturarCara = async (
    ref: React.RefObject<HTMLDivElement | null>,
  ): Promise<string> => {
    if (!ref.current) throw new Error("Ref no disponible.");
    await esperarImagenes(ref.current);
    return htmlToImage.toPng(ref.current, {
      cacheBust: true,
      backgroundColor: "#ffffff",
      pixelRatio: 2.5,
    });
  };

  const iniciarDescarga = useCallback(
    async (alumnos: AlumnoCredencial[], filename = "Credenciales.pdf") => {
      if (alumnos.length === 0) return;

      const firmante = await obtenerDirector();
      setFirmanteRender(firmante);

      // ── Fase 1: captura en DOM (requiere main thread) ──
      setEstado({
        descargando: true,
        fase: "capturando",
        progreso: 0,
        total: alumnos.length,
      });

      const frentesImg: string[] = [];
      const reversosImg: string[] = [];

      for (let i = 0; i < alumnos.length; i++) {
        try {
          setAlumnoRender(alumnos[i]);
          await esperarFrame();
          frentesImg.push(await capturarCara(frenteRef));
          reversosImg.push(await capturarCara(reversoRef));
        } catch {
          frentesImg.push("");
          reversosImg.push("");
        }
        setEstado((s) => ({ ...s, progreso: i + 1 }));
        // Ceder hilo cada 5 capturas para no bloquear UI
        if (i % 5 === 0) await cederHilo();
      }

      setAlumnoRender(null);

      // ── Fase 2: ensamblado PDF cediendo entre lotes ──
      const cardsPerPage = PDF_LAYOUT.cols * PDF_LAYOUT.rows;
      setEstado({
        descargando: true,
        fase: "generando",
        progreso: 0,
        total: frentesImg.length,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const { cardW, cardH, cols } = PDF_LAYOUT;
      const marginX = (pageW - cols * cardW) / (cols + 1);
      const marginY = (pageH - PDF_LAYOUT.rows * cardH) / (PDF_LAYOUT.rows + 1);

      const posX = (p: number) => marginX + (p % cols) * (cardW + marginX);
      const posY = (p: number) =>
        marginY + Math.floor(p / cols) * (cardH + marginY);
      // x-espejado: al voltear hoja por borde largo las columnas se intercambian
      const backPosX = (p: number) =>
        marginX + (cols - 1 - (p % cols)) * (cardW + marginX);

      let firstPage = true;

      for (let i = 0; i < frentesImg.length; i += cardsPerPage) {
        const lotF = frentesImg.slice(i, i + cardsPerPage);
        const lotR = reversosImg.slice(i, i + cardsPerPage);

        if (!firstPage) pdf.addPage("letter", "portrait");
        firstPage = false;

        lotF.forEach((img, j) => {
          if (img) pdf.addImage(img, "PNG", posX(j), posY(j), cardW, cardH);
        });
        pdf.addPage("letter", "portrait");
        lotR.forEach((img, j) => {
          if (img) pdf.addImage(img, "PNG", backPosX(j), posY(j), cardW, cardH);
        });

        setEstado((s) => ({
          ...s,
          progreso: Math.min(i + cardsPerPage, frentesImg.length),
        }));
        // Ceder hilo entre lotes de páginas
        await cederHilo();
      }

      pdf.save(filename);
      setEstado({ descargando: false, fase: null, progreso: 0, total: 0 });
    },
    [],
  );

  const pct =
    estado.total > 0 ? Math.round((estado.progreso / estado.total) * 100) : 0;

  return (
    <CredencialDownloadContext.Provider value={{ ...estado, iniciarDescarga }}>
      {children}

      {/* Capa de render oculta — vive en el layout, nunca se desmonta */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
        {alumnoRender && (
          <>
            <div ref={frenteRef}>
              <CredencialCard
                estudiante={alumnoRender}
                firmante={firmanteRender}
                lado="frente"
              />
            </div>
            <div ref={reversoRef}>
              <CredencialCard
                estudiante={alumnoRender}
                firmante={firmanteRender}
                lado="reverso"
              />
            </div>
          </>
        )}
      </div>

      {/* Indicador flotante persistente — visible aunque el usuario navegue */}
      {estado.descargando && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#691C32",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            minWidth: 240,
            fontSize: 13,
          }}
        >
          <p style={{ fontWeight: 700, margin: "0 0 2px" }}>
            {estado.fase === "capturando"
              ? "Capturando credenciales…"
              : "Generando PDF…"}
          </p>
          <p style={{ margin: "0 0 8px", opacity: 0.8, fontSize: 12 }}>
            {estado.progreso} / {estado.total} · {pct}%
          </p>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.25)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "#fff",
                borderRadius: 2,
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      )}
    </CredencialDownloadContext.Provider>
  );
}
