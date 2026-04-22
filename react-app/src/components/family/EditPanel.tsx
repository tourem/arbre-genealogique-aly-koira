import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Member } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { useMembersContext } from '../../context/MembersContext';
import { resolveTags } from '../../lib/culturalTags';
import FormSection from './edit/FormSection';
import Segmented from './edit/Segmented';
import CopyButton from './edit/CopyButton';
import DeleteConfirmDialog from './edit/DeleteConfirmDialog';
import CulturalTagsEditor from './edit/CulturalTagsEditor';
import { useToast } from './edit/Toast';

interface Props {
  person: Member;
  onClose: () => void;
  onSaved: (updatedFields: Partial<Member>) => void;
  onDeleted?: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

/**
 * Side panel / bottom sheet for editing a person's identity fields.
 * - Desktop (>=720px) : slides in from the right, width 440px.
 * - Mobile  (<720px)  : bottom sheet 92dvh with handle + safe-area.
 *
 * Only the "Identité" section is active (firstname, lastname, alias, gender).
 * Other sections (État civil, Généalogie, Notes) are collapsed placeholders;
 * Tags culturels is minimally functional (promote/remove/add).
 *
 * Persist via supabase.from('members').update(diff).eq('id', id). Only
 * modified fields are sent (sparse patch).
 */
export default function EditPanel({ person, onClose, onSaved, onDeleted }: Props) {
  const { members, updateMember } = useMembersContext();
  const toast = useToast();

  // ── Form state, initialised from `person` ────────────────────────────────
  // Derive a usable first_name when the column is null (some legacy rows
  // have `name` but no `first_name`). We fall back to the first word.
  const initialFirstName = useMemo(
    () => person.first_name?.trim() ?? (person.name?.split(/\s+/)[0] ?? ''),
    [person.first_name, person.name],
  );
  const initialLastName = useMemo(() => {
    if (person.first_name) {
      const fn = person.first_name.trim();
      return person.name.startsWith(fn) ? person.name.slice(fn.length).trim() : person.name;
    }
    // Fallback: everything after the first word.
    const parts = person.name?.split(/\s+/) ?? [];
    return parts.slice(1).join(' ');
  }, [person.first_name, person.name]);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [nickname, setNickname] = useState(person.alias ?? '');
  const [gender, setGender] = useState<'M' | 'F'>(person.gender);
  const [tags, setTags] = useState<string[]>(person.cultural_tags ?? []);

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: boolean; lastName?: boolean }>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mount animation: add `.is-open` after first paint so the transform animates
  // from off-screen to 0.
  const [mounted, setMounted] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = useRef(`edit-panel-title-${person.id.slice(0, 8)}`);
  const idRowValueRef = useRef<HTMLSpanElement>(null);

