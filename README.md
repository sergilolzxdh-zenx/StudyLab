# StudyLab

Plataforma de estudio todo-en-uno: cuaderno, calendario, resumidor, corrector,
flashcards, asistente de IA, traductor, OCR e historial, con planes
Free / Pro / Premium.

Aplicación nueva construida desde cero — sin versión anterior que preservar.

## Estado

**Fases 1–6 y 15–16 hechas** (arquitectura, design system, landing/auth,
dashboard+nav, Cuaderno, Calendario, Firebase Auth, Firestore). Quedan 16 de 25.

- [x] Scaffold Next.js 16 (App Router, TypeScript estricto, Tailwind v4)
- [x] Design tokens (`apps/web/styles/tokens.css`) — escala monocromática
      compartida entre la UI y el fondo del hero
- [x] Design system base: `Button`, `Input`, `Checkbox`, `Card`, `Spinner`, toasts (Sonner)
- [x] `StarfieldBackground` (Three.js r0.143) montado globalmente en el layout
      raíz — fondo persistente en toda la app (solo en modo oscuro; en claro
      se omite por completo, ya que su paleta es fija-oscura)
- [x] Firebase Authentication — configurado y verificado (registro/login reales)
- [x] `/login`, `/registro`, `/recuperar` — formularios reales con Zod + react-hook-form
- [x] Dashboard protegido (guard real) + navegación + 9 herramientas (placeholders honestos)
- [x] Calculadora de nota de paso — herramienta extra, 100% funcional, sin backend
- [x] Firestore: reglas de seguridad publicadas, modelo `users/{uid}` con
      plan/powermoney, perfil creado y leído en vivo en el dashboard
- [x] Cuaderno: notas reales en `users/{uid}/notes` — crear, buscar, editar
      con autoguardado (debounce 800ms), eliminar con confirmación
- [x] Calendario: vista de mes real + tareas/objetivos en `users/{uid}/tasks`
      (crear, marcar completada, eliminar), con indicador de días con tareas
- [ ] Selector de idioma, resto del contenido de landing
- [ ] Stripe, Gemini — **pendientes** (ver `.env.example`)

**Proveedor de IA: Google Gemini** (decisión del usuario — el master prompt original
proponía Anthropic, se cambió antes de implementar ninguna llamada a IA).

## Desarrollo

```bash
npm --prefix apps/web run dev
```

## Estructura

```
apps/web/     Next.js (frontend)
functions/    Firebase Cloud Functions (backend) — se añade en su fase
```

Ver `.env.example` para las variables de entorno que faltan antes de
conectar Firestore, Stripe y Gemini de forma real.
