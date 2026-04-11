"use client";

import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import LoginForm from "./LoginForm";
import Link from "next/link";

export default function LoginCard() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { username: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.username, data.password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
        variant: "success",
        duration: 3000,
      });
    } catch (err: unknown) {
      console.error("Error en login:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error de conexión. Por favor, intenta de nuevo.";
      setError(errorMessage);

      // Mostrar toast de error
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto bg-white rounded-lg shadow-lg">
      <img
        src="/images/logoCetis.png"
        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-3 sm:mb-4"
        alt="Logo CETIS"
      />
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-primary text-center">
        Gestión Académica
      </h2>

      <LoginForm />

      <div className="mt-3 text-center">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-[#691C32] hover:text-[#8E2B4B] underline underline-offset-2"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error de autenticación
              </h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
