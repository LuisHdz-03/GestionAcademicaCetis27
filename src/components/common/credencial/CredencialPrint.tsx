"use client";

import React, { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/useToast";

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
  firmante: {
    cargo: string;
    nombre: string;
    firmaImagenUrl?: string;
  };
}

export default function CredencialPrint({
  estudiante,
  firmante,
}: CredencialPrintProps) {
  const credencialRef = useRef<HTMLDivElement>(null);
  const [generando, setGenerando] = useState(false);
  const { toast } = useToast();

  const handleDescargarPDF = async () => {
    if (!credencialRef.current) return;
    setGenerando(true);

    try {
      const imgData = await htmlToImage.toPng(credencialRef.current, {
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
      pdf.save(`Credencial_${estudiante.noControl}.pdf`);
    } catch (error) {
      console.error(error);
      toast({ title: "Error al generar PDF", variant: "destructive" });
    } finally {
      setGenerando(false);
    }
  };
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "N/A";
    return fecha.substring(0, 10); // yyyy-mm-dd
  };
  const primary = "#691C32";
  const gold = "#B38E5D";

  return (
    <>
      <Button onClick={handleDescargarPDF} disabled={generando}>
        <Printer size={16} className="mr-2" />
        {generando ? "Procesando..." : "Imprimir Credencial"}
      </Button>

      {/* CAPTURA */}
      <div style={{ position: "absolute", left: "-9999px" }}>
        <div
          ref={credencialRef}
          style={{
            display: "flex",
            gap: "40px",
            background: "#fff",
            padding: "20px",
          }}
        >
          {/* ================= FRONT ================= */}
          <div
            style={{
              width: "340px",
              height: "220px",
              border: `2px solid ${primary}`,
              borderRadius: "16px",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* LOGOS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                }}
              >
                {["/images/SEP.png", "/images/DGETI.png"].map((src, i) => (
                  <div
                    key={i}
                    style={{
                      width: "100px",
                      height: "50px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={src}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* CONTENIDO */}
              <div style={{ display: "flex", padding: "10px 14px" }}>
                {/* FOTO */}
                <div style={{ width: "120px", textAlign: "center" }}>
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      border: `2px solid ${primary}`,
                      borderRadius: "12px",
                      overflow: "hidden",
                      margin: "auto",
                    }}
                  >
                    {estudiante.fotoUrl ? (
                      <img
                        src={estudiante.fotoUrl}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : null}
                  </div>

                  <p style={{ fontSize: "8px", margin: 0 }}>NO. DE CONTROL</p>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: primary,
                    }}
                  >
                    {estudiante.noControl}
                  </p>
                </div>

                {/* DATOS */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{ fontSize: "8px", color: primary, fontWeight: 700 }}
                  >
                    CENTRO DE ESTUDIOS TECNOLÓGICOS INDUSTRIAL Y DE SERVICIOS
                    No. 27
                  </p>

                  <p style={{ fontSize: "10px", color: primary }}>ALUMNO(A)</p>

                  <p style={{ fontSize: "12px", fontWeight: 700 }}>
                    {estudiante.nombre} {estudiante.apellidoPaterno}{" "}
                    {estudiante.apellidoMaterno}
                  </p>

                  <p style={{ fontSize: "8px", color: primary }}>CURP</p>
                  <p style={{ fontSize: "9px" }}>{estudiante.curp}</p>

                  <p style={{ fontSize: "8px", color: primary }}>GRUPO</p>
                  <p style={{ fontSize: "9px" }}>{estudiante.grupo}</p>
                </div>
              </div>
            </div>

            {/* BARRA */}
            <div
              style={{
                width: "38px",
                background: primary,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  transform: "rotate(90deg)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                ESPECIALIDAD {estudiante.especialidad}
              </span>
            </div>
          </div>

          {/* ================= BACK ================= */}
          <div
            style={{
              width: "340px",
              height: "220px",
              border: `2px solid ${primary}`,
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              overflow: "visible",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                background: primary,
                color: "#fff",
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                borderTopLeftRadius: "14px",
                borderTopRightRadius: "14px",
              }}
            >
              {/* IZQUIERDA */}
              <div style={{ lineHeight: "1.2" }}>
                <p style={{ fontSize: "8px", fontWeight: 600 }}>
                  SISTEMA ESCOLARIZADO
                </p>
                <p style={{ fontSize: "7px" }}>
                  TURNO {estudiante.turno || "MATUTINO"}
                </p>
                <p style={{ fontSize: "7px" }}>
                  GRUPO {estudiante.grupo || "N/A"}
                </p>
              </div>

              {/* DERECHA */}
              <div style={{ textAlign: "right", lineHeight: "1.2" }}>
                <p style={{ fontSize: "7px" }}>EMISIÓN</p>
                <p style={{ fontSize: "8px", fontWeight: 700 }}>
                  {formatearFecha(estudiante.emision)}
                </p>

                <p style={{ fontSize: "7px", marginTop: "2px" }}>VIGENCIA</p>
                <p style={{ fontSize: "8px", fontWeight: 700 }}>
                  {formatearFecha(estudiante.vigencia)}
                </p>
              </div>
            </div>

            {/* QR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                gap: "20px",
              }}
            >
              <QRCode value={estudiante.noControl} size={60} />
              <div
                style={{ width: "1px", height: "40px", background: primary }}
              />
              <img
                src="/images/DGETI.png"
                style={{ height: "60px", opacity: 0.3 }}
              />
            </div>

            {/* DIRECTOR */}
            <div
              style={{
                border: `2px solid ${gold}`,
                width: "220px",
                alignSelf: "center",
                textAlign: "center",
                padding: "5px",
              }}
            >
              <p style={{ fontSize: "9px", color: gold, fontWeight: 800 }}>
                {firmante.cargo}
              </p>
              <p style={{ fontSize: "9px", color: primary }}>
                {firmante.nombre}
              </p>
            </div>

            <div
              style={{
                width: "95%",
                height: "1.5px",
                background: primary,
                alignSelf: "center",
                marginTop: "5px",
              }}
            />

            {/* DIRECCIÓN */}
            <div style={{ textAlign: "center", padding: "5px" }}>
              <p style={{ fontSize: "9px", color: primary, fontWeight: 800 }}>
                DIRECCIÓN DEL PLANTEL
              </p>
              <p style={{ fontSize: "6px" }}>
                CARRETERA CARAPAN-URUAPAN KM 66.8 URUAPAN, MICHOACAN, CP.60000,
                TEL. 5231509
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
