#!/usr/bin/env bash
#
# Crea en GitHub los issues de una epica: la epica, sus historias y sus tickets,
# enlazados entre si con checklists.
#
#   bash scripts/create-issues.sh 0        # crea la Epica 0 completa
#   bash scripts/create-issues.sh 1        # crea la Epica 1 completa
#   bash scripts/create-issues.sh 1 --dry-run
#
# Es idempotente: si un issue con el mismo prefijo de titulo ya existe, lo reutiliza
# en vez de duplicarlo. Puedes correrlo de nuevo tras editar scripts/backlog.tsv.
#
# Requiere: gh autenticado con permiso de escritura sobre el repo.

set -euo pipefail

EPIC="${1:-}"
DRY_RUN="${2:-}"
DATA="$(dirname "$0")/backlog.tsv"

if [[ -z "$EPIC" ]]; then
  echo "Uso: bash scripts/create-issues.sh <numero-de-epica> [--dry-run]" >&2
  exit 1
fi

if [[ ! -f "$DATA" ]]; then
  echo "ERROR: no se encontro $DATA" >&2
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
BACKLOG_URL="https://github.com/$REPO/blob/develop/docs/BACKLOG.md"
echo "Repo: $REPO — Epica $EPIC"

# ── Labels ──────────────────────────────────────────────────────────────────
ensure_label() {
  local name="$1" color="$2" desc="$3"
  if ! gh label list --limit 100 --json name --jq '.[].name' | grep -qx "$name"; then
    echo "Creando label: $name"
    [[ "$DRY_RUN" == "--dry-run" ]] || gh label create "$name" --color "$color" --description "$desc"
  fi
}

ensure_label "epic" "5319E7" "Objetivo macro que agrupa historias"
ensure_label "story" "0E8A16" "Agrupacion logica de tickets"
ensure_label "task" "1D76DB" "Unidad micro de trabajo: 1 rama, 1 PR"

# ── Busca un issue existente por prefijo de titulo ───────────────────────────
# Los titulos tienen la forma "[T-0.2.1] ..." asi que el prefijo es unico.
find_issue() {
  local prefix="$1"
  gh issue list --state all --limit 300 --json number,title \
    --jq ".[] | select(.title | startswith(\"$prefix\")) | .number" | head -1
}

create_issue() {
  local title="$1" body="$2" label="$3" prefix="$4"
  local existing
  existing="$(find_issue "$prefix")"
  if [[ -n "$existing" ]]; then
    echo "$existing"
    return
  fi
  if [[ "$DRY_RUN" == "--dry-run" ]]; then
    echo "0"
    return
  fi
  gh issue create --title "$title" --body "$body" --label "$label" \
    | grep -oE '[0-9]+$'
}

# ── 1. Epica ─────────────────────────────────────────────────────────────────
EPIC_TITLE=""
while IFS=$'\t' read -r tipo id rama titulo; do
  [[ "$tipo" == "E" && "$id" == "$EPIC" ]] && EPIC_TITLE="$titulo"
done < <(grep -v '^#' "$DATA" | grep -v '^$')

if [[ -z "$EPIC_TITLE" ]]; then
  echo "ERROR: no existe la epica $EPIC en $DATA" >&2
  exit 1
fi

EPIC_NUM="$(create_issue \
  "[EPICA $EPIC] $EPIC_TITLE" \
  "Objetivo macro. El detalle vive en [docs/BACKLOG.md]($BACKLOG_URL).

Las historias de esta epica se listan abajo a medida que se crean." \
  "epic" "[EPICA $EPIC]")"
echo "Epica $EPIC -> #$EPIC_NUM"

# ── 2. Historias y tickets ───────────────────────────────────────────────────
STORY_REFS=""

while IFS=$'\t' read -r tipo id rama titulo; do
  case "$tipo" in
    H)
      [[ "$id" == "$EPIC".* ]] || continue
      STORY_NUM="$(create_issue \
        "[HU-$id] $titulo" \
        "Historia de la epica #$EPIC_NUM.

Detalle en [docs/BACKLOG.md]($BACKLOG_URL).

## Tickets

Se agregan abajo conforme se crean." \
        "story" "[HU-$id]")"
      echo "  Historia $id -> #$STORY_NUM"
      STORY_REFS="$STORY_REFS
- [ ] #$STORY_NUM"
      TICKET_REFS=""
      ;;
    T)
      [[ "$id" == "$EPIC".* ]] || continue
      TICKET_NUM="$(create_issue \
        "[T-$id] $titulo" \
        "Ticket de la historia #$STORY_NUM.

**Rama:** \`$rama\`

Criterios de aceptacion y contexto en [docs/BACKLOG.md]($BACKLOG_URL).

## Definicion de terminado

- [ ] Incluye su \`.spec.ts\` si agrega codigo (el gate de coverage es 80%)
- [ ] \`npm run lint && npm run typecheck && npm run test:coverage && npm run build:prod\` pasa en local
- [ ] Evidencia visual adjunta si toca UI" \
        "task" "[T-$id]")"
      echo "    Ticket $id -> #$TICKET_NUM"
      TICKET_REFS="$TICKET_REFS
- [ ] #$TICKET_NUM"
      if [[ "$DRY_RUN" != "--dry-run" ]]; then
        gh issue edit "$STORY_NUM" --body "Historia de la epica #$EPIC_NUM.

Detalle en [docs/BACKLOG.md]($BACKLOG_URL).

## Tickets
$TICKET_REFS" >/dev/null
      fi
      ;;
  esac
done < <(grep -v '^#' "$DATA" | grep -v '^$')

# ── 3. Cierra la epica con el checklist de historias ─────────────────────────
if [[ "$DRY_RUN" != "--dry-run" ]]; then
  gh issue edit "$EPIC_NUM" --body "Objetivo macro. El detalle vive en [docs/BACKLOG.md]($BACKLOG_URL).

## Historias
$STORY_REFS" >/dev/null
fi

echo "Listo. Epica $EPIC creada como #$EPIC_NUM."
