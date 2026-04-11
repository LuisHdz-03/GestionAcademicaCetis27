"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Loader2, Users } from "lucide-react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Nuevos estados para los papás
  const [matricula, setMatricula] = useState("");
  const [curp, setCurp] = useState("");
  const [isTutorMode, setIsTutorMode] = useState(false); // <--- El interruptor mágico

  const { login, loginPadre, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isTutorMode) {
        // Ejecutamos el login de padres
        if (!matricula || !curp) {
          toast({
            title: "Error",
            description: "Llena ambos campos",
            variant: "destructive",
          });
          return;
        }
        await loginPadre(matricula, curp);
      } else {
        // Ejecutamos el login normal
        if (!username || !password) {
          toast({
            title: "Error",
            description: "Llena ambos campos",
            variant: "destructive",
          });
          return;
        }
        await login(username, password);
      }

      toast({
        title: "¡Bienvenido!",
        description: "Iniciando sesión correctamente.",
      });
    } catch (error: any) {
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
        {/* === MODO TUTOR === */}
        {isTutorMode ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula del Alumno</Label>
              <Input
                id="matricula"
                placeholder="Ej. 21040497"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="curp">CURP del Alumno</Label>
              <Input
                id="curp"
                type="text"
                placeholder="Ingresa la CURP"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                required
              />
            </div>
          </>
        ) : (
          /* === MODO PERSONAL (Normal) === */
          <>
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full bg-[#800000] hover:bg-[#600000] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isTutorMode ? (
            "Consultar Estatus"
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>

      {/* === BOTÓN PARA CAMBIAR DE MODO === */}

      <Button
        type="button"
        variant="outline"
        className="w-full flex gap-2"
        onClick={() => setIsTutorMode(!isTutorMode)}
      >
        <Users size={16} />
        {isTutorMode ? "Soy Personal del CETIS" : "Soy Padre / Tutor"}
      </Button>
    </div>
  );
}
