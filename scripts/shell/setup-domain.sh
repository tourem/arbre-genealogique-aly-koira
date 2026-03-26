#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Configuration du domaine alykoira.fr sur Vercel
# Usage : VERCEL_TOKEN=xxx bash scripts/setup-domain.sh
# ═══════════════════════════════════════════════════════════════

DOMAIN="alykoira.fr"
PROJECT_ID="prj_PACfPDzYLJbxkAY5Ml1QBUKJjzO9"
TEAM_ID="team_KVbjcsbyRRLj1KsPfLYAurrn"
API="https://api.vercel.com"

# ─── Verification du token ─────────────────────────────────────
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Erreur : VERCEL_TOKEN non defini."
  echo "  export VERCEL_TOKEN=votre_token"
  exit 1
fi

AUTH="Authorization: Bearer $VERCEL_TOKEN"
CT="Content-Type: application/json"

# ─── Fonctions utilitaires ──────────────────────────────────────
api_post() {
  curl -s -X POST "$1" -H "$AUTH" -H "$CT" -d "$2"
}

api_get() {
  curl -s -X GET "$1" -H "$AUTH"
}

check_error() {
  local resp="$1"
  local context="$2"
  if echo "$resp" | grep -q '"error"'; then
    local code msg
    code=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('code',''))" 2>/dev/null || echo "")
    msg=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null || echo "")
    if [ "$code" = "domain_already_in_use" ] || [ "$code" = "domain_already_exists" ]; then
      echo "  -> Domaine deja configure (OK)"
      return 0
    fi
    echo "  ERREUR ($context): $code - $msg"
    return 1
  fi
  return 0
}

echo "═══════════════════════════════════════════════════════════"
echo "  Configuration domaine : $DOMAIN"
echo "  Projet Vercel : $PROJECT_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── Etape 1 : Ajouter le domaine apex (alykoira.fr) ───────────
echo "[1/4] Ajout de $DOMAIN au projet..."
RESP=$(api_post "$API/v10/projects/$PROJECT_ID/domains?teamId=$TEAM_ID" \
  "{\"name\":\"$DOMAIN\"}")
if check_error "$RESP" "ajout $DOMAIN"; then
  echo "  -> $DOMAIN ajoute avec succes"
fi
echo ""

# ─── Etape 2 : Ajouter www avec redirect vers apex ─────────────
echo "[2/4] Ajout de www.$DOMAIN (redirect vers $DOMAIN)..."
RESP=$(api_post "$API/v10/projects/$PROJECT_ID/domains?teamId=$TEAM_ID" \
  "{\"name\":\"www.$DOMAIN\",\"redirect\":\"$DOMAIN\",\"redirectStatusCode\":308}")
if check_error "$RESP" "ajout www.$DOMAIN"; then
  echo "  -> www.$DOMAIN ajoute avec redirect 308 vers $DOMAIN"
fi
echo ""

# ─── Etape 3 : Verifier la configuration DNS ────────────────────
echo "[3/4] Verification de la configuration DNS..."
echo ""

RESP=$(api_get "$API/v6/domains/$DOMAIN/config?teamId=$TEAM_ID")
CONFIGURED=$(echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
misconfigured = d.get('misconfigured', True)
if not misconfigured:
    print('OK')
else:
    print('PENDING')
" 2>/dev/null || echo "UNKNOWN")

if [ "$CONFIGURED" = "OK" ]; then
  echo "  DNS correctement configure !"
else
  echo "  DNS pas encore configure. Configurez chez OVH :"
  echo ""
  echo "  ┌─────────────────────────────────────────────────────┐"
  echo "  │  OPTION A : Nameservers Vercel (recommande)         │"
  echo "  │  ─────────────────────────────────────────────      │"
  echo "  │  Chez OVH > Noms de domaine > $DOMAIN    │"
  echo "  │  > Serveurs DNS > Modifier                          │"
  echo "  │                                                     │"
  echo "  │  ns1.vercel-dns.com                                 │"
  echo "  │  ns2.vercel-dns.com                                 │"
  echo "  │                                                     │"
  echo "  ├─────────────────────────────────────────────────────┤"
  echo "  │  OPTION B : Enregistrements DNS manuels             │"
  echo "  │  ─────────────────────────────────────────────      │"
  echo "  │  Chez OVH > Zone DNS > Ajouter une entree          │"
  echo "  │                                                     │"
  echo "  │  Type    Nom   Valeur                               │"
  echo "  │  A       @     76.76.21.21                          │"
  echo "  │  CNAME   www   cname.vercel-dns.com.                │"
  echo "  └─────────────────────────────────────────────────────┘"
fi
echo ""

# ─── Etape 4 : Lister les domaines du projet ────────────────────
echo "[4/4] Domaines configures sur le projet :"
RESP=$(api_get "$API/v9/projects/$PROJECT_ID/domains?teamId=$TEAM_ID")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
domains = d.get('domains', [])
for dom in domains:
    name = dom.get('name', '?')
    verified = dom.get('verified', False)
    redirect = dom.get('redirect', '')
    status = 'Verifie' if verified else 'En attente'
    redir = f' -> {redirect}' if redirect else ''
    print(f'  - {name} [{status}]{redir}')
if not domains:
    print('  (aucun domaine)')
" 2>/dev/null || echo "  (impossible de lire la reponse)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Termine ! Propagation DNS : 5 min a 48h"
echo "  Verifier : https://dnschecker.org/#A/$DOMAIN"
echo "═══════════════════════════════════════════════════════════"
