"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface Alumno {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  matricula: string;
  especialidad: string;
  semestre: number;
  idGrupo?: number;
  grupo?: string;
  idEspecialidad: number;
}

interface Reporte {
  idReporte: number;
  nombreEstudiante: string;
  matriculaEstudiante: string;
  especialidadEstudiante: string;
  grupoEstudiante: string | null;
  tipo: string;
  titulo: string;
  descripcion: string;
  gravedad: string;
  fechaReporte: string;
  estatus: number;
  accionTomada?: string;
  lugarEncontraba?: string;
  leClasesReportado?: string;
  nombreFirmaAlumno?: string;
  nombreFirmaMaestro?: string;
  nombreTutor?: string;
  nombrePapaMamaTutor?: string;
  telefono?: string;
}

export default function ReportesPage() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [reportesRecientes, setReportesRecientes] = useState<Reporte[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([]);
  const [reporteVisualizacion, setReporteVisualizacion] = useState<Reporte | null>(null);
  const [mostrarDetalleReporte, setMostrarDetalleReporte] = useState(false);

  const [formData, setFormData] = useState({
    nombreAlumno: "",
    folio: "",
    especialidad: "",
    grupo: "",
    motivoReporte: "",
    lugarEncontraba: "",
    leClasesReportado: "",
    nombreFirmaAlumno: "",
    nombreFirmaMaestro: "",
    accionesTomadas: "",
    nombreTutor: "",
    fecha: "",
    nombrePapaMamaTutor: "",
    telefono: "",
  });

  useEffect(() => {
    cargarAlumnos();
    cargarReportesRecientes();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/v1/community/alumnos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAlumnos(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
    }
  };

  const cargarReportesRecientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/v1/reportes?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setReportesRecientes(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    }
  };

  const handleBusquedaAlumnoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusquedaAlumno(valor);
    
    if (valor.trim().length >= 2) {
      const filtrados = alumnos.filter(alumno => {
        const nombreCompleto = `${alumno.nombre || ''} ${alumno.apellidoPaterno || ''} ${alumno.apellidoMaterno || ''}`.toLowerCase();
        const matricula = String(alumno.matricula || '').toLowerCase();
        const busqueda = valor.toLowerCase();
        
        return nombreCompleto.includes(busqueda) || matricula.includes(busqueda);
      });
      
      setAlumnosFiltrados(filtrados);
      setMostrarSugerencias(filtrados.length > 0);
    } else {
      setAlumnosFiltrados([]);
      setMostrarSugerencias(false);
    }
  }, [alumnos]);

  const seleccionarAlumno = useCallback((alumno: Alumno) => {
    setAlumnoSeleccionado(alumno);
    const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}`.trim();
    setBusquedaAlumno(`${alumno.matricula} - ${nombreCompleto}`);
    setMostrarSugerencias(false);
    
    const grupoTexto = alumno.grupo || 'Sin grupo';
    const fechaActual = new Date().toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      nombreAlumno: nombreCompleto,
      folio: alumno.matricula,
      especialidad: alumno.especialidad,
      grupo: grupoTexto,
      fecha: fechaActual,
    }));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!alumnoSeleccionado) {
      alert('Debes seleccionar un alumno');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/v1/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          idEstudiante: alumnoSeleccionado.id,
          idGrupo: alumnoSeleccionado.idGrupo || null,
          tipo: 'disciplinario',
          titulo: `Reporte - ${formData.nombreAlumno}`,
          descripcion: formData.motivoReporte,
          gravedad: 'media',
          accionTomada: formData.accionesTomadas,
          fechaReporte: formData.fecha,
          lugarEncontraba: formData.lugarEncontraba,
          leClasesReportado: formData.leClasesReportado,
          nombreFirmaAlumno: formData.nombreFirmaAlumno,
          nombreFirmaMaestro: formData.nombreFirmaMaestro,
          nombreTutor: formData.nombreTutor,
          nombrePapaMamaTutor: formData.nombrePapaMamaTutor,
          telefono: formData.telefono,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert('Reporte guardado exitosamente');
        limpiarFormulario();
        cargarReportesRecientes();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      alert(' Error al guardar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = useCallback(() => {
    setFormData({
      nombreAlumno: "",
      folio: "",
      especialidad: "",
      grupo: "",
      motivoReporte: "",
      lugarEncontraba: "",
      leClasesReportado: "",
      nombreFirmaAlumno: "",
      nombreFirmaMaestro: "",
      accionesTomadas: "",
      nombreTutor: "",
      fecha: "",
      nombrePapaMamaTutor: "",
      telefono: "",
    });
    setAlumnoSeleccionado(null);
    setMostrarFormulario(false);
    setBusquedaAlumno("");
    setMostrarSugerencias(false);
    setAlumnosFiltrados([]);
  }, []);

  const handleFocus = useCallback(() => {
    if (alumnosFiltrados.length > 0) {
      setMostrarSugerencias(true);
    }
  }, [alumnosFiltrados.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setMostrarSugerencias(false), 200);
  }, []);

  const marcarComoRevisado = async (idReporte: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/v1/reportes/${idReporte}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          estatus: 2,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert(' Reporte marcado como revisado');
        cargarReportesRecientes();
        setMostrarDetalleReporte(false);
        setReporteVisualizacion(null);
      } else {
        alert(` Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al marcar reporte:', error);
      alert(' Error al marcar el reporte como revisado');
    }
  };

  const handlePrintReporte = (reporte: Reporte) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reporte Individual</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                padding: 10mm 15mm;
                font-size: 9pt;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
              }
              .header h1 {
                font-size: 14pt;
                margin: 5px 0;
              }
              .header p {
                font-size: 9pt;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
              }
              td {
                border: 1px solid #000;
                padding: 5px;
                vertical-align: top;
              }
              .label {
                font-weight: bold;
                font-size: 8pt;
              }
              .value {
                min-height: 20px;
                font-size: 9pt;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 8pt;
                font-weight: bold;
              }
              .signatures {
                margin-top: 20px;
                display: flex;
                justify-content: space-around;
              }
              .signature-block {
                text-align: center;
                width: 40%;
              }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 30px;
                padding-top: 3px;
                font-size: 7pt;
              }
              @media print {
                body { 
                  padding: 10mm 15mm;
                }
                @page { 
                  size: letter;
                  margin: 10mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REPORTE INDIVIDUAL</h1>
              <p>CETIS No. 27</p>
            </div>

            <table>
              <tr>
                <td colspan="2">
                  <span class="label">NOMBRE DEL ALUMNO:</span>
                  <div class="value">${reporte.nombreEstudiante || ''}</div>
                </td>
                <td>
                  <span class="label">FOLIO:</span>
                  <div class="value">${reporte.matriculaEstudiante || ''}</div>
                </td>
              </tr>
              
              <tr>
                <td>
                  <span class="label">ESPECIALIDAD:</span>
                  <div class="value">${reporte.especialidadEstudiante || ''}</div>
                </td>
                <td colspan="2">
                  <span class="label">GRUPO:</span>
                  <div class="value">${reporte.grupoEstudiante || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">MOTIVO DEL REPORTE:</span>
                  <div class="value" style="min-height: 40px;">${reporte.descripcion || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">LUGAR DONDE SE ENCONTRABA (N):</span>
                  <div class="value">${reporte.lugarEncontraba || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">LE DA CLASES AL (A LOS) ALUMNO (S) REPORTADO (S):</span>
                  <div class="value">${reporte.leClasesReportado || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">NOMBRE Y FIRMA DEL ALUMNO (A) QUE REPORTA:</span>
                  <div class="value">${reporte.nombreFirmaAlumno || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">NOMBRE Y FIRMA DEL MAESTRO (A) QUE REPORTA:</span>
                  <div class="value">${reporte.nombreFirmaMaestro || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">ACCIONES TOMADAS:</span>
                  <div class="value" style="min-height: 40px;">${reporte.accionTomada || ''}</div>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">NOMBRE DEL TUTOR:</span>
                  <div class="value">${reporte.nombreTutor || ''}</div>
                </td>
                <td>
                  <span class="label">FECHA:</span>
                  <div class="value">${new Date(reporte.fechaReporte).toLocaleDateString('es-MX') || ''}</div>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">NOMBRE DE PAPÁ/MAMÁ/TUTOR:</span>
                  <div class="value">${reporte.nombrePapaMamaTutor || ''}</div>
                </td>
                <td>
                  <span class="label">TELÉFONO:</span>
                  <div class="value">${reporte.telefono || ''}</div>
                </td>
              </tr>
            </table>

            <div class="footer">
              ATENTAMENTE
            </div>

            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line">
                  LIC. MARIA SALUD CAZARES TORRES JEFA<br>
                  OFNA. DE ORIENTACIÓN EDUCATIVA TURNO MATUTINO
                </div>
              </div>
              <div class="signature-block">
                <div class="signature-line">
                  MEMS. ARTURO OZUNA SANCHEZ JEFE<br>
                  OFNA. DE ORIENTACIÓN EDUCATIVA TURNO VESPERTINO
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reporte Individual</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: Arial, sans-serif; 
                padding: 10mm 15mm;
                font-size: 9pt;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
              }
              .header h1 {
                font-size: 14pt;
                margin: 5px 0;
              }
              .header p {
                font-size: 9pt;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
              }
              td {
                border: 1px solid #000;
                padding: 5px;
                vertical-align: top;
              }
              .label {
                font-weight: bold;
                font-size: 8pt;
              }
              .value {
                min-height: 20px;
                font-size: 9pt;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 8pt;
                font-weight: bold;
              }
              .signatures {
                margin-top: 20px;
                display: flex;
                justify-content: space-around;
              }
              .signature-block {
                text-align: center;
                width: 40%;
              }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 30px;
                padding-top: 3px;
                font-size: 7pt;
              }
              @media print {
                body { 
                  padding: 10mm 15mm;
                }
                @page { 
                  size: letter;
                  margin: 10mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REPORTE INDIVIDUAL</h1>
              <p>CETIS No. 27</p>
            </div>

            <table>
              <tr>
                <td colspan="2">
                  <span class="label">NOMBRE DEL ALUMNO:</span>
                  <div class="value">${formData.nombreAlumno || ''}</div>
                </td>
                <td>
                  <span class="label">FOLIO:</span>
                  <div class="value">${formData.folio || ''}</div>
                </td>
              </tr>
              
              <tr>
                <td>
                  <span class="label">ESPECIALIDAD:</span>
                  <div class="value">${formData.especialidad || ''}</div>
                </td>
                <td colspan="2">
                  <span class="label">GRUPO:</span>
                  <div class="value">${formData.grupo || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">MOTIVO DEL REPORTE:</span>
                  <div class="value" style="min-height: 40px;">${formData.motivoReporte || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">LUGAR DONDE SE ENCONTRABA (N):</span>
                  <div class="value">${formData.lugarEncontraba || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">LE DA CLASES AL (A LOS) ALUMNO (S) REPORTADO (S):</span>
                  <div class="value">${formData.leClasesReportado || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">NOMBRE Y FIRMA DEL ALUMNO (A) QUE REPORTA:</span>
                  <div class="value">${formData.nombreFirmaAlumno || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">NOMBRE Y FIRMA DEL MAESTRO (A) QUE REPORTA:</span>
                  <div class="value">${formData.nombreFirmaMaestro || ''}</div>
                </td>
              </tr>

              <tr>
                <td colspan="3">
                  <span class="label">ACCIONES TOMADAS:</span>
                  <div class="value" style="min-height: 40px;">${formData.accionesTomadas || ''}</div>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">NOMBRE DEL TUTOR:</span>
                  <div class="value">${formData.nombreTutor || ''}</div>
                </td>
                <td>
                  <span class="label">FECHA:</span>
                  <div class="value">${formData.fecha || ''}</div>
                </td>
              </tr>

              <tr>
                <td>
                  <span class="label">NOMBRE DE PAPÁ/MAMÁ/TUTOR:</span>
                  <div class="value">${formData.nombrePapaMamaTutor || ''}</div>
                </td>
                <td>
                  <span class="label">TELÉFONO:</span>
                  <div class="value">${formData.telefono || ''}</div>
                </td>
              </tr>
            </table>

            <div class="footer">
              ATENTAMENTE
            </div>

            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line">
                  LIC. MARIA SALUD CAZARES TORRES JEFA<br>
                  OFNA. DE ORIENTACIÓN EDUCATIVA TURNO MATUTINO
                </div>
              </div>
              <div class="signature-block">
                <div class="signature-line">
                  MEMS. ARTURO OZUNA SANCHEZ JEFE<br>
                  OFNA. DE ORIENTACIÓN EDUCATIVA TURNO VESPERTINO
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reportes Individuales</h1>
        <p className="text-gray-500 mt-2">
          Gestión de reportes disciplinarios y académicos
        </p>
      </div>

      {/* Selector de alumno con autocompletado */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Alumno</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <Label>Escribe el nombre o matrícula del alumno</Label>
            <Input
              type="text"
              placeholder="Ej: Juan Pérez o 2024001..."
              value={busquedaAlumno}
              onChange={handleBusquedaAlumnoChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="mt-1"
            />
            
            {/* Sugerencias de autocompletado */}
            {mostrarSugerencias && alumnosFiltrados.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {alumnosFiltrados.slice(0, 10).map((alumno) => (
                  <div
                    key={alumno.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => seleccionarAlumno(alumno)}
                  >
                    <div className="font-semibold text-sm">
                      {alumno.matricula}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-normal break-words">
                      {`${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ''}`.trim()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {alumno.especialidad} - Semestre {alumno.semestre}
                    </div>
                  </div>
                ))}
                {alumnosFiltrados.length > 10 && (
                  <div className="px-4 py-2 text-sm text-gray-500 text-center bg-gray-50">
                    Mostrando 10 de {alumnosFiltrados.length} resultados
                  </div>
                )}
              </div>
            )}
            
            {busquedaAlumno.length >= 2 && alumnosFiltrados.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
                No se encontraron alumnos
              </div>
            )}
          </div>
          
          <Button
            onClick={() => {
              if (mostrarFormulario) {
                limpiarFormulario();
              } else {
                setMostrarFormulario(true);
              }
            }}
            disabled={!alumnoSeleccionado}
          >
            {mostrarFormulario ? "Cancelar" : "Crear Reporte"}
          </Button>
        </CardContent>
      </Card>

      {/* Formulario de reporte */}
      {mostrarFormulario && (
        <Card className="max-w-5xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-[#691C32] to-[#8B2442] text-white">
            <CardTitle className="text-2xl font-bold text-center">
              REPORTE INDIVIDUAL
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
              {/* Sección: Información del Alumno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="nombreAlumno" className="text-gray-700 font-semibold">
                    NOMBRE DEL ALUMNO:
                  </Label>
                  <Input
                    id="nombreAlumno"
                    name="nombreAlumno"
                    value={formData.nombreAlumno}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="folio" className="text-gray-700 font-semibold">
                    FOLIO:
                  </Label>
                  <Input
                    id="folio"
                    name="folio"
                    value={formData.folio}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="md:col-span-2"></div>

                <div>
                  <Label htmlFor="especialidad" className="text-gray-700 font-semibold">
                    ESPECIALIDAD:
                  </Label>
                  <Input
                    id="especialidad"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="grupo" className="text-gray-700 font-semibold">
                    GRUPO:
                  </Label>
                  <Input
                    id="grupo"
                    name="grupo"
                    value={formData.grupo}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Sección: Motivo del Reporte */}
              <div>
                <Label htmlFor="motivoReporte" className="text-gray-700 font-semibold">
                  MOTIVO DEL REPORTE:
                </Label>
                <textarea
                  id="motivoReporte"
                  name="motivoReporte"
                  value={formData.motivoReporte}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#691C32] focus:border-transparent"
                  required
                />
              </div>

              {/* Lugar donde se encontraba */}
              <div>
                <Label htmlFor="lugarEncontraba" className="text-gray-700 font-semibold">
                  LUGAR DONDE SE ENCONTRABA (N):
                </Label>
                <Input
                  id="lugarEncontraba"
                  name="lugarEncontraba"
                  value={formData.lugarEncontraba}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              {/* Le da clases */}
              <div>
                <Label htmlFor="leClasesReportado" className="text-gray-700 font-semibold">
                  LE DA CLASES AL (A LOS) ALUMNO (S) REPORTADO (S):
                </Label>
                <Input
                  id="leClasesReportado"
                  name="leClasesReportado"
                  value={formData.leClasesReportado}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              {/* Nombre y firma del alumno */}
              <div>
                <Label htmlFor="nombreFirmaAlumno" className="text-gray-700 font-semibold">
                  NOMBRE Y FIRMA DEL ALUMNO (A) QUE REPORTA:
                </Label>
                <Input
                  id="nombreFirmaAlumno"
                  name="nombreFirmaAlumno"
                  value={formData.nombreFirmaAlumno}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              {/* Nombre y firma del maestro */}
              <div>
                <Label htmlFor="nombreFirmaMaestro" className="text-gray-700 font-semibold">
                  NOMBRE Y FIRMA DEL MAESTRO (A) QUE REPORTA:
                </Label>
                <Input
                  id="nombreFirmaMaestro"
                  name="nombreFirmaMaestro"
                  value={formData.nombreFirmaMaestro}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              {/* Acciones tomadas */}
              <div>
                <Label htmlFor="accionesTomadas" className="text-gray-700 font-semibold">
                  ACCIONES TOMADAS:
                </Label>
                <textarea
                  id="accionesTomadas"
                  name="accionesTomadas"
                  value={formData.accionesTomadas}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#691C32] focus:border-transparent"
                />
              </div>

              {/* Sección inferior: Tutor, Fecha y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="nombreTutor" className="text-gray-700 font-semibold">
                    NOMBRE DEL TUTOR:
                  </Label>
                  <Input
                    id="nombreTutor"
                    name="nombreTutor"
                    value={formData.nombreTutor}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fecha" className="text-gray-700 font-semibold">
                    FECHA:
                  </Label>
                  <Input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nombrePapaMamaTutor" className="text-gray-700 font-semibold">
                    NOMBRE DE PAPÁ/MAMÁ/TUTOR:
                  </Label>
                  <Input
                    id="nombrePapaMamaTutor"
                    name="nombrePapaMamaTutor"
                    value={formData.nombrePapaMamaTutor}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono" className="text-gray-700 font-semibold">
                    TELÉFONO:
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-4 pt-6 border-t print:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFormulario}
                  disabled={loading}
                >
                  Limpiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  Imprimir
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#691C32] hover:bg-[#50172A] text-white"
                >
                  {loading ? "Guardando..." : "Guardar Reporte"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de reportes recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {reportesRecientes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay reportes registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportesRecientes.map((reporte) => (
                    <TableRow key={reporte.idReporte}>
                      <TableCell>
                        {new Date(reporte.fechaReporte).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>{reporte.nombreEstudiante}</TableCell>
                      <TableCell>{reporte.matriculaEstudiante}</TableCell>
                      <TableCell>{reporte.especialidadEstudiante}</TableCell>
                      <TableCell>{reporte.grupoEstudiante || "Sin grupo"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {reporte.descripcion}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          reporte.estatus === 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reporte.estatus === 2 ? 'Revisado' : 'Pendiente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReporteVisualizacion(reporte);
                            setMostrarDetalleReporte(true);
                          }}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del reporte */}
      {mostrarDetalleReporte && reporteVisualizacion && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="bg-white border-0 shadow-none">
            <CardHeader className="bg-gradient-to-r from-[#691C32] to-[#8B2442] text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold">
                  Detalles del Reporte
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMostrarDetalleReporte(false);
                    setReporteVisualizacion(null);
                  }}
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label className="text-gray-700 font-semibold">NOMBRE DEL ALUMNO:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.nombreEstudiante}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">FOLIO:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.matriculaEstudiante}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">ESTADO:</Label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded text-sm ${
                      reporteVisualizacion.estatus === 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reporteVisualizacion.estatus === 2 ? 'Revisado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">ESPECIALIDAD:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.especialidadEstudiante}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">GRUPO:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.grupoEstudiante || 'Sin grupo'}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">MOTIVO DEL REPORTE:</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md min-h-[80px] whitespace-pre-wrap">
                  {reporteVisualizacion.descripcion}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">LUGAR DONDE SE ENCONTRABA (N):</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {reporteVisualizacion.lugarEncontraba || ''}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">LE DA CLASES AL (A LOS) ALUMNO (S) REPORTADO (S):</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {reporteVisualizacion.leClasesReportado || ''}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">NOMBRE Y FIRMA DEL ALUMNO (A) QUE REPORTA:</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {reporteVisualizacion.nombreFirmaAlumno || ''}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">NOMBRE Y FIRMA DEL MAESTRO (A) QUE REPORTA:</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {reporteVisualizacion.nombreFirmaMaestro || ''}
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">ACCIONES TOMADAS:</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md min-h-[80px] whitespace-pre-wrap">
                  {reporteVisualizacion.accionTomada || ''}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-semibold">NOMBRE DEL TUTOR:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.nombreTutor || ''}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">FECHA:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {new Date(reporteVisualizacion.fechaReporte).toLocaleDateString('es-MX')}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">NOMBRE DE PAPÁ/MAMÁ/TUTOR:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.nombrePapaMamaTutor || ''}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">TELÉFONO:</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    {reporteVisualizacion.telefono || ''}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarDetalleReporte(false);
                    setReporteVisualizacion(null);
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintReporte(reporteVisualizacion)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Imprimir
                </Button>
                {reporteVisualizacion.estatus !== 2 && (
                  <Button
                    className="bg-[#691C32] hover:bg-[#50172A] text-white"
                    onClick={() => marcarComoRevisado(reporteVisualizacion.idReporte)}
                  >
                    Marcar como Revisado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
