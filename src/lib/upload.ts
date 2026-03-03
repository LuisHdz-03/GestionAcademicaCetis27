const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/web";

export async function uploadCsv(
  file: File | null | undefined,
  endpoint: string,
  fieldName = "archivoExcel",
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
