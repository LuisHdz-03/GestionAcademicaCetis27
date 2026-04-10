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

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [curp, setCurp] = useState("");

  const enviarSolicitud = async (payload: {
    username: string;
    email?: string;
    curp?: string;
  }) => {
    const res = await fetch(`${API_URL}/auth/olvide-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    return { res, data };
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const { res, data } = await enviarSolicitud({ username: username.trim() });

      if (res.ok && data?.necesitaCorreo) {
        setStep(2);
        toast({
          title: "Verificación adicional",
          description: "Completa los datos solicitados para continuar.",
          variant: "default",
        });
        return;
      }

      if (res.ok) {
        toast({
          title: "Solicitud procesada",
          description:
            "Si los datos son correctos, recibirás instrucciones para restablecer tu contraseña.",
          variant: "success",
        });
        return;
      }

      toast({
        title: "Solicitud procesada",
        description:
          "Si los datos son correctos, recibirás instrucciones para restablecer tu contraseña.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "No fue posible procesar la solicitud",
        description: "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !curp.trim()) return;

    setLoading(true);
    try {
      const { res } = await enviarSolicitud({
        username: username.trim(),
        email: email.trim(),
        curp: curp.trim().toUpperCase(),
      });

      if (res.ok) {
        toast({
          title: "Solicitud procesada",
          description:
            "Si los datos son correctos, recibirás instrucciones para restablecer tu contraseña.",
          variant: "success",
        });
      } else {
        toast({
          title: "Solicitud procesada",
          description:
            "Si los datos son correctos, recibirás instrucciones para restablecer tu contraseña.",
          variant: "default",
        });
      }
    } catch {
      toast({
        title: "No fue posible procesar la solicitud",
        description: "Intenta nuevamente en unos minutos.",
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
        <h1 className="text-2xl font-bold text-[#691C32] text-center mb-2">
          Recuperar Contraseña
        </h1>
        <p className="text-sm text-gray-600 text-center mb-5">
          {step === 1
            ? "Ingresa tu nombre de usuario"
            : "Completa email y CURP para continuar"}
        </p>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#691C32] hover:bg-[#8E2B4B]"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Continuar"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username2">Nombre de usuario</Label>
              <Input
                id="username2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={curp}
                onChange={(e) =>
                  setCurp(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 18),
                  )
                }
                required
                maxLength={18}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#691C32] hover:bg-[#8E2B4B]"
              disabled={loading}
            >
              {loading ? "Procesando..." : "Enviar Solicitud"}
            </Button>
          </form>
        )}

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

