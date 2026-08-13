# Backlog — Inka

Descomposición del MVP en **épicas → historias → tickets**. La regla operativa es
**1 ticket = 1 rama = 1 PR**, salvo los tickets sin cambio de lógica (documentación,
plantillas, configuración del repo), que se trabajan directo sobre `develop`
(ver [`CONTRIBUTING.md`](../CONTRIBUTING.md)).

Alcance del MVP: pantalla **Home** (mapa de descubrimiento de tatuadores) y
**Catálogo de Tatuador** (perfil + portafolio), construidas extendiendo el sistema
visual que ya existe en `StartPage` y `ForgotPasswordPage`.

---

## Estado del repositorio al abrir el backlog

El código heredado es de **Ñeque**, una app de entrenadores personales. Antes de construir
Home y Catálogo hay que convertirlo en Inka y dejar el pipeline verde. De ahí la Épica 0.

| Supuesto del diseño Inka       | Realidad del repo                                                 |
| ------------------------------ | ----------------------------------------------------------------- |
| Tokens `--inka-*`              | Tokens `--nq-*`. Cero ocurrencias de "inka" en el código.         |
| Existe `LoginPage`             | No existe. El login es un panel deslizante dentro de `StartPage`. |
| Tailwind instalado             | No hay Tailwind ni PostCSS. El sistema es SCSS puro.              |
| Templates en `.component.html` | No hay ni un `.html` en `src/`. Todo es `template:` inline.       |
| Carpeta `features/`            | La convención es `src/app/pages/`.                                |

Tres bloqueos operativos detectados:

1. **CI roto para PRs.** `ci.yml` exige coverage ≥80% y no existe ni un `.spec.ts`.
   Hoy el gate pasa en verde solo porque Jest no encuentra ninguna suite y nunca llega a
   evaluar el threshold — en cuanto entre el primer `.spec.ts` empieza a medir de verdad.
   Lo resuelve HU-0.2.
2. ~~**Cuenta de `gh` sin permiso de escritura.**~~ Resuelto: `gh auth login` con la cuenta
   `cosyfps` (`admin: true`). El remote va por SSH (`github-personal`).
3. ~~**No existía `develop`.**~~ Resuelto en T-0.1.2.

### Decisiones tomadas

- Rebrand completo `--nq-*` → `--inka-*` con los valores Inka exactos.
- Sin Tailwind: se extiende el sistema SCSS existente.
- El gate de coverage se mantiene en 80%; cada ticket de código incluye su spec.
- Se respeta la convención del repo: `pages/`, standalone, template inline, `styleUrl`.

---

## ÉPICA 0 — Fundación, Identidad Inka y Desbloqueo de CI

> Convierte el esqueleto Ñeque en Inka y deja el pipeline verde **antes** de que entre
> cualquier feature. Sin esta épica ningún PR posterior puede mergear.
>
> **Definición de terminado:** `develop` protegida, CI en verde con coverage real ≥80%,
> tokens `--inka-*` aplicados, y `StartPage`/`ForgotPasswordPage` visualmente idénticas
> salvo por el cambio de paleta.

### HU-0.1 — Infraestructura de Gitflow

Deja el repositorio listo para recibir trabajo: rama de integración, protecciones,
plantillas y el backlog trazable en issues.

| Ticket  | Rama                      | Qué hace                                                                                                                                                                      |
| ------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.1.1 | _(sin PR)_                | **Bloqueante.** Alinear credenciales: `git remote` por SSH (`github-personal`) y `gh auth login` con la cuenta `cosyfps`. Verificar con `gh api repos/... --jq .permissions`. |
| T-0.1.2 | _(sin PR)_                | Crear y publicar `develop` desde `main`. Cambiar el default branch de PRs a `develop`.                                                                                        |
| T-0.1.3 | _(sin PR)_                | Branch protection en `main` y `develop`: required check `ci-gate`, PR obligatorio con **0 aprobaciones**, sin force-push ni borrado de rama. Ver nota de abajo.               |
| T-0.1.4 | `develop` (directo)       | `pull_request_template.md`, `ISSUE_TEMPLATE/` (epic, story, task, bug), `CODEOWNERS`.                                                                                         |
| T-0.1.5 | `develop` (directo)       | `CONTRIBUTING.md`: gitflow, ramas, commits, política de merge.                                                                                                                |
| T-0.1.6 | `develop` (directo)       | Este documento.                                                                                                                                                               |
| T-0.1.7 | _(sin PR)_                | Crear los issues con `gh issue create`: épicas e historias como issues padre con checklist, un issue por ticket. Labels `epic`, `story`, `task`, `blocked`.                   |
| T-0.1.8 | **PR `develop` → `main`** | Bootstrap del gitflow: lleva a `main` la infraestructura de T-0.1.4/0.1.5/0.1.6 y valida que `ci-gate` corre y bloquea. Único PR a `main` que no viene de `release/*`.        |

T-0.1.4, T-0.1.5 y T-0.1.6 no cambian lógica — solo documentación y plantillas — así que van
directo sobre `develop` sin rama propia. El PR de T-0.1.8 los agrupa a los tres.

**Nota sobre T-0.1.3 — por qué 0 aprobaciones.** GitHub no permite aprobar tu propio PR.
En un repo de una sola persona, exigir 1 aprobación bloquearía todos los merges. Se exige
PR + `ci-gate` en verde, que es lo que realmente protege. Si más adelante entran
colaboradores, subir el número es un cambio de un campo.

`enforce_admins` queda en `false` a propósito: el owner puede seguir commiteando directo
sobre `develop` para los tickets sin cambio de lógica. Para cualquier otra cuenta, el push
directo a `main` y `develop` es rechazado.

**Criterios de aceptación:** el PR `develop` → `main` dispara `ci-gate` y no puede mergear
sin él; una cuenta no-admin no puede pushear directo a `main` ni a `develop`.

### HU-0.2 — Desbloquear el gate de coverage

El pipeline exige 80% y no hay tests. Esta historia lo deja en verde con cobertura real.

| Ticket  | Rama                                    | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.2.1 | `ci/INKA-0.2.1-jest-config-fix`         | Dejar la config de Jest realmente operativa. `tsconfig.spec.json`: `"types": ["jasmine"]` → `["jest"]` + `esModuleInterop`. Eliminar el target `test` con builder Karma de `angular.json` (muerto). En `package.json`: `setupFiles` → `setupFilesAfterEnv`, ampliar `transformIgnorePatterns`, añadir `moduleNameMapper` para `ionicons/components/*` y las exclusiones `!src/**/*.model.ts` y `!src/app/shared/mocks/**` en `collectCoverageFrom`. `setup-jest.ts` → `setupZoneTestEnv()`. |
| T-0.2.2 | `test/INKA-0.2.2-start-page-specs`      | Specs de `StartPage`: validación de email, las 4 reglas de password, `formValid`, toggle del panel de login, `isSubmitting`.                                                                                                                                                                                                                                                                                                                                                                |
| T-0.2.3 | `test/INKA-0.2.3-forgot-password-specs` | Specs de `ForgotPasswordPage`: OTP auto-advance, backspace, paste de 6 dígitos, countdown de reenvío, enmascarado de email.                                                                                                                                                                                                                                                                                                                                                                 |
| T-0.2.4 | `ci/INKA-0.2.4-harden-ci-gate`          | Dos falsos verdes. (1) El agregador ignora los jobs en estado `skipped`: cambiar el patrón a `(failure\|cancelled\|skipped)`. (2) El paso "Verify coverage threshold" de `ci.yml` da `NaN` y pasa igual — ver nota abajo.                                                                                                                                                                                                                                                                   |

**Por qué las exclusiones de T-0.2.1:** los mocks de la Épica 1 son arrays constantes sin
funciones. Si entran al denominador de coverage con 0%, hunden el promedio de las 4 métricas
sin que haya nada real que testear.

#### Los tres bugs de T-0.2.1 que no eran evidentes

La config de Jest nunca se había ejecutado. Además de los residuos de Karma/Jasmine, había
tres fallos que impedían correr **cualquier** spec, detectados al validar el ticket con un
spec temporal:

1. **`setupFiles` en vez de `setupFilesAfterEnv`.** `setupFiles` corre antes de que existan
   los globals de Jest, así que `zone-testing` fallaba al parchear `jest.each` con
   `TypeError: Cannot read properties of undefined (reading 'each')`. Reventaba toda suite.
2. **`transformIgnorePatterns` demasiado estrecho.** `@ionic/core` publica ESM en archivos
   `.js` y el patrón del preset solo exceptúa `.mjs` y los locales de Angular, así que
   cualquier spec que importara una página moría con `SyntaxError: Unexpected token 'export'`.
3. **`ionicons/components/ion-icon.js` no resolvía.** ionicons 8 expone ese subpath solo
   bajo la condición `import` y Jest resuelve con `require`/`default`. Se arregla con un
   `moduleNameMapper` acotado; **no** con `customExportConditions`, que es global y rompe
   `dedent`, una dependencia interna de Jest.

**T-0.2.1 no lleva specs a propósito.** Con cero suites, Jest sale temprano y
`collectCoverageFrom` nunca se aplica. En cuanto exista un solo spec la recolección se
activa de verdad, el coverage real cae a ~5% y el `coverageThreshold` de 80% hace fallar
`npm run test:coverage`. La cobertura la aportan T-0.2.2 y T-0.2.3.

#### El segundo falso verde de T-0.2.4

El paso "Verify coverage threshold" de `ci.yml` promedia las 4 métricas de
`coverage/coverage-summary.json`. Sin tests, Jest escribe un summary vacío donde cada `pct`
es el string `"Unknown"`, así que el cálculo da `NaN`; como `NaN < 80` es `false`, el job
imprime `OK: Coverage NaN% >= 80%` y pasa. T-0.2.4 debe validar que el summary traiga
archivos y que las 4 métricas sean numéricas antes de comparar.

**Orden:** T-0.2.1 primero. La historia va antes de HU-0.4 para no escribir specs de páginas
que después se borran.

**Criterios de aceptación:** `npm run lint && npm run typecheck && npm run test:coverage && npm run build:prod`
pasa limpio y `ci-gate` reporta verde en un PR.

### HU-0.3 — Design tokens Inka

| Ticket  | Rama                                    | Qué hace                                                                                                                                                                                                                                               |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-0.3.1 | `refactor/INKA-0.3.1-inka-token-rename` | Rename **atómico** `--nq-*` → `--inka-*` en `_palette.scss`, `_components.scss`, `_utilities.scss`, `styles.scss` (incluido el remapeo de variables Ionic) y los `.scss` de páginas. Clases `.nq-*` → `.inka-*` y keyframes. **Sin cambios de valor.** |
| T-0.3.2 | `feat/INKA-0.3.2-inka-color-values`     | Aplicar los valores Inka exactos y resolver los dos conflictos de abajo. DoD: screenshots antes/después de `StartPage` y `ForgotPasswordPage` en el PR.                                                                                                |

T-0.3.1 **no es divisible**: separar el palette de sus referencias rompe el build.

