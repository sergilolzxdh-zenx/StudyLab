import { Card } from "@/components/ui/Card";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <Card className="max-w-md text-center">
        <h1 className="font-display text-2xl text-text">{title}</h1>
        <p className="mt-3 font-sans text-sm text-text-dim">
          Esta herramienta todavía no está construida — llega en {phase} del
          roadmap de StudyLab.
        </p>
      </Card>
    </div>
  );
}
