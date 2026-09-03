# StudyLab

Plataforma de estudio todo-en-uno: cuaderno, calendario, resumidor, corrector,
flashcards, asistente de IA, traductor, OCR e historial, con planes
Free / Pro / Premium.

Aplicación nueva construida desde cero — sin versión anterior que preservar.

## Estado

**Las 25 fases hechas** (arquitectura, design system, landing/auth,
dashboard+nav, Cuaderno, Calendario, Resumidor, Corrector, Flashcards,
Asistente IA, Traductor, Historial, Firebase Auth, Firestore, backend de IA,
Gemini real, Imágenes/OCR, planes y Stripe, auditoría de seguridad, PWA, pase
responsive/accesibilidad, testing automatizado, optimización). Queda por
delante únicamente el despliegue real (Vercel u otro hosting) con claves de
producción.

- [x] Scaffold Next.js 16 (App Router, TypeScript estricto, Tailwind v4)
- [x] Design tokens (`apps/web/styles/tokens.css`) — escala monocromática
      compartida entre la UI y el fondo del hero
- [x] Design system base: `Button`, `Input`, `Checkbox`, `Card`, `Spinner`, toasts (Sonner)
- [x] `StarfieldBackground` (Three.js r0.143) montado globalmente en el layout
      raíz — fondo persistente en toda la app (solo en modo oscuro; en claro
      se omite por completo, ya que su paleta es fija-oscura)
- [x] Firebase Authentication — configurado y verificado (registro/login reales)
- [x] `/login`, `/registro`, `/recuperar` — formularios reales con Zod + react-hook-form
- [x] Login con Google (`GoogleSignInButton`) — código listo; falta activar el
      proveedor en Firebase Console (Authentication → Sign-in method) y no he
      podido probar el flujo OAuth real por automatización (implicaría
      introducir credenciales de Google, algo que no hago)
- [x] Dashboard protegido (guard real) + navegación + herramientas
- [x] Calculadora de nota de paso — herramienta extra, 100% funcional, sin backend
- [x] Firestore: reglas de seguridad publicadas, modelo `users/{uid}` con
      plan/powermoney, perfil creado y leído en vivo en el dashboard
- [x] Cuaderno: notas reales en `users/{uid}/notes` — crear, buscar, editar
      con autoguardado (debounce 800ms), eliminar con confirmación
- [x] Calendario: vista de mes real + tareas/objetivos en `users/{uid}/tasks`
      (crear, marcar completada, eliminar), con indicador de días con tareas
- [x] Flashcards: mazos y tarjetas en `users/{uid}/flashcardDecks/{id}/cards`
      — crear/editar/eliminar mazos y tarjetas, modo estudio con volteo 3D,
      dificultad grabada por tarjeta (base para repetición espaciada futura)
- [x] Historial: registro real en `users/{uid}/history`, con búsqueda,
      filtro por tipo y abrir/eliminar
- [x] **Backend de IA real — como Route Handlers de Next.js, no Cloud
      Functions.** Firebase Cloud Functions (2ª gen) requieren el plan Blaze
      incluso para desplegar sin usarlas; este proyecto se queda en el plan
      Spark (gratis), así que `aiTextTool`/`aiChat` viven en
      `apps/web/app/api/` y usan Firebase Admin SDK con cuenta de servicio en
      vez de Cloud Functions — desplegable gratis en Vercel o cualquier
      hosting Node. `planConsumeUse` atómico solo cobra un uso si Gemini
      responde con éxito
- [x] **Gemini conectado de verdad** (modelo `gemini-3.6-flash` — el
      `gemini-2.0-flash` inicial está retirado)
- [x] Resumidor, Corrector, Traductor y Asistente IA — las cuatro como
      páginas propias además del panel rápido del dashboard, todas contra
      `aiTextTool`/`aiChat` reales: probadas en el navegador con sesión real
      (resumir/explicar/preguntas/examen, corregir, traducir con selector de
      idioma origen/destino, chat conversacional), cada una genera su
      entrada de historial real y descuenta powermoney solo al tener éxito
- [x] Imágenes/OCR: `/imagenes` sube una foto/captura, `aiOcr` (Route Handler +
      Gemini multimodal) extrae el texto verbatim, y desde ahí se puede
      enviar el resultado al Resumidor, Corrector o Traductor (handoff vía
      `sessionStorage`). Probado con una imagen real generada por `sharp` —
      texto extraído correctamente
- [x] Planes y Stripe: página `/plan` real (uso actual, barra de progreso,
      comparativa Free/Pro/Premium), Checkout Sessions y Billing Portal como
      Route Handlers (`/api/stripe/*`), webhook con verificación de firma e
      idempotencia (`stripeEvents/{id}`) que sincroniza plan/powermoney desde
      Stripe. Firestore rules bloquean que el cliente escriba plan/powermoney/
      stripe*; esos campos solo los toca el webhook con el Admin SDK.
      Verificado en el navegador contra producción: falla con honestidad
      ("No se ha podido iniciar el pago") mientras no haya claves de Stripe
      reales configuradas
- [x] Auditoría de seguridad transversal: revisadas reglas de Firestore,
      guardas de auth en cada Route Handler, validación de entrada (Zod) y
      límites de tamaño, superficie XSS (sin `dangerouslySetInnerHTML` ni
      `eval` en toda la app), fuga de secretos (grep confirma que
      `GEMINI_API_KEY`/`STRIPE_SECRET_KEY`/claves de Admin SDK solo se leen
      en `lib/server/*` y `app/api/*`, nunca en código de cliente), y firma +
      idempotencia del webhook de Stripe. **Encontrado y corregido un fallo
      real**: `checkUsageAvailable`/`consumeUse` comprobaba el saldo en una
      lectura suelta y solo descontaba el uso después de que Gemini
      respondiera con éxito — un usuario podía lanzar varias peticiones en
      paralelo y conseguir respuestas de IA gratis sin límite, porque el
      descuento fallido se ignoraba silenciosamente y la respuesta ya se
      devolvía. Sustituido por `reserveUse`/`refundUse`: una transacción
      atómica reserva el uso ANTES de llamar a Gemini (cierra la carrera) y
      lo reembolsa solo si la llamada falla. Verificado con un test contra el
      emulador: 5 peticiones concurrentes contra un saldo de 2 dejan exactamente
      2 reservas correctas y 3 rechazos, saldo final consistente
- [x] PWA: `app/manifest.ts` (nombre, colores, `start_url: /dashboard`,
      iconos 192/512/512-maskable), icono de marca propio (un destello de 4
      puntas, coherente con el starfield) generado en varios tamaños —
      `app/icon.png`, `app/apple-icon.png`, `public/icons/*` — reemplazando
      los SVG de ejemplo de create-next-app. Service worker en `public/sw.js`
      (solo se registra en producción, nunca en dev, para no chocar con el
      HMR de Turbopack): cachea el shell estático y sirve `/offline` cuando
      no hay red, pero **nunca cachea Firestore, la API de IA ni Stripe** —
      no finge que la app funciona sin conexión para datos reales. Verificado:
      `/manifest.webmanifest` sirve JSON correcto, `<link rel="manifest">`,
      `theme-color` e iconos aparecen en el `<head>`, `/offline` renderiza
      bien. El registro del service worker en sí (`navigator.serviceWorker.register`)
      falla con "unknown error fetching the script" dentro de este entorno
      de navegador sandboxed de Claude Code — confirmé que `/sw.js` se sirve
      con código y sintaxis correctos vía `fetch` normal, así que parece una
      restricción del entorno de automatización y no un bug real, pero no he
      podido confirmar la instalación completa en un navegador de verdad
