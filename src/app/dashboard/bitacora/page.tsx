"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { HiMagnifyingGlass } from "react-icons/hi2";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

interface Bitacora {
  idBitacora: number;
  accion: string;
  detalles: string;
  fechaHora: string;
  ipBase: string;
  usuario: {
    nombre: string;
    apellidoPaterno: string;
    email: string;
  } | null;
}

export default function BitacoraPage() {
  const { toast } = useToast();
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const cargarBitacora = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bitacoras`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error al obtener la bitácora");

      const data = await res.json();
      // Aseguramos que sea un array y lo ordenamos por fecha más reciente
      const registrosArray = Array.isArray(data) ? data : data.data || [];
      setRegistros(registrosArray);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudo cargar la bitácora del sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  // Función para darle color al "Badge" según la acción
  const getColorAccion = (accion: string) => {
    const act = accion.toUpperCase();
    if (
      act.includes("CREAR") ||
      act.includes("AGREGAR") ||
      act.includes("POST")
    )
      return "bg-green-100 text-green-800 border-green-200";
    if (
      act.includes("ACTUALIZAR") ||
      act.includes("EDITAR") ||
      act.includes("PUT")
    )
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (
      act.includes("ELIMINAR") ||
      act.includes("BORRAR") ||
      act.includes("DELETE")
    )
      return "bg-red-100 text-red-800 border-red-200";
    if (
      act.includes("LOGIN") ||
      act.includes("SESIÓN") ||
      act.includes("ACCESO")
    )
      return "bg-purple-100 text-purple-800 border-purple-200";

    return "bg-gray-100 text-gray-800 border-gray-200"; // Por defecto
  };

  // Filtrado de búsqueda
  const registrosFiltrados = registros.filter((reg) => {
    const busqueda = searchTerm.toLowerCase();
    const nombreUsuario = reg.usuario
      ? `${reg.usuario.nombre} ${reg.usuario.apellidoPaterno}`.toLowerCase()
      : "sistema";

    return (
      nombreUsuario.includes(busqueda) ||
      reg.accion.toLowerCase().includes(busqueda) ||
      (reg.detalles && reg.detalles.toLowerCase().includes(busqueda))
    );
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bitácora del Sistema
          </h1>
          <p className="text-gray-500 mt-2">
            Registro de auditoría y movimientos administrativos.
          </p>
        </div>
      </div>

      <Card className="border-t-4 border-t-[#691C32] shadow-md">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Últimos Movimientos
            </CardTitle>
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiMagnifyingGlass className="text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar por usuario, acción o detalle..."
                className="pl-10 border-gray-300 focus:ring-[#691C32]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#691C32]"></div>
              <span className="ml-3 text-gray-600 font-medium">
                Cargando registros...
              </span>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-gray-500 text-lg">
                No se encontraron registros en la bitácora.
              </p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otros términos de búsqueda.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[180px] font-bold text-gray-700">
                      Fecha y Hora
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Usuario
                    </TableHead>
                    <TableHead className="font-bold text-gray-700">
                      Acción
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 max-w-[300px]">
                      Detalles
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-right">
                      Dirección IP
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosFiltrados.map((registro) => (
                    <TableRow
                      key={registro.idBitacora}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {new Date(registro.fechaHora).toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {registro.usuario
                            ? `${registro.usuario.nombre} ${registro.usuario.apellidoPaterno}`
                            : "Sistema / Desconocido"}
                        </div>
                        {registro.usuario?.email && (
                          <div className="text-xs text-gray-500">
                            {registro.usuario.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getColorAccion(registro.accion)}`}
                        >
                          {registro.accion}
                        </span>
                      </TableCell>
                      <TableCell
                        className="text-sm text-gray-700 max-w-[300px] truncate"
                        title={registro.detalles}
                      >
                        {registro.detalles || "Sin detalles"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 text-right font-mono text-xs">
                        {registro.ipBase || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
