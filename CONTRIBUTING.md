# Contribuir a Inka

Guía de trabajo del repositorio: cómo se organiza el backlog, cómo se nombran las ramas,
cómo se escriben los commits y qué tiene que pasar antes de mergear.

---

## Jerarquía del backlog

| Nivel        | Qué es                                               | ¿Tiene rama? |
| ------------ | ---------------------------------------------------- | ------------ |
| **Épica**    | Objetivo macro. Agrupa historias.                    | No           |
| **Historia** | Agrupación lógica de tickets. Entrega una capacidad. | No           |
| **Ticket**   | Unidad micro de trabajo. Resuelve un issue concreto. | **Sí**       |

La regla central: **1 ticket = 1 rama = 1 PR**. Un ticket puede tener varios commits.
Si un ticket no cabe en un PR revisable, está mal dimensionado — divídelo.

**Excepción — tickets sin cambio de lógica.** Los tickets que solo tocan documentación,
plantillas de GitHub o configuración del repositorio (`CONTRIBUTING.md`, `docs/BACKLOG.md`,
`.github/`, `README.md`) se trabajan **directo sobre `develop`**, sin rama propia. No
introducen riesgo de regresión y fragmentarlos en ramas solo agrega ruido. Todo ticket que
toque `src/`, `package.json`, `angular.json` o los workflows de CI sí necesita su rama.

El backlog completo vive en [`docs/BACKLOG.md`](docs/BACKLOG.md).

---

## Ramas

```
main ─────────────────────────────────────────────●──── tag v0.1.0
                                                 ╱
release/0.1.0 ──────────────────────────────────●
                                               ╱
develop ──●───●───●───●───●───●───●───●───●───●
          ╱   ╱   ╱   ╱   ╱   ╱   ╱   ╱   ╱
   feat/INKA-0.1.4 … feat/INKA-2.6.3
```

| Rama        | Rol                                                              |
| ----------- | ---------------------------------------------------------------- |
| `main`      | Producción. Solo recibe merges desde `release/*` o `hotfix/*`.   |
| `develop`   | Integración. Todos los tickets apuntan aquí.                     |
| `<tipo>/…`  | Rama de ticket. Nace de `develop` y vuelve a `develop`.          |
| `release/*` | Corte de versión. Nace de `develop`, mergea a `main` y se tagea. |
| `hotfix/*`  | Urgencia en producción. **Única rama que nace de `main`.**       |

### Nomenclatura

```
<tipo>/INKA-<épica>.<historia>.<ticket>-<slug-en-kebab-case>
```

Ejemplos:

```
feat/INKA-1.3.1-home-page-scaffold
fix/INKA-1.2.4-ios-safe-area-tabs
refactor/INKA-0.3.1-inka-token-rename
ci/INKA-0.2.4-harden-ci-gate
```

El `<tipo>` usa los mismos valores que acepta commitlint:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`.

---

## Commits

Conventional Commits, validados por `commitlint` en el hook `commit-msg`.

```
<tipo>(<scope>): <descripción en imperativo>
```

- El `<tipo>` viene de la lista de arriba.
- El subject no puede pasar de **72 caracteres**.
- Varios commits por ticket están bien y son deseables: cuentan la historia del cambio.

```
feat(home): agregar chips de estilo scrollables
fix(map): liberar la instancia de mapbox en ngOnDestroy
test(start): cubrir las reglas de validación de password
```

Los hooks de Husky corren automáticamente:

- `pre-commit` → `lint-staged` (ESLint `--fix` sobre `.ts`, Prettier sobre `.ts/.html/.scss/.json/.md`)
- `commit-msg` → `commitlint`

---

## Flujo de un ticket

```bash
git checkout develop && git pull
git checkout -b feat/INKA-1.3.1-home-page-scaffold
```

Trabaja, commitea las veces que haga falta, y antes de abrir el PR:

```bash
npm run lint && npm run typecheck && npm run test:coverage && npm run build:prod
```

```bash
git push -u origin feat/INKA-1.3.1-home-page-scaffold
```

```bash
gh pr create --base develop --title "feat(home): scaffold de HomePage con ruta lazy" --body "Closes #NN"
```

---

## Política de merge

| Destino              | Estrategia                   | Por qué                                  |
| -------------------- | ---------------------------- | ---------------------------------------- |
| ticket → `develop`   | **Merge normal (`--no-ff`)** | Preserva los commits del ticket.         |
| `develop` → `main`   | **Merge normal**             | Bootstrap del gitflow (ver abajo).       |
| `release/*` → `main` | **Merge normal**             | El corte de versión queda explícito.     |
| `main` → `develop`   | Back-merge tras cada release | Evita que `develop` quede atrás del tag. |

**No se hace squash.** **No se hace push directo a `main` ni a `develop`** — solo mediante
merges de PR.

### Bootstrap del gitflow

El primer PR del proyecto es **`develop` → `main`** y lleva la infraestructura del flujo:
plantillas de GitHub, `CONTRIBUTING.md` y `docs/BACKLOG.md`. Sirve para dejar ambas ramas
alineadas y validar que `ci-gate` corre y bloquea correctamente antes de que entre trabajo
de producto. A partir de ahí, `main` solo recibe merges desde `release/*` o `hotfix/*`.

---

## Reglas de merge

Un PR puede mergear cuando:

1. El check **`ci-gate`** está en verde. Es el único required check: agrega
   `dependencies`, `lint`, `typecheck`, `test` y `build`, y falla si cualquiera de ellos
   termina en `failure`, `cancelled` o `skipped`.
2. Tiene **al menos 1 aprobación**.
3. El cuerpo del PR cierra su issue (`Closes #NN`) y adjunta evidencia visual si toca UI.

### Sobre el gate de coverage

El pipeline exige **80% de coverage promedio** (líneas, statements, funciones, ramas).
Cada PR pasa el gate **por sí solo**, no en conjunto con otros.

La consecuencia práctica: un ticket que agrega código **no puede dejar su spec para
después** — el gate lo rechazaría. Por eso no existen tickets sueltos de "escribir tests";
el `.spec.ts` es parte del Definition of Done de cada ticket de código.

---

## Convenciones de código

- **Angular 17 standalone.** Sin NgModules.
- **Templates inline** (`template:` en el decorador) con **SCSS externo** (`styleUrl`).
  Es la convención del repo: no hay ni un `.html` en `src/`.
- Las páginas viven en `src/app/pages/`, lo compartido en `src/app/shared/`.
- **Signals** (`signal`, `computed`, `toSignal`) para estado, no `BehaviorSubject`.
- **Sin Tailwind.** El sistema visual son los tokens CSS y los mixins de
  `src/app/shared/theme/`. Extiéndelo, no lo rediseñes.
- `tsconfig.json` corre en modo estricto con `noUncheckedIndexedAccess` y
  `noPropertyAccessFromIndexSignature`: todo acceso indexado devuelve `T | undefined`.
- `no-explicit-any` es **error**, no warning.

### Design tokens

Los colores, radios, sombras y espaciados son variables CSS declaradas en
`src/app/shared/theme/_palette.scss`. **Nunca hardcodees un color en un componente.**
Si necesitas un valor que no existe, agrégalo al palette en su propio ticket.

---

## Release

```bash
git checkout -b release/0.1.0 develop
# bump de versión + CHANGELOG
```

PR de `release/0.1.0` → `main`, merge normal, y luego:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

El tag dispara `release.yml`, que reutiliza el pipeline de CI y construye el APK de Android
y el archive de iOS. Cierra con el back-merge de `main` a `develop`.
