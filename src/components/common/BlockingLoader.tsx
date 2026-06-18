interface BlockingLoaderProps {
  open: boolean;
  title?: string;
  description?: string;
}
// esto solo es para que el usuario no haga algo mas cuando se haga una carga por un archivo excel
export default function BlockingLoader({
  open,
  title = "Procesando información...",
  description = "Por favor espera, no cierres la página.",
}: BlockingLoaderProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in duration-300 rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full border-4 border-[#691C32] border-t-transparent animate-spin" />
          <div>
            <p className="text-xl font-bold text-[#691C32]">{title}</p>
            <p className="mt-1 text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}