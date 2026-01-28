"use client";

import LoginCard from "@/components/common/LoginCard/LoginCard";

export default function LoginPage() {
  return (
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/images/fondoLogin.png")',
      }}
    >
      <LoginCard /> 
    </div>
  );
}