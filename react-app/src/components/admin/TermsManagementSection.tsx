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

export default function TermsManagementSection() {
  const [categories, setCategories] = useState<RelationCategory[]>([]);
  const [terms, setTerms] = useState<RelationTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTerm | null>(null);
  const [adding, setAdding] = useState<NewTerm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    terms.filter((t) => t.category_code === code);

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

    if (!adding.term_code.trim() || !adding.term_songhoy.trim() || !adding.label_fr.trim()) {
      setError('Code, terme Songhoy et traduction FR sont obligatoires.');
      return;
    }

    setSaving(true);
    setError(null);

    const catTerms = termsForCategory(adding.category_code);
    const maxOrder = catTerms.reduce((max, t) => Math.max(max, t.display_order), 0);

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
          ? `Le code "${adding.term_code.toUpperCase()}" existe deja.`
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

  return (
    <div className="admin-section terms-management">
      <p className="terms-intro">
        Gerez les termes de parente Songhoy utilises dans le calcul des
        relations familiales.
      </p>

      {error && <p className="terms-error">{error}</p>}

      <div className="terms-categories-list">
        {categories.map((cat) => {
          const catTerms = termsForCategory(cat.code);
          const isExpanded = expandedCat === cat.code;

          return (
            <div key={cat.code} className="terms-category-block">
              <button
                className={`terms-category-header${isExpanded ? ' expanded' : ''}`}
                onClick={() => toggleCategory(cat.code)}
                type="button"
              >
                <div className="terms-category-info">
                  <span className="terms-category-label">
                    {cat.label_songhoy && (
                      <span className="terms-category-songhoy-label">
                        {cat.label_songhoy}
                        {' — '}
                      </span>
                    )}
                    {cat.label_fr}
                  </span>
                  <span className="terms-category-count">
                    {catTerms.length} terme{catTerms.length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="terms-category-chevron">
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </button>

              {isExpanded && (
                <div className="terms-category-body">
                  {cat.description && (
                    <p className="terms-category-desc">{cat.description}</p>
                  )}

                  <div className="terms-list">
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

                      return (
                        <div
                          key={term.id}
                          className={`term-card${!term.is_active ? ' inactive' : ''}`}
                        >
                          <div className="term-card-main">
                            <div className="term-card-left">
                              <span className="term-card-code">
                                {term.term_code}
                              </span>
                              <span className="term-card-songhoy">
                                {term.term_songhoy}
                              </span>
                              {term.prononciation && (
                                <span className="term-card-prononciation">
                                  [{term.prononciation}]
                                </span>
                              )}
                            </div>
                            <div className="term-card-right">
                              <span className="term-card-label-fr">
                                {term.label_fr}
                              </span>
                              <span className="term-card-gender-info">
                                {term.speaker_gender !== 'ANY'
                                  ? term.speaker_gender === 'M'
                                    ? 'Loc: H'
                                    : 'Loc: F'
                                  : ''}
                                {term.target_gender !== 'ANY'
                                  ? ` \u2192 ${term.target_gender === 'M' ? 'H' : 'F'}`
                                  : ''}
                              </span>
                              {term.context_condition && (
                                <span className="term-card-context">
                                  {term.context_condition}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="term-card-actions">
                            <button
                              className="btn-edit"
                              onClick={() => startEdit(term)}
                              type="button"
                            >
                              Modifier
                            </button>
                            <button
                              className={`btn-toggle-active${term.is_active ? '' : ' activate'}`}
                              onClick={() => toggleActive(term)}
                              type="button"
                            >
                              {term.is_active ? 'Desactiver' : 'Activer'}
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
          placeholder="Ex: Grand-pere"
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
            <option value="ANY">Indifferent</option>
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
            <option value="ANY">Indifferent</option>
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
              ? 'Creer'
              : 'Enregistrer'}
        </button>
        <button
          className="btn-reject"
          onClick={onCancel}
          type="button"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