#### Mapeo de tokens

```scss
--inka-gradient-start: #7eeac4; // era --nq-gradient-start #7eeacc
--inka-gradient-end: #12a7c6; // era --nq-gradient-end   #00b4d8
--inka-primary: #16b899; // era --nq-primary        #2cb5a0
--inka-primary-dark: #0e8f79; // era --nq-primary-dark   #0d9488
--inka-ink: #0f172a; // era --nq-text           #1a2b2a
--inka-muted: #64748b; // era --nq-text-secondary #5a706d
--inka-surface: #ffffff; // era --nq-bg
--inka-error: #e5484d; // era --nq-danger         #ef4444
--inka-success: #16a34a; // era --nq-success        #2e7d32
--radius-pill: 999px; // era --nq-radius-full    9999px
--radius-card: 20px; // era --nq-radius-lg      20px  (mismo valor)
```

#### Conflictos a resolver dentro de T-0.3.2

1. **Colisión de `surface`.** `--inka-surface: #FFFFFF` corresponde a lo que hoy es
   `--nq-bg`. Pero `--nq-surface: #f7faf9` es un token distinto que usan cards, chips
   inactivos y estados. Se resuelve con `--inka-surface: #FFFFFF` +
   `--inka-surface-alt: #F7FAF9` + `--inka-surface-2: #EEF5F3`. El chip inactivo del Home
   usa `--inka-surface-alt`.
2. **Tokens sin equivalente en la lista Inka** que el sistema sí usa y hay que conservar
   renombrados: `--nq-gradient-mid` (el hero es un gradiente de 3 paradas), `--nq-accent`,
   `--nq-text-muted`, `--nq-border`/`-hover`/`-solid`, `--nq-warning`, la escala completa de
   radios (`xs/sm/md/lg/xl`), sombras, transiciones y tokens de layout.
   `--inka-gradient-mid` se recalcula interpolando entre los nuevos start y end.
   Recordar los tripletes `-rgb` que consumen los `rgba()` de `_components.scss`.

### HU-0.4 — Rebrand del proyecto y limpieza de Ñeque

| Ticket  | Rama                                          | Qué hace                                                                                                                                                                                                                    |
| ------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.4.1 | `chore/INKA-0.4.1-rename-angular-project`     | `package.json` name → `ui-any-inka-mobile-app`; `angular.json` project `neque` → `inka` y `outputPath` → `dist/inka`; `capacitor.config.ts` → `appId: 'com.duocuc.inka'`, `appName: 'Inka'`, `webDir: 'dist/inka/browser'`. |
| T-0.4.2 | `chore/INKA-0.4.2-remove-trainer-pages`       | Eliminar `src/app/pages/trainer/**` y sus 4 rutas (3 apuntan al mismo `DashboardPage`). Corregir el comentario "FitConnect" de `commitlint.config.js` — tercer nombre de proyecto en el repo.                               |
| T-0.4.3 | `docs/INKA-0.4.3-readme`                      | `README.md` (hoy 0 bytes): setup, scripts, gitflow, cómo obtener el token de Mapbox.                                                                                                                                        |
| T-0.4.4 | _(sin PR — `CLAUDE.md` está en `.gitignore`)_ | Mantener `CLAUDE.md` alineado con el estado real del repo tras cada ticket de rebrand. Es un archivo local, no versionado: no genera PR y hay que actualizarlo a mano en cada máquina. Ver nota de abajo.                   |

**Nota sobre T-0.4.4.** Además del rebrand, `CLAUDE.md` tiene una sección "Formato PR" que
apunta a Jira (`PFMX`, `jira.falabella.tech`), heredada de otro repositorio. Inka usa GitHub
Issues con `Closes #NN`, que es lo que implementa `.github/pull_request_template.md`.
Esa sección debe reemplazarse o eliminarse para que no haya dos formatos en conflicto.

### HU-0.5 — Higiene del sistema de estilos

> Prerrequisito real de la Épica 1: Home añade bastante SCSS y el budget de
> `anyComponentStyle` es de **8kb por componente**.

| Ticket  | Rama                                               | Qué hace                                                                                                                                                                                                                                                                            |
| ------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.5.1 | `refactor/INKA-0.5.1-split-mixins-from-components` | Separar `_components.scss` en `_mixins.scss` (solo `@mixin`/`%placeholder`) y `_components.scss` (clases globales). Hoy cada página hace `@use '.../components' as *` mientras `styles.scss` **también** lo importa global: cada stylesheet recibe una copia scoped de ~600 líneas. |
| T-0.5.2 | `fix/INKA-0.5.2-dedupe-state-divider-classes`      | Resolver duplicados con valores en conflicto entre `_components.scss` y `_utilities.scss`: `.inka-state`, `.inka-state-icon`, `.inka-state-title`, `.inka-state-desc`, `.inka-divider`.                                                                                             |
| T-0.5.3 | `refactor/INKA-0.5.3-scss-use-migration`           | Migrar `styles.scss` de `@import` (deprecado en Sass) a `@use`.                                                                                                                                                                                                                     |
| T-0.5.4 | `feat/INKA-0.5.4-self-host-inter-font`             | `'Inter'` está en el token de tipografía pero **nunca se carga**: sin `@font-face`, sin link en `index.html`, `src/assets/` vacío. Self-hostear en `src/assets/fonts/` o quitarla del token.                                                                                        |

---

## ÉPICA 1 — Home: Mapa de Descubrimiento

