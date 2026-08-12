## Ticket

Closes #

<!-- Un PR = un ticket. Si estás cerrando más de un ticket, divide el PR. -->

## Qué cambia

<!-- Describe el cambio en 2-4 líneas. Qué hace, no cómo. -->

## Criterios de aceptación

<!-- Copia los criterios del issue del ticket y marca cada uno. -->

- [ ]
- [ ]

## Evidencia

<!--
Obligatorio si el ticket toca UI: screenshot o GIF del antes/después.
Para tickets de refactor visual (ej. rebrand de tokens), adjunta ambos estados
de las pantallas afectadas.
Si el ticket no toca UI, escribe "No aplica".
-->

## Verificación local

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:coverage`
- [ ] `npm run build:prod`

## Checklist

- [ ] La rama sigue la convención `<tipo>/INKA-<épica>.<historia>.<ticket>-<slug>`, o el
      ticket no cambia lógica y va directo sobre `develop`
- [ ] Los commits siguen Conventional Commits (subject ≤ 72 caracteres)
- [ ] El PR apunta a `develop` (a `main` solo desde `release/*`, `hotfix/*`, o el PR de
      bootstrap `develop` → `main`)
- [ ] Si el ticket agrega código, incluye su `.spec.ts` — el gate de coverage es 80%
- [ ] No se commitearon tokens, claves ni secretos
