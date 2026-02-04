#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/react-app" && pwd)"
PROD=false
SETUP_ENV=false
LOCAL=false

for arg in "$@"; do
  case "$arg" in
    --prod)      PROD=true ;;
    --setup-env) SETUP_ENV=true ;;
    --local)     LOCAL=true ;;
  esac
done

# ─── Prerequis ───────────────────────────────────────────────
if [ "$LOCAL" = false ] && [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Erreur : la variable VERCEL_TOKEN n'est pas definie."
  echo "  export VERCEL_TOKEN=votre_token"
  echo "  (ou utilisez --local pour deployer en local)"
  exit 1
fi

if ! command -v npx &>/dev/null; then
  echo "Erreur : npx introuvable. Installez Node.js."
  exit 1
fi

# ─── Variables d'environnement Supabase ──────────────────────
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$PROJECT_DIR/.env"
  set +a
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_KEY="${VITE_SUPABASE_ANON_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Erreur : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent etre definis."
  echo "  Verifiez le fichier react-app/.env"
  exit 1
fi

# ─── Pousser les env vars sur Vercel (--setup-env) ───────────
if [ "$SETUP_ENV" = true ]; then
  echo "== Configuration des variables d'environnement sur Vercel =="
  cd "$PROJECT_DIR"

  for ENV_NAME in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
    ENV_VAL="${!ENV_NAME}"
    # Supprimer l'ancienne valeur (ignore l'erreur si elle n'existe pas)
    npx vercel env rm "$ENV_NAME" production preview development \
      --token "$VERCEL_TOKEN" --yes 2>/dev/null || true
    # Ajouter la nouvelle valeur pour tous les environnements
    printf '%s' "$ENV_VAL" | npx vercel env add "$ENV_NAME" production preview development \
      --token "$VERCEL_TOKEN"
    echo "  $ENV_NAME  -> OK"
  done

  echo ""
  echo "Variables configurees. Lancez sans --setup-env pour deployer."
  exit 0
fi

# ─── Build local ─────────────────────────────────────────────
echo "== Build du projet =="
cd "$PROJECT_DIR"
npm ci --silent
npm run build

echo "Build OK (dist/ pret)"

# ─── Deploy local (--local) ──────────────────────────────────
if [ "$LOCAL" = true ]; then
  echo ""
  echo "== Deploiement LOCAL =="
  echo "  Supabase cloud : $SUPABASE_URL"
  echo "  Lancement du serveur de preview..."
  echo ""
  npx vite preview --host
  exit 0
fi

# ─── Deploy via Vercel CLI ───────────────────────────────────
VERCEL_FLAGS=(
  --token "$VERCEL_TOKEN"
  --yes
)

if [ "$PROD" = true ]; then
  echo "== Deploiement en PRODUCTION =="
  VERCEL_FLAGS+=(--prod)
else
  echo "== Deploiement en preview =="
fi

URL=$(npx vercel deploy "${VERCEL_FLAGS[@]}" 2>&1)

echo ""
echo "Deploiement termine :"
echo "  $URL"