> Pantalla principal: mapa a pantalla completa con tatuadores como burbujas, filtros por
> estilo, preview al tap y navegación inferior fija.
>
> **Definición de terminado:** `/home` carga el mapa con los 6 tatuadores mock, los chips
> filtran marcadores en vivo, el tap abre la card preview y la preview navega al catálogo.

### HU-1.1 — Modelo de dominio y datos mock

| Ticket  | Rama                                  | Qué hace                                                                                                                                                                                                                                  |
| ------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1.1.1 | `feat/INKA-1.1.1-tattoo-artist-model` | `src/app/shared/models/tattoo-artist.model.ts`: `TattooArtist`, `PortfolioImage`, `GeoPoint`, y union types `TattooStyle` y `Availability`.                                                                                               |
| T-1.1.2 | `feat/INKA-1.1.2-mock-artists`        | `src/app/shared/mocks/mock-artists.ts`: 6 tatuadores con coords reales de Santiago (Bellavista, Providencia, Barrio Italia, Ñuñoa, Lastarria, Franklin), estilos, zona, precio CLP, rating, disponibilidad y portafolio de 8–12 imágenes. |
| T-1.1.3 | `feat/INKA-1.1.3-artist-service`      | `ArtistService` (`providedIn: 'root'`) con `getAll()` y `getById(id)` sobre el mock — punto único de cambio cuando entre el backend. **+ spec.**                                                                                          |

`tsconfig.json` tiene `noUncheckedIndexedAccess` y `noPropertyAccessFromIndexSignature`
activos: todo acceso indexado devuelve `T | undefined`. Modelar con eso desde el inicio.

### HU-1.2 — Shell de layout + bottom nav

| Ticket  | Rama                                        | Qué hace                                                                                                              |
| ------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| T-1.2.1 | `feat/INKA-1.2.1-main-layout-shell`         | `MainLayoutPage` reutilizable con el patrón de tab activa que se conserva abajo. **+ spec.**                          |
| T-1.2.2 | `feat/INKA-1.2.2-bottom-nav-tabs`           | 4 tabs: Home, Explorar, Favoritos, Chat (iconos Lucide individuales).                                                 |
| T-1.2.3 | `feat/INKA-1.2.3-child-routes-placeholders` | Rutas hijas en `app.routes.ts`; Explorar/Favoritos/Chat usan el `page-state.component.ts` existente como placeholder. |
| T-1.2.4 | `fix/INKA-1.2.4-ios-safe-area-tabs`         | `env(safe-area-inset-bottom)` sobre `--inka-tab-height` / `--inka-tab-bottom`.                                        |

#### Patrón de tab activa (conservado de `trainer-layout.page.ts`)

T-0.4.2 eliminó `src/app/pages/trainer/`, que era el único lugar donde vivía este patrón.
Se conserva aquí porque T-1.2.1 lo reimplementa en `MainLayoutPage`:

```ts
private readonly activeTab = toSignal(
  this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map(e => e.urlAfterRedirects.split('?')[0]),
  ),
  { initialValue: this.router.url.split('?')[0] },
);

isActive(path: string): boolean {
  return this.activeTab()?.startsWith(path) ?? false;
}
```

El `?? false` no es opcional: `noUncheckedIndexedAccess` hace que `split('?')[0]` sea
`string | undefined`, así que `activeTab()` puede ser `undefined`.

### HU-1.3 — Header compacto + chips de estilo

| Ticket  | Rama                                   | Qué hace                                                                                                                                                                             |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-1.3.1 | `feat/INKA-1.3.1-home-page-scaffold`   | `HomePage` standalone en `src/app/pages/home/` (template inline + `styleUrl`), ruta `/home` lazy. **+ spec.**                                                                        |
| T-1.3.2 | `feat/INKA-1.3.2-home-compact-header`  | Gradiente de `.hero` reducido a `--inka-header-height`, search pill (reusa `.inka-search`), botón de filtros, avatar (reusa `.inka-avatar`). `openFilters()` queda como placeholder. |
| T-1.3.3 | `feat/INKA-1.3.3-style-chips-scroller` | Chips scrollables horizontales con signal `activeStyle`: fondo `--inka-primary` activo / `--inka-surface-alt` inactivo, `--radius-pill`. Scroll con `.inka-scroll`.                  |
| T-1.3.4 | `feat/INKA-1.3.4-artist-filter-signal` | `computed` que filtra por chip activo + texto de búsqueda. Alimenta el mapa en HU-1.5. **+ spec.**                                                                                   |

### HU-1.4 — Integración Mapbox

| Ticket  | Rama                                          | Qué hace                                                                                                                                                                                                                 |
| ------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-1.4.1 | `chore/INKA-1.4.1-add-mapbox-dependency`      | `npm i mapbox-gl` + `npm i -D @types/mapbox-gl`; añadir `mapbox-gl/dist/mapbox-gl.css` a `styles` en `angular.json`.                                                                                                     |
| T-1.4.2 | `ci/INKA-1.4.2-environment-file-replacements` | `mapboxToken` en `environment.ts`/`.prod.ts`. **Añadir `fileReplacements` a `angular.json`**: hoy no existe, así que `environment.prod.ts` es código muerto y un build de prod usa el de dev. **No commitear el token.** |
| T-1.4.3 | `feat/INKA-1.4.3-map-init-outside-zone`       | Init en `ngAfterViewInit` dentro de `NgZone.runOutsideAngular` — si no, cada frame de pan/zoom dispara change detection. `map.remove()` en `ngOnDestroy`. **+ spec.**                                                    |
| T-1.4.4 | `feat/INKA-1.4.4-custom-map-style`            | Base `mapbox://styles/mapbox/light-v11` + sección en README de cómo clonarlo en Mapbox Studio: bajar saturación de agua/vegetación, ocultar POIs de terceros, fondo gris-verde afín a `--inka-gradient-start`.           |
| T-1.4.5 | `feat/INKA-1.4.5-map-loading-error-states`    | Estados de carga/error (reusa `.inka-state*`) y fallback legible si falta el token.                                                                                                                                      |
| T-1.4.6 | `perf/INKA-1.4.6-verify-lazy-chunk-budgets`   | `mapbox-gl` pesa ~230kb gzip. Home es lazy, así que debería caer en su propio chunk y no en `initial` (500kb warn / 1mb error). Confirmar con `build:prod`.                                                              |

