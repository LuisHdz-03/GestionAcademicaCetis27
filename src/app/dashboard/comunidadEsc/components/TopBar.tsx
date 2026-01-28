"use client";
import {
  HiMagnifyingGlass,
  HiPlus,
  HiTableCells,
  HiArrowDownTray,
} from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
}

interface Grupo {
  id: number;
  codigo: string;
  semestre: number;
  idEspecialidad: number;
  especialidadNombre?: string;
}

interface UsuarioData {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  password: string;
  tipoUsuario: string;
  activo: boolean;
  curp: string;
  fechaNacimiento: string;
  matricula: string;
  telefono?: string;
}

interface EstudianteData {
  idEspecialidad?: number;
  numeroControl: string;
  curp: string;
  fechaNacimiento: string;
  telefono?: string;
  semestreActual: number;
  idGrupo?: number;
  direccion?: string;
  fechaIngreso?: string;
}

interface AlumnoProcesado {
  carrera: string;
  turno: string;
  semestre: number;
  grupo: string;
  usuario: UsuarioData;
  estudiante: EstudianteData;
}

interface TopBarProps {
  visibleColumns: string[];
  toggleColumn: (column: string) => void;
  activeTab: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedFilter: string;
  onFilterChange: (val: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (n: number) => void;
  filters: string[];
  onAddClick: () => void;
  especialidades?: Especialidad[];
  grupos?: Grupo[];
}

export default function TopBar({
  visibleColumns,
  toggleColumn,
  activeTab,
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  itemsPerPage,
  setItemsPerPage,
  filters,
  onAddClick,
  especialidades = [],
  grupos = [],
}: TopBarProps) {
  /**
   * Convierte un número en notación científica a string decimal completo.
   * @param valor Valor a convertir
   * @returns String sin notación científica
   */
  const convertirNumeroControl = (valor: string): string => {
    if (/[eE]/.test(valor)) {
      const numero = parseFloat(valor);
      return numero.toFixed(0);
    }
    return valor;
  };

  /**
   * Extrae la fecha de nacimiento de una CURP mexicana.
   * @param curp CURP de 18 caracteres
   * @returns Fecha en formato YYYY-MM-DD
   */
  const extraerFechaNacimientoDeCURP = (curp: string): string => {
    if (curp.length < 10) return "";

    const aa = curp.substring(4, 6);
    const mm = curp.substring(6, 8);
    const dd = curp.substring(8, 10);

    const year = parseInt(aa);
    const fullYear = year <= 30 ? 2000 + year : 1900 + year;

    const mes = parseInt(mm);
    const dia = parseInt(dd);

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return "";
    }

    return `${fullYear}-${mm}-${dd}`;
  };

  /**
   * Parsea el texto de un archivo CSV y lo convierte en un arreglo de alumnos procesados.
   * @param csvText Texto del archivo CSV
   * @returns Arreglo de alumnos procesados
   */
  const parseCSV = (csvText: string): AlumnoProcesado[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error(
        "El archivo CSV debe tener al menos una fila de encabezados y una fila de datos.",
      );
    }

    const alumnos: AlumnoProcesado[] = [];
    const errores: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const campos = line.split(",").map((campo) => campo.trim());

      if (campos.length < 9) {
        errores.push(
          `Línea ${i + 1}: No tiene suficientes campos (esperados: 9, encontrados: ${campos.length})`,
        );
        continue;
      }

      const [
        carrera,
        turno,
        semestreStr,
        grupo,
        numeroControl,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        curp,
      ] = campos;

      if (!carrera || !numeroControl || !nombre || !apellidoPaterno || !curp) {
        errores.push(`Línea ${i + 1}: Faltan campos obligatorios`);
        continue;
      }

      // Log para debug

      // Convertir notación científica si existe
      const numeroControlFinal = convertirNumeroControl(numeroControl);

      const semestre = parseInt(semestreStr);
      if (isNaN(semestre) || semestre < 1 || semestre > 6) {
        errores.push(`Línea ${i + 1}: Semestre inválido (${semestreStr})`);
        continue;
      }

