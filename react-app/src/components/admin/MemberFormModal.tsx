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

  // Auto-generate UUID for new members
  const [id, setId] = useState(() => isEdit ? '' : crypto.randomUUID());
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

  // Search state for father selection
  const [fatherSearch, setFatherSearch] = useState('');
  const [showFatherSuggestions, setShowFatherSuggestions] = useState(false);

  // Search state for mother selection
  const [motherSearch, setMotherSearch] = useState('');
  const [showMotherSuggestions, setShowMotherSuggestions] = useState(false);

  // Track removed and added children for relationship updates
  const [removedChildren, setRemovedChildren] = useState<string[]>([]);
  const [addedChildren, setAddedChildren] = useState<string[]>([]);

  // Track original parent IDs for detecting changes
  const [originalFatherId, setOriginalFatherId] = useState<string | null>(null);
  const [originalMotherRef, setOriginalMotherRef] = useState<string | null>(null);

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

      // Initialize parent search fields with current parent names
      if (member.father_id && members[member.father_id]) {
        const father = members[member.father_id];
        setFatherSearch(father.alias ? `${father.name} (${father.alias})` : father.name);
      }
      if (member.mother_ref && members[member.mother_ref]) {
        const mother = members[member.mother_ref];
        setMotherSearch(mother.alias ? `${mother.name} (${mother.alias})` : mother.name);
      }

      // Track original parent IDs
      setOriginalFatherId(member.father_id || null);
      setOriginalMotherRef(member.mother_ref || null);
    }
  }, [member, members]);

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

  // Filter suggestions for father search (only males)
  const fatherSuggestions = useMemo(() => {
    if (!fatherSearch.trim()) return [];
    const q = fatherSearch.toLowerCase();
    return Object.values(members)
      .filter(m =>
        m.gender === 'M' && // Only males
        m.id !== id && // Not self
        (m.name.toLowerCase().includes(q) ||
         m.id.toLowerCase().includes(q) ||
         (m.alias?.toLowerCase().includes(q) ?? false))
      )
      .sort((a, b) => a.generation - b.generation) // Sort by generation
      .slice(0, 8);
  }, [fatherSearch, members, id]);

  // Filter suggestions for mother search (only females)
  const motherSuggestions = useMemo(() => {
    if (!motherSearch.trim()) return [];
    const q = motherSearch.toLowerCase();
    return Object.values(members)
      .filter(m =>
        m.gender === 'F' && // Only females
        m.id !== id && // Not self
        (m.name.toLowerCase().includes(q) ||
         m.id.toLowerCase().includes(q) ||
         (m.alias?.toLowerCase().includes(q) ?? false))
      )
      .sort((a, b) => a.generation - b.generation) // Sort by generation
      .slice(0, 8);
  }, [motherSearch, members, id]);

  // Suggested mothers: father's spouses (if father is set)
  const suggestedMothers = useMemo(() => {
    if (!fatherId || !members[fatherId]) return [];
    const father = members[fatherId];
    return (father.spouses || [])
      .map(spouseId => members[spouseId])
      .filter((m): m is Member => m !== undefined && m.gender === 'F');
  }, [fatherId, members]);

  // Suggested fathers: mother's spouses (if mother is set)
  const suggestedFathers = useMemo(() => {
    if (!motherRef || !members[motherRef]) return [];
    const mother = members[motherRef];
    return (mother.spouses || [])
      .map(spouseId => members[spouseId])
      .filter((m): m is Member => m !== undefined && m.gender === 'M');
  }, [motherRef, members]);

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
    if (!name.trim()) {
      setError('Le nom est requis');
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
            // Set father relationship on child
            await supabase
              .from('members')
              .update({ father_id: id.trim() })
              .eq('id', childId);

            // Also add child to mother's children[] if mother exists
            if (child.mother_ref && members[child.mother_ref]) {
              const mother = members[child.mother_ref];
              const motherChildren = mother.children || [];
              if (!motherChildren.includes(childId)) {
                await supabase
                  .from('members')
                  .update({ children: [...motherChildren, childId] })
                  .eq('id', child.mother_ref);
              }
            }
          } else {
            // Set mother relationship on child
            await supabase
              .from('members')
              .update({ mother_ref: id.trim() })
              .eq('id', childId);

            // Also add child to father's children[] if father exists
            if (child.father_id && members[child.father_id]) {
              const father = members[child.father_id];
              const fatherChildren = father.children || [];
              if (!fatherChildren.includes(childId)) {
                await supabase
                  .from('members')
                  .update({ children: [...fatherChildren, childId] })
                  .eq('id', child.father_id);
              }
            }
          }
        }

        // Handle parent changes (when editing a child's father/mother)
        const currentFatherId = fatherId.trim() || null;
        const currentMotherRef = motherRef.trim() || null;

        // Father changed
        if (originalFatherId !== currentFatherId) {
          // Remove from old father's children[]
          if (originalFatherId && members[originalFatherId]) {
            const oldFather = members[originalFatherId];
            const updatedChildren = (oldFather.children || []).filter(c => c !== member.id);
            await supabase
              .from('members')
              .update({ children: updatedChildren })
              .eq('id', originalFatherId);
          }
          // Add to new father's children[]
          if (currentFatherId && members[currentFatherId]) {
            const newFather = members[currentFatherId];
            const newFatherChildren = newFather.children || [];
            if (!newFatherChildren.includes(member.id)) {
              await supabase
                .from('members')
                .update({ children: [...newFatherChildren, member.id] })
                .eq('id', currentFatherId);
            }
          }
        }

        // Mother changed
        if (originalMotherRef !== currentMotherRef) {
          // Remove from old mother's children[]
          if (originalMotherRef && members[originalMotherRef]) {
            const oldMother = members[originalMotherRef];
            const updatedChildren = (oldMother.children || []).filter(c => c !== member.id);
            await supabase
              .from('members')
              .update({ children: updatedChildren })
              .eq('id', originalMotherRef);
          }
          // Add to new mother's children[]
          if (currentMotherRef && members[currentMotherRef]) {
            const newMother = members[currentMotherRef];
            const newMotherChildren = newMother.children || [];
            if (!newMotherChildren.includes(member.id)) {
              await supabase
                .from('members')
                .update({ children: [...newMotherChildren, member.id] })
                .eq('id', currentMotherRef);
            }
          }
        }
      } else {
        // Creating new member
        const { error: err } = await supabase
          .from('members')
          .insert(payload);
        if (err) {
          setError(err.message);
          setSaving(false);
          return;
        }

        // Add new member to father's children[] if father is set
        const newFatherId = fatherId.trim() || null;
        if (newFatherId && members[newFatherId]) {
          const father = members[newFatherId];
          const fatherChildren = father.children || [];
          if (!fatherChildren.includes(id.trim())) {
            await supabase
              .from('members')
              .update({ children: [...fatherChildren, id.trim()] })
              .eq('id', newFatherId);
          }
        }

        // Add new member to mother's children[] if mother is set
        const newMotherRef = motherRef.trim() || null;
        if (newMotherRef && members[newMotherRef]) {
          const mother = members[newMotherRef];
          const motherChildren = mother.children || [];
          if (!motherChildren.includes(id.trim())) {
            await supabase
              .from('members')
              .update({ children: [...motherChildren, id.trim()] })
              .eq('id', newMotherRef);
          }
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
          {/* ID is auto-generated (UUID) for new members, shown read-only for edits */}
          {isEdit && (
            <div className="form-group">
              <label>ID</label>
              <input
                type="text"
                value={id}
                disabled
                className="input-disabled"
              />
            </div>
          )}

          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Moussa Ali"
            />
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

          <div className="form-group">
            <label>G&eacute;n&eacute;ration</label>
            <input
              type="number"
              value={generation}
              onChange={(e) => setGeneration(Number(e.target.value))}
              min={0}
            />
          </div>

          {/* Father selection with search */}
          <div className="form-group">
            <label>P&egrave;re</label>
            {fatherId && members[fatherId] && (
              <div className="selected-parent">
                <span className="parent-gender male">♂</span>
                <span className="parent-name">{getMemberName(fatherId)}</span>
                <span className="parent-gen">Gen. {members[fatherId].generation}</span>
                <button
                  type="button"
                  className="parent-remove"
                  onClick={() => {
                    setFatherId('');
                    setFatherSearch('');
                  }}
                  title="Retirer le père"
                >
                  &times;
                </button>
              </div>
            )}
            {!fatherId && (
              <>
                {/* Suggested fathers from mother's spouses */}
                {suggestedFathers.length > 0 && (
                  <div className="suggested-parents">
                    <span className="suggested-label">Époux de la mère :</span>
                    <div className="suggested-list">
                      {suggestedFathers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="suggested-parent-btn"
                          onClick={() => {
                            setFatherId(m.id);
                            setFatherSearch(m.alias ? `${m.name} (${m.alias})` : m.name);
                          }}
                        >
                          <span className="parent-gender male">♂</span>
                          {m.alias ? `${m.name} (${m.alias})` : m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="parent-search-wrap">
                  <input
                    type="text"
                    value={fatherSearch}
                    onChange={(e) => {
                      setFatherSearch(e.target.value);
                      setShowFatherSuggestions(true);
                    }}
                    onFocus={() => setShowFatherSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFatherSuggestions(false), 200)}
                    placeholder={suggestedFathers.length > 0 ? "Ou rechercher un autre père..." : "Rechercher le père..."}
                    className="parent-search-input"
                  />
                  {showFatherSuggestions && fatherSuggestions.length > 0 && (
                    <div className="parent-suggestions">
                      {fatherSuggestions.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="parent-suggestion"
                          onClick={() => {
                            setFatherId(m.id);
                            setFatherSearch(m.alias ? `${m.name} (${m.alias})` : m.name);
                            setShowFatherSuggestions(false);
                          }}
                        >
                          <span className="parent-gender male">♂</span>
                          <span className="suggestion-name">{m.name}</span>
                          {m.alias && <span className="suggestion-alias">({m.alias})</span>}
                          <span className="suggestion-gen">Gen. {m.generation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mother selection with search */}
          <div className="form-group">
            <label>M&egrave;re</label>
            {motherRef && members[motherRef] && (
              <div className="selected-parent">
                <span className="parent-gender female">♀</span>
                <span className="parent-name">{getMemberName(motherRef)}</span>
                <span className="parent-gen">Gen. {members[motherRef].generation}</span>
                <button
                  type="button"
                  className="parent-remove"
                  onClick={() => {
                    setMotherRef('');
                    setMotherSearch('');
                  }}
                  title="Retirer la mère"
                >
                  &times;
                </button>
              </div>
            )}
            {!motherRef && (
              <>
                {/* Suggested mothers from father's spouses */}
                {suggestedMothers.length > 0 && (
                  <div className="suggested-parents">
                    <span className="suggested-label">Épouses du père :</span>
                    <div className="suggested-list">
                      {suggestedMothers.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="suggested-parent-btn"
                          onClick={() => {
                            setMotherRef(m.id);
                            setMotherSearch(m.alias ? `${m.name} (${m.alias})` : m.name);
                          }}
                        >
                          <span className="parent-gender female">♀</span>
                          {m.alias ? `${m.name} (${m.alias})` : m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="parent-search-wrap">
                  <input
                    type="text"
                    value={motherSearch}
                    onChange={(e) => {
                      setMotherSearch(e.target.value);
                      setShowMotherSuggestions(true);
                    }}
                    onFocus={() => setShowMotherSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMotherSuggestions(false), 200)}
                    placeholder={suggestedMothers.length > 0 ? "Ou rechercher une autre mère..." : "Rechercher la mère..."}
                    className="parent-search-input"
                  />
                  {showMotherSuggestions && motherSuggestions.length > 0 && (
                    <div className="parent-suggestions">
                      {motherSuggestions.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="parent-suggestion"
                          onClick={() => {
                            setMotherRef(m.id);
                            setMotherSearch(m.alias ? `${m.name} (${m.alias})` : m.name);
                            setShowMotherSuggestions(false);
                          }}
                        >
                          <span className="parent-gender female">♀</span>
                          <span className="suggestion-name">{m.name}</span>
                          {m.alias && <span className="suggestion-alias">({m.alias})</span>}
                          <span className="suggestion-gen">Gen. {m.generation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
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
