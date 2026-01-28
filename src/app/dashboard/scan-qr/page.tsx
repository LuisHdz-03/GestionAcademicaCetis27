"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2, User, Calendar, Mail, Phone, MapPin, BookOpen, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from "sonner";


interface Estudiante {
  idEstudiante: number;
  numeroControl: string;
  nombreCompleto: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  curp: string;
  fechaNacimiento: string;
  direccion: string;
  telefono: string;
  semestreActual: number;
  codigoQr: string;
  fechaIngreso: string;
  especialidad: {
    idEspecialidad: number;
    nombre: string;
  };
  fotoUrl: string;
}

export default function ScanQRPage() {
  const { user } = useAuth();
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Efecto para enfocar el input al cargar el componente
  useEffect(() => {
  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  focusInput(); // Al cargar
  window.addEventListener("click", focusInput);

  return () => window.removeEventListener("click", focusInput);
}, []);


  // Función para manejar la redirección al login
  const redirigirALogin = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('token');
    // Redirigir a la página de login
    window.location.href = '/login';
  };

  // Función para buscar un estudiante por número de control
  const buscarEstudiante = async (numeroControl: string) => {
    if (!numeroControl || isLoading) return;
    
    // Limpiar resultados anteriores
    setEstudiante(null);
    setError(null);
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Verificar si hay un token
      if (!token) {
        toast.error('Sesión expirada', {
          description: 'Por favor, inicia sesión nuevamente',
        });
        redirigirALogin();
        return;
      }

      // Realizar la petición al servidor
      const response = await fetch(`http://localhost:4000/api/v1/estudiantes/buscar/${numeroControl}`, {
        headers: {
          'x-token': token,
          'Content-Type': 'application/json',
        },
      });
      
      // Manejar la respuesta
      const data = await response.json();
      
      // Si hay un error de autenticación
      if (response.status === 401) {
        toast.error('Sesión expirada', {
          description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        });
        redirigirALogin();
        return;
      }
      
      // Si hay otro tipo de error
      if (!response.ok) {
        throw new Error(data.message || 'Error al buscar el estudiante');
      }
      
      // Si todo está bien, actualizar el estado con los datos del estudiante
      setEstudiante(data.data);
      toast.success('Estudiante encontrado', {
        description: `Bienvenido ${data.data.nombreCompleto}`,
      });
      
      // Registrar asistencia automáticamente
      try {
        await registrarAsistencia(data.data.idEstudiante);
      } catch (error) {
        console.error('Error al registrar asistencia:', error);
        // No mostramos error al usuario para no interrumpir la experiencia
      }
      
    } catch (err) {
      console.error('Error al buscar estudiante:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar el estudiante');
      
      // Mostrar notificación de error
      toast.error('Error al buscar estudiante', {
        description: err instanceof Error ? err.message : 'Por favor, intente nuevamente',
      });
      
      // Enfocar el input para intentar de nuevo
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para registrar la asistencia
  const registrarAsistencia = async (idEstudiante: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await fetch(`http://localhost:4000/api/v1/estudiantes/${idEstudiante}/asistencia`, {
        method: 'POST',
        headers: {
          'x-token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idUsuarioRegistro: user?.id || (user as any)?.idUsuario,
          tipo: 'entrada',
          observaciones: 'Registro automático por escaneo de QR'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al registrar la asistencia');
      }
      
      toast.success('Asistencia registrada correctamente', {
        description: 'La asistencia se ha registrado exitosamente',
      });
      
    } catch (err) {
      console.error('Error al registrar asistencia:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al registrar la asistencia', {
        description: errorMessage,
      });
    }
  };
  
  // Manejador de entrada de teclado para simular el escáner de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Si se presiona Enter, buscar el estudiante
    if (e.key === 'Enter' && inputRef.current?.value) {
      buscarEstudiante(inputRef.current.value);
      if (inputRef.current) {
        inputRef.current.value = ''; // Limpiar el input después de buscar
      }
    }
  };

  // Verificar que el usuario tenga permiso para acceder a esta página
  if (user?.tipoUsuario !== 'guardia') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso no autorizado</h2>
          <p className="text-gray-600 mb-6">
            No tienes permiso para acceder a esta sección. Por favor, inicia sesión con una cuenta de guardia.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">Registro de Asistencia</h1>
            <p className="text-gray-600">Escanea el código QR de un estudiante o ingresa su número de control</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Guardia: {user?.nombre} {user?.apellidoPaterno}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Sección de entrada de datos */}
          <div className="p-6 border-b">
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="numeroControl" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Control
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <QrCode className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      name="numeroControl"
                      id="numeroControl"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300"
                      placeholder="Escanee el código QR o ingrese el número de control"
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.value && buscarEstudiante(inputRef.current.value)}
                    disabled={isLoading || !inputRef.current?.value}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <span>Buscar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Presione Enter o haga clic en Buscar después de escanear
                </p>
              </div>
            </div>
          </div>

          {/* Sección de resultados */}
          <div className="bg-gray-50 p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Buscando información del estudiante...</p>
              </div>
            ) : error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error al buscar el estudiante</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="rounded-md bg-red-50 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                        onClick={() => setError(null)}
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : estudiante ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {estudiante.nombreCompleto}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {estudiante.especialidad?.nombre} - {estudiante.semestreActual}° Semestre
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <BookOpen className="mr-2 h-4 w-4 text-gray-400" />
                        Número de Control
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {estudiante.numeroControl}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        Fecha de Nacimiento
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(estudiante.fechaNacimiento), 'PPP', { locale: es })}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        Correo Electrónico
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`mailto:${estudiante.email}`} className="text-blue-600 hover:text-blue-500">
                          {estudiante.email}
                        </a>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        Teléfono
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {estudiante.telefono || 'No disponible'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                        Dirección
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {estudiante.direccion || 'No disponible'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Asistencia registrada: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEstudiante(null);
                      if (inputRef.current) {
                        inputRef.current.value = '';
                        inputRef.current.focus();
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Nuevo Escaneo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <QrCode className="mx-auto h-full w-full" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Listo para escanear</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escanea el código QR de un estudiante o ingresa su número de control
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