### HU-1.5 — Marcadores y clustering

| Ticket  | Rama                                        | Qué hace                                                                                                                                                                              |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1.5.1 | `feat/INKA-1.5.1-artist-bubble-marker`      | Marcador burbuja: foto circular + borde `--inka-primary` + sombra, como `Marker` HTML custom de Mapbox.                                                                               |
| T-1.5.2 | `feat/INKA-1.5.2-supercluster-clustering`   | Clustering con `supercluster` recalculado en `moveend`. Descarta el bucketing por coordenada redondeada: es de radio fijo y agrupa mal al cambiar zoom. **+ spec de la lógica pura.** |
| T-1.5.3 | `feat/INKA-1.5.3-cluster-badge-zoom`        | Badge "+N" en clusters; tap → `easeTo` con zoom de expansión.                                                                                                                         |
| T-1.5.4 | `feat/INKA-1.5.4-sync-markers-with-filters` | Sincronizar marcadores con el `computed` de filtros de T-1.3.4.                                                                                                                       |

### HU-1.6 — Card preview flotante

| Ticket  | Rama                                         | Qué hace                                                                                                                                                                      |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1.6.1 | `feat/INKA-1.6.1-artist-preview-card`        | `ArtistPreviewCardComponent` en `src/app/shared/components/`, reusando `.inka-card` (`--radius-card`) y `.inka-badge`. Foto, nombre, estilos, rating, "desde $X". **+ spec.** |
| T-1.6.2 | `feat/INKA-1.6.2-preview-card-enter-dismiss` | Entrada con el keyframe `inka-fade-up` existente; cierre por tap fuera o swipe down.                                                                                          |
| T-1.6.3 | `feat/INKA-1.6.3-preview-card-navigation`    | Tap en la card → `/artist/:id`.                                                                                                                                               |

---

## ÉPICA 2 — Catálogo de Tatuador

> Perfil + portafolio estilo Cove.so. Depende solo de HU-1.1 (el modelo), así que puede
> avanzar en paralelo a HU-1.3…1.6.
>
> **Definición de terminado:** `/artist/:id` renderiza portada, identidad, filtro y grid;
> el tap abre el lightbox; "Contactar" abre WhatsApp o Instagram.

### HU-2.1 — Shell del perfil + header con portada

| Ticket  | Rama                                      | Qué hace                                                                                                                           |
| ------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T-2.1.1 | `feat/INKA-2.1.1-artist-catalog-scaffold` | `ArtistCatalogPage` standalone en `src/app/pages/artist-catalog/`, ruta `/artist/:id` lazy. **+ spec.**                            |
| T-2.1.2 | `feat/INKA-2.1.2-artist-route-resolution` | Resolver el artista desde `ArtistService`; id inexistente → `page-state.component.ts` en modo error. **+ spec del caso inválido.** |
| T-2.1.3 | `feat/INKA-2.1.3-cover-header-gradient`   | Header con cover + overlay `linear-gradient(to bottom, transparent, var(--inka-surface))` para legibilidad del nombre.             |
| T-2.1.4 | `feat/INKA-2.1.4-catalog-back-button`     | Botón back reusando el mixin `inka-nav-back`.                                                                                      |

### HU-2.2 — Bloque de identidad

| Ticket  | Rama                                    | Qué hace                                                                           |
| ------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| T-2.2.1 | `feat/INKA-2.2.1-artist-identity-block` | Nombre artístico en `--inka-ink` sobre `--inka-surface`, zona, "desde $X", rating. |
| T-2.2.2 | `feat/INKA-2.2.2-identity-style-chips`  | Chips de estilo reutilizando el componente visual de T-1.3.3.                      |

### HU-2.3 — Filtro pills del portafolio

| Ticket  | Rama                                      | Qué hace                                                                                                                           |
| ------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T-2.3.1 | `feat/INKA-2.3.1-portfolio-filter-pills`  | Pills All / Blackwork / Fine Line / Color… derivadas **dinámicamente** de los estilos presentes en el portafolio, no hardcodeadas. |
| T-2.3.2 | `feat/INKA-2.3.2-portfolio-filter-signal` | `computed` que filtra el grid. **+ spec.**                                                                                         |

### HU-2.4 — Grid masonry del portafolio

| Ticket  | Rama                                       | Qué hace                                                                                                                     |
| ------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| T-2.4.1 | `feat/INKA-2.4.1-masonry-grid-layout`      | 2 columnas tipo masonry vía CSS `columns: 2` con `break-inside: avoid`, `--radius-card`, gap generoso. **+ spec de render.** |
| T-2.4.2 | `perf/INKA-2.4.2-lazy-images-aspect-ratio` | `loading="lazy"` + `decoding="async"` + `aspect-ratio` desde el modelo para evitar layout shift.                             |
| T-2.4.3 | `feat/INKA-2.4.3-portfolio-skeletons`      | Skeletons durante la carga reusando `.inka-skeleton-card` de `_utilities.scss`.                                              |

### HU-2.5 — Lightbox de imagen completa

| Ticket  | Rama                                         | Qué hace                                                                                                                                                          |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-2.5.1 | `feat/INKA-2.5.1-lightbox-overlay`           | Overlay full-screen reusando `.inka-overlay`; tap en una foto lo abre. **+ spec.**                                                                                |
| T-2.5.2 | `feat/INKA-2.5.2-lightbox-swipe-nav`         | Swipe horizontal entre imágenes del set filtrado.                                                                                                                 |
| T-2.5.3 | `feat/INKA-2.5.3-lightbox-back-button-close` | Cerrar con el botón back de Android. `@capacitor/app` no está en dependencias; se resuelve sin plugin con `history.pushState` + `popstate`, que además cubre iOS. |

### HU-2.6 — Disponibilidad + CTA Contactar

| Ticket  | Rama                                           | Qué hace                                                                                                                                                  |
| ------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-2.6.1 | `feat/INKA-2.6.1-availability-pill`            | Pill informativa: "Disponible esta semana" en `--inka-success` / "Agenda llena" en gris. **Sin botón de reserva** (fuera de MVP).                         |
| T-2.6.2 | `feat/INKA-2.6.2-contact-cta-button`           | CTA fijo inferior, pill `--inka-primary`, texto "Contactar". Respeta la safe area de T-1.2.4.                                                             |
| T-2.6.3 | `feat/INKA-2.6.3-whatsapp-instagram-deeplinks` | Deep links `https://wa.me/<num>?text=` y `https://ig.me/m/<user>` vía `window.open(url, '_system')`. Hook de analytics como TODO documentado. **+ spec.** |

---

## ÉPICA 3 — Release v0.1.0

> **Definición de terminado:** el tag `v0.1.0` produce un GitHub Release con APK y IPA
> descargables.

### HU-3.1 — QA de integración

| Ticket  | Rama                                       | Qué hace                                                                                                                                                                  |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-3.1.1 | `test/INKA-3.1.1-integration-qa-checklist` | Recorrido Home → tap marcador → preview → catálogo → lightbox → Contactar. Safe areas iOS/Android, bloqueo de landscape, estados vacíos y de error. Checklist en `docs/`. |

### HU-3.2 — Plataformas nativas (iOS + Android)

| Ticket  | Rama                                        | Qué hace                                                                                                                                                                               |
| ------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-3.2.1 | `chore/INKA-3.2.1-capacitor-add-android`    | `npx cap add android`. Hoy `/android` no existe (gitignored, nunca se corrió `cap add`). Verificar el APK vía `gradlew assembleRelease`.                                               |
| T-3.2.2 | `chore/INKA-3.2.2-capacitor-add-ios`        | `npx cap add ios`. Mismo caso. Verificar el archive en macOS y la generación del IPA.                                                                                                  |
| T-3.2.3 | `ci/INKA-3.2.3-fix-release-workflow-native` | `release.yml` construye APK y archive iOS **sin firma**. Definir el esquema de firma (keystore Android, certificado/provisioning iOS como secrets) para producir binarios instalables. |

### HU-3.3 — Corte de release

| Ticket  | Rama                                      | Qué hace                                                                                                      |
| ------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| T-3.3.1 | `chore/INKA-3.3.1-version-bump-changelog` | Bump de versión en `package.json` + `CHANGELOG.md`. PR a `develop`.                                           |
| T-3.3.2 | `release/0.1.0`                           | Rama de release desde `develop` → PR a `main` (merge normal), tag `v0.1.0`, back-merge de `main` a `develop`. |

---

## Resumen

| Épica                     | Historias | Tickets | PRs                                   |
| ------------------------- | --------- | ------- | ------------------------------------- |
| 0 — Fundación e Identidad | 5         | 22      | 15 (4 sin PR, 3 directo en `develop`) |
| 1 — Home / Mapa           | 6         | 24      | 24                                    |
| 2 — Catálogo              | 6         | 17      | 17                                    |
| 3 — Release               | 3         | 6       | 5 + 1 a `main`                        |
| **Total**                 | **20**    | **69**  | **~61 a `develop` + 2 a `main`**      |

### Orden de ejecución

- **Épica 0**: secuencial por historia (0.1 → 0.2 → 0.3 → 0.4 → 0.5).
- **Épica 1**: HU-1.1 y HU-1.2 en paralelo; luego 1.3 → 1.4 → 1.5 → 1.6 en cadena.
- **Épica 2**: solo depende de HU-1.1; puede avanzar en paralelo a HU-1.3…1.6.
- **Épica 3**: al final, con las Épicas 1 y 2 integradas en `develop`.

Dentro de cada historia los tickets son secuenciales salvo donde se indique.

---

## Tablero de ejecución

Lista plana en orden de trabajo. Estados: ✅ mergeado · 🔄 PR abierto · ⬜ pendiente · 🚫 bloqueado.

Cada ticket tiene su issue en GitHub. Se crean por épica con:

```bash
bash scripts/create-issues.sh <numero-de-epica>
```

El script lee `scripts/backlog.tsv`, crea la épica, sus historias y sus tickets ya
enlazados con checklists, y es idempotente: si vuelves a correrlo tras editar el TSV,
reutiliza los issues existentes en vez de duplicarlos. Usa `--dry-run` para simular.

### Épica 0 — Fundación

| #   | Ticket  | Rama                                               | Estado                                        |
| --- | ------- | -------------------------------------------------- | --------------------------------------------- |
| 01  | T-0.1.1 | _(sin PR)_ alinear credenciales git/gh             | ✅ `gh` = `cosyfps` (admin)                   |
| 02  | T-0.1.2 | _(sin PR)_ crear `develop`                         | ✅                                            |
| 03  | T-0.1.4 | `develop` (directo)                                | ✅                                            |
| 04  | T-0.1.5 | `develop` (directo)                                | ✅                                            |
| 05  | T-0.1.6 | `develop` (directo)                                | ✅                                            |
| 06  | T-0.1.8 | PR `develop` → `main`                              | 🔄 PR #2 — arrastra tambien T-0.4.3           |
| 07  | T-0.1.3 | _(sin PR)_ branch protection                       | ✅ `ci-gate` + PR obligatorio, 0 aprobaciones |
| 08  | T-0.1.7 | _(sin PR)_ crear issues                            | ✅ Épica 0 creada como issues #4 a #31        |
| 09  | T-0.2.1 | `ci/INKA-0.2.1-jest-config-fix`                    | 🔄 PR #32 — +3 bugs no documentados           |
| 10  | T-0.2.2 | `test/INKA-0.2.2-start-page-specs`                 | 🔄 PR #33 — 22 tests                          |
| 11  | T-0.2.3 | `test/INKA-0.2.3-forgot-password-specs`            | 🔄 PR #34 — 34 tests                          |
| 12  | T-0.2.4 | `ci/INKA-0.2.4-harden-ci-gate`                     | 🔄 PR #35 — mergea el ultimo                  |
| 13  | T-0.3.1 | `refactor/INKA-0.3.1-inka-token-rename`            | ⬜                                            |
| 14  | T-0.3.2 | `feat/INKA-0.3.2-inka-color-values`                | ⬜                                            |
| 15  | T-0.4.1 | `chore/INKA-0.4.1-rename-angular-project`          | ⬜                                            |
| —   | T-0.4.2 | `chore/INKA-0.4.2-remove-trainer-pages`            | 🔄 PR #3 — prerrequisito de HU-0.2            |
| 16  | T-0.4.3 | _(sin rama)_ `README.md` dentro del PR #2          | 🔄 adelantado, viaja en el PR #2              |
| —   | T-0.4.4 | _(sin PR)_ `CLAUDE.md` local                       | ✅ se mantiene a mano                         |
| 17  | T-0.5.1 | `refactor/INKA-0.5.1-split-mixins-from-components` | ⬜                                            |
| 18  | T-0.5.2 | `fix/INKA-0.5.2-dedupe-state-divider-classes`      | ⬜                                            |
| 19  | T-0.5.3 | `refactor/INKA-0.5.3-scss-use-migration`           | ⬜                                            |
| 20  | T-0.5.4 | `feat/INKA-0.5.4-self-host-inter-font`             | ⬜                                            |

#### Orden de merge de HU-0.2

Los cuatro PRs de la historia van **apilados**: cada rama nace de la anterior porque todas
necesitan la configuración de Jest de T-0.2.1. GitHub reapunta cada PR a `develop` a medida
que el anterior mergea.

```
#32 (T-0.2.1) → #33 (T-0.2.2) → #34 (T-0.2.3) → #3 (T-0.4.2) → #35 (T-0.2.4)
```

Dos restricciones que no son negociables:

1. **#3 entra antes que #35.** `dashboard.page.ts` y `trainer-layout.page.ts` suman 235
   statements sin un solo test. Con ellos dentro del denominador la historia se queda en
   75.86% de statements; sin ellos sube a 88.44% y las 4 métricas pasan.
2. **#35 mergea el último.** Endurece el guard de coverage para que un reporte vacío sea
   fallo explícito. Si entra antes que los specs, bloquea `develop` por completo.

Ningún PR de la cadena puede pasar `ci-gate` por sí solo: la historia se integra como
bloque. Es la excepción prevista en `CONTRIBUTING.md` para historias que levantan la
cobertura desde cero.

### Épica 1 — Home / Mapa

| #   | Ticket  | Rama                                          | Estado |
| --- | ------- | --------------------------------------------- | ------ |
| 21  | T-1.1.1 | `feat/INKA-1.1.1-tattoo-artist-model`         | ⬜     |
| 22  | T-1.1.2 | `feat/INKA-1.1.2-mock-artists`                | ⬜     |
| 23  | T-1.1.3 | `feat/INKA-1.1.3-artist-service`              | ⬜     |
| 24  | T-1.2.1 | `feat/INKA-1.2.1-main-layout-shell`           | ⬜     |
| 25  | T-1.2.2 | `feat/INKA-1.2.2-bottom-nav-tabs`             | ⬜     |
| 26  | T-1.2.3 | `feat/INKA-1.2.3-child-routes-placeholders`   | ⬜     |
| 27  | T-1.2.4 | `fix/INKA-1.2.4-ios-safe-area-tabs`           | ⬜     |
| 28  | T-1.3.1 | `feat/INKA-1.3.1-home-page-scaffold`          | ⬜     |
| 29  | T-1.3.2 | `feat/INKA-1.3.2-home-compact-header`         | ⬜     |
| 30  | T-1.3.3 | `feat/INKA-1.3.3-style-chips-scroller`        | ⬜     |
| 31  | T-1.3.4 | `feat/INKA-1.3.4-artist-filter-signal`        | ⬜     |
| 32  | T-1.4.1 | `chore/INKA-1.4.1-add-mapbox-dependency`      | ⬜     |
| 33  | T-1.4.2 | `ci/INKA-1.4.2-environment-file-replacements` | ⬜     |
| 34  | T-1.4.3 | `feat/INKA-1.4.3-map-init-outside-zone`       | ⬜     |
| 35  | T-1.4.4 | `feat/INKA-1.4.4-custom-map-style`            | ⬜     |
| 36  | T-1.4.5 | `feat/INKA-1.4.5-map-loading-error-states`    | ⬜     |
| 37  | T-1.4.6 | `perf/INKA-1.4.6-verify-lazy-chunk-budgets`   | ⬜     |
| 38  | T-1.5.1 | `feat/INKA-1.5.1-artist-bubble-marker`        | ⬜     |
| 39  | T-1.5.2 | `feat/INKA-1.5.2-supercluster-clustering`     | ⬜     |
| 40  | T-1.5.3 | `feat/INKA-1.5.3-cluster-badge-zoom`          | ⬜     |
| 41  | T-1.5.4 | `feat/INKA-1.5.4-sync-markers-with-filters`   | ⬜     |
| 42  | T-1.6.1 | `feat/INKA-1.6.1-artist-preview-card`         | ⬜     |
| 43  | T-1.6.2 | `feat/INKA-1.6.2-preview-card-enter-dismiss`  | ⬜     |
| 44  | T-1.6.3 | `feat/INKA-1.6.3-preview-card-navigation`     | ⬜     |

### Épica 2 — Catálogo

Puede arrancar apenas cierre T-1.1.3, en paralelo a la Épica 1.

| #   | Ticket  | Rama                                           | Estado |
| --- | ------- | ---------------------------------------------- | ------ |
| 45  | T-2.1.1 | `feat/INKA-2.1.1-artist-catalog-scaffold`      | ⬜     |
| 46  | T-2.1.2 | `feat/INKA-2.1.2-artist-route-resolution`      | ⬜     |
| 47  | T-2.1.3 | `feat/INKA-2.1.3-cover-header-gradient`        | ⬜     |
| 48  | T-2.1.4 | `feat/INKA-2.1.4-catalog-back-button`          | ⬜     |
| 49  | T-2.2.1 | `feat/INKA-2.2.1-artist-identity-block`        | ⬜     |
| 50  | T-2.2.2 | `feat/INKA-2.2.2-identity-style-chips`         | ⬜     |
| 51  | T-2.3.1 | `feat/INKA-2.3.1-portfolio-filter-pills`       | ⬜     |
| 52  | T-2.3.2 | `feat/INKA-2.3.2-portfolio-filter-signal`      | ⬜     |
| 53  | T-2.4.1 | `feat/INKA-2.4.1-masonry-grid-layout`          | ⬜     |
| 54  | T-2.4.2 | `perf/INKA-2.4.2-lazy-images-aspect-ratio`     | ⬜     |
| 55  | T-2.4.3 | `feat/INKA-2.4.3-portfolio-skeletons`          | ⬜     |
| 56  | T-2.5.1 | `feat/INKA-2.5.1-lightbox-overlay`             | ⬜     |
| 57  | T-2.5.2 | `feat/INKA-2.5.2-lightbox-swipe-nav`           | ⬜     |
| 58  | T-2.5.3 | `feat/INKA-2.5.3-lightbox-back-button-close`   | ⬜     |
| 59  | T-2.6.1 | `feat/INKA-2.6.1-availability-pill`            | ⬜     |
| 60  | T-2.6.2 | `feat/INKA-2.6.2-contact-cta-button`           | ⬜     |
| 61  | T-2.6.3 | `feat/INKA-2.6.3-whatsapp-instagram-deeplinks` | ⬜     |

### Épica 3 — Release v0.1.0

| #   | Ticket  | Rama                                        | Estado |
| --- | ------- | ------------------------------------------- | ------ |
| 62  | T-3.1.1 | `test/INKA-3.1.1-integration-qa-checklist`  | ⬜     |
| 63  | T-3.2.1 | `chore/INKA-3.2.1-capacitor-add-android`    | ⬜     |
| 64  | T-3.2.2 | `chore/INKA-3.2.2-capacitor-add-ios`        | ⬜     |
| 65  | T-3.2.3 | `ci/INKA-3.2.3-fix-release-workflow-native` | ⬜     |
| 66  | T-3.3.1 | `chore/INKA-3.3.1-version-bump-changelog`   | ⬜     |
| 67  | T-3.3.2 | `release/0.1.0` → `main` + tag `v0.1.0`     | ⬜     |

---

## Componentes que se reutilizan tal cual

No se rediseña el sistema visual: se extiende. Tras el rename de T-0.3.1, estos elementos
se consumen bajo su nombre `--inka-*` / `.inka-*`:

- **Mixins:** `btn-gradient`, `field-base`, `nav-back`.
- **Clases:** `.card`, `.search`, `.badge*`, `.avatar`, `.tabs`/`.tab`, `.overlay`/`.sheet*`,
  `.state*`, `.skeleton-*`, `.scroll`.
- **Keyframes:** `fade-up`, `spin`, `shimmer`.
- **Patrones:** `toSignal(NavigationEnd)` de `trainer-layout.page.ts` (tab bar activa) y
  `page-state.component.ts` (loading/error/empty/offline).

---

## Fuera de alcance del MVP

Documentado, no implementado:

- Bottom-sheet de filtros avanzados (`openFilters()` queda como placeholder).
- Reemplazo de `picsum.photos` por Supabase Storage.
- Chat interno, reserva y agenda.
- Analytics de conversión a WhatsApp/Instagram.
- Clustering server-side.
- Auth real — `StartPage.onLogin()` conserva su `// TODO: wire to auth service`.
