"use client";

import React, { useRef, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const API_ORIGIN = API_URL.replace(/\/api\/web\/?$/, "");

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

export default function CredencialPrint({ estudiante }: CredencialPrintProps) {
  const credencialRef = useRef<HTMLDivElement>(null);
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

  // En src/components/common/credencial/CredencialPrint.tsx
  useEffect(() => {
    const obtenerDirector = async () => {
      try {
        // Obtener el token del localStorage o cookies (ajusta según tu app)
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(
          `${API_URL}/administrativos/director`,
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
      } catch (error) {
        console.error("ERROR FETCH DIRECTOR:", error);
        setFirmante({
          cargo: "DIRECTOR DEL PLANTEL",
          nombre: "NOMBRE NO ASIGNADO",
          firmaImagenUrl: undefined,
        });
      }
    };
    obtenerDirector();
  }, []);

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
  const placeholderBg = "#F8F1E7";
  const placeholderStroke = "#B38E5D";
  const resolveMediaUrl = (url?: string) => {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };
  const fotoSrc = resolveMediaUrl(estudiante.fotoUrl);
  const firmaSrc = firmante.firmaImagenUrl
    ? resolveMediaUrl(firmante.firmaImagenUrl)
    : undefined;

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
                    {fotoSrc ? (
                      <img
                        src={fotoSrc}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: placeholderBg,
                        }}
                      >
                        <svg
                          width="62"
                          height="62"
                          viewBox="0 0 64 64"
                          aria-hidden="true"
                        >
                          <circle cx="32" cy="32" r="30" fill="#FFF9F2" />
                          <circle
                            cx="32"
                            cy="24"
                            r="10"
                            fill="none"
                            stroke={placeholderStroke}
                            strokeWidth="3"
                          />
                          <path
                            d="M16 52c3.5-8 10.2-12 16-12s12.5 4 16 12"
                            fill="none"
                            stroke={placeholderStroke}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
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
                <p style={{ fontSize: "13px", fontWeight: 600 }}>
                  SISTEMA ESCOLARIZADO
                </p>
                <p style={{ fontSize: "11px" }}>
                  TURNO {estudiante.turno || "MATUTINO"}
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
                padding: "8px 18px 6px",
                gap: "16px",
              }}
            >
              <QRCode value={estudiante.noControl} size={60} />
              <div
                style={{ width: "1px", height: "40px", background: primary }}
              />
              <img
                src="/images/DGETI.png"
                style={{ height: "52px", opacity: 0.3 }}
              />
            </div>

            {/* DIRECTOR */}
            <div
              style={{
                border: `2px solid ${gold}`,
                width: "220px",
                alignSelf: "center",
                textAlign: "center",
                padding: "32px 8px 6px",
                minHeight: "62px",
                lineHeight: 1,
                overflow: "visible",
                position: "relative",
              }}
            >
              {firmaSrc ? (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "8px",
                    width: "196px",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    transform: "translateX(calc(-50% + 12px))",
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src={firmaSrc}
                    alt="Firma del director"
                    style={{
                      width: "190px",
                      height: "50px",
                      objectFit: "contain",
                      transform: "scale(1.3)",
                      transformOrigin: "center center",
                      filter: "contrast(1.7) brightness(0.62)",
                    }}
                  />
                </div>
              ) : null}
              <p
                style={{
                  fontSize: "8px",
                  color: gold,
                  fontWeight: 800,
                  margin: 0,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {firmante.cargo}
              </p>
              <p
                style={{
                  fontSize: "9px",
                  color: primary,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {firmante.nombre}
              </p>
            </div>

            <div
              style={{
                width: "92%",
                height: "1.5px",
                background: primary,
                alignSelf: "center",
                marginTop: "4px",
              }}
            />

            {/* DIRECCIÓN */}
            <div style={{ textAlign: "center", padding: "3px 8px 4px" }}>
              <p
                style={{
                  fontSize: "8px",
                  color: primary,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                DIRECCIÓN DEL PLANTEL
              </p>
              <p
                style={{
                  fontSize: "5.5px",
                  lineHeight: 1.1,
                  margin: "1px 0 0",
                }}
              >
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
