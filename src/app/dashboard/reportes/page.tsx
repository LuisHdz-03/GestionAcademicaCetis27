"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

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
  acciones: string;
  gravedad: string;
  fechaReporte: string;
  estatus: string;
  reportadoPor?: string;
}

export default function ReportesPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // 👇 ARREGLO DE TYPESCRIPT: Usamos el rol principal del usuario
  const rolUsuario =
    user?.tipoUsuario?.toUpperCase() || (user as any)?.rol?.toUpperCase() || "";

  // Permitimos generar reportes a Docentes, Directivos y Administrativos
  const puedeGenerarReporte =
    rolUsuario === "DOCENTE" ||
    rolUsuario === "ADMINISTRATIVO" ||
    rolUsuario === "DIRECTIVO";

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [reportesRecientes, setReportesRecientes] = useState<Reporte[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(
    null,
  );
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([]);
  const [reporteVisualizacion, setReporteVisualizacion] =
    useState<Reporte | null>(null);
  const [mostrarDetalleReporte, setMostrarDetalleReporte] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "DISCIPLINARIO",
    gravedad: "MEDIA",
    motivoReporte: "",
    accionesTomadas: "",
    nombreAlumno: "",
    folio: "",
    especialidad: "",
    grupo: "",
    lugarEncontraba: "",
    leClasesReportado: "",
    nombreFirmaAlumno: "",
    nombreFirmaMaestro: "",
    nombreTutor: "",
    fecha: "",
    nombrePapaMamaTutor: "",
    telefono: "",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  useEffect(() => {
    cargarAlumnos();
    cargarReportesRecientes();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const res = await fetch(`${API_URL}/estudiantes`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al obtener alumnos");
      const data = await res.json();

      const alumnosMapeados: Alumno[] = data.map((a: any) => ({
        id: a.idEstudiante,
        nombre: a.usuario?.nombre || "Sin nombre",
        apellidoPaterno: a.usuario?.apellidoPaterno || "",
        apellidoMaterno: a.usuario?.apellidoMaterno || "",
        matricula: a.matricula || "S/N",
        especialidad: a.grupo?.especialidad?.nombre || "Sin Asignar",
        semestre: a.semestre || 1,
        idGrupo: a.grupoId,
        grupo: a.grupo?.nombre || "Sin Grupo",
        idEspecialidad: a.grupo?.especialidadId || 0,
      }));

      setAlumnos(alumnosMapeados);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const cargarReportesRecientes = async () => {
    try {
      const res = await fetch(`${API_URL}/incidencias`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al obtener incidencias");
      const data = await res.json();

      const reportesMapeados: Reporte[] = data.map((r: any) => ({
        idReporte: r.idReporte || r.idIncidencia,
        nombreEstudiante: `${r.alumno?.usuario?.nombre || r.estudiante?.usuario?.nombre} ${r.alumno?.usuario?.apellidoPaterno || r.estudiante?.usuario?.apellidoPaterno}`,
        matriculaEstudiante:
          r.alumno?.matricula || r.estudiante?.matricula || "S/N",
        especialidadEstudiante:
          r.alumno?.grupo?.especialidad?.nombre ||
          r.estudiante?.grupo?.especialidad?.nombre ||
          "S/N",
        grupoEstudiante:
          r.alumno?.grupo?.nombre || r.estudiante?.grupo?.nombre || "S/N",
        tipo: r.tipoIncidencia || r.tipo || "DISCIPLINARIO",
        titulo:
          r.titulo ||
          `Reporte de ${r.alumno?.usuario?.nombre || r.estudiante?.usuario?.nombre}`,
        descripcion: r.descripcion || "",
        acciones: r.accionesTomadas || r.acciones || "Sin acciones registradas",
        gravedad: r.nivel || r.gravedad || "MEDIA",
        fechaReporte: r.fecha || r.fechaHora,
        estatus: r.estatus || r.estado,
        reportadoPor: r.reportadoPor || "Administración",
      }));

      setReportesRecientes(reportesMapeados.reverse());
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    }
  };

  const handleBusquedaAlumnoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = e.target.value;
      setBusquedaAlumno(valor);

      if (valor.trim().length >= 2) {
        const filtrados = alumnos.filter((alumno) => {
          const nombreCompleto =
            `${alumno.nombre || ""} ${alumno.apellidoPaterno || ""} ${alumno.apellidoMaterno || ""}`.toLowerCase();
          const matricula = String(alumno.matricula || "").toLowerCase();
          const busqueda = valor.toLowerCase();
          return (
            nombreCompleto.includes(busqueda) || matricula.includes(busqueda)
          );
        });

        setAlumnosFiltrados(filtrados);
        setMostrarSugerencias(filtrados.length > 0);
      } else {
        setAlumnosFiltrados([]);
        setMostrarSugerencias(false);
      }
    },
    [alumnos],
  );

  const seleccionarAlumno = useCallback(
    (alumno: Alumno) => {
      setAlumnoSeleccionado(alumno);
      const nombreCompleto =
        `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ""}`.trim();
      setBusquedaAlumno(`${alumno.matricula} - ${nombreCompleto}`);
      setMostrarSugerencias(false);

      const grupoTexto = alumno.grupo || "Sin grupo";
      const fechaActual = new Date().toISOString().split("T")[0];

      const esDocente = user?.tipoUsuario === "docente";
      const nombreMaestro = esDocente
        ? `${user?.nombre || ""} ${user?.apellidoPaterno || ""}`.trim()
        : "";

      setFormData((prev) => ({
        ...prev,
        nombreAlumno: nombreCompleto,
        folio: alumno.matricula,
        especialidad: alumno.especialidad,
        grupo: grupoTexto,
        fecha: fechaActual,
        nombreFirmaMaestro: nombreMaestro,
        titulo: `Reporte de conducta - ${nombreCompleto}`,
      }));
    },
    [user],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alumnoSeleccionado) {
      toast({
        title: "Atención",
        description: "Debes seleccionar un alumno",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 👇 ARREGLO DE TYPESCRIPT: Forzamos (user as any) para sacar el cargo si existe
      const cargoReal =
        (user as any)?.cargo ||
        (user?.tipoUsuario === "docente" ? "DOCENTE" : "ADMINISTRATIVO");
      const nombreQuienReporta =
        `${cargoReal} - ${user?.nombre} ${user?.apellidoPaterno}`.toUpperCase();

      const payload = {
        estudianteId: alumnoSeleccionado.id,
        titulo: formData.titulo || "Reporte Escolar",
        descripcion: formData.motivoReporte,
        tipo: formData.tipo,
        gravedad: formData.gravedad,
        acciones: formData.accionesTomadas || "Pendiente de revisión",
        reportadoPor: nombreQuienReporta,
      };

      const res = await fetch(`${API_URL}/incidencias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar la incidencia");
      }

      toast({
        title: "Éxito",
        description: "Reporte guardado exitosamente. Ya visible en la app.",
        variant: "success",
      });

      handlePrint();
      limpiarFormulario();
      cargarReportesRecientes();
    } catch (error: any) {
      console.error("Error al guardar reporte:", error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      titulo: "",
      tipo: "DISCIPLINARIO",
      gravedad: "MEDIA",
      motivoReporte: "",
      accionesTomadas: "",
      nombreAlumno: "",
      folio: "",
      especialidad: "",
      grupo: "",
      lugarEncontraba: "",
      leClasesReportado: "",
      nombreFirmaAlumno: "",
      nombreFirmaMaestro: "",
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
  };

  const marcarComoRevisado = async (idReporte: number) => {
    try {
      const res = await fetch(`${API_URL}/incidencias/${idReporte}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: "RESUELTO" }),
      });

      if (res.ok) {
        toast({
          title: "Éxito",
          description: "Reporte marcado como resuelto",
          variant: "success",
        });
        cargarReportesRecientes();
        setMostrarDetalleReporte(false);
      } else {
        toast({
          title: "Error",
          description: "Error al actualizar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al marcar reporte:", error);
    }
  };

  const handlePrintReporte = (reporte: Reporte) => {
    const dataForPrint = {
      nombreAlumno: reporte.nombreEstudiante,
      folio: reporte.matriculaEstudiante,
      especialidad: reporte.especialidadEstudiante,
      grupo: reporte.grupoEstudiante || "",
      motivoReporte: reporte.descripcion,
      accionesTomadas: reporte.acciones,
      fecha: new Date(reporte.fechaReporte).toLocaleDateString("es-MX"),
      lugarEncontraba: "",
      leClasesReportado: "",
      nombreFirmaAlumno: "",
      nombreFirmaMaestro: reporte.reportadoPor || "",
      nombreTutor: "",
      nombrePapaMamaTutor: "",
      telefono: "",
    };
    handlePrintCustom(dataForPrint);
  };

  const handlePrint = () => {
    handlePrintCustom(formData);
  };

  const handlePrintCustom = (dataToPrint: any) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reporte Individual</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 10mm 15mm; font-size: 9pt; }
              .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
              .header h1 { font-size: 14pt; margin: 5px 0; }
              .header p { font-size: 9pt; }
              table { width: 100%; border-collapse: collapse; margin-top: 5px; }
              td { border: 1px solid #000; padding: 5px; vertical-align: top; }
              .label { font-weight: bold; font-size: 8pt; }
              .value { min-height: 20px; font-size: 9pt; }
              .footer { margin-top: 15px; text-align: center; font-size: 8pt; font-weight: bold; }
              .signatures { margin-top: 20px; display: flex; justify-content: space-around; }
              .signature-block { text-align: center; width: 40%; }
              .signature-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 3px; font-size: 7pt; }
              @media print { body { padding: 10mm 15mm; } @page { size: letter; margin: 10mm; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REPORTE INDIVIDUAL</h1>
              <p>CETIS No. 27</p>
            </div>
            <table>
              <tr>
                <td colspan="2"><span class="label">NOMBRE DEL ALUMNO:</span><div class="value">${dataToPrint.nombreAlumno || ""}</div></td>
                <td><span class="label">FOLIO:</span><div class="value">${dataToPrint.folio || ""}</div></td>
              </tr>
              <tr>
                <td><span class="label">ESPECIALIDAD:</span><div class="value">${dataToPrint.especialidad || ""}</div></td>
                <td colspan="2"><span class="label">GRUPO:</span><div class="value">${dataToPrint.grupo || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">MOTIVO DEL REPORTE:</span><div class="value" style="min-height: 40px;">${dataToPrint.motivoReporte || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">LUGAR DONDE SE ENCONTRABA (N):</span><div class="value">${dataToPrint.lugarEncontraba || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">LE DA CLASES AL (A LOS) ALUMNO (S) REPORTADO (S):</span><div class="value">${dataToPrint.leClasesReportado || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">NOMBRE Y FIRMA DEL ALUMNO (A) QUE REPORTA:</span><div class="value">${dataToPrint.nombreFirmaAlumno || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">NOMBRE Y FIRMA DEL MAESTRO/ADMIN QUE REPORTA:</span><div class="value">${dataToPrint.nombreFirmaMaestro || ""}</div></td>
              </tr>
              <tr>
                <td colspan="3"><span class="label">ACCIONES TOMADAS:</span><div class="value" style="min-height: 40px;">${dataToPrint.accionesTomadas || ""}</div></td>
              </tr>
              <tr>
                <td><span class="label">NOMBRE DEL TUTOR:</span><div class="value">${dataToPrint.nombreTutor || ""}</div></td>
                <td><span class="label">FECHA:</span><div class="value">${dataToPrint.fecha || ""}</div></td>
              </tr>
              <tr>
                <td><span class="label">NOMBRE DE PAPÁ/MAMÁ/TUTOR:</span><div class="value">${dataToPrint.nombrePapaMamaTutor || ""}</div></td>
                <td><span class="label">TELÉFONO:</span><div class="value">${dataToPrint.telefono || ""}</div></td>
              </tr>
            </table>
            <div class="footer">ATENTAMENTE</div>
            <div class="signatures">
              <div class="signature-block">
                <div class="signature-line">LIC. MARIA SALUD CAZARES TORRES JEFA<br>OFNA. DE ORIENTACIÓN EDUCATIVA TURNO MATUTINO</div>
              </div>
              <div class="signature-block">
                <div class="signature-line">MEMS. ARTURO OZUNA SANCHEZ JEFE<br>OFNA. DE ORIENTACIÓN EDUCATIVA TURNO VESPERTINO</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes Individuales</h1>
          <p className="text-gray-500 mt-2">
            Gestión de reportes disciplinarios y académicos
          </p>
        </div>
      </div>

      {puedeGenerarReporte && (
        <Card>
          <CardHeader>
            <CardTitle>Buscar Alumno a Reportar</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <Label>Escribe el nombre o matrícula del alumno</Label>
              <Input
                type="text"
                placeholder="Ej: Juan Pérez o 213110..."
                value={busquedaAlumno}
                onChange={handleBusquedaAlumnoChange}
                onFocus={() => {
                  if (alumnosFiltrados.length > 0) setMostrarSugerencias(true);
                }}
                onBlur={() =>
                  setTimeout(() => setMostrarSugerencias(false), 200)
                }
                className="mt-1"
              />

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
                      <div className="text-sm text-gray-600">
                        {`${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ""}`.trim()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {alumno.especialidad} - Grupo {alumno.grupo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                if (mostrarFormulario) limpiarFormulario();
                else setMostrarFormulario(true);
              }}
              disabled={!alumnoSeleccionado}
              className={
                mostrarFormulario
                  ? "bg-gray-500"
                  : "bg-[#691C32] hover:bg-[#50172A] text-white"
              }
            >
              {mostrarFormulario ? "Cancelar Formulario" : "Nuevo Reporte"}
            </Button>
          </CardContent>
        </Card>
      )}

      {mostrarFormulario && puedeGenerarReporte && (
        <Card className="max-w-5xl mx-auto border-[#691C32]/20">
          <CardHeader className="bg-[#691C32] text-white rounded-t-lg">
            <CardTitle className="text-xl font-bold text-center">
              LLENAR REPORTE (Sincronizado con App Móvil)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h3 className="font-bold text-lg mb-4 text-[#691C32]">
                  1. Detalles de la Incidencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-3">
                    <Label>Título del Reporte *</Label>
                    <Input
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      required
                      placeholder="Ej: Faltas de respeto en clase"
                    />
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(val) => handleSelectChange("tipo", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DISCIPLINARIO">
                          Disciplinario
                        </SelectItem>
                        <SelectItem value="ACADEMICO">Académico</SelectItem>
                        <SelectItem value="ASISTENCIA">Asistencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gravedad *</Label>
                    <Select
                      value={formData.gravedad}
                      onValueChange={(val) =>
                        handleSelectChange("gravedad", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAJA">Baja (Advertencia)</SelectItem>
                        <SelectItem value="MEDIA">Media (Reporte)</SelectItem>
                        <SelectItem value="ALTA">Alta (Citatorio)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha del Suceso *</Label>
                    <Input
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Motivo del Reporte *</Label>
                    <textarea
                      name="motivoReporte"
                      value={formData.motivoReporte}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#691C32]"
                      required
                    />
                  </div>
                  <div>
                    <Label>Acciones Tomadas *</Label>
                    <textarea
                      name="accionesTomadas"
                      value={formData.accionesTomadas}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Ej: Se le llamó la atención y se acordó citar al tutor."
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#691C32]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-gray-700">
                  2. Información Adicional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lugar donde se encontraba(n):</Label>
                    <Input
                      name="lugarEncontraba"
                      value={formData.lugarEncontraba}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>¿Le da clases al alumno reportado?:</Label>
                    <Input
                      name="leClasesReportado"
                      value={formData.leClasesReportado}
                      onChange={handleChange}
                      placeholder="Sí / No / Materia"
                    />
                  </div>
                  <div>
                    <Label>Firma de alumno que reporta (Opcional):</Label>
                    <Input
                      name="nombreFirmaAlumno"
                      value={formData.nombreFirmaAlumno}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Firma del maestro que reporta:</Label>
                    <Input
                      name="nombreFirmaMaestro"
                      value={formData.nombreFirmaMaestro}
                      onChange={handleChange}
                    />
                  </div>
                  {rolUsuario !== "DOCENTE" && (
                    <>
                      <div>
                        <Label>Nombre del Tutor Escolar:</Label>
                        <Input
                          name="nombreTutor"
                          value={formData.nombreTutor}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>Nombre de Papá/Mamá/Tutor:</Label>
                        <Input
                          name="nombrePapaMamaTutor"
                          value={formData.nombrePapaMamaTutor}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label>Teléfono de contacto:</Label>
                        <Input
                          name="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFormulario}
                >
                  Limpiar / Cancelar
                </Button>
                <Button type="button" variant="secondary" onClick={handlePrint}>
                  Solo Imprimir PDF (No guardar)
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#691C32] hover:bg-[#50172A] text-white"
                >
                  {loading ? "Guardando..." : "Guardar e Imprimir"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Historial de Reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reportes</CardTitle>
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
                    <TableHead>Gravedad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportesRecientes.map((reporte) => (
                    <TableRow key={reporte.idReporte}>
                      <TableCell>
                        {new Date(reporte.fechaReporte).toLocaleDateString(
                          "es-MX",
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium block">
                          {reporte.nombreEstudiante}
                        </span>
                        <span className="text-xs text-gray-500">
                          {reporte.grupoEstudiante}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${reporte.gravedad === "ALTA" ? "bg-red-100 text-red-700" : reporte.gravedad === "MEDIA" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                        >
                          {reporte.gravedad}
                        </span>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={reporte.descripcion}
                      >
                        {reporte.descripcion}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${reporte.estatus === "RESUELTO" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}
                        >
                          {reporte.estatus}
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
                          Ver Detalle
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

      {/* Modal de Detalle */}
      {mostrarDetalleReporte && reporteVisualizacion && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-[#691C32]">
                Detalle de Incidencia
              </h3>
              <Button
                variant="ghost"
                onClick={() => setMostrarDetalleReporte(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-bold text-gray-500 block">Alumno:</span>{" "}
                  {reporteVisualizacion.nombreEstudiante}
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">
                    Matrícula:
                  </span>{" "}
                  {reporteVisualizacion.matriculaEstudiante}
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Tipo:</span>{" "}
                  {reporteVisualizacion.tipo}
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">
                    Gravedad:
                  </span>{" "}
                  {reporteVisualizacion.gravedad}
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block">Motivo:</span>
                  <p className="mt-1 bg-red-50 text-red-900 p-3 rounded border border-red-100">
                    {reporteVisualizacion.descripcion}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block">
                    Acciones Tomadas:
                  </span>
                  <p className="mt-1 bg-gray-50 text-gray-900 p-3 rounded border border-gray-200">
                    {reporteVisualizacion.acciones}
                  </p>
                </div>
                {/* Mostramos quién reportó en el detalle */}
                {reporteVisualizacion.reportadoPor && (
                  <div className="col-span-2">
                    <span className="font-bold text-gray-500 block">
                      Reportado por:
                    </span>
                    <p className="mt-1 font-semibold">
                      {reporteVisualizacion.reportadoPor}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-between">
              <Button
                variant="outline"
                onClick={() => handlePrintReporte(reporteVisualizacion)}
              >
                🖨️ Re-Imprimir PDF
              </Button>
              {rolUsuario !== "DOCENTE" &&
                reporteVisualizacion.estatus !== "RESUELTO" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      marcarComoRevisado(reporteVisualizacion.idReporte)
                    }
                  >
                    ✅ Marcar como Resuelto
                  </Button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
