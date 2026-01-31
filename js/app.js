// ═══════════════════════════════════════════════════════════════
// APPLICATION GÉNÉALOGIE - Famille Aly Koïra
// ═══════════════════════════════════════════════════════════════

// ========== AUTHENTIFICATION SÉCURISÉE ==========
// Seul le hash SHA-256 est stocké - le mot de passe n'apparaît JAMAIS dans le code
const VALID_HASH = '2846e08eff7ade0829bf37e3bd3b0022e34649e1271cedd88a986c59df8afe77';

// Fonction de hashage SHA-256
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérification du mot de passe
async function login() {
  const input = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;
  const errorEl = document.getElementById('loginError');
  
  // Hasher l'input et comparer avec le hash valide
  const inputHash = await sha256(input);
  
  if (inputHash === VALID_HASH) {
    // Succès - stocker le hash comme preuve d'authentification
    if (remember) {
      localStorage.setItem('aly_koira_auth', inputHash);
    } else {
      sessionStorage.setItem('aly_koira_auth', inputHash);
    }
    
    // Animation et affichage de l'app
    document.getElementById('loginScreen').style.animation = 'loginFadeOut 0.3s ease forwards';
    setTimeout(() => {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('mainApp').style.display = 'flex';
      // IMPORTANT: Initialiser l'application après connexion
      initApp();
    }, 300);
  } else {
    // Erreur
    errorEl.textContent = '❌ Mot de passe incorrect';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
    setTimeout(() => { errorEl.textContent = ''; }, 3000);
  }
}

function togglePassword() {
  const input = document.getElementById('loginPassword');
  const btn = document.querySelector('.toggle-password');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function checkAuth() {
  const remembered = localStorage.getItem('aly_koira_auth');
  const session = sessionStorage.getItem('aly_koira_auth');
  
  // Vérifier si le hash stocké correspond au hash valide
  if (remembered === VALID_HASH || session === VALID_HASH) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('aly_koira_auth');
  sessionStorage.removeItem('aly_koira_auth');
  location.reload();
}

// Animation de sortie
const loginStyle = document.createElement('style');
loginStyle.textContent = '@keyframes loginFadeOut{from{opacity:1}to{opacity:0}}';
document.head.appendChild(loginStyle);

// Vérifier l'auth au chargement
document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    // Utilisateur déjà authentifié - initialiser l'app
    initApp();
  } else {
    document.getElementById('loginPassword').focus();
  }
});

// Fonction d'initialisation de l'app
function initApp() {
  initSelects();
  showPerson('ali');
  renderSearch();
  renderStats();
}

// ========== DONNÉES ==========

let currentPerson = 'ali';
let history = [];

// Navigation pages
function showPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  btn.classList.add('active');
}

// Couleurs par génération
const genColors = {
  0: '#9333ea',
  1: '#f59e0b',
  2: '#10b981', 
  3: '#6366f1',
  4: '#ec4899',
  5: '#8b5cf6',
  6: '#14b8a6',
  7: '#f97316'
};

// Fonction pour formater le nom avec le surnom
function formatName(p, short = false) {
  if (!p) return '';
  if (short) {
    // Version courte : juste le prénom + surnom si existe
    const prenom = p.n.split(' ')[0];
    return p.a ? `${prenom} (${p.a})` : prenom;
  }
  // Version complète : nom complet + surnom
  return p.a ? `${p.n} dit "${p.a}"` : p.n;
}

// Afficher une personne avec animation
function showPerson(id) {
  const p = D[id];
  if (!p) return;
  
  const view = document.getElementById('personView');
  const genColor = genColors[p.gen] || '#6366f1';
  
  // Animation de sortie
  view.classList.add('changing');
  
  // Flash de couleur en haut
  const flash = document.createElement('div');
  flash.className = 'click-flash';
  flash.style.background = `linear-gradient(90deg, ${genColor}, transparent)`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);
  
  setTimeout(() => {
    if (currentPerson !== id) {
      history.push(currentPerson);
    }
    currentPerson = id;
    document.getElementById('rootSelect').value = id;
    
    renderBreadcrumb();
    renderPersonView(p);
    
    // Animation d'entrée
    view.classList.remove('changing');
    view.classList.add('entering');
    setTimeout(() => view.classList.remove('entering'), 400);
    
    // Scroll en haut
    document.querySelector('#pageFamille .scroll').scrollTo({top: 0, behavior: 'smooth'});
  }, 150);
}

