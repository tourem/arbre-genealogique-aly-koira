import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { RelationCategory, RelationTerm } from '../../lib/types';

interface EditingTerm {
  id: string;
  term_songhoy: string;
  prononciation: string;
  label_fr: string;
  description: string;
  speaker_gender: 'M' | 'F' | 'ANY';
  target_gender: 'M' | 'F' | 'ANY';
  context_condition: string;
}

interface NewTerm {
  category_code: string;
  term_code: string;
  term_songhoy: string;
  prononciation: string;
  label_fr: string;
  description: string;
  speaker_gender: 'M' | 'F' | 'ANY';
  target_gender: 'M' | 'F' | 'ANY';
  context_condition: string;
}

function emptyNewTerm(categoryCode: string): NewTerm {
  return {
    category_code: categoryCode,
    term_code: '',
    term_songhoy: '',
    prononciation: '',
    label_fr: '',
    description: '',
    speaker_gender: 'ANY',
    target_gender: 'ANY',
    context_condition: '',
  };
}

/* --- Category color/icon palette (assigned by index) --- */
const colorPalette = ['gold', 'green', 'terra', 'blue', 'violet'] as const;
const iconPalette = ['\u25B2', '\u25C6', '\u2550', '\u2295', '\u25CF', '\u25C8', '\u2726', '\u25A0', '\u2666', '\u2740', '\u2605'];

function getCatStyle(index: number) {
  return {
    color: colorPalette[index % colorPalette.length],
    icon: iconPalette[index % iconPalette.length],
  };
}

/* --- Direction formatting --- */
function formatDirection(
  speaker: string,
  target: string,
): { from: string; to: string } | null {
  if (speaker === 'ANY' && target === 'ANY') return null;
  const from =
    speaker === 'M' ? 'Homme' : speaker === 'F' ? 'Femme' : 'Tous';
  const to = target === 'M' ? 'Homme' : target === 'F' ? 'Femme' : 'Tous';
  return { from, to };
}