      // Buscar especialidad por nombre
      const especialidadNormalizada = carrera.toUpperCase().trim();
      const especialidadEncontrada = especialidades.find(
        (esp) =>
          esp.nombre.toUpperCase().includes(especialidadNormalizada) ||
          especialidadNormalizada.includes(esp.nombre.toUpperCase()) ||
          esp.codigo.toUpperCase() === especialidadNormalizada,
      );

      // Extraer fecha de nacimiento de la CURP
      const fechaNacimiento = extraerFechaNacimientoDeCURP(curp);
      if (!fechaNacimiento) {
        errores.push(
          `Línea ${i + 1}: No se pudo extraer fecha de nacimiento del CURP (${curp})`,
        );
      }

      // Generar email y password a partir del CURP
      const email = `${curp.toLowerCase()}@cetis27.com`;
      const password = curp; // La contraseña será el CURP

      // Estructura para tabla usuarios
      const usuario: UsuarioData = {
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email,
        password,
        tipoUsuario: "alumno",
        activo: true,
        curp,
        fechaNacimiento,
        matricula: numeroControlFinal,
      };

      // Estructura para tabla estudiantes (sin grupo, se asignará después manualmente)
      const estudiante: EstudianteData = {
        idEspecialidad: especialidadEncontrada?.id,
        numeroControl: numeroControlFinal,
        curp,
        fechaNacimiento,
        semestreActual: semestre,
      };

      const alumno: AlumnoProcesado = {
        carrera,
        turno,
        semestre,
        grupo,
        usuario,
        estudiante,
      };

