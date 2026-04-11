import React from "react";
import CredencialPrint from "@/components/common/credencial/CredencialPrint";
import { Button } from "@/components/ui/button";

export function DescargarCredencialButton({ alumno, firmante }: { alumno: any; firmante: any }) {
  return (
    <div>
      <CredencialPrint estudiante={alumno} firmante={firmante} />
    </div>
  );
}

export default DescargarCredencialButton;
