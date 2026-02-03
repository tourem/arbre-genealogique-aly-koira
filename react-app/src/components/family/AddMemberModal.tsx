import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member, MemberDict } from '../../lib/types';

interface Props {
  mode: 'child' | 'spouse' | 'parent';
  person: Member;
  members: MemberDict;
  onClose: () => void;
  onSaved: () => void;
}

interface SpouseEntry { name: string; firstName: string }
interface ChildEntry { name: string; firstName: string; gender: 'M' | 'F' }

function generateId(name: string, members: MemberDict): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (!base) return `membre_${Date.now()}`;
  if (!members[base]) return base;
  let i = 2;
  while (members[`${base}_${i}`]) i++;
  return `${base}_${i}`;
}

function buildFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

export default function AddMemberModal({ mode, person, members, onClose, onSaved }: Props) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>(
    mode === 'spouse' ? (person.gender === 'M' ? 'F' : 'M') :
    mode === 'parent' ? 'M' : 'M',
  );
  const [birthCity, setBirthCity] = useState('');
  const [birthCountry, setBirthCountry] = useState('');
  const [village, setVillage] = useState('');

  // Mother selection for child mode
  const [motherId, setMotherId] = useState<string | null>(null);

  // Inline spouse entries
  const [spouseEntries, setSpouseEntries] = useState<SpouseEntry[]>([]);

  // Inline children entries
  const [childEntries, setChildEntries] = useState<ChildEntry[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Mother logic for child mode
  const spouseMembers = (person.spouses || [])
    .map((id) => members[id])
    .filter(Boolean);

  const showMotherField =
    mode === 'child' && person.gender === 'M' && spouseMembers.length >= 2;
  const autoMother =
    mode === 'child' && person.gender === 'M' && spouseMembers.length === 1
      ? spouseMembers[0]
      : null;
  const personIsMother = mode === 'child' && person.gender === 'F';
  const autoFather =
    personIsMother && spouseMembers.length === 1 ? spouseMembers[0] : null;

  // Spouse entries management
  const addSpouseEntry = () => {
    setSpouseEntries([...spouseEntries, { name: '', firstName: '' }]);
  };
  const removeSpouseEntry = (idx: number) => {
    setSpouseEntries(spouseEntries.filter((_, i) => i !== idx));
  };
  const updateSpouseEntry = (idx: number, field: keyof SpouseEntry, value: string) => {
    const updated = [...spouseEntries];
    updated[idx] = { ...updated[idx], [field]: value };
    setSpouseEntries(updated);
  };

  // Children entries management
  const addChildEntry = () => {
    setChildEntries([...childEntries, { name: '', firstName: '', gender: 'M' }]);
  };
  const removeChildEntry = (idx: number) => {
    setChildEntries(childEntries.filter((_, i) => i !== idx));
  };
  const updateChildEntry = (idx: number, field: keyof ChildEntry, value: string) => {
    const updated = [...childEntries];
    updated[idx] = { ...updated[idx], [field]: value };
    setChildEntries(updated);
  };

  const handleSave = async () => {
    if (!lastName.trim() && !firstName.trim()) {
      setError('Le nom ou le prénom est obligatoire');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const fullName = buildFullName(firstName, lastName);
      const newId = generateId(fullName, members);
      const generation =
        mode === 'child' ? person.generation + 1 :
        mode === 'parent' ? person.generation - 1 :
        person.generation;

      // Build the new member record
      const newMember: Record<string, unknown> = {
        id: newId,
        name: fullName,
        first_name: firstName.trim() || null,
        alias: alias.trim() || null,
        gender,
        generation,
        father_id: null,
        mother_ref: null,
        spouses: [] as string[],
        children: [] as string[],
        photo_url: null,
        note: null,
        birth_city: birthCity.trim() || null,
        birth_country: birthCountry.trim() || null,
        village: village.trim() || null,
      };

      if (mode === 'child') {
        if (person.gender === 'M') {
          newMember.father_id = person.id;
          if (autoMother) {
            newMember.mother_ref = autoMother.id;
          } else if (showMotherField && motherId) {
            newMember.mother_ref = motherId;
          }
        } else {
          newMember.mother_ref = person.id;
          if (autoFather) {
            newMember.father_id = autoFather.id;
          }
        }
      } else if (mode === 'spouse') {
        newMember.spouses = [person.id];
      } else if (mode === 'parent') {
        if (gender === 'M') {
          // Adding a father
          newMember.children = [person.id];
        } else {
          // Adding a mother
          newMember.children = [person.id];
        }
      }

      // Create inline spouse members first
      const createdSpouseIds: string[] = [];
      for (const sp of spouseEntries) {
        const spFullName = buildFullName(sp.firstName, sp.name);
        if (!spFullName) continue;
        const spId = generateId(spFullName, { ...members, [newId]: {} as Member });
        const spGender = gender === 'M' ? 'F' : 'M';
        const spMember = {
          id: spId,
          name: spFullName,
          first_name: sp.firstName.trim() || null,
          alias: null,
          gender: spGender,
          generation,
          father_id: null,
          mother_ref: null,
          spouses: [newId],
          children: [] as string[],
          photo_url: null,
          note: null,
          birth_city: null,
          birth_country: null,
          village: null,
        };
        const { error: spErr } = await supabase.from('members').insert(spMember);
        if (spErr) throw spErr;
        createdSpouseIds.push(spId);
      }

      // Add inline spouse IDs to the main member
      (newMember.spouses as string[]).push(...createdSpouseIds);

      // Create inline children members
      const createdChildIds: string[] = [];
      for (const ch of childEntries) {
        const chFullName = buildFullName(ch.firstName, ch.name);
        if (!chFullName) continue;
        const chId = generateId(chFullName, { ...members, [newId]: {} as Member });
        const chMember: Record<string, unknown> = {
          id: chId,
          name: chFullName,
          first_name: ch.firstName.trim() || null,
          alias: null,
          gender: ch.gender,
          generation: generation + 1,
          father_id: gender === 'M' ? newId : null,
          mother_ref: gender === 'F' ? newId : null,
          spouses: [] as string[],
          children: [] as string[],
          photo_url: null,
          note: null,
          birth_city: null,
          birth_country: null,
          village: null,
        };
        const { error: chErr } = await supabase.from('members').insert(chMember);
        if (chErr) throw chErr;
        createdChildIds.push(chId);
      }

      // Add children IDs
      (newMember.children as string[]).push(...createdChildIds);

      // Insert the main member
      const { error: insertErr } = await supabase.from('members').insert(newMember);
      if (insertErr) throw insertErr;

      // Update relationships on the current person
      if (mode === 'child') {
        await supabase
          .from('members')
          .update({ children: [...(person.children || []), newId] })
          .eq('id', person.id);

        // Update other parent's children
        const otherParentId = person.gender === 'M'
          ? (newMember.mother_ref as string | null)
          : (newMember.father_id as string | null);
        if (otherParentId && members[otherParentId]) {
          const otherParent = members[otherParentId];
          await supabase
            .from('members')
            .update({ children: [...(otherParent.children || []), newId] })
            .eq('id', otherParentId);
        }
      } else if (mode === 'spouse') {
        await supabase
          .from('members')
          .update({ spouses: [...(person.spouses || []), newId] })
          .eq('id', person.id);
      } else if (mode === 'parent') {
        if (gender === 'M') {
          await supabase
            .from('members')
            .update({ father_id: newId })
            .eq('id', person.id);
        } else {
          await supabase
            .from('members')
            .update({ mother_ref: newId })
            .eq('id', person.id);
        }
      }

      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const contextLabel =
    mode === 'child'
      ? `Enfant de ${person.name}`
      : mode === 'spouse'
        ? `${person.gender === 'M' ? 'Épouse' : 'Époux'} de ${person.name}`
        : `Parent de ${person.name}`;
  const contextIcon =
    mode === 'child' ? '\u25BC' : mode === 'spouse' ? '\u25C6' : '\u25B2';

  // For parent mode: restrict gender if parent already exists
  const canAddFather = mode === 'parent' && !person.father_id;
  const canAddMother = mode === 'parent' && !person.mother_ref;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ajouter un membre</h3>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Context banner */}
          <div className="add-modal-context">
            <span className="add-modal-context-icon">{contextIcon}</span>
            <span>{contextLabel}</span>
          </div>

          {/* === Section: Identite === */}
          <div className="add-section-title">Identité</div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                placeholder="Ex: Ali"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                placeholder="Ex: Moussa"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Surnom</label>
            <input
              type="text"
              placeholder="Ex: Baba"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>Genre *</label>
            <div className="gender-selector">
              {(mode !== 'parent' || canAddFather) && (
                <div
                  className={`gender-option ${gender === 'M' ? 'selected' : ''}`}
                  onClick={() => setGender('M')}
                >
                  <span>{'\u2642'}</span>
                  <small>Homme</small>
                </div>
              )}
              {(mode !== 'parent' || canAddMother) && (
                <div
                  className={`gender-option ${gender === 'F' ? 'selected' : ''}`}
                  onClick={() => setGender('F')}
                >
                  <span>{'\u2640'}</span>
                  <small>Femme</small>
                </div>
              )}
            </div>
          </div>

          {/* === Section: Origine === */}
          <div className="add-section-title">Origine</div>

          <div className="form-group">
            <label>Village</label>
            <input
              type="text"
              placeholder="Ex: Koira Tegui"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Ville de naissance</label>
              <input
                type="text"
                placeholder="Ex: Gao"
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Pays</label>
              <input
                type="text"
                placeholder="Ex: Mali"
                value={birthCountry}
                onChange={(e) => setBirthCountry(e.target.value)}
              />
            </div>
          </div>

          {/* === Mother field (child mode) === */}
          {showMotherField && (
            <div className="form-group">
              <label>Mère</label>
              <select
                value={motherId || ''}
                onChange={(e) => setMotherId(e.target.value || null)}
              >
                <option value="">-- Choisir la mère --</option>
                {spouseMembers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}{sp.alias ? ` (${sp.alias})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {autoMother && (
            <div className="form-group">
              <label>Mère</label>
              <input type="text" value={autoMother.name} disabled />
            </div>
          )}
          {autoFather && (
            <div className="form-group">
              <label>Père</label>
              <input type="text" value={autoFather.name} disabled />
            </div>
          )}

          {/* === Section: Conjoints === */}
          <div className="add-section-title">
            {gender === 'M' ? 'Conjointes' : 'Conjoint'}
          </div>
              {spouseEntries.map((sp, idx) => (
                <div className="inline-entry" key={idx}>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={sp.name}
                    onChange={(e) => updateSpouseEntry(idx, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={sp.firstName}
                    onChange={(e) => updateSpouseEntry(idx, 'firstName', e.target.value)}
                  />
                  <button
                    className="inline-entry-rm"
                    onClick={() => removeSpouseEntry(idx)}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                className="fiche-add-btn"
                onClick={addSpouseEntry}
                type="button"
              >
                <span className="fiche-add-ico">+</span>
                Ajouter {gender === 'M' ? 'une conjointe' : 'un conjoint'}
              </button>

          {/* === Section: Enfants === */}
          <div className="add-section-title">Enfants</div>
              {childEntries.map((ch, idx) => (
                <div className="inline-entry" key={idx}>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={ch.name}
                    onChange={(e) => updateChildEntry(idx, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={ch.firstName}
                    onChange={(e) => updateChildEntry(idx, 'firstName', e.target.value)}
                  />
                  <div className="inline-gender">
                    <span
                      className={`inline-g-opt${ch.gender === 'M' ? ' on' : ''}`}
                      onClick={() => updateChildEntry(idx, 'gender', 'M')}
                    >
                      {'\u2642'}
                    </span>
                    <span
                      className={`inline-g-opt${ch.gender === 'F' ? ' on' : ''}`}
                      onClick={() => updateChildEntry(idx, 'gender', 'F')}
                    >
                      {'\u2640'}
                    </span>
                  </div>
                  <button
                    className="inline-entry-rm"
                    onClick={() => removeChildEntry(idx)}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                className="fiche-add-btn"
                onClick={addChildEntry}
                type="button"
              >
                <span className="fiche-add-ico">+</span>
                Ajouter un enfant
              </button>

          {error && <div className="login-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button
            className="btn-reject"
            onClick={onClose}
            type="button"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            className="btn-approve"
            onClick={handleSave}
            type="button"
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
