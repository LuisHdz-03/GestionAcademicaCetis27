"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const API_URL = "http://localhost:4000/api/web/padres";

export default function TutorDashboard() {
  const { user } = useAuth();
  const [alumno, setAlumno] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No autenticado");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/alumno`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/asistencias`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_URL}/reportes`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([alumnoData, asistenciasData, reportesData]) => {
        setAlumno(alumnoData);
        setAsistencias(asistenciasData);
        setReportes(reportesData);
      })
      .catch(() => setError("Error al obtener datos del alumno"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-center py-10">Cargando información...</div>;
  if (error)
    return <div className="text-center text-red-600 py-10">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen del Alumno</CardTitle>
        </CardHeader>
        <CardContent>
          {alumno ? (
            <div>
              <div>
                <b>Nombre:</b> {alumno.nombreCompleto}
              </div>
              <div>
                <b>Grupo:</b> {typeof alumno.grupo === "object" && alumno.grupo !== null
                  ? alumno.grupo.nombre
                  : alumno.grupo}
              </div>
              <div>
                <b>Matrícula:</b> {alumno.matricula}
              </div>
            </div>
          ) : (
            <div>No se encontró información del alumno.</div>
          )}
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          {asistencias && asistencias.length > 0 ? (
            <ul className="list-disc pl-5">
              {asistencias.map((a, i) => (
                <li key={i}>
                  {a.fecha} - {a.estado}
                </li>
              ))}
            </ul>
          ) : (
            <div>No hay asistencias registradas.</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reportes / Incidencias</CardTitle>
        </CardHeader>
        <CardContent>
          {reportes && reportes.length > 0 ? (
            <ul className="list-disc pl-5">
              {reportes.map((r, i) => (
                <li key={i}>
                  {r.fecha} - {r.descripcion}
                </li>
              ))}
            </ul>
          ) : (
            <div>No hay reportes registrados.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
