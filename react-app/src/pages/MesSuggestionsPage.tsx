import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Suggestion } from '../lib/types';

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

const statusClasses: Record<string, string> = {
  pending: 'status-pending',
  approved: 'status-approved',
  rejected: 'status-rejected',
};

export default function MesSuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('suggestions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setSuggestions((data as Suggestion[]) || []);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="page active">
        <div className="scroll">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <div className="scroll">
        <h2 className="page-title">Mes suggestions</h2>
        <p className="page-subtitle">
          Suivez le statut de vos contributions soumises
        </p>

        {suggestions.length === 0 ? (
          <div className="empty-state">
            <p>Aucune suggestion pour le moment.</p>
            <p>Utilisez la page Contribuer pour proposer des modifications.</p>
          </div>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((s) => (
              <div key={s.id} className="suggestion-card">
                <div className="suggestion-header">
                  <span className={`suggestion-status ${statusClasses[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                  <span className="suggestion-type">
                    {s.type === 'add' ? 'Ajout' : s.type === 'edit' ? 'Modification' : 'Suppression'}
                  </span>
                  <span className="suggestion-date">
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="suggestion-body">
                  <strong>{s.payload.nom}</strong>
                  {s.payload.prenom && ` (${s.payload.prenom})`}
                  {s.payload.genre && ` - ${s.payload.genre === 'M' ? 'Homme' : 'Femme'}`}
                </div>
                {s.admin_note && (
                  <div className="suggestion-note">
                    <strong>Note admin :</strong> {s.admin_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
