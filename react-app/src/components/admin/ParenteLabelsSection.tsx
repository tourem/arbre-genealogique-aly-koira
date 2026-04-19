import { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useParenteLabels } from '../../hooks/useParenteLabels';

type Category = 'term' | 'gloss' | 'explain';

const CATEGORY_LABELS: Record<Category, string> = {
  term: 'Termes Songhay',
  gloss: 'Gloses françaises',
  explain: 'Explications pédagogiques',
};

function categoryOf(key: string): Category | null {
  if (key.startsWith('term.')) return 'term';
  if (key.startsWith('gloss.')) return 'gloss';
  if (key.startsWith('explain.')) return 'explain';
  return null;
}

export default function ParenteLabelsSection() {
  const { defaults, overrides, refetch, loading } = useParenteLabels();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const out: Record<Category, string[]> = { term: [], gloss: [], explain: [] };
    for (const key of Object.keys(defaults)) {
      const cat = categoryOf(key);
      if (cat) out[cat].push(key);
    }
    for (const cat of Object.keys(out) as Category[]) out[cat].sort();
    return out;
  }, [defaults]);

  const effectiveValue = (key: string): string => draft[key] ?? overrides[key] ?? defaults[key];
  const isOverridden = (key: string): boolean => key in overrides;
  const isDirty = (key: string): boolean => key in draft;

  const handleChange = (key: string, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleResetOne = async (key: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('parente_labels').delete().eq('key', key);
    if (err) setError(err.message);
    setDraft((d) => { const copy = { ...d }; delete copy[key]; return copy; });
    await refetch();
    setSaving(false);
  };

  const handleResetAll = async () => {
    if (saving) return;
    if (!confirm('Réinitialiser tous les libellés aux valeurs par défaut ? Les overrides seront supprimés.')) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('parente_labels').delete().neq('key', '');
    if (err) setError(err.message);
    setDraft({});
    await refetch();
    setSaving(false);
  };

  const handleSave = async () => {
    if (saving) return;
    const rows = Object.keys(draft)
      .filter((k) => draft[k] !== defaults[k] || isOverridden(k))
      .map((k) => ({ key: k, value: draft[k] }));
    // Clés remises à la valeur par défaut → supprimer de la DB
    const resetKeys = Object.keys(draft).filter((k) => draft[k] === defaults[k] && isOverridden(k));

    setSaving(true);
    setError(null);

    if (resetKeys.length > 0) {
      const { error: err } = await supabase.from('parente_labels').delete().in('key', resetKeys);
      if (err) { setError(err.message); setSaving(false); return; }
    }
    if (rows.length > 0) {
      const { error: err } = await supabase.from('parente_labels').upsert(rows, { onConflict: 'key' });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setDraft({});
    await refetch();
    setSaving(false);
  };

  if (loading) return <div>Chargement...</div>;

  const hasChanges = Object.keys(draft).length > 0;

  return (
    <div className="admin-parente-labels">
      {error && <div className="admin-error">{error}</div>}

      {(['term', 'gloss', 'explain'] as Category[]).map((cat) => (
        <section key={cat} className="admin-labels-group">
          <h3>{CATEGORY_LABELS[cat]}</h3>
          <div className="admin-labels-table">
            {groups[cat].map((key) => {
              const isTextarea = cat === 'explain';
              const val = effectiveValue(key);
              const def = defaults[key];
              return (
                <div key={key} className={`admin-labels-row${isOverridden(key) ? ' overridden' : ''}${isDirty(key) ? ' dirty' : ''}`}>
                  <div className="row-key">
                    <code>{key}</code>
                    {isOverridden(key) && <span className="badge">personnalisé</span>}
                  </div>
                  <div className="row-value">
                    {isTextarea ? (
                      <textarea aria-label={key} value={val} onChange={(e) => handleChange(key, e.target.value)} rows={3} />
                    ) : (
                      <input type="text" aria-label={key} value={val} onChange={(e) => handleChange(key, e.target.value)} />
                    )}
                    {val !== def && <div className="row-default">Défaut : {def}</div>}
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      title="Réinitialiser au défaut"
                      onClick={() => handleResetOne(key)}
                      disabled={!isOverridden(key) || saving}
                    >↺</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="admin-labels-footer">
        <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="btn-primary">
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
        <button type="button" onClick={handleResetAll} disabled={saving} className="btn-danger">
          Tout réinitialiser
        </button>
      </div>
    </div>
  );
}
