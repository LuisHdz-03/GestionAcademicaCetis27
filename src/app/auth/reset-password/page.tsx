"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

const API_URL =
  "http://localhost:4000/api/web";

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Verifica los campos e intenta nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/restablecer-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token.trim(),
          passwordNueva: password,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo restablecer la contraseña.");
      }

      toast({
        title: "Contraseña actualizada",
        description: "Ya puedes iniciar sesión con tu nueva contraseña.",
        variant: "success",
      });
      setToken("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      toast({
        title: "Error",
        description: "No se pudo restablecer la contraseña.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/images/fondoLogin.png")',
      }}
    >
      <Card className="p-6 w-full max-w-md mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-[#691C32] text-center mb-5">
          Restablecer Contraseña
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token de recuperación</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#691C32] hover:bg-[#8E2B4B]"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-[#691C32] hover:text-[#8E2B4B] underline underline-offset-2"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}

