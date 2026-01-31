interface Child {
  nom: string;
  prenom: string;
  genre: string;
}

interface Props {
  children: Child[];
  onAddChild: () => void;
  onRemoveChild: (index: number) => void;
  onChildChange: (
    index: number,
    field: 'nom' | 'prenom' | 'genre',
    value: string,
  ) => void;
}

export default function ChildFieldGroup({
  children,
  onAddChild,
  onRemoveChild,
  onChildChange,
}: Props) {
  return (
    <>
      <div className="form-section-title">
        <span>{'\u{1F476}'} Enfants</span>
        <button className="add-child-btn" onClick={onAddChild} type="button">
          + Ajouter
        </button>
      </div>
      {children.length === 0 ? (
        <div className="no-children">
          <p>Aucun enfant ajout&eacute;</p>
          <button className="add-first-child" onClick={onAddChild} type="button">
            + Ajouter un enfant
          </button>
        </div>
      ) : (
        children.map((child, idx) => (
          <div className="child-item" key={idx}>
            <div className="child-item-header">
              <span className="child-number">Enfant {idx + 1}</span>
              <button
                className="remove-child"
                onClick={() => onRemoveChild(idx)}
                type="button"
              >
                &times;
              </button>
            </div>
            <div className="child-fields">
              <div className="child-row">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={child.nom}
                    onChange={(e) => onChildChange(idx, 'nom', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Pr&eacute;nom</label>
                  <input
                    type="text"
                    placeholder="Pr\u00E9nom"
                    value={child.prenom}
                    onChange={(e) =>
                      onChildChange(idx, 'prenom', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Genre</label>
                <div className="gender-select">
                  <div
                    className={`gender-option ${child.genre === 'M' ? 'selected' : ''}`}
                    onClick={() => onChildChange(idx, 'genre', 'M')}
                  >
                    <span>{'\u{1F468}'}</span>
                    <small>Homme</small>
                  </div>
                  <div
                    className={`gender-option ${child.genre === 'F' ? 'selected' : ''}`}
                    onClick={() => onChildChange(idx, 'genre', 'F')}
                  >
                    <span>{'\u{1F469}'}</span>
                    <small>Femme</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