/* --- Arrow SVG (inline) --- */
function ArrowSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function TermsManagementSection() {
  const [categories, setCategories] = useState<RelationCategory[]>([]);
  const [terms, setTerms] = useState<RelationTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTerm | null>(null);
  const [adding, setAdding] = useState<NewTerm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catRes, termRes] = await Promise.all([
      supabase
        .from('relation_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('relation_terms')
        .select('*')
        .order('display_order', { ascending: true }),
    ]);

    if (catRes.data) setCategories(catRes.data as RelationCategory[]);
    if (termRes.data) setTerms(termRes.data as RelationTerm[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const termsForCategory = (code: string) =>
    terms.filter((t) => {
      if (t.category_code !== code) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.term_songhoy.toLowerCase().includes(q) ||
          t.label_fr.toLowerCase().includes(q) ||
          (t.prononciation?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });

  const toggleCategory = (code: string) => {
    setExpandedCat(expandedCat === code ? null : code);
    setEditing(null);
    setAdding(null);
    setError(null);
  };

  // ---- Edit ----

  const startEdit = (term: RelationTerm) => {
    setAdding(null);
    setError(null);
    setEditing({
      id: term.id,
      term_songhoy: term.term_songhoy,
      prononciation: term.prononciation || '',
      label_fr: term.label_fr,
      description: term.description || '',
      speaker_gender: term.speaker_gender,
      target_gender: term.target_gender,
      context_condition: term.context_condition || '',
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);

    const oldTerm = terms.find((t) => t.id === editing.id);

    const { error: updateErr } = await supabase
      .from('relation_terms')
      .update({
        term_songhoy: editing.term_songhoy,
        prononciation: editing.prononciation || null,
        label_fr: editing.label_fr,
        description: editing.description || null,
        speaker_gender: editing.speaker_gender,
        target_gender: editing.target_gender,
        context_condition: editing.context_condition || null,
      })
      .eq('id', editing.id);

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    // Audit log
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && oldTerm) {
      await supabase.from('term_audit_log').insert({
        term_id: editing.id,
        category_code: oldTerm.category_code,
        user_id: user.id,
        action: 'UPDATE',
        field_changed: 'multiple',
        old_value: JSON.stringify({
          term_songhoy: oldTerm.term_songhoy,
          label_fr: oldTerm.label_fr,
        }),
        new_value: JSON.stringify({
          term_songhoy: editing.term_songhoy,
          label_fr: editing.label_fr,
        }),
      });
    }

    setEditing(null);
    await loadData();
    setSaving(false);
  };

  // ---- Add ----

  const startAdd = (categoryCode: string) => {
    setEditing(null);
    setError(null);
    setAdding(emptyNewTerm(categoryCode));
  };

  const cancelAdd = () => {
    setAdding(null);
    setError(null);
  };

  const saveNewTerm = async () => {
    if (!adding) return;

    if (
      !adding.term_code.trim() ||
      !adding.term_songhoy.trim() ||
      !adding.label_fr.trim()
    ) {
      setError('Code, terme Songhoy et traduction FR sont obligatoires.');
      return;
    }

    setSaving(true);
    setError(null);

    const catTerms = terms.filter(
      (t) => t.category_code === adding.category_code,
    );
    const maxOrder = catTerms.reduce(
      (max, t) => Math.max(max, t.display_order),
      0,
    );

    const { data, error: insertErr } = await supabase
      .from('relation_terms')
      .insert({
        category_code: adding.category_code,
        term_code: adding.term_code.trim().toUpperCase(),
        term_songhoy: adding.term_songhoy.trim(),
        prononciation: adding.prononciation.trim() || null,
        label_fr: adding.label_fr.trim(),
        description: adding.description.trim() || null,
        speaker_gender: adding.speaker_gender,
        target_gender: adding.target_gender,
        context_condition: adding.context_condition.trim() || null,
        is_active: true,
        display_order: maxOrder + 1,
      })
      .select('id')
      .single();

    if (insertErr) {
      setError(
        insertErr.message.includes('unique')
          ? `Le code "${adding.term_code.toUpperCase()}" existe déjà.`
          : insertErr.message,
      );
      setSaving(false);
      return;
    }

    // Audit log
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && data) {
      await supabase.from('term_audit_log').insert({
        term_id: data.id,
        category_code: adding.category_code,
        user_id: user.id,
        action: 'CREATE',
        field_changed: null,
        old_value: null,
        new_value: JSON.stringify({
          term_code: adding.term_code.toUpperCase(),
          term_songhoy: adding.term_songhoy,
          label_fr: adding.label_fr,
        }),
      });
    }

    setAdding(null);
    await loadData();
    setSaving(false);
  };

  // ---- Toggle active ----

  const toggleActive = async (term: RelationTerm) => {
    const newActive = !term.is_active;

    const { error: toggleErr } = await supabase
      .from('relation_terms')
      .update({ is_active: newActive })
      .eq('id', term.id);

    if (toggleErr) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('term_audit_log').insert({
        term_id: term.id,
        category_code: term.category_code,
        user_id: user.id,
        action: newActive ? 'REACTIVATE' : 'DEACTIVATE',
        field_changed: 'is_active',
        old_value: String(term.is_active),
        new_value: String(newActive),
      });
    }

    await loadData();
  };

  // ---- Render ----

  if (loading) return <p>Chargement des termes...</p>;

  /* KPIs */
  const totalTerms = terms.length;
  const totalCats = categories.length;

  return (
    <div className="admin-section">
      {/* KPIs */}
      <div className="adm-kpis">
        <div className="adm-kpi gold">
          <strong>{totalTerms}</strong> termes
        </div>
        <div className="adm-kpi blue">
          <strong>{totalCats}</strong> cat&eacute;gories
        </div>
      </div>

      {/* Search */}
      <div className="adm-toolbar">
        <input
          type="text"
          className="adm-search"
          placeholder="Rechercher un terme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="terms-error">{error}</p>}

      {/* Categories */}
      <div className="adm-rows">
        {categories.map((cat, catIndex) => {
          const style = getCatStyle(catIndex);
          const catTerms = termsForCategory(cat.code);
          const allCatTerms = terms.filter(
            (t) => t.category_code === cat.code,
          );
          const isExpanded = expandedCat === cat.code;

          return (
            <div key={cat.code}>
              <button
                className={`adm-cat-header ${style.color}${isExpanded ? ' expanded' : ''}`}
                onClick={() => toggleCategory(cat.code)}
                type="button"
              >
                <span className="adm-cat-icon">{style.icon}</span>
                <div className="adm-cat-info">
                  <span className={`adm-cat-title ${style.color}`}>
                    {cat.label_songhoy || cat.label_fr}
                  </span>
                  {cat.label_songhoy && (
                    <span className="adm-cat-sub">{cat.label_fr}</span>
                  )}
                </div>
                <span className={`adm-cat-count ${style.color}`}>
                  {allCatTerms.length}
                </span>
                <span className="adm-cat-chevron">&#x25BC;</span>
              </button>

              {isExpanded && (
                <div className="adm-cat-body">
                  {cat.description && (
                    <p className="adm-cat-desc">{cat.description}</p>
                  )}

                  {catTerms.map((term) => {
                    const isEditing = editing?.id === term.id;

                    if (isEditing && editing) {
                      return (
                        <div key={term.id} className="term-card editing">
                          <TermForm
                            mode="edit"
                            values={{
                              term_code: term.term_code,
                              term_songhoy: editing.term_songhoy,
                              prononciation: editing.prononciation,
                              label_fr: editing.label_fr,
                              description: editing.description,
                              speaker_gender: editing.speaker_gender,
                              target_gender: editing.target_gender,
                              context_condition: editing.context_condition,
                            }}
                            onChange={(field, value) =>
                              setEditing({ ...editing, [field]: value })
                            }
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            saving={saving}
                          />
                        </div>
                      );
                    }

                    const dir = formatDirection(
                      term.speaker_gender,
                      term.target_gender,
                    );

                    return (
                      <div
                        key={term.id}
                        className={`adm-term ${style.color}${!term.is_active ? ' inactive' : ''}`}
                      >
                        <div className="adm-term-main">
                          <span
                            className={`adm-term-songhoy ${style.color}`}
                          >
                            {term.term_songhoy}
                          </span>
                          {term.prononciation && (
                            <span className="adm-term-prononciation">
                              [{term.prononciation}]
                            </span>
                          )}
                          <span className="adm-term-fr">
                            {term.label_fr}
                          </span>
                          {dir && (
                            <span className="adm-term-dir">
                              {dir.from} <ArrowSvg /> {dir.to}
                            </span>
                          )}
                          {term.context_condition && (
                            <span className="adm-term-context">
                              {term.context_condition}
                            </span>
                          )}
                          {term.description && (
                            <p className="adm-term-desc">
                              {term.description}
                            </p>
                          )}
                        </div>
                        <div className="adm-acts">
                          <button
                            onClick={() => startEdit(term)}
                            title="Modifier"
                            type="button"
                          >
                            &#x270E;
                          </button>
                          <button
                            onClick={() => toggleActive(term)}
                            title={
                              term.is_active
                                ? 'Désactiver'
                                : 'Activer'
                            }
                            type="button"
                          >
                            {term.is_active ? '\u25CF' : '\u25CB'}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new term form */}
                  {adding && adding.category_code === cat.code ? (
                    <div className="term-card editing adding">
                      <TermForm
                        mode="add"
                        values={{
                          term_code: adding.term_code,
                          term_songhoy: adding.term_songhoy,
                          prononciation: adding.prononciation,
                          label_fr: adding.label_fr,
                          description: adding.description,
                          speaker_gender: adding.speaker_gender,
                          target_gender: adding.target_gender,
                          context_condition: adding.context_condition,
                        }}
                        onChange={(field, value) =>
                          setAdding({ ...adding, [field]: value })
                        }
                        onSave={saveNewTerm}
                        onCancel={cancelAdd}
                        saving={saving}
                      />
                    </div>
                  ) : (
                    <button
                      className="btn-add-term"
                      onClick={() => startAdd(cat.code)}
                      type="button"
                    >
                      + Ajouter un terme
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Shared form component for edit and add ---- */

interface TermFormValues {
  term_code: string;
  term_songhoy: string;
  prononciation: string;
  label_fr: string;
  description: string;
  speaker_gender: 'M' | 'F' | 'ANY';
  target_gender: 'M' | 'F' | 'ANY';
  context_condition: string;
}

function TermForm({
  mode,
  values,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  mode: 'edit' | 'add';
  values: TermFormValues;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="term-edit-form">
      <div className="term-edit-row">
        <label>Code</label>
        <input
          type="text"
          value={values.term_code}
          disabled={mode === 'edit'}
          onChange={(e) => onChange('term_code', e.target.value)}
          className={`term-edit-input${mode === 'edit' ? ' disabled' : ''}`}
          placeholder="Ex: BABA_BERO"
        />
      </div>
      <div className="term-edit-row">
        <label>Terme Songhoy</label>
        <input
          type="text"
          value={values.term_songhoy}
          onChange={(e) => onChange('term_songhoy', e.target.value)}
          className="term-edit-input"
          placeholder="Ex: BABA BERO"
        />
      </div>
      <div className="term-edit-row">
        <label>Prononciation</label>
        <input
          type="text"
          value={values.prononciation}
          onChange={(e) => onChange('prononciation', e.target.value)}
          className="term-edit-input"
          placeholder="Ex: ba-ba be-ro"
        />
      </div>
      <div className="term-edit-row">
        <label>Traduction FR</label>
        <input
          type="text"
          value={values.label_fr}
          onChange={(e) => onChange('label_fr', e.target.value)}
          className="term-edit-input"
          placeholder="Ex: Grand-père"
        />
      </div>
      <div className="term-edit-row">
        <label>Description</label>
        <input
          type="text"
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="term-edit-input"
          placeholder="Description optionnelle"
        />
      </div>
      <div className="term-edit-row">
        <label>Condition</label>
        <input
          type="text"
          value={values.context_condition}
          onChange={(e) => onChange('context_condition', e.target.value)}
          className="term-edit-input"
          placeholder="Ex: ELDER, YOUNGER, LEVEL_1"
        />
      </div>
      <div className="term-edit-row-inline">
        <div className="term-edit-row">
          <label>Sexe locuteur</label>
          <select
            value={values.speaker_gender}
            onChange={(e) => onChange('speaker_gender', e.target.value)}
            className="term-edit-input"
          >
            <option value="ANY">Indiff&eacute;rent</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>
        <div className="term-edit-row">
          <label>Sexe cible</label>
          <select
            value={values.target_gender}
            onChange={(e) => onChange('target_gender', e.target.value)}
            className="term-edit-input"
          >
            <option value="ANY">Indiff&eacute;rent</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>
      </div>
      <div className="term-edit-actions">
        <button
          className="btn-approve"
          onClick={onSave}
          disabled={saving}
          type="button"
        >
          {saving
            ? 'Enregistrement...'
            : mode === 'add'
              ? 'Créer'
              : 'Enregistrer'}
        </button>
        <button className="btn-reject" onClick={onCancel} type="button">
          Annuler
        </button>
      </div>
    </div>
  );
}