// Fil d'ariane
function renderBreadcrumb() {
  const path = [];
  let cur = currentPerson;
  while (cur && path.length < 5) {
    path.unshift(cur);
    const p = D[cur];
    cur = p.f || p.m;
  }
  
  let html = '';
  if (history.length > 0) {
    html += `<div class="tree-nav-item" onclick="goBack()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      Retour
    </div>`;
  }
  
  path.forEach((id, i) => {
    const p = D[id];
    const isLast = i === path.length - 1;
    html += `<div class="tree-nav-item" onclick="showPerson('${id}')" style="${isLast ? 'background:var(--primary);color:white;' : ''}">${p.n.split(' ')[0]}</div>`;
  });
  
  document.getElementById('breadcrumb').innerHTML = html;
}

function goBack() {
  if (history.length > 0) {
    currentPerson = history.pop();
    document.getElementById('rootSelect').value = currentPerson;
    renderBreadcrumb();
    renderPersonView(D[currentPerson]);
  }
}

// Vue personne
function renderPersonView(p) {
  const kids = (p.c || []).filter(c => D[c]);
  const father = p.f && D[p.f] ? D[p.f] : null;
  const mother = p.m ? (typeof p.m === 'string' && D[p.m] ? D[p.m] : null) : null;
  const motherName = typeof p.m === 'string' && !D[p.m] ? p.m : null;
  const spouses = p.sp || [];
  const genClass = `gen${p.gen}`;
  const genColor = genColors[p.gen];
  const genNames = {0: 'Ancêtre', 1: '1ère', 2: '2ème', 3: '3ème', 4: '4ème', 5: '5ème', 6: '6ème', 7: '7ème'};
  
  let html = `
    <div class="person-card ${genClass}">
      <div class="gen-badge">G${p.gen}</div>
      <div class="person-avatar ${p.g === 'M' ? 'male' : 'female'}">${p.g === 'M' ? '👨' : '👩'}</div>
      <div class="person-name">${p.n}${p.a ? ` <span class="alias-inline">(${p.a})</span>` : ''}</div>
      <div class="person-gen">${genNames[p.gen]} génération</div>
    </div>
  `;
  
  // Parents
  if (father || mother || motherName) {
    html += `<div class="section-title">⬆️ Parents</div><div class="parent-cards">`;
    if (father) {
      const fGenClass = `gen${father.gen}`;
      const fName = father.a ? `${father.n.split(' ')[0]} (${father.a})` : father.n.split(' ')[0];
      html += `
        <div class="parent-card ${fGenClass}" onclick="showPerson('${father.id}')">
          <div class="mini-avatar male">👨</div>
          <div class="name">${fName}</div>
          <div class="label">Père</div>
          <div class="gen-tag" style="background:${genColors[father.gen]}">G${father.gen}</div>
        </div>
      `;
    }
    if (mother) {
      const mGenClass = `gen${mother.gen}`;
      const mName = mother.a ? `${mother.n.split(' ')[0]} (${mother.a})` : mother.n.split(' ')[0];
      html += `
        <div class="parent-card ${mGenClass}" onclick="showPerson('${mother.id}')">
          <div class="mini-avatar female">👩</div>
          <div class="name">${mName}</div>
          <div class="label">Mère</div>
          <div class="gen-tag" style="background:${genColors[mother.gen]}">G${mother.gen}</div>
        </div>
      `;
    } else if (motherName) {
      html += `
        <div class="parent-card static">
          <div class="mini-avatar female">👩</div>
          <div class="name">${motherName.split(' ')[0]}</div>
          <div class="label">Mère</div>
        </div>
      `;
    }
    html += `</div>`;
  }
  
  // Épouse(s) / Époux
  if (spouses.length > 0) {
    const spouseLabel = p.g === 'M' ? 'Épouse(s)' : 'Époux';
    const spouseIcon = p.g === 'M' ? '👩' : '👨';
    html += `<div class="section-title">💑 ${spouseLabel}</div><div class="spouses-list">`;
    spouses.forEach((sp, idx) => {
      // Vérifier si l'épouse est une personne dans l'arbre
      const spouseInTree = D[sp];
      const spouseName = spouseInTree ? spouseInTree.n : sp;
      const spouseAlias = spouseInTree && spouseInTree.a ? ` (${spouseInTree.a})` : '';
      const clickable = spouseInTree ? `onclick="showPerson('${sp}')"` : '';
      const clickableClass = spouseInTree ? 'clickable' : '';
      
      html += `
        <div class="spouse-card ${clickableClass}" ${clickable}>
          <div class="spouse-avatar">${spouseIcon}</div>
          <div class="spouse-info">
            <div class="spouse-name">${spouseName}${spouseAlias}</div>
            ${spouses.length > 1 ? `<div class="spouse-num">${idx + 1}${idx === 0 ? 'ère' : 'ème'} épouse</div>` : ''}
            ${spouseInTree ? `<div class="spouse-link">Voir sa famille →</div>` : ''}
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }
  
  // Enfants groupés par mère si plusieurs épouses
  if (kids.length > 0) {
    if (spouses.length > 1 && p.g === 'M') {
      // Grouper les enfants par mère
      const childrenByMother = {};
      kids.forEach(cid => {
        const c = D[cid];
        let motherKey = c.m || 'Mère inconnue';
        // Si la mère est un ID dans l'arbre, récupérer son nom
        if (D[motherKey]) {
          motherKey = D[motherKey].n;
        }
        if (!childrenByMother[motherKey]) childrenByMother[motherKey] = [];
        childrenByMother[motherKey].push(c);
      });
      
      html += `<div class="section-title">⬇️ Enfants (${kids.length})</div>`;
      
      for (const [motherKey, children] of Object.entries(childrenByMother)) {
        html += `<div class="children-mother-group">
          <div class="mother-label">👩 ${motherKey}</div>
          <div class="children-grid">`;
        children.forEach(c => {
          const cGenClass = `gen${c.gen}`;
          const grandKids = (c.c || []).filter(gc => D[gc]).length;
          const cName = c.a ? `${c.n.split(' ')[0]} (${c.a})` : c.n.split(' ')[0];
          html += `
            <div class="child-card ${cGenClass}" onclick="showPerson('${c.id}')">
              <div class="mini-avatar ${c.g === 'M' ? 'male' : 'female'}">${c.g === 'M' ? '👨' : '👩'}</div>
              <div class="name">${cName}</div>
              <span class="gen-tag" style="background:${genColors[c.gen]}">G${c.gen}</span>
              ${grandKids > 0 ? `<div class="badge">${grandKids} 👶</div>` : ''}
            </div>
          `;
        });
        html += `</div></div>`;
      }
    } else {
      // Affichage simple
      html += `<div class="section-title">⬇️ Enfants (${kids.length})</div><div class="children-grid">`;
      kids.forEach(cid => {
        const c = D[cid];
        const cGenClass = `gen${c.gen}`;
        const grandKids = (c.c || []).filter(gc => D[gc]).length;
        const cName = c.a ? `${c.n.split(' ')[0]} (${c.a})` : c.n.split(' ')[0];
        html += `
          <div class="child-card ${cGenClass}" onclick="showPerson('${cid}')">
            <div class="mini-avatar ${c.g === 'M' ? 'male' : 'female'}">${c.g === 'M' ? '👨' : '👩'}</div>
            <div class="name">${cName}</div>
            <span class="gen-tag" style="background:${genColors[c.gen]}">G${c.gen}</span>
            ${grandKids > 0 ? `<div class="badge">${grandKids} 👶</div>` : ''}
          </div>
        `;
      });
      html += `</div>`;
    }
  } else if (p.c && p.c.length === 0) {
    html += `<div class="section-title">Enfants</div><div class="no-data">Pas d'enfants enregistrés</div>`;
  }
  
  // Famille élargie (par alliance) - pour Alkamahamane
  if (p.id === 'alkamahamane' && D['hamatou_lassane']) {
    html += `<div class="section-title">👨‍👩‍👧‍👦 Belle-famille (famille de l'épouse)</div>`;
    html += `<div class="extended-family-note">Famille de Lalla Hamatou - Cliquez sur son nom ci-dessus pour voir</div>`;
    html += `<div class="parent-cards">
      <div class="parent-card extended" onclick="showPerson('hamatou_lassane')">
        <div class="mini-avatar male">👨</div>
        <div class="name">Hamatou Lassane (Koro)</div>
        <div class="label">Beau-père</div>
        <div class="extended-badge">Père de l'épouse →</div>
      </div>
      <div class="parent-card extended" onclick="showPerson('mahamane_h')">
        <div class="mini-avatar male">👨</div>
        <div class="name">Mahamane (Koro)</div>
        <div class="label">Beau-frère</div>
        <div class="extended-badge">Frère de l'épouse →</div>
      </div>
    </div>`;
  }
  
  // Famille élargie (par alliance) - pour Mahamane Hamatou
  if (p.id === 'mahamane_h' && D['alkamahamane']) {
    html += `<div class="section-title">👨‍👩‍👧‍👦 Famille élargie (par alliance)</div>`;
    html += `<div class="extended-family-note">Époux de sa sœur Lalla Hamatou</div>`;
    html += `<div class="parent-cards">
      <div class="parent-card extended" onclick="showPerson('alkamahamane')">
        <div class="mini-avatar male">👨</div>
        <div class="name">Alkamahamane</div>
        <div class="label">Beau-frère</div>
        <div class="extended-badge">Voir sa branche →</div>
      </div>
      <div class="parent-card extended" onclick="showPerson('lalla_hamatou')">
        <div class="mini-avatar female">👩</div>
        <div class="name">Lalla Hamatou</div>
        <div class="label">Sœur</div>
        <div class="extended-badge">Voir ses enfants →</div>
      </div>
    </div>`;
  }
  
  // Frère/Sœur pour Lalla Hamatou
  if (p.id === 'lalla_hamatou' && D['mahamane_h']) {
    html += `<div class="section-title">👫 Frère</div>`;
    html += `<div class="parent-cards">
      <div class="parent-card extended" onclick="showPerson('mahamane_h')">
        <div class="mini-avatar male">👨</div>
        <div class="name">Mahamane (Koro)</div>
        <div class="label">Frère</div>
        <div class="extended-badge">Même père →</div>
      </div>
    </div>`;
  }
  
  // Légende des générations
  html += `
    <div class="gen-legend">
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen0)"></div>G0</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen1)"></div>G1</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen2)"></div>G2</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen3)"></div>G3</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen4)"></div>G4</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen5)"></div>G5</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen6)"></div>G6</div>
      <div class="gen-legend-item"><div class="gen-legend-dot" style="background:var(--gen7)"></div>G7</div>
    </div>
  `;
  
  document.getElementById('personView').innerHTML = html;
}

// Changement racine
function changeRoot() {
  const id = document.getElementById('rootSelect').value;
  if (id && D[id]) {
    history = [];
    showPerson(id);
  }
}

// Recherche
function renderSearch() {
  const list = Object.values(D).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  let html = '';
  list.forEach(p => {
    const displayName = p.a ? `${p.n} (${p.a})` : p.n;
    html += `
      <div class="person-item" onclick="goToPerson('${p.id}')">
        <div class="avatar ${p.g === 'M' ? 'male' : 'female'}">${p.g === 'M' ? '👨' : '👩'}</div>
        <div class="info">
          <div class="name">${displayName}</div>
          <div class="details">Génération ${p.gen}</div>
        </div>
        <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    `;
  });
  document.getElementById('personList').innerHTML = html;
}

function filterSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#personList .person-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function goToPerson(id) {
  history = [];
  showPerson(id);
  showPage('pageFamille', document.querySelector('.nav-item'));
}

// Parenté
function initSelects() {
  const list = Object.values(D).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
  const roots = ['alkamahamane', 'ali', 'mahamane', 'babachigaw', 'kobbo', 'moussa', 'omorou', 'tamimoune', 'mahadi', 'goussoumbi', 'hamatou_lassane', 'mahamane_h'];
  
  // Root select
  const rootSel = document.getElementById('rootSelect');
  roots.forEach(id => {
    if (D[id]) {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = D[id].n + (D[id].a ? ' (' + D[id].a + ')' : '');
      o.selected = id === 'ali';
      rootSel.appendChild(o);
    }
  });
  
  // Relation selects
  ['person1Select', 'person2Select'].forEach(sid => {
    const sel = document.getElementById(sid);
    if (sel) {
      list.forEach(p => {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.n + (p.a ? ' (' + p.a + ')' : '');
        sel.appendChild(o);
      });
    }
  });
}

// Algorithme parenté
function getPaths(id, visited = new Set()) {
  const paths = [];
  const p = D[id];
  if (!p || visited.has(id)) return [[p]];
  visited.add(id);
  if (p.f && D[p.f]) getPaths(p.f, new Set(visited)).forEach(x => paths.push([p, ...x]));
  if (p.m && D[p.m]) getPaths(p.m, new Set(visited)).forEach(x => paths.push([p, ...x]));
  if (!paths.length) paths.push([p]);
  return paths;
}

function findAncestor(id1, id2) {
  const p1 = getPaths(id1), p2 = getPaths(id2);
  let best = null, min = Infinity;
  for (const a of p1) for (const b of p2) for (let i = 0; i < a.length; i++) {
    const j = b.findIndex(x => x.id === a[i].id);
    if (j !== -1 && i + j < min) {
      min = i + j;
      best = { anc: a[i], path1: a.slice(0, i + 1), path2: b.slice(0, j + 1), d1: i, d2: j };
      break;
    }
  }
  return best;
}

function getRelationType(d1, d2, p1, p2) {
  if (d1 === 0 && d2 === 0) return "Même personne";
  if (d1 === 1 && d2 === 1) return p1.g === p2.g ? (p1.g === 'M' ? "Frères" : "Sœurs") : "Frère et sœur";
  if (d1 === 0) return d2 === 1 ? (p1.g === 'M' ? "Père" : "Mère") : d2 === 2 ? (p1.g === 'M' ? "Grand-père" : "Grand-mère") : "Ancêtre";
  if (d2 === 0) return d1 === 1 ? (p1.g === 'M' ? "Fils" : "Fille") : d1 === 2 ? (p1.g === 'M' ? "Petit-fils" : "Petite-fille") : "Descendant";
  if ((d1 === 1 && d2 === 2) || (d1 === 2 && d2 === 1)) return d1 === 1 ? (p1.g === 'M' ? "Oncle" : "Tante") : (p1.g === 'M' ? "Neveu" : "Nièce");
  if (d1 === 2 && d2 === 2) return "Cousins germains";
  return "Parents éloignés";
}

function findRelationship() {
  const id1 = document.getElementById('person1Select').value;
  const id2 = document.getElementById('person2Select').value;
  const container = document.getElementById('parenteResult');
  
  if (!id1 || !id2) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">👆</div><div class="empty-text">Sélectionnez deux personnes</div></div>';
    return;
  }
  
  if (id1 === id2) {
    container.innerHTML = '<div class="relation-result"><div class="relation-badge">Même personne!</div></div>';
    return;
  }
  
  const r = findAncestor(id1, id2);
  if (!r) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">❓</div><div class="empty-text">Lien non trouvé</div></div>';
    return;
  }
  
  const rel = getRelationType(r.d1, r.d2, D[id1], D[id2]);
  let steps = '';
  for (let i = 0; i < r.path1.length - 1; i++) {
    steps += `<div class="relation-step"><div class="dot"></div>${r.path1[i].n} est ${r.path1[i].g === 'M' ? 'fils' : 'fille'} de ${r.path1[i + 1].n}</div>`;
  }
  for (let i = 0; i < r.path2.length - 1; i++) {
    steps += `<div class="relation-step"><div class="dot"></div>${r.path2[i].n} est ${r.path2[i].g === 'M' ? 'fils' : 'fille'} de ${r.path2[i + 1].n}</div>`;
  }
  
  container.innerHTML = `
    <div class="relation-result">
      <div style="color:var(--text-secondary);font-size:13px">${D[id1].n}<br>&<br>${D[id2].n}</div>
      <div class="relation-badge">${rel}</div>
      <div style="color:var(--text-muted);font-size:12px">Ancêtre commun : ${r.anc.n}</div>
      <div class="relation-detail">${steps}</div>
    </div>
  `;
}

