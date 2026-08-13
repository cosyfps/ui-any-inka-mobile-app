# ui-any-inka-mobile-app

**Inka** — app móvil híbrida de descubrimiento de tatuadores. Combina un mapa de artistas
cercanos con el catálogo de su portafolio, empaquetada para Android e iOS con Capacitor.

El MVP son dos pantallas: **Home** (mapa a pantalla completa con los tatuadores como
burbujas, chips de filtro por estilo y card de preview al tap) y **Catálogo de Tatuador**
(portada, identidad, grid masonry del portafolio, lightbox y CTA a WhatsApp/Instagram).

> **Estado actual: rebrand en curso.** El repositorio nació como _Ñeque_, una app de
> entrenadores personales, y la conversión a Inka es la Épica 0 del backlog. Mientras no
> cierre, conviven nombres de ambos proyectos: el proyecto Angular se llama `neque`, el
> `appId` es `com.duocuc.neque` y los design tokens usan el prefijo `--nq-*`. Consulta
> [`docs/BACKLOG.md`](docs/BACKLOG.md) antes de renombrar nada: cada pieza tiene su ticket.

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Inicio rápido](#inicio-rápido)
- [Arquitectura](#arquitectura)
- [Sistema visual](#sistema-visual)
- [Rutas](#rutas)
- [Prerrequisitos](#prerrequisitos)
- [Scripts disponibles](#scripts-disponibles)
- [Secuencia de validación](#secuencia-de-validación)
- [Variables de entorno](#variables-de-entorno)
- [CI/CD](#cicd)
- [Testing](#testing)
- [Backlog](#backlog)
- [Equipo](#equipo)
- [Contribución](CONTRIBUTING.md)

## Stack tecnológico

| Categoría   | Tecnología                                                        |
| ----------- | ----------------------------------------------------------------- |
| Runtime     | Node 22 (el que fija CI en `ci.yml`)                              |
| Framework   | Angular 17 — standalone components + signals, sin NgModules       |
| UI móvil    | Ionic 8 (`@ionic/angular/standalone`)                             |
| Nativo      | Capacitor 6 (Android + iOS)                                       |
| Iconos      | `@lucide/angular`, importados uno a uno como directivas           |
| Estilos     | SCSS puro con design tokens propios. **Sin Tailwind ni PostCSS.** |
| Formularios | `ReactiveFormsModule`                                             |
| Testing     | Jest 29 + `jest-preset-angular` + `@testing-library/angular`      |
| Calidad     | ESLint (`--max-warnings 0`) + Prettier + Husky + commitlint       |
| CI/CD       | GitHub Actions                                                    |

## Inicio rápido

1. Clona el repositorio y sitúate en la rama de integración:

   ```bash
   git checkout develop
   ```

2. Instala dependencias:

   ```bash
   npm ci
   ```

3. Levanta el servidor de desarrollo:

   ```bash
   npm start
   ```

   Angular sirve la app en `http://localhost:4200`.

4. Valida calidad mínima antes de empezar a cambiar cosas:

   ```bash
   npm run lint
   ```

   ```bash
   npm run typecheck
   ```

   ```bash
   npm test
   ```

No hace falta configurar credenciales para correr el MVP: los datos son mocks y no hay
llamadas HTTP salientes.

## Arquitectura

Aplicación Angular standalone con rutas lazy. No hay NgModules ni carpeta de features:
las pantallas viven en `src/app/pages/` y lo reutilizable en `src/app/shared/`.

```
src/
├── main.ts                          # bootstrapApplication + appConfig
├── index.html
├── styles.scss                      # estilos globales + import del theme
├── environments/                    # environment.ts / environment.prod.ts
└── app/
    ├── app.component.ts             # shell: <ion-app><ion-router-outlet>
    ├── app.config.ts                # provideRouter, provideIonicAngular
    ├── app.routes.ts                # rutas top-level con loadComponent
    ├── pages/
    │   ├── start/                   # landing + login (panel deslizante)
    │   └── forgot-password/         # flujo de 2 pasos: email -> OTP
    └── shared/
        ├── components/              # page-state.component.ts
        └── theme/                   # _palette.scss + _utilities.scss + _components.scss
```

### Convenciones

- Todos los componentes son **standalone**, con import explícito de cada pieza usada.
- Las páginas usan **template inline** (`template:` en el decorador) con **SCSS externo**
  (`styleUrl`). No hay ni un `.html` en `src/`.
- Control flow moderno (`@if`, `@for`, `@switch`), no `*ngIf` / `*ngFor`.
- Estado con **signals** (`signal`, `computed`). RxJS solo para streams externos (router
  events, `valueChanges`), siempre con `takeUntilDestroyed`.
- Patrón de estado de página: un signal `'loading' | 'error' | 'empty' | 'success'` con un
  `@switch` que delega los estados no-success en `<nq-page-state>`.
- TypeScript en modo estricto, con `noUncheckedIndexedAccess` — todo acceso indexado
  devuelve `T | undefined`. `no-explicit-any` es error, no warning.

### Path aliases

Declarados en `tsconfig.json` (hoy los imports siguen siendo relativos):

```
@app/*    -> src/app/*
@env/*    -> src/environments/*
@shared/* -> src/app/shared/*
```

## Sistema visual

No hay framework de CSS. El sistema son design tokens propios como custom properties:

| Archivo                         | Qué contiene                                                        |
| ------------------------------- | ------------------------------------------------------------------- |
| `shared/theme/_palette.scss`    | Tokens: color, radios, sombras, transiciones, tipografía, safe-area |
| `shared/theme/_utilities.scss`  | Utilidades: spacing, flex, skeletons, estados vacío/error, scroll   |
| `shared/theme/_components.scss` | Clases y mixins reutilizables                                       |

Piezas que ya existen y hay que consumir en vez de reinventar: los mixins
`nq-btn-gradient`, `nq-field-base` y `nq-nav-back`; las clases `.nq-card`, `.nq-search`,
`.nq-badge*`, `.nq-avatar`, `.nq-tabs`, `.nq-overlay`/`.nq-sheet*`, `.nq-state*`,
`.nq-skeleton-*` y `.nq-scroll`; y las animaciones `.nq-ani` + `.nq-d1..d4`.

**Nunca hardcodees un color en un componente.** Si falta un valor, agrégalo al palette en
su propio ticket.

## Rutas

| Ruta               | Componente           | Qué es                                |
| ------------------ | -------------------- | ------------------------------------- |
| `/`                | `StartPage`          | Landing + login como panel deslizante |
| `/forgot-password` | `ForgotPasswordPage` | Recuperación en 2 pasos: email → OTP  |

Todas se cargan con `loadComponent` (lazy). **No existe una `LoginPage`**: el login es un
panel dentro de `StartPage`. Las rutas de Home y Catálogo las agregan las Épicas 1 y 2.

## Prerrequisitos

- **Node.js 22** o superior (es la versión que usa CI).
- **npm** — el proyecto usa `package-lock.json`; instala con `npm ci`, no `npm install`.
- Para builds nativos, **Android Studio** (Android) y **Xcode** (iOS). Las carpetas
  `/android` y `/ios` no están en el repo: las genera `npx cap add` en la Épica 3.

## Scripts disponibles

| Comando                 | Descripción                                   |
| ----------------------- | --------------------------------------------- |
| `npm start`             | Servidor de desarrollo (`ng serve`)           |
| `npm run build`         | Build de desarrollo                           |
| `npm run build:prod`    | Build de producción                           |
| `npm run lint`          | ESLint con `--max-warnings 0`                 |
| `npm run lint:fix`      | ESLint con autofix                            |
| `npm run format`        | Prettier `--write` sobre ts/html/scss/json/md |
| `npm run format:check`  | Prettier `--check`                            |
| `npm run typecheck`     | `tsc --noEmit`                                |
| `npm test`              | Jest                                          |
| `npm run test:watch`    | Jest en watch mode                            |
| `npm run test:coverage` | Jest con cobertura (threshold 80%)            |
| `npm run cap:sync`      | `npx cap sync`                                |
| `npm run cap:build`     | `build:prod` + `npx cap copy`                 |

## Secuencia de validación

Ejecutar en este orden antes de abrir un PR. Es exactamente lo que valida `ci-gate`:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run test:coverage
```

```bash
npm run build:prod
```

## Variables de entorno

Angular resuelve la configuración en `src/environments/`, no con archivos `.env`. **No hay
secretos que pedir**: el MVP corre íntegramente con datos mock.

| Clave             | Estado                                                                      |
| ----------------- | --------------------------------------------------------------------------- |
| `production`      | Activo. Distingue el build de desarrollo del de producción.                 |
| `supabaseUrl`     | Vacío. Declarado pero sin consumir; nada lo importa todavía.                |
| `supabaseAnonKey` | Vacío. Igual que el anterior.                                               |
| `flowApiUrl`      | **Residuo de Ñeque.** Flow.cl es una pasarela de pago; Inka no tiene pagos. |

⚠️ Dos advertencias sobre este archivo:

- `angular.json` **no declara `fileReplacements`**, así que `environment.prod.ts` es código
  muerto: un build de producción sigue usando el de desarrollo. Lo arregla el ticket
  T-1.4.2.
- Cuando entre el mapa (Épica 1), el token de Mapbox va aquí y **no debe commitearse** un
  token de producción.

## CI/CD

- **`ci.yml`** — pipeline secuencial en cada push y PR a `main` o `develop`:

  ```
  dependencies → lint + typecheck → test (coverage) → build:prod → ci-gate
  ```

  `ci-gate` es el único check que mira la branch protection: agrega el resultado de todos
  los jobs anteriores y falla si alguno no pasó.

- **`release.yml`** — se dispara con tags `v[0-9]+.[0-9]+.[0-9]+`. Corre `ci.yml` como
  validación, construye Android con Gradle e iOS con `xcodebuild archive` (sin firma) vía
  Capacitor, y publica un GitHub Release.

## Testing

Jest configurado inline en `package.json` (no hay `jest.config.js`), con setup en
`setup-jest.ts`. Los tests viven junto al archivo que prueban (`*.page.spec.ts`,
`*.component.spec.ts`), y `@testing-library/angular` es la vía preferida.

Threshold de cobertura: **80%** en las 4 métricas (lines, statements, functions, branches).
Se excluyen de la medición `*.module.ts`, `*.routes.ts`, `main.ts`, `environments/**`,
`*.model.ts` y `shared/mocks/**`.

```bash
npm run test:coverage
```

```bash
npx jest src/app/pages/start/start.page.spec.ts
```

```bash
npx jest --testPathPattern="home"
```

Como el gate exige cobertura, **un ticket que agrega código incluye su `.spec.ts` en el
mismo PR**. No existen tickets sueltos de "escribir tests".

## Backlog

El MVP está descompuesto en épicas → historias → tickets en
[`docs/BACKLOG.md`](docs/BACKLOG.md), con un tablero de ejecución que lleva el estado de
cada ticket. Los issues de GitHub se generan desde ahí:

```bash
bash scripts/create-issues.sh <numero-de-epica>
```

## Equipo

Proyecto académico de **DuocUC**.

**Desarrollo:**

- Kelvin A. Moreno ([@cosyfps](https://github.com/cosyfps))

## Contribución

El flujo de trabajo — gitflow, nomenclatura de ramas, formato de commits y política de
merge — está en [`CONTRIBUTING.md`](CONTRIBUTING.md). Léelo antes del primer PR.