  // ── Dirty state ─────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (firstName !== initialFirstName) return true;
    if (lastName !== initialLastName) return true;
    if ((nickname || '') !== (person.alias ?? '')) return true;
    if (gender !== person.gender) return true;
    const personTags = person.cultural_tags ?? [];
    if (tags.length !== personTags.length) return true;
    const sortedA = [...tags].sort();
    const sortedB = [...personTags].sort();
    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return true;
    }
    return false;
  }, [
    firstName,
    lastName,
    nickname,
    gender,
    tags,
    initialFirstName,
    initialLastName,
    person.alias,
    person.gender,
    person.cultural_tags,
  ]);

  const dirtyFlags = useMemo(() => ({
    firstName: firstName !== initialFirstName,
    lastName: lastName !== initialLastName,
    nickname: (nickname || '') !== (person.alias ?? ''),
  }), [firstName, lastName, nickname, initialFirstName, initialLastName, person.alias]);

  // ── Close w/ dirty guard ───────────────────────────────────────────────
  const requestClose = useCallback(() => {
    if (isDirty && saveState !== 'saved') {
      if (typeof window !== 'undefined') {
        const ok = window.confirm('Vos modifications ne seront pas enregistrées. Fermer le panneau ?');
        if (!ok) return;
      }
    }
    onClose();
  }, [isDirty, saveState, onClose]);

  // ── Save flow ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!isDirty || saveState === 'saving') return;

    const fnTrim = firstName.trim();
    const lnTrim = lastName.trim();
    const errs: { firstName?: boolean; lastName?: boolean } = {};
    if (!fnTrim) errs.firstName = true;
    if (!lnTrim) errs.lastName = true;
    if (errs.firstName || errs.lastName) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setError(null);

    const updates: Partial<Member> = {};
    if (fnTrim !== (person.first_name ?? '')) updates.first_name = fnTrim;
    const fullName = `${fnTrim} ${lnTrim}`.trim();
    if (fullName !== person.name) updates.name = fullName;
    if ((nickname.trim() || null) !== (person.alias ?? null)) {
      updates.alias = nickname.trim() || null;
    }
    if (gender !== person.gender) updates.gender = gender;
    const personTags = person.cultural_tags ?? [];
    if (JSON.stringify([...tags].sort()) !== JSON.stringify([...personTags].sort())) {
      updates.cultural_tags = tags;
    }

    if (Object.keys(updates).length === 0) return;

    setSaveState('saving');
    const { error: updErr } = await supabase
      .from('members')
      .update(updates)
      .eq('id', person.id);

    if (updErr) {
      setSaveState('idle');
      setError(updErr.message);
      return;
    }

    // Optimistic local cache update.
    updateMember(person.id, updates);
    setSaveState('saved');
    toast.show('Fiche enregistrée');
    window.setTimeout(() => {
      onSaved(updates);
      onClose();
    }, 900);
  }, [
    isDirty,
    saveState,
    firstName,
    lastName,
    nickname,
    gender,
    tags,
    person,
    updateMember,
    toast,
    onSaved,
    onClose,
  ]);

  // ── Delete flow ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    const { error: delErr } = await supabase.from('members').delete().eq('id', person.id);
    setDeleting(false);
    if (delErr) {
      setError(delErr.message);
      setDeleteOpen(false);
      return;
    }
    toast.show('Fiche supprimée');
    setDeleteOpen(false);
    if (onDeleted) onDeleted();
    onClose();
  }, [person.id, toast, onDeleted, onClose]);

  // ── Mount / unmount side-effects ──────────────────────────────────────
  useEffect(() => {
    // Prevent body scroll while panel is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Trigger slide-in animation on next frame.
    const raf = requestAnimationFrame(() => setMounted(true));
    // Autofocus first field shortly after the animation starts.
    const focusTimer = window.setTimeout(() => {
      firstInputRef.current?.focus();
      firstInputRef.current?.select();
    }, 80);
    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
      window.clearTimeout(focusTimer);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // DeleteConfirmDialog handles its own Escape — if it's open, do
        // nothing here (it calls stopPropagation but we double-guard).
        if (deleteOpen) return;
        e.preventDefault();
        requestClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isDirty && saveState === 'idle') {
          e.preventDefault();
          void handleSave();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [requestClose, handleSave, isDirty, saveState, deleteOpen]);

  // ── Render ─────────────────────────────────────────────────────────────
  const titleDisplay = `${firstName || person.first_name || ''} ${lastName || ''}`.trim() || person.name;
  const personTagsCount = tags.length;
  const inferredCount = resolveTags(person, members)
    .filter((r) => r.source === 'inferred' && !tags.includes(r.tag)).length;
  const tagsCounter = `${personTagsCount} actif${personTagsCount > 1 ? 's' : ''}${
    inferredCount > 0 ? ` · ${inferredCount} suggéré${inferredCount > 1 ? 's' : ''}` : ''
  }`;

  const footerStateClass =
    saveState === 'saved' ? 'is-saved' : isDirty ? 'is-dirty' : '';
  const footerStateLabel =
    saveState === 'saved'
      ? 'Enregistré'
      : isDirty
      ? 'Modifications non enregistrées'
      : 'Aucune modification';

  const saveDisabled = !isDirty || saveState !== 'idle';

  return createPortal(
    <>
      <div
        className={`edit-overlay${mounted ? ' is-open' : ''}`}
        onClick={requestClose}
        aria-hidden="true"
      />
      <aside
        className={`edit-panel${mounted ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
      >
        {/* Header */}
        <div className="edit-panel-header">
          <div className="edit-panel-header-main">
            <div className="edit-eyebrow">Modifier la fiche</div>
            <h2 className="edit-title" id={titleId.current}>
              {titleDisplay}
              {nickname && <em className="edit-title-alias"> {nickname}</em>}
            </h2>
          </div>
          <button
            type="button"
            className="edit-close"
            onClick={requestClose}
            aria-label="Fermer le panneau"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="edit-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="edit-body">
          <FormSection title="Identité">
            <div className="edit-field">
              <label className="edit-label" htmlFor="edit-firstname">
                Prénom
                <span className="edit-label-required">requis</span>
              </label>
              <input
                id="edit-firstname"
                ref={firstInputRef}
                type="text"
                className={`edit-input${dirtyFlags.firstName ? ' is-changed' : ''}${fieldErrors.firstName ? ' is-error' : ''}`}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) setFieldErrors((f) => ({ ...f, firstName: false }));
                }}
                autoComplete="off"
              />
              {fieldErrors.firstName && (
                <div className="edit-field-error">Ce champ est requis.</div>
              )}
            </div>

            <div className="edit-field">
              <label className="edit-label" htmlFor="edit-lastname">
                Nom
                <span className="edit-label-required">requis</span>
              </label>
              <input
                id="edit-lastname"
                type="text"
                className={`edit-input${dirtyFlags.lastName ? ' is-changed' : ''}${fieldErrors.lastName ? ' is-error' : ''}`}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) setFieldErrors((f) => ({ ...f, lastName: false }));
                }}
                autoComplete="off"
              />
              <div className="edit-help">
                Nom patronymique tel qu'il est inscrit ou transmis oralement.
              </div>
              {fieldErrors.lastName && (
                <div className="edit-field-error">Ce champ est requis.</div>
              )}
            </div>

            <div className="edit-field">
              <label className="edit-label" htmlFor="edit-nickname">
                Surnom
                <span
                  className="edit-label-hint"
                  title="Nom d'usage, nom de caste, nom honorifique ou sobriquet familial."
                  aria-label="Aide : nom d'usage, nom de caste, nom honorifique ou sobriquet familial"
                >
                  (?)
                </span>
              </label>
              <input
                id="edit-nickname"
                type="text"
                className={`edit-input edit-input--nickname${dirtyFlags.nickname ? ' is-changed' : ''}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="off"
              />
              <div className="edit-help">
                S'affiche en italique ocre à côté du nom, et sert d'identifiant dans la famille.
              </div>
            </div>

            <div className="edit-field">
              <span className="edit-label">
                Sexe
                <span className="edit-label-required">requis</span>
              </span>
              <Segmented
                ariaLabel="Sexe"
                value={gender}
                onChange={(v) => setGender(v)}
                options={[
                  { value: 'M', label: 'Homme', glyph: '\u2642' },
                  { value: 'F', label: 'Femme', glyph: '\u2640' },
                ]}
              />
            </div>
          </FormSection>

          <FormSection
            title="État civil"
            counter="à venir"
            collapsible
            defaultCollapsed
          >
            <div className="edit-coming-soon">
              Dates de naissance et de décès, lieu de naissance — à implémenter dans une prochaine version.
            </div>
          </FormSection>

          <FormSection
            title="Généalogie"
            counter="à venir"
            collapsible
            defaultCollapsed
          >
            <div className="edit-coming-soon">
              Modification des parents, foyers, épouses et enfants — à implémenter séparément, via les actions dédiées du FAB.
            </div>
          </FormSection>

          <FormSection
            title="Tags culturels"
            counter={tagsCounter}
            collapsible
            defaultCollapsed
          >
            <div className="edit-field">
              <span className="edit-label">
                Marqueurs songhay
                <span className="edit-label-songhay">cultural_tags</span>
              </span>
              <CulturalTagsEditor
                person={person}
                members={members}
                tags={tags}
                onChange={setTags}
              />
            </div>
          </FormSection>

          <FormSection
            title="Notes"
            counter="à venir"
            collapsible
            defaultCollapsed
          >
            <div className="edit-coming-soon">
              Anecdotes, précisions orales, références historiques — à implémenter.
            </div>
          </FormSection>

          {/* Technical footer */}
          <div className="edit-tech-footer">
            <div className="edit-tech-title">Informations techniques</div>

            <div className="edit-id-row">
              <span className="edit-id-row-label">ID</span>
              <span className="edit-id-row-value" ref={idRowValueRef}>{person.id}</span>
              <CopyButton
                value={person.id}
                fallbackTarget={idRowValueRef}
                onCopied={(msg) => toast.show(msg)}
              />
            </div>

            <div className="edit-audit-row edit-audit-row--placeholder">
              <span>Informations d'audit</span>
              <span className="edit-audit-placeholder">à implémenter</span>
            </div>

            <div className="edit-danger-zone">
              <div className="edit-danger-title">Zone de danger</div>
              <button
                type="button"
                className="edit-danger-btn"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Supprimer cette fiche
              </button>
              <div className="edit-danger-hint">
                Cette action est définitive et irréversible. Les relations familiales seront cassées.
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="edit-footer">
          <div className={`edit-footer-state ${footerStateClass}`}>
            <span className="edit-footer-dot" aria-hidden="true" />
            <span>{footerStateLabel}</span>
          </div>
          <button
            type="button"
            className="edit-btn"
            onClick={requestClose}
            disabled={saveState === 'saving'}
          >
            Annuler
          </button>
          <button
            type="button"
            className="edit-btn edit-btn--primary"
            onClick={() => void handleSave()}
            disabled={saveDisabled}
          >
            {saveState === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </aside>

      {/* Global toast (rendered here so it's portal-friendly but inside the panel tree). */}
      {toast.render()}

      {/* Delete confirmation */}
      {deleteOpen && (
        <DeleteConfirmDialog
          personName={person.name}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeleteOpen(false)}
          busy={deleting}
        />
      )}
    </>,
    document.body,
  );
}
