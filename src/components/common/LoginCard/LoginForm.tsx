"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Loader2, Users, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      // Ejecutamos el login normal
      if (!username || !password) {
        setErrorMsg("Llena ambos campos");
        return;
      }
      await login(username, password);
      toast({
        title: "¡Bienvenido!",
        description: "Iniciando sesión correctamente.",
      });
    } catch (error: any) {
      setErrorMsg(error.message || "Usuario o contraseña incorrectos");
      toast({
        title: "Error de autenticación",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <Input
            id="username"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrorMsg(null);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg(null);
            }}
            required
          />
        </div>
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <Button
          type="submit"
          className="w-full bg-[#800000] hover:bg-[#600000] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </div>
  );
}
