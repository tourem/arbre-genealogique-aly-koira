import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member } from '../../lib/types';

interface Props {
  member: Member | null;
  members: Record<string, Member>;
  onClose: () => void;
  onSaved: (updatedPayload?: Partial<Member>) => void;
}

export default function MemberFormModal({ member, members, onClose, onSaved }: Props) {
  const isEdit = member !== null;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [generation, setGeneration] = useState(0);
  const [fatherId, setFatherId] = useState('');
  const [motherRef, setMotherRef] = useState('');
  const [spousesStr, setSpousesStr] = useState('');
  const [children, setChildren] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [birthCountry, setBirthCountry] = useState('');
  const [village, setVillage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Search state for adding children
  const [childSearch, setChildSearch] = useState('');
  const [showChildSuggestions, setShowChildSuggestions] = useState(false);
  const childSearchRef = useRef<HTMLInputElement>(null);

  // Track removed and added children for relationship updates
  const [removedChildren, setRemovedChildren] = useState<string[]>([]);
  const [addedChildren, setAddedChildren] = useState<string[]>([]);

  useEffect(() => {
    if (member) {
      setId(member.id);
      setName(member.name);
      setAlias(member.alias || '');
      setGender(member.gender);
      setGeneration(member.generation);
      setFatherId(member.father_id || '');
      setMotherRef(member.mother_ref || '');
      setSpousesStr(member.spouses.join(', '));
      setChildren(member.children || []);
      setPhotoPreview(member.photo_url || null);
      setNote(member.note || '');
      setBirthCity(member.birth_city || '');
      setBirthCountry(member.birth_country || '');
      setVillage(member.village || '');
    }
  }, [member]);

  // Filter suggestions for child search
  const childSuggestions = useMemo(() => {
    if (!childSearch.trim()) return [];
    const q = childSearch.toLowerCase();
    return Object.values(members)
      .filter(m =>
        !children.includes(m.id) && // Not already a child
        m.id !== id && // Not self
        (m.name.toLowerCase().includes(q) ||
         m.id.toLowerCase().includes(q) ||
         (m.alias?.toLowerCase().includes(q) ?? false))
      )
      .slice(0, 8);
  }, [childSearch, children, members, id]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 2 Mo');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const parseList = (str: string): string[] =>
    str.split(',').map((s) => s.trim()).filter(Boolean);

  // Remove a child from the list
  const handleRemoveChild = (childId: string) => {
    setChildren(prev => prev.filter(c => c !== childId));
    // Track for relationship update (only if it was an original child)
    if (member?.children.includes(childId)) {
      setRemovedChildren(prev => [...prev, childId]);
    }
    // If it was just added, remove from addedChildren
    setAddedChildren(prev => prev.filter(c => c !== childId));
  };

  // Add a child to the list
  const handleAddChild = (childId: string) => {
    if (children.includes(childId)) return;
    setChildren(prev => [...prev, childId]);
    setChildSearch('');
    setShowChildSuggestions(false);
    // Track for relationship update (only if not an original child)
    if (!member?.children.includes(childId)) {
      setAddedChildren(prev => [...prev, childId]);
    }
    // If it was removed before, remove from removedChildren
    setRemovedChildren(prev => prev.filter(c => c !== childId));
  };

  const handleSave = async () => {
    if (!id.trim() || !name.trim()) {
      setError('L\'ID et le nom sont requis');
      return;
    }

    setSaving(true);
    setError('');

    let photoUrl: string | null = member?.photo_url ?? null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const filePath = `${id.trim()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(filePath, photoFile, { upsert: true });
      if (uploadErr) {
        setError(uploadErr.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }

    const payload = {
      id: id.trim(),
      name: name.trim(),
      alias: alias.trim() || null,
      gender,
      generation,
      father_id: fatherId.trim() || null,
      mother_ref: motherRef.trim() || null,
      spouses: parseList(spousesStr),
      children,
      photo_url: photoUrl,
      note: note.trim() || null,
      birth_city: birthCity.trim() || null,
      birth_country: birthCountry.trim() || null,
      village: village.trim() || null,
    };

    try {
      if (isEdit) {
        // Update the member
        const { error: err } = await supabase
          .from('members')
          .update(payload)
          .eq('id', member.id);
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }

        // Update relationships for removed children
        for (const childId of removedChildren) {
          const child = members[childId];
          if (!child) continue;

          if (gender === 'M') {
            // Remove father relationship
            await supabase
              .from('members')
              .update({ father_id: null })
              .eq('id', childId);
          } else {
            // Remove mother relationship
            await supabase
              .from('members')
              .update({ mother_ref: null })
              .eq('id', childId);
          }
        }

        // Update relationships for added children
        for (const childId of addedChildren) {
          const child = members[childId];
          if (!child) continue;

          if (gender === 'M') {
            // Set father relationship
            await supabase
              .from('members')
              .update({ father_id: id.trim() })
              .eq('id', childId);
          } else {
            // Set mother relationship
            await supabase
              .from('members')
              .update({ mother_ref: id.trim() })
              .eq('id', childId);
          }
        }
      } else {
        const { error: err } = await supabase
          .from('members')
          .insert(payload);
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      onSaved(isEdit ? payload : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setSaving(false);
    }
  };

  // Get member name by ID
  const getMemberName = (memberId: string) => {
    const m = members[memberId];
    if (!m) return memberId;
    return m.alias ? `${m.name} (${m.alias})` : m.name;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Modifier le membre' : 'Ajouter un membre'}</h3>
          <button className="modal-close" onClick={onClose} type="button">&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>ID *</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEdit}
                placeholder="ex: moussa_ali"
              />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Moussa Ali"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Surnom</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="ex: Koïra"
              />
            </div>
            <div className="form-group">
              <label>Genre *</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as 'M' | 'F')}>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>G&eacute;n&eacute;ration</label>
              <input
                type="number"
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="form-group">
              <label>P&egrave;re (ID)</label>
              <input
                type="text"
                value={fatherId}
                onChange={(e) => setFatherId(e.target.value)}
                placeholder="ID du père"
              />
            </div>
          </div>

          <div className="form-group">
            <label>M&egrave;re (r&eacute;f&eacute;rence)</label>
            <input
              type="text"
              value={motherRef}
              onChange={(e) => setMotherRef(e.target.value)}
              placeholder="Référence de la mère"
            />
          </div>

          <div className="form-group">
            <label>&Eacute;poux/&eacute;pouses (IDs s&eacute;par&eacute;s par des virgules)</label>
            <input
              type="text"
              value={spousesStr}
              onChange={(e) => setSpousesStr(e.target.value)}
              placeholder="id1, id2"
            />
          </div>

          {/* Children section with visual list */}
          <div className="form-group">
            <label>Enfants ({children.length})</label>

            {/* Current children list */}
            {children.length > 0 && (
              <div className="children-list">
                {children.map(childId => {
                  const child = members[childId];
                  return (
                    <div key={childId} className="child-tag">
                      <span className={`child-gender ${child?.gender === 'F' ? 'female' : 'male'}`}>
                        {child?.gender === 'F' ? '♀' : '♂'}
                      </span>
                      <span className="child-name">{getMemberName(childId)}</span>
                      <button
                        type="button"
                        className="child-remove"
                        onClick={() => handleRemoveChild(childId)}
                        title="Retirer cet enfant"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Search to add children */}
            <div className="child-search-wrap">
              <input
                ref={childSearchRef}
                type="text"
                value={childSearch}
                onChange={(e) => {
                  setChildSearch(e.target.value);
                  setShowChildSuggestions(true);
                }}
                onFocus={() => setShowChildSuggestions(true)}
                placeholder="Rechercher un enfant à ajouter..."
                className="child-search-input"
              />

              {showChildSuggestions && childSuggestions.length > 0 && (
                <div className="child-suggestions">
                  {childSuggestions.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className="child-suggestion"
                      onClick={() => handleAddChild(m.id)}
                    >
                      <span className={`child-gender ${m.gender === 'F' ? 'female' : 'male'}`}>
                        {m.gender === 'F' ? '♀' : '♂'}
                      </span>
                      <span className="suggestion-name">{m.name}</span>
                      {m.alias && <span className="suggestion-alias">({m.alias})</span>}
                      <span className="suggestion-gen">Gen. {m.generation}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {children.length === 0 && !childSearch && (
              <p className="form-hint">Aucun enfant. Utilisez le champ ci-dessus pour en ajouter.</p>
            )}
          </div>

          <div className="form-group">
            <label>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: Premier fils de la famille"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Village</label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="ex: Koira Tegui"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ville de naissance</label>
              <input
                type="text"
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                placeholder="ex: Gao"
              />
            </div>
            <div className="form-group">
              <label>Pays</label>
              <input
                type="text"
                value={birthCountry}
                onChange={(e) => setBirthCountry(e.target.value)}
                placeholder="ex: Mali"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo</label>
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="photo-preview" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="photo-input"
            />
          </div>

          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="action-btn" onClick={onClose} type="button">Annuler</button>
          <button className="modal-btn-primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
