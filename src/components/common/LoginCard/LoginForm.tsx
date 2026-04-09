"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HiEye, HiEyeSlash } from "react-icons/hi2";

interface LoginFormProps {
  onSubmit: (data: { username: string; password: string }) => void;
  isLoading?: boolean;
}

export default function LoginForm({
  onSubmit,
  isLoading = false,
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo Usuario o Correo */}
      <div className="space-y-2">
        <Label htmlFor="username">Usuario o correo</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Ingresa tu usuario o correo"
          value={formData.username}
          onChange={handleChange}
          disabled={isLoading}
          required
          className="w-full"
        />
      </div>

      {/* Campo Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            className="w-full pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <HiEyeSlash className="h-4 w-4 text-gray-500" />
            ) : (
              <HiEye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Botón Submit */}
      <Button
        type="submit"
        className="w-full bg-[#691C32] hover:bg-[#8E2B4B]"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Iniciando sesión...</span>
          </div>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>
    </form>
  );
}
