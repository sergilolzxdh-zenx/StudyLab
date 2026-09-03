"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface Evaluacion {
  id: string;
  nombre: string;
  peso: string;
  nota: string;
}

let nextId = 0;
function makeRow(nombre: string, peso: string): Evaluacion {
  nextId += 1;
  return { id: `row-${nextId}`, nombre, peso, nota: "" };
}

function toNumber(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 font-sans text-sm text-text placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text";

export default function CalculadoraPage() {
  const [objetivo, setObjetivo] = useState("5");
  const [rows, setRows] = useState<Evaluacion[]>(() => [
    makeRow("Parcial 1", "30"),
    makeRow("Parcial 2", "30"),
    makeRow("Examen final", "40"),
  ]);

  function updateRow(id: string, patch: Partial<Evaluacion>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow(`Evaluación ${prev.length + 1}`, "0")]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const objetivoNum = toNumber(objetivo);
  const pesoTotal = rows.reduce((sum, r) => sum + toNumber(r.peso), 0);
  const conocidas = rows.filter((r) => r.nota.trim() !== "");
  const pendientes = rows.filter((r) => r.nota.trim() === "");
  const pesoPendiente = pendientes.reduce((sum, r) => sum + toNumber(r.peso), 0);
  const puntosConocidos = conocidas.reduce((sum, r) => sum + toNumber(r.peso) * toNumber(r.nota), 0);

  let resultado: ReactNode;

  if (pesoTotal <= 0) {
    resultado = (
      <p className="font-sans text-sm text-text-dim">
        Añade al menos una evaluación con su peso para calcular.
      </p>
    );
  } else if (pesoPendiente <= 0) {
    const media = puntosConocidos / pesoTotal;
    const aprueba = media >= objetivoNum;
    resultado = (
      <div>
        <p className="font-display text-3xl text-text">{media.toFixed(2)}</p>
        <p className={cn("mt-1 font-sans text-sm", aprueba ? "text-success" : "text-danger")}>
          {aprueba ? "Alcanzas el objetivo" : "No llegas al objetivo"} con las notas
          introducidas.
        </p>
      </div>
    );
  } else {
    const necesaria = (objetivoNum * pesoTotal - puntosConocidos) / pesoPendiente;
    if (necesaria > 10) {
      resultado = (
        <p className="font-sans text-sm text-danger">
          No es posible llegar a un {objetivoNum} ni sacando un 10 en el resto —
          necesitarías un {necesaria.toFixed(2)}.
        </p>
      );
    } else if (necesaria <= 0) {
      resultado = (
        <p className="font-sans text-sm text-success">
          Objetivo asegurado, aunque saques un 0 en lo que te queda.
        </p>
      );
    } else {
      resultado = (
        <div>
          <p className="font-display text-3xl text-text">{necesaria.toFixed(2)}</p>
          <p className="mt-1 font-sans text-sm text-text-dim">
            Nota media que necesitas en {pendientes.map((r) => r.nombre || "sin nombre").join(", ")}{" "}
            ({pesoPendiente}% del total).
          </p>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl text-text">Calculadora de nota de paso</h1>
        <p className="mt-1 font-sans text-text-dim">
          Añade tus evaluaciones, sus pesos y las notas que ya tengas — calculamos
          qué necesitas en el resto para aprobar.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="objetivo" className="font-sans text-sm text-text">
            Nota objetivo (sobre 10)
          </label>
          <input
            id="objetivo"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="10"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            className={cn(inputClass, "w-24 text-right")}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem_2.5rem] gap-2 font-sans text-xs uppercase tracking-wide text-text-dim">
            <span>Evaluación</span>
            <span>Peso %</span>
            <span>Nota</span>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_4.5rem_4.5rem_2.5rem] items-center gap-2">
              <input
                aria-label="Nombre de la evaluación"
                value={row.nombre}
                onChange={(e) => updateRow(row.id, { nombre: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label="Peso porcentual"
                type="number"
                inputMode="decimal"
                value={row.peso}
                onChange={(e) => updateRow(row.id, { peso: e.target.value })}
                className={cn(inputClass, "text-right")}
              />
              <input
                aria-label="Nota obtenida"
                type="number"
                inputMode="decimal"
                placeholder="—"
                min="0"
                max="10"
                value={row.nota}
                onChange={(e) => updateRow(row.id, { nota: e.target.value })}
                className={cn(inputClass, "text-right")}
              />
              <button
                type="button"
                aria-label={`Eliminar ${row.nombre || "evaluación"}`}
                onClick={() => removeRow(row.id)}
                className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-text-dim transition-colors hover:bg-surface-2 hover:text-danger"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={addRow}>
            + Añadir evaluación
          </Button>
          <span
            className={cn(
              "font-sans text-sm",
              pesoTotal === 100 ? "text-text-dim" : "text-warning"
            )}
          >
            Peso total: {pesoTotal}%
          </span>
        </div>
      </Card>

      <Card>{resultado}</Card>

      <p className="font-sans text-xs text-text-dim">
        Cálculo local en tu navegador — todavía no se guarda entre sesiones (llegará
        al conectar Firestore, en su fase).
      </p>
    </div>
  );
}
