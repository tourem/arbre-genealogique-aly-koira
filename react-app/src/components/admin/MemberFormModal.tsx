import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Member } from '../../lib/types';

interface Props {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function MemberFormModal({ member, onClose, onSaved }: Props) {
  const isEdit = member !== null;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [generation, setGeneration] = useState(0);
  const [fatherId, setFatherId] = useState('');
  const [motherRef, setMotherRef] = useState('');
  const [spousesStr, setSpousesStr] = useState('');
  const [childrenStr, setChildrenStr] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      setChildrenStr(member.children.join(', '));
      setPhotoPreview(member.photo_url || null);
      setNote(member.note || '');
    }
  }, [member]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas d\u00E9passer 2 Mo');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const parseList = (str: string): string[] =>
    str.split(',').map((s) => s.trim()).filter(Boolean);

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
      children: parseList(childrenStr),
      photo_url: photoUrl,
      note: note.trim() || null,
    };

    if (isEdit) {
      const { error: err } = await supabase
        .from('members')
        .update(payload)
        .eq('id', member.id);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
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
    onSaved();
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
                placeholder="ex: Ko\u00EFra"
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
                placeholder="ID du p\u00E8re"
              />
            </div>
          </div>

          <div className="form-group">
            <label>M&egrave;re (r&eacute;f&eacute;rence)</label>
            <input
              type="text"
              value={motherRef}
              onChange={(e) => setMotherRef(e.target.value)}
              placeholder="R\u00E9f\u00E9rence de la m\u00E8re"
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

          <div className="form-group">
            <label>Enfants (IDs s&eacute;par&eacute;s par des virgules)</label>
            <input
              type="text"
              value={childrenStr}
              onChange={(e) => setChildrenStr(e.target.value)}
              placeholder="id1, id2, id3"
            />
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
          <button className="login-btn" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
