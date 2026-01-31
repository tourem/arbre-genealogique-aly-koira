import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ContributionData } from '../lib/types';
import GenderSelector from '../components/contribute/GenderSelector';
import SpouseFieldGroup from '../components/contribute/SpouseFieldGroup';
import ChildFieldGroup from '../components/contribute/ChildFieldGroup';
import Toast from '../components/ui/Toast';

interface ChildField {
  nom: string;
  prenom: string;
  genre: string;
}

interface SpouseField {
  nom: string;
  prenom: string;
}

export default function ContribuerPage() {
  const { user } = useAuth();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [genre, setGenre] = useState('');
  const [pereNom, setPereNom] = useState('');
  const [perePrenom, setPerePrenom] = useState('');
  const [mereNom, setMereNom] = useState('');
  const [merePrenom, setMerePrenom] = useState('');
  const [epoux, setEpoux] = useState({ nom: '', prenom: '' });
  const [spouses, setSpouses] = useState<SpouseField[]>([]);
  const [children, setChildren] = useState<ChildField[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const addSpouse = () => setSpouses((prev) => [...prev, { nom: '', prenom: '' }]);
  const removeSpouse = (index: number) =>
    setSpouses((prev) => prev.filter((_, i) => i !== index));
  const updateSpouse = (
    index: number,
    field: 'nom' | 'prenom',
    value: string,
  ) =>
    setSpouses((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, [field]: value } : sp)),
    );

  const addChild = () =>
    setChildren((prev) => [...prev, { nom: '', prenom: '', genre: '' }]);
  const removeChild = (index: number) =>
    setChildren((prev) => prev.filter((_, i) => i !== index));
  const updateChild = (
    index: number,
    field: 'nom' | 'prenom' | 'genre',
    value: string,
  ) =>
    setChildren((prev) =>
      prev.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch)),
    );

  const collectData = useCallback((): ContributionData => {
    return {
      nom: nom.trim(),
      prenom: prenom.trim(),
      genre,
      pere: { nom: pereNom.trim(), prenom: perePrenom.trim() },
      mere: { nom: mereNom.trim(), prenom: merePrenom.trim() },
      epoux:
        genre === 'F' && (epoux.nom || epoux.prenom)
          ? { nom: epoux.nom.trim(), prenom: epoux.prenom.trim() }
          : null,
      epouses:
        genre === 'M'
          ? spouses.filter((sp) => sp.nom || sp.prenom).map((sp) => ({
              nom: sp.nom.trim(),
              prenom: sp.prenom.trim(),
            }))
          : [],
      enfants: children
        .filter((ch) => ch.nom || ch.prenom)
        .map((ch) => ({
          nom: ch.nom.trim(),
          prenom: ch.prenom.trim(),
          genre: ch.genre,
        })),
    };
  }, [nom, prenom, genre, pereNom, perePrenom, mereNom, merePrenom, epoux, spouses, children]);

  const resetForm = () => {
    setNom('');
    setPrenom('');
    setGenre('');
    setPereNom('');
    setPerePrenom('');
    setMereNom('');
    setMerePrenom('');
    setEpoux({ nom: '', prenom: '' });
    setSpouses([]);
    setChildren([]);
  };

  const handleSubmit = async () => {
    const data = collectData();
    if (!data.nom && !data.prenom) {
      setToast({
        message: 'Veuillez renseigner le nom ou le surnom',
        type: 'error',
      });
      return;
    }
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase.from('suggestions').insert({
      user_id: user.id,
      type: 'add',
      payload: data,
    });

    if (error) {
      setToast({ message: 'Erreur lors de l\'envoi : ' + error.message, type: 'error' });
    } else {
      setToast({ message: 'Suggestion envoy\u00e9e ! Un admin la validera.', type: 'success' });
      resetForm();
    }
    setSubmitting(false);
  };

  return (
    <div className="page active">
      <div className="scroll">
        <h2 className="page-title">
          Contribuer \u00e0 l&apos;arbre
        </h2>
        <p className="page-subtitle">
          Proposez un ajout &agrave; l&apos;arbre familial. Un administrateur validera votre suggestion.
        </p>

        <div className="form-section">
          <div className="form-section-title">
            Informations de la personne
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nom complet *</label>
              <input
                type="text"
                placeholder="Ex: Moussa Ali"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Surnom</label>
              <input
                type="text"
                placeholder="Ex: Ko\u00EFra"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Genre *</label>
            <GenderSelector value={genre} onChange={setGenre} />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            Parents
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nom du p&egrave;re</label>
              <input
                type="text"
                placeholder="Ex: Ali Alkamahamane"
                value={pereNom}
                onChange={(e) => setPereNom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Pr&eacute;nom du p&egrave;re</label>
              <input
                type="text"
                placeholder="Pr\u00E9nom"
                value={perePrenom}
                onChange={(e) => setPerePrenom(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nom de la m&egrave;re</label>
              <input
                type="text"
                placeholder="Ex: Farimata Alassane"
                value={mereNom}
                onChange={(e) => setMereNom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Pr&eacute;nom de la m&egrave;re</label>
              <input
                type="text"
                placeholder="Pr\u00E9nom"
                value={merePrenom}
                onChange={(e) => setMerePrenom(e.target.value)}
              />
            </div>
          </div>
        </div>

        {genre && (
          <div className="form-section">
            <SpouseFieldGroup
              gender={genre}
              spouses={spouses}
              epoux={epoux}
              onAddSpouse={addSpouse}
              onRemoveSpouse={removeSpouse}
              onSpouseChange={updateSpouse}
              onEpouxChange={(field, value) =>
                setEpoux((prev) => ({ ...prev, [field]: value }))
              }
            />
          </div>
        )}

        <div className="form-section">
          <ChildFieldGroup
            children={children}
            onAddChild={addChild}
            onRemoveChild={removeChild}
            onChildChange={updateChild}
          />
        </div>

        <div className="form-actions">
          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={submitting}
            type="button"
          >
            {submitting ? 'Envoi en cours...' : 'Soumettre la suggestion'}
          </button>
        </div>

        <div className="form-note">
          Votre suggestion sera v&eacute;rifi&eacute;e par un administrateur avant d&apos;&ecirc;tre
          ajout&eacute;e &agrave; l&apos;arbre familial. Vous pouvez suivre le statut dans
          la page &laquo; Mes suggestions &raquo;.
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
