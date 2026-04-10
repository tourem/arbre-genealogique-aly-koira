#!/bin/bash
#
# Démarre l'application en local avec les données Supabase self-hosted
#

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$PROJECT_DIR/react-app"
ENV_SELFHOST="$APP_DIR/.env.selfhost"
ENV_FILE="$APP_DIR/.env"
ENV_BACKUP="$APP_DIR/.env.cloud.bak"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERREUR]${NC} $1"; exit 1; }

# Vérifications
[ -f "$ENV_SELFHOST" ] || error "Fichier $ENV_SELFHOST introuvable"
command -v node >/dev/null 2>&1 || error "Node.js n'est pas installé"
command -v npm >/dev/null 2>&1  || error "npm n'est pas installé"

# Sauvegarde du .env cloud si présent
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_BACKUP"
    info "Sauvegarde de .env cloud -> .env.cloud.bak"
fi

# Copie de la config self-hosted
cp "$ENV_SELFHOST" "$ENV_FILE"
info "Configuration self-hosted activée"
info "  URL: $(grep VITE_SUPABASE_URL "$ENV_FILE" | cut -d= -f2)"

# Restauration du .env cloud à la sortie
cleanup() {
    if [ -f "$ENV_BACKUP" ]; then
        cp "$ENV_BACKUP" "$ENV_FILE"
        rm "$ENV_BACKUP"
        echo ""
        info "Configuration cloud restaurée"
    fi
}
trap cleanup EXIT INT TERM

# Installation des dépendances si nécessaire
if [ ! -d "$APP_DIR/node_modules" ]; then
    info "Installation des dépendances..."
    npm --prefix "$APP_DIR" install
fi

# Démarrage
info "Démarrage du serveur de développement..."
echo ""
npm --prefix "$APP_DIR" run dev
