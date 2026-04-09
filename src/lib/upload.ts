const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export type TemplateType =
  | "administrativos"
  | "estudiantes"
  | "docentes"
  | "grupos"
  | "materias"
  | "especialidades"
  | "asistencias";

const TEMPLATE_ENDPOINTS: Record<TemplateType, string> = {
  administrativos: "administrativos/plantilla/excel",
  estudiantes: "estudiantes/plantilla/excel",
  docentes: "docentes/plantilla/excel",
  grupos: "grupos/plantilla/excel",
  materias: "materias/plantilla/excel",
  especialidades: "especialidades/plantilla/excel",
  asistencias: "asistencias/plantilla/excel",
};

export async function downloadTemplate(tipo: TemplateType): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const endpoint = TEMPLATE_ENDPOINTS[tipo];
  const response = await fetch(`${API_URL.replace(/\/$/, "")}/${endpoint}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar la plantilla (${response.status})`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const fileNameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i,
  );
  const rawFileName =
    fileNameMatch?.[1] || fileNameMatch?.[2] || `plantilla_${tipo}.xlsx`;
  const fileName = decodeURIComponent(rawFileName);

  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

export async function uploadCsv(
  file: File | null | undefined,
  endpoint: string,
  fieldName = "archivo",
) {
  if (!file) {
    return { ok: false, status: 0, data: { message: "No file provided" } };
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const formData = new FormData();
  formData.append(fieldName, file);

  const url = `${API_URL.replace(/\/$/, "")}/${endpoint}/masivo`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { message: (error as Error).message },
    };
  }
}

export default uploadCsv;
