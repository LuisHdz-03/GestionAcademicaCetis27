import React from "react";
import CredencialPrint from "@/components/common/credencial/CredencialPrint";
import { Button } from "@/components/ui/button";

export default function DescargarCredencialButton({ alumno }: { alumno: any }) {
  return (
    <div>
      <CredencialPrint estudiante={alumno} />
    </div>
  );
}
