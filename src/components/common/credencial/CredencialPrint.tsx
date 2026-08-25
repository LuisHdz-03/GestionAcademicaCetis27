"use client";

import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import CredencialCard from "./CredencialCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface CredencialPrintProps {
  estudiante: {
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
  };
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

export default function CredencialPrint({ estudiante }: CredencialPrintProps) {
  const frenteRef = useRef<HTMLDivElement>(null);
  const reversoRef = useRef<HTMLDivElement>(null);
  const [generando, setGenerando] = useState(false);
  const { toast } = useToast();
  const [firmante, setFirmante] = useState<{
    cargo: string;
    nombre: string;
    firmaImagenUrl?: string;
  }>({
    cargo: "DIRECTOR DEL PLANTEL",
    nombre: "NOMBRE NO ASIGNADO",
    firmaImagenUrl: undefined,
  });

  useEffect(() => {
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
          setFirmante({
            cargo: data.cargo || "DIRECTOR DEL PLANTEL",
            nombre: data.nombre || "NOMBRE NO ASIGNADO",
            firmaImagenUrl: data.firmaImagenUrl || undefined,
          });
        }
      } catch {
        // usar defaults
      }
    };
    obtenerDirector();
  }, []);

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

  const handleDescargarPDF = async () => {
    setGenerando(true);
    try {
      await esperarFrame();
      const frente = await capturarCara(frenteRef);
      const reverso = await capturarCara(reversoRef);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const cardW = 85.6;
      const cardH = 54;
      const x = (pageW - cardW) / 2;
      const y = (pageH - cardH) / 2;

      pdf.addImage(frente, "PNG", x, y, cardW, cardH);
      pdf.addPage("letter", "portrait");
      pdf.addImage(reverso, "PNG", x, y, cardW, cardH);

      pdf.save(`Credencial_${estudiante.noControl}.pdf`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error al generar PDF", variant: "destructive" });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <>
      <Button onClick={handleDescargarPDF} disabled={generando}>
        <Printer size={16} className="mr-2" />
        {generando ? "Procesando..." : "Imprimir Credencial"}
      </Button>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={frenteRef}>
          <CredencialCard
            estudiante={estudiante}
            firmante={firmante}
            lado="frente"
          />
        </div>
        <div ref={reversoRef}>
          <CredencialCard
            estudiante={estudiante}
            firmante={firmante}
            lado="reverso"
          />
        </div>
      </div>
    </>
  );
}