// Stats header
function renderStats() {
  const ps = Object.values(D);
  const males = ps.filter(p => p.g === 'M').length;
  const females = ps.filter(p => p.g === 'F').length;
  const totalMembers = ps.length;
  const maxGen = Math.max(...ps.map(p => p.gen));
  
  document.getElementById('memberCount').textContent = totalMembers;
  document.getElementById('genCount').textContent = maxGen + 1; // +1 car on commence à 0
  document.getElementById('maleCount').textContent = males;
  document.getElementById('femaleCount').textContent = females;
}

// L'initialisation est gérée dans le premier DOMContentLoaded

// ========== FORMULAIRE CONTRIBUER ==========
let childCount = 0;
let spouseCount = 0;
let myGender = '';

function selectMyGender(gender, el) {
  // Retirer la sélection des autres options
  el.parentElement.querySelectorAll('.gender-option').forEach(opt => opt.classList.remove('selected'));
  // Ajouter la sélection
  el.classList.add('selected');
  // Mettre à jour la valeur
  document.getElementById('f_genre').value = gender;
  myGender = gender;
  
  // Afficher la section époux/épouses
  document.getElementById('spouseSection').style.display = 'block';
  
  if (gender === 'M') {
    // Homme : peut avoir plusieurs épouses
    document.getElementById('spouseSectionTitle').innerHTML = `
      <span>💑 Vos épouse(s)</span>
      <button class="add-child-btn" onclick="addSpouse()">+ Ajouter</button>
    `;
    document.getElementById('spouseContent').innerHTML = `
      <div id="spousesList"></div>
      <div class="no-children" id="noSpouses">
        <p>Aucune épouse ajoutée</p>
        <button class="add-first-child" onclick="addSpouse()">+ Ajouter une épouse</button>
      </div>
    `;
    spouseCount = 0;
  } else {
    // Femme : un seul époux
    document.getElementById('spouseSectionTitle').innerHTML = '<span>💑 Votre époux</span>';
    document.getElementById('spouseContent').innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Nom</label>
          <input type="text" id="f_epoux_nom" placeholder="Nom de l'époux">
        </div>
        <div class="form-group">
          <label>Prénom</label>
          <input type="text" id="f_epoux_prenom" placeholder="Prénom de l'époux">
        </div>
      </div>
    `;
  }
}

function addSpouse() {
  spouseCount++;
  document.getElementById('noSpouses').style.display = 'none';
  
  const spouseHtml = `
    <div class="child-item" id="spouse${spouseCount}">
      <div class="child-item-header">
        <span class="child-number">Épouse ${spouseCount}</span>
        <button class="remove-child" onclick="removeSpouse(${spouseCount})">×</button>
      </div>
      <div class="child-fields">
        <div class="child-row">
          <div class="form-group">
            <label>Nom</label>
            <input type="text" id="spouse${spouseCount}_nom" placeholder="Nom">
          </div>
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" id="spouse${spouseCount}_prenom" placeholder="Prénom">
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('spousesList').insertAdjacentHTML('beforeend', spouseHtml);
}

function removeSpouse(num) {
  document.getElementById(`spouse${num}`).remove();
  if (document.getElementById('spousesList').children.length === 0) {
    document.getElementById('noSpouses').style.display = 'block';
  }
}

function addChild() {
  childCount++;
  document.getElementById('noChildren').style.display = 'none';
  
  const childHtml = `
    <div class="child-item" id="child${childCount}">
      <div class="child-item-header">
        <span class="child-number">Enfant ${childCount}</span>
        <button class="remove-child" onclick="removeChild(${childCount})">×</button>
      </div>
      <div class="child-fields">
        <div class="child-row">
          <div class="form-group">
            <label>Nom</label>
            <input type="text" id="child${childCount}_nom" placeholder="Nom">
          </div>
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" id="child${childCount}_prenom" placeholder="Prénom">
          </div>
        </div>
        <div class="form-group">
          <label>Genre</label>
          <div class="gender-select">
            <div class="gender-option" onclick="selectGender(${childCount}, 'M', this)">
              <span>👨</span>
              <small>Homme</small>
            </div>
            <div class="gender-option" onclick="selectGender(${childCount}, 'F', this)">
              <span>👩</span>
              <small>Femme</small>
            </div>
          </div>
          <input type="hidden" id="child${childCount}_genre" value="">
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('childrenList').insertAdjacentHTML('beforeend', childHtml);
}

function removeChild(num) {
  document.getElementById(`child${num}`).remove();
  // Vérifier s'il reste des enfants
  if (document.getElementById('childrenList').children.length === 0) {
    document.getElementById('noChildren').style.display = 'block';
  }
}

function selectGender(childNum, gender, el) {
  // Retirer la sélection des autres options
  el.parentElement.querySelectorAll('.gender-option').forEach(opt => opt.classList.remove('selected'));
  // Ajouter la sélection à l'option cliquée
  el.classList.add('selected');
  // Mettre à jour la valeur cachée
  document.getElementById(`child${childNum}_genre`).value = gender;
}

function collectFormData() {
  const genre = document.getElementById('f_genre').value;
  const data = {
    nom: document.getElementById('f_nom').value.trim(),
    prenom: document.getElementById('f_prenom').value.trim(),
    genre: genre,
    pere: {
      nom: document.getElementById('f_pere_nom').value.trim(),
      prenom: document.getElementById('f_pere_prenom').value.trim()
    },
    mere: {
      nom: document.getElementById('f_mere_nom').value.trim(),
      prenom: document.getElementById('f_mere_prenom').value.trim()
    },
    epoux: null,
    epouses: [],
    enfants: []
  };
  
  // Collecter l'époux (si femme)
  if (genre === 'F') {
    const epouxNom = document.getElementById('f_epoux_nom')?.value.trim() || '';
    const epouxPrenom = document.getElementById('f_epoux_prenom')?.value.trim() || '';
    if (epouxNom || epouxPrenom) {
      data.epoux = { nom: epouxNom, prenom: epouxPrenom };
    }
  }
  
  // Collecter les épouses (si homme)
  if (genre === 'M') {
    document.querySelectorAll('[id^="spouse"]').forEach(item => {
      if (item.id.match(/^spouse\d+$/)) {
        const id = item.id.replace('spouse', '');
        const epouse = {
          nom: document.getElementById(`spouse${id}_nom`)?.value.trim() || '',
          prenom: document.getElementById(`spouse${id}_prenom`)?.value.trim() || ''
        };
        if (epouse.nom || epouse.prenom) {
          data.epouses.push(epouse);
        }
      }
    });
  }
  
  // Collecter les enfants
  document.querySelectorAll('.child-item').forEach(item => {
    if (!item.id.startsWith('spouse')) {
      const id = item.id.replace('child', '');
      const enfant = {
        nom: document.getElementById(`child${id}_nom`)?.value.trim() || '',
        prenom: document.getElementById(`child${id}_prenom`)?.value.trim() || '',
        genre: document.getElementById(`child${id}_genre`)?.value || ''
      };
      if (enfant.nom || enfant.prenom) {
        data.enfants.push(enfant);
      }
    }
  });
  
  return data;
}

function formatDataAsText(data) {
  const genreEmoji = data.genre === 'M' ? '👨' : data.genre === 'F' ? '👩' : '👤';
  let text = `🌳 CONTRIBUTION ARBRE FAMILIAL ALY KOÏRA\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  text += `${genreEmoji} INFORMATIONS PERSONNELLES\n`;
  text += `   Nom: ${data.nom || '(non renseigné)'}\n`;
  text += `   Prénom: ${data.prenom || '(non renseigné)'}\n\n`;
  
  // Époux (si femme)
  if (data.genre === 'F' && data.epoux) {
    text += `💑 ÉPOUX\n`;
    text += `   Nom: ${data.epoux.nom || '(non renseigné)'}\n`;
    text += `   Prénom: ${data.epoux.prenom || '(non renseigné)'}\n\n`;
  }
  
  // Épouses (si homme)
  if (data.genre === 'M' && data.epouses.length > 0) {
    text += `💑 ÉPOUSE(S) (${data.epouses.length})\n`;
    data.epouses.forEach((ep, i) => {
      text += `   ${i + 1}. ${ep.prenom} ${ep.nom}\n`;
    });
    text += `\n`;
  }
  
  text += `👨 PÈRE\n`;
  text += `   Nom: ${data.pere.nom || '(non renseigné)'}\n`;
  text += `   Prénom: ${data.pere.prenom || '(non renseigné)'}\n\n`;
  
  text += `👩 MÈRE\n`;
  text += `   Nom: ${data.mere.nom || '(non renseigné)'}\n`;
  text += `   Prénom: ${data.mere.prenom || '(non renseigné)'}\n\n`;
  
  if (data.enfants.length > 0) {
    text += `👶 ENFANTS (${data.enfants.length})\n`;
    data.enfants.forEach((e, i) => {
      const genre = e.genre === 'M' ? '👨' : e.genre === 'F' ? '👩' : '?';
      text += `   ${i + 1}. ${e.prenom} ${e.nom} ${genre}\n`;
    });
  } else {
    text += `👶 ENFANTS: Aucun\n`;
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📅 Envoyé le ${new Date().toLocaleDateString('fr-FR')}`;
  
  return text;
}

function showToast(message, type = 'success') {
  // Supprimer toast existant
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function validateForm(data) {
  if (!data.nom && !data.prenom) {
    showToast('Veuillez renseigner votre nom ou prénom', 'error');
    return false;
  }
  return true;
}

function sendWhatsApp() {
  const data = collectFormData();
  if (!validateForm(data)) return;
  
  const text = formatDataAsText(data);
  const encoded = encodeURIComponent(text);
  
  // Numéro WhatsApp pour recevoir les contributions
  const phoneNumber = '33662992985'; // France
  
  let url;
  if (phoneNumber) {
    url = `https://wa.me/${phoneNumber}?text=${encoded}`;
  } else {
    url = `https://wa.me/?text=${encoded}`;
  }
  
  window.open(url, '_blank');
}

function copyData() {
  const data = collectFormData();
  if (!validateForm(data)) return;
  
  const text = formatDataAsText(data);
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ Texte copié ! Collez-le dans un email ou message');
  }).catch(() => {
    // Fallback pour les anciens navigateurs
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('✓ Texte copié !');
  });
}

function downloadData() {
  const data = collectFormData();
  if (!validateForm(data)) return;
  
  const text = formatDataAsText(data);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `contribution_${data.prenom || 'famille'}_${data.nom || 'koira'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('✓ Fichier téléchargé !');
}