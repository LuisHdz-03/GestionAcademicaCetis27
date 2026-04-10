"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
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
      toast({ title: "Generando credencial..." });

      const canvas = await html2canvas(credencialRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "cm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 2, 2, 10.8, 8.6);

      pdf.save(`Credencial_${estudiante.noControl}_${estudiante.nombre}.pdf`);

      toast({ title: "¡Credencial generada con éxito!" });
    } catch (error) {
      console.error("Error al generar PDF", error);
      toast({
        title: "Error al generar la credencial",
        variant: "destructive",
      });
    } finally {
      setGenerando(false);
    }
  };
  const qrStringSeguro = estudiante.noControl
    ? `${estudiante.noControl}|${Date.now()}`
    : "Sin QR";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDescargarPDF}
        disabled={generando}
        className="flex gap-2"
      >
        <Printer size={16} />
        {generando ? "Procesando..." : "Imprimir Credencial"}
      </Button>

      <div className="overflow-hidden h-0 w-0 absolute -left-[9999px] top-0">
        <div ref={credencialRef} className="flex flex-row bg-white">
          {/* Cara frontal de la credencial */}
          <div
            className="w-[204px] h-[325px] flex flex-col bg-white overflow-hidden relative border border-gray-200"
            style={{ boxSizing: "border-box" }}
          >
            {/* Logos Superiores */}
            <div className="flex justify-between items-center px-2 py-1 mt-1">
              <img
                src="/images/SEP.png"
                alt="SEP"
                className="w-12 object-contain"
              />
              <img
                src="/images/DGETI.png"
                alt="DGETI"
                className="w-12 object-contain"
              />
            </div>

            <div className="flex flex-row px-2 mt-2 gap-2">
              {/* Columna Izquierda: Foto y No. Control */}
              <div className="flex flex-col items-center w-[80px]">
                <div className="w-[70px] h-[85px] border border-gray-400 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                  {estudiante.fotoUrl ? (
                    <img
                      src={estudiante.fotoUrl}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">Sin Foto</div>
                  )}
                </div>
                <p className="text-[7px] font-bold mt-1 text-center leading-none">
                  NO. DE CONTROL
                </p>
                <p className="text-[9px] font-bold text-[#800000]">
                  {estudiante.noControl}
                </p>
              </div>

              {/* Columna Derecha: Datos */}
              <div className="flex flex-col w-[100px]">
                <p className="text-[6.5px] font-bold text-center leading-tight mb-2">
                  CENTRO DE ESTUDIOS TECNOLÓGICOS INDUSTRIAL Y DE SERVICIOS No.
                  27
                </p>

                <p className="text-[7px] font-bold text-[#800000]">ALUMNO(A)</p>
                <p className="text-[9px] font-bold leading-tight mb-1 uppercase">
                  {estudiante.nombre} {estudiante.apellidoPaterno}{" "}
                  {estudiante.apellidoMaterno}
                </p>

                <p className="text-[7px] font-bold text-[#800000]">CURP</p>
                <p className="text-[8px] font-bold mb-1 uppercase">
                  {estudiante.curp || "N/A"}
                </p>

                <p className="text-[7px] font-bold text-[#800000]">GRUPO</p>
                <p className="text-[8px] font-bold uppercase">
                  {estudiante.grupo || "N/A"}
                </p>
              </div>
            </div>

            {/* Franja de Especialidad Inferior */}
            <div className="absolute bottom-0 w-full h-[25px] bg-[#800000] flex justify-end items-center px-2">
              <p className="text-[9px] text-white font-bold italic uppercase truncate max-w-[80%] text-right">
                ESPECIALIDAD {estudiante.especialidad}
              </p>
            </div>
          </div>

          {/* Cara trasera de la credencial */}
          <div
            className="w-[204px] h-[325px] flex flex-col bg-white overflow-hidden relative border-y border-r border-gray-200 px-2 pt-2"
            style={{ boxSizing: "border-box" }}
          >
            {/* Turnos y Fechas */}
            <div className="flex flex-row justify-between mb-2">
              <div className="flex flex-col">
                <p className="text-[8px] font-bold">SISTEMA ESCOLARIZADO</p>
                <p className="text-[8px] font-bold">
                  TURNO {estudiante.turno || "MATUTINO"}
                </p>
              </div>
              <div className="flex flex-col text-right">
                <p className="text-[6px] font-bold text-gray-500">
                  FECHA DE EMISIÓN:
                </p>
                <p className="text-[7px] font-bold mb-1">
                  {estudiante.emision || "AGOSTO 2025"}
                </p>
                <p className="text-[6px] font-bold text-gray-500">VIGENCIA:</p>
                <p className="text-[7px] font-bold">
                  {estudiante.vigencia || "AGOSTO 2026"}
                </p>
              </div>
            </div>

            {/* QR y Logo */}
            <div className="flex flex-row justify-between items-center mb-3 px-2">
              <div className="bg-white p-1 border border-gray-200 rounded flex items-center justify-center">
                <QRCode value={qrStringSeguro} size={50} />
              </div>
              <div className="w-[1px] h-[50px] bg-gray-300 mx-2"></div>
              <img
                src="/images/DGETI.png"
                alt="DGETI"
                className="w-[50px] object-contain opacity-50"
              />
            </div>

            {/* ZONA DE FIRMA DINÁMICA */}
            <div className="flex flex-col items-center mt-2">
              {/* Renderiza la imagen de la firma si existe */}
              <div className="h-[35px] flex items-end justify-center mb-1">
                {firmante.firmaImagenUrl ? (
                  <img
                    src={firmante.firmaImagenUrl}
                    crossOrigin="anonymous"
                    alt="Firma"
                    className="max-h-full max-w-[120px] object-contain"
                  />
                ) : (
                  <div className="h-[20px] w-[100px] border-b border-gray-400"></div>
                )}
              </div>
              <p className="text-[7px] font-bold text-center uppercase">
                {firmante.cargo || "DIRECTOR DEL PLANTEL"}
              </p>
              <p className="text-[9px] font-bold text-center uppercase">
                {firmante.nombre || "NOMBRE NO ASIGNADO"}
              </p>
            </div>

            {/* Dirección */}
            <div className="absolute bottom-2 left-0 w-full px-3 text-center">
              <div className="w-full h-[1px] bg-gray-300 mb-1"></div>
              <p className="text-[6px] font-bold">DIRECCIÓN DEL PLANTEL</p>
              <p className="text-[5.5px] text-gray-600 leading-tight">
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