- [x] Pase final de responsive/accesibilidad: probadas las 12 páginas
      protegidas más landing/login/registro/recuperar a 375px (móvil) con
      una cuenta de prueba real y un mazo/nota reales (limpiados al
      terminar). **Encontrados y corregidos dos bugs reales de layout**: (1)
      el selector de idioma destino del Traductor se salía de la tarjeta y
      quedaba inalcanzable en móvil (los `<select>` no encogían) — arreglado
      con `min-w-0 flex-1`; (2) el header mostraba "Plan" y "Cerrar sesión"
      sueltos junto al botón de menú en móvil en vez de vivir dentro del
      menú desplegable — reorganizado para que ese menú móvil incluya
      cuenta, Plan y cerrar sesión, y el formulario de crear mazo de
      Flashcards ahora apila en vez de comprimir el placeholder. Verificado
      sin overflow horizontal (`scrollWidth === innerWidth`) en las 15
      rutas comprobadas. Contraste de color revisado contra los tokens
      (`--text-dim` ≥ 4.6:1 en claro, ≥ 7.7:1 en oscuro, ambos superan
      WCAG AA), `aria-label` presente en todos los botones de solo icono,
      `focus-visible:ring` consistente en inputs/botones
- [x] Testing automatizado: Vitest configurado (`apps/web/vitest.config.ts`,
      `npm run test`), 30 tests reales en 5 archivos sobre lógica pura sin
      mockear nada — `lib/plans.ts` (invariantes de límites por plan),
      `lib/validation/auth.ts` (email inválido, contraseñas que no
      coinciden, términos sin aceptar, contraseña corta), `lib/utils/
      calendar.ts` (la cuadrícula del calendario siempre tiene 42 días,
      empieza en lunes, sin huecos ni saltos), `lib/utils/date.ts` (los
      límites exactos de "hace N min/h/días" con tiempo simulado), y
      `lib/utils/handoff.ts` (el fallback cuando `sessionStorage` no existe,
      como en SSR, no lanza y devuelve `null`). No hay tests de los
      Route Handlers de IA/Stripe ni de las reglas de Firestore — esos ya se
      verificaron manualmente contra el emulador real durante el desarrollo
      (ver fases anteriores), y montar un entorno de test que levante el
      emulador de Firestore en CI queda fuera de alcance por ahora
- [x] Optimización de producción: **encontrado y corregido un problema real
      de rendimiento** — el fondo Three.js (~450 KB minificado, con post-
      procesado de bloom) se cargaba entero en el bundle inicial de TODAS
      las páginas, incluidas login/registro y las herramientas, aunque es
      puramente decorativo. Separado con `next/dynamic(..., {ssr:false})`
      en `StarfieldBackgroundLoader.tsx` para que cargue en su propio chunk
      después de que la página ya sea interactiva. Verificado con el build
      de producción: el chunk ya no aparece en el HTML pre-renderizado de
      `/login`, y en el navegador se sigue cargando y renderizando bien de
      forma asíncrona. Revisado también: sin `console.log` de depuración en
      todo el código, sin `<img>` sin justificar (la única, en Imágenes/OCR,
      usa una URL `blob:` local que `next/image` no puede optimizar, con
      comentario explicándolo), fuentes ya sirviéndose vía `next/font/google`
      (autohospedadas, sin bloquear el render)
- [ ] **Desplegar de verdad** (Vercel u otro hosting Node) con una cuenta de
      servicio real de Firebase Admin y claves de Stripe reales — hoy solo
      está verificado en local contra el emulador de Firestore

**Proveedor de IA: Google Gemini** (decisión del usuario — el master prompt original
proponía Anthropic, se cambió antes de implementar ninguna llamada a IA).

## Desarrollo

```bash
npm --prefix apps/web run dev
```

Tests unitarios (lógica pura, sin backend):

```bash
npm --prefix apps/web run test
```

Para probar las herramientas de IA en local sin tocar datos de producción:

```bash
firebase emulators:start --only firestore,auth
```

y descomenta `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` en `apps/web/.env.local`
(coméntala de nuevo para volver a apuntar a producción).

## Estructura

```
apps/web/                Next.js — frontend Y backend de IA/Stripe
apps/web/app/api/        Route Handlers: ai-text-tool, ai-chat, ai-ocr,
                          stripe/create-checkout-session,
                          stripe/create-portal-session, stripe/webhook
apps/web/lib/server/     Firebase Admin, guard de auth, planConsumeUse,
                          Gemini, cliente de Stripe
apps/web/lib/plans.ts    Fuente única de verdad de planes (Free/Pro/Premium,
                          límites de powermoney)
```

Ver `.env.example` para las variables de entorno que faltan antes de
conectar Stripe con claves reales y desplegar de verdad.
