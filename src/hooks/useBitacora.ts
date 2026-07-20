import { Bitacora } from "@/types/community";
import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Pagination {
  totalRegistros: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface UseBitacoraReturn {
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  pagination: Pagination;
  registrosFiltrados: Bitacora[];
  fetchBitacora: (
    page?: number,
    limit?: number,
    busqueda?: string,
  ) => Promise<void>;
}

export function useBitacora(): UseBitacoraReturn {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState<Bitacora[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    totalRegistros: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchBitacora = useCallback(
    async (page = 1, limit = 20, busqueda = "") => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (busqueda) params.set("busqueda", busqueda);

        const response = await fetch(`${API_URL}/bitacoras?${params}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Error al obtener la bitácora");
        }

        const data = await response.json();
        const bitacora = Array.isArray(data.data) ? data.data : [];
        setRegistros(bitacora);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const registrosFiltrados = registros.filter((reg) => {
    const busqueda = searchTerm.toLowerCase();
    const nombreUsuario = reg.usuario
      ? `${reg.usuario.nombre} ${reg.usuario.apellidoPaterno}`.toLowerCase()
      : "sistema";

    return (
      nombreUsuario.includes(busqueda) ||
      reg.accion.toLowerCase().includes(busqueda) ||
      (reg.detalles ? reg.detalles.toLowerCase().includes(busqueda) : false)
    );
  });

  return {
    loading,
    error,
    searchTerm,
    setSearchTerm,
    pagination,
    registrosFiltrados,
    fetchBitacora,
  };
}