      alumnos.push(alumno);
    }

    // Mostrar errores en consola si los hay
    if (errores.length > 0) {
      console.warn("Errores encontrados al procesar CSV:", errores);
    }

    return alumnos;
  };

  // Función para extraer especialidades únicas del CSV
  const extraerEspecialidadesUnicas = (alumnos: AlumnoProcesado[]) => {
    const especialidadesMap = new Map<
      string,
      { nombre: string; codigo: string }
    >();

    alumnos.forEach((alumno) => {
      const carrera = alumno.carrera.toUpperCase().trim();
      if (!especialidadesMap.has(carrera)) {
        // Generar código automático de 3-4 letras
        const codigo =
          carrera.replace(/[^A-Z]/g, "").substring(0, 4) ||
          carrera.substring(0, 4).toUpperCase();

        especialidadesMap.set(carrera, {
          nombre: alumno.carrera,
          codigo: codigo,
        });
      }
    });

    return Array.from(especialidadesMap.values());
  };

  // Función para extraer grupos únicos del CSV
  const extraerGruposUnicos = (alumnos: AlumnoProcesado[]) => {
    const gruposMap = new Map<
      string,
      { codigo: string; semestre: number; carrera: string }
    >();

    alumnos.forEach((alumno) => {
      if (alumno.grupo) {
        const key = `${alumno.grupo}_${alumno.semestre}_${alumno.carrera}`;
        if (!gruposMap.has(key)) {
          gruposMap.set(key, {
            codigo: alumno.grupo,
            semestre: alumno.semestre,
            carrera: alumno.carrera,
          });
        }
      }
    });

    return Array.from(gruposMap.values());
  };

  // Función auxiliar para descargar JSON
  const descargarJSON = (data: any, nombreArchivo: string) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Función para enviar la carga masiva al backend
  const enviarCargaMasiva = async (alumnos: AlumnoProcesado[]) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('No hay sesión activa. Por favor, inicia sesión nuevamente.');
        return;
      }


      // Mostrar loading
      const loadingMsg = document.createElement('div');
      loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:10000;text-align:center;';
      loadingMsg.innerHTML = `
        <div style="width:40px;height:40px;border:4px solid #691C32;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px;"></div>
        <p style="margin:0;color:#691C32;font-weight:bold;">Procesando ${alumnos.length} alumnos...</p>
        <p style="margin:5px 0 0;font-size:12px;color:#666;">Esto puede tomar unos momentos</p>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;
      document.body.appendChild(loadingMsg);

      const response = await fetch('http://localhost:4000/api/v1/estudiantes/carga-masiva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-token': token, // Agregar también este header por si acaso
        },
        body: JSON.stringify({ alumnos }),
      });

      document.body.removeChild(loadingMsg);


      // Manejar error 401 específicamente
      if (response.status === 401) {
        alert(
          'Sesión expirada o no autorizada\n\n' +
          'Por favor, cierra sesión y vuelve a iniciar sesión.\n\n' +
          'Si el problema persiste, verifica que tu usuario tenga permisos.'
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        const { exitosos, fallidos, total } = data.data;
        
        alert(
          ` Carga completada\n\n` +
          ` RESULTADOS:\n` +
          `Total procesados: ${total}\n` +
          `✓ Exitosos: ${exitosos.length}\n` +
          `✗ Fallidos: ${fallidos.length}\n\n` +
          (fallidos.length > 0 
            ? ` Revisa la consola para ver los detalles de los errores.`
            : ` Todos los alumnos fueron registrados correctamente!`)
        );

        if (fallidos.length > 0) {
          console.error('=== ALUMNOS FALLIDOS ===');
          console.table(fallidos);
        }

        console.table(exitosos);

        // Recargar la página para mostrar los nuevos alumnos
        window.location.reload();
      } else {
        alert(`❌ Error en el servidor:\n\n${data.message}`);
      }

    } catch (error) {
      console.error('Error al enviar carga masiva:', error);
      alert(
        `❌ Error al conectar con el servidor:\n\n` +
        `${error instanceof Error ? error.message : 'Error desconocido'}\n\n` +
        `Verifica que el backend esté ejecutándose.`
      );
    }
  };

  const allColumns = () => {
    switch (activeTab) {
      case "docentes":
        return ["Nombre", "Email", "Teléfono", "Especialidad", "N° Empleado"];
      case "alumnos":
        return ["Nombre", "Email", "Matrícula", "Especialidad", "Semestre"];
      case "administradores":
        return ["Nombre", "Email", "Cargo", "N° Empleado"];
      default:
        return [];
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case "docentes":
        return "Agregar docente";
      case "alumnos":
        return "Agregar alumno";
      case "administradores":
        return "Agregar administrador";
      default:
        return "Agregar";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Left: Search + Filters + Items per page */}
      <div className="flex items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Escribe aquí para buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <Select value={selectedFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-64">
            <SelectValue
              placeholder={`Filtrar por ${
                activeTab === "docentes"
                  ? "especialidad"
                  : activeTab === "alumnos"
                    ? "especialidad"
                    : "cargo"
              }`}
            />
          </SelectTrigger>
          <SelectContent>
            {filters.map((filter) => (
              <SelectItem key={filter} value={filter}>
                {filter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Items per page */}
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(val) => setItemsPerPage(Number(val))}
        >
          <SelectTrigger className="flex-shrink-0 w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 por página</SelectItem>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Mostrar columnas con dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <HiTableCells className="w-4 h-4" />
              Mostrar columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {allColumns().map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns.includes(col)}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv,text/csv";
            input.onchange = (e: Event) => {
              const target = e.target as HTMLInputElement;
              const file = target.files?.[0];
              if (!file) return;

              // Validar que sea un archivo CSV
              if (
                !file.name.toLowerCase().endsWith(".csv") &&
                file.type !== "text/csv"
              ) {
                alert("Por favor, selecciona un archivo CSV válido.");
                return;
              }

              // Validar tamaño del archivo (máximo 5MB)
              if (file.size > 5 * 1024 * 1024) {
                alert(
                  "El archivo es demasiado grande. El tamaño máximo es 5MB.",
                );
                return;
              }

              // Leer contenido del archivo
              const reader = new FileReader();
              reader.onload = () => {
                const text = reader.result as string;

                // Validar que el contenido parezca un CSV
                if (!text || text.startsWith("PK") || text.includes("<?xml")) {
                  alert(
                    "El archivo no parece ser un CSV válido. Asegúrate de seleccionar un archivo CSV de texto plano.",
                  );
                  return;
                }

                // Procesar el CSV
                try {
                  const alumnos = parseCSV(text);

                  if (alumnos.length === 0) {
                    alert("El archivo CSV no contiene datos válidos.");
                    return;
                  }

                  // Extraer especialidades y grupos únicos
                  const especialidadesUnicas =
                    extraerEspecialidadesUnicas(alumnos);
                  const gruposUnicos = extraerGruposUnicos(alumnos);

                  // Generar timestamp para nombres de archivos
                  const timestamp = new Date().getTime();

                  // 1. Descargar especialidades a crear
                  descargarJSON(
                    especialidadesUnicas,
                    `1_especialidades_a_crear_${timestamp}.json`,
                  );

                  // 2. Descargar grupos a crear
                  descargarJSON(
                    gruposUnicos,
                    `2_grupos_a_crear_${timestamp}.json`,
                  );

                  // 3. Descargar alumnos procesados
                  descargarJSON(
                    alumnos,
                    `3_alumnos_procesados_${timestamp}.json`,
                  );


                  // Calcular estadísticas
                  const alumnosConEspecialidad = alumnos.filter(
                    (a) => a.estudiante.idEspecialidad,
                  ).length;
                  const alumnosConGrupo = alumnos.filter(
                    (a) => a.estudiante.idGrupo,
                  ).length;
                  const especialidadesNuevas = especialidadesUnicas.filter(
                    (esp) =>
                      !especialidades.some(
                        (e) =>
                          e.nombre.toUpperCase() === esp.nombre.toUpperCase(),
                      ),
                  ).length;
                  const gruposNuevos = gruposUnicos.filter(
                    (g) =>
                      !grupos.some(
                        (gr) =>
                          gr.codigo.toUpperCase() === g.codigo.toUpperCase() &&
                          gr.semestre === g.semestre,
                      ),
                  ).length;

                  // Preguntar al usuario qué desea hacer
                  const mensaje =
                    `Archivo procesado exitosamente\n\n` +
                    `Total de alumnos: ${alumnos.length}\n` +
                    `Con especialidad encontrada: ${alumnosConEspecialidad}\n` +
                    `Con grupo encontrado: ${alumnosConGrupo}\n\n` +
                    `A CREAR:\n` +
                    `Especialidades nuevas: ${especialidadesNuevas}\n` +
                    `Grupos nuevos: ${gruposNuevos}\n\n` +
                    `¿Qué deseas hacer?\n` +
                    `• OK = Enviar a la base de datos\n` +
                    `• Cancelar = Descargar JSON para revisión`;

                  const enviarABD = confirm(mensaje);

                  if (enviarABD) {
                    enviarCargaMasiva(alumnos);
                  } else {
                    
                    const timestamp = new Date().getTime();
                    descargarJSON(
                      especialidadesUnicas,
                      `1_especialidades_a_crear_${timestamp}.json`,
                    );
                    descargarJSON(
                      gruposUnicos,
                      `2_grupos_a_crear_${timestamp}.json`,
                    );
                    descargarJSON(
                      alumnos,
                      `3_alumnos_procesados_${timestamp}.json`,
                    );
                  }

                } catch (error) {
                  console.error("Error al procesar CSV:", error);
                  alert(
                    `Error al procesar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  );
                }
              };

              reader.onerror = () => {
                alert(
                  "Error al leer el archivo. Por favor, intenta nuevamente.",
                );
              };

              reader.readAsText(file);
            };
            input.click();
          }}
        >
          <HiArrowDownTray className="w-4 h-4" />
          Cargar CSV
        </Button>

        <Button
          className="bg-[#691C32] hover:bg-[#5a1829] text-white flex items-center gap-2"
          onClick={onAddClick}
        >
          <HiPlus className="w-4 h-4" />
          {getAddButtonText()}
        </Button>
      </div>
    </div>
  );
}
