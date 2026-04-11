"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fetchPadreData(token: string) {
  return Promise.all([
    fetch("http://localhost:4000/api/web/padres/alumno", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    fetch("http://localhost:4000/api/web/padres/asistencias", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    fetch("http://localhost:4000/api/web/padres/reportes", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  ]);
}

export default function PadresPage() {
  const [matricula, setMatricula] = useState("");
  const [curp, setCurp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alumno, setAlumno] = useState<any>(null);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAlumno(null);
    setAsistencias([]);
    setReportes([]);
    try {
      // Simulación de login: el backend debe devolver un token válido
      const res = await fetch("http://localhost:4000/api/web/padres/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, curp })
      });
      if (!res.ok) throw new Error("Credenciales incorrectas");
      const data = await res.json();
      setToken(data.token);
      // Obtener datos
      const [alumnoData, asistenciasData, reportesData] = await fetchPadreData(data.token);
      setAlumno(alumnoData);
      setAsistencias(asistenciasData);
      setReportes(reportesData);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso para Padres</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                placeholder="Matrícula del alumno"
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                required
              />
              <Input
                placeholder="CURP del alumno"
                value={curp}
                onChange={e => setCurp(e.target.value)}
                required
                type="password"
              />
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Alumno</CardTitle>
        </CardHeader>
        <CardContent>
          {alumno ? (
            <div>
              <div><b>Nombre:</b> {alumno.nombreCompleto || alumno.nombre}</div>
              <div><b>Grupo:</b> {alumno.grupo}</div>
              <div><b>Especialidad:</b> {alumno.especialidad}</div>
              <div><b>Matrícula:</b> {alumno.matricula}</div>
            </div>
          ) : (
            <div>No disponible</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          {asistencias && asistencias.length > 0 ? (
            <ul className="list-disc ml-6">
              {asistencias.map((a, i) => (
                <li key={i}>{a.fecha} - {a.estado}</li>
              ))}
            </ul>
          ) : (
            <div>No hay asistencias registradas.</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reportes e Incidencias</CardTitle>
        </CardHeader>
        <CardContent>
          {reportes && reportes.length > 0 ? (
            <ul className="list-disc ml-6">
              {reportes.map((r, i) => (
                <li key={i}>{r.fecha} - {r.descripcion}</li>
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
