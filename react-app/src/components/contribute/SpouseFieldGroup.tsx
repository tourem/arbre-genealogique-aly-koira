interface Spouse {
  nom: string;
  prenom: string;
}

interface Props {
  gender: string;
  spouses: Spouse[];
  epoux: { nom: string; prenom: string };
  onAddSpouse: () => void;
  onRemoveSpouse: (index: number) => void;
  onSpouseChange: (index: number, field: 'nom' | 'prenom', value: string) => void;
  onEpouxChange: (field: 'nom' | 'prenom', value: string) => void;
}

export default function SpouseFieldGroup({
  gender,
  spouses,
  epoux,
  onAddSpouse,
  onRemoveSpouse,
  onSpouseChange,
  onEpouxChange,
}: Props) {
  if (!gender) return null;

  if (gender === 'F') {
    return (
      <>
        <div className="form-section-title">
          <span>{'\u{1F491}'} Votre \u00E9poux</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              placeholder="Nom de l'\u00E9poux"
              value={epoux.nom}
              onChange={(e) => onEpouxChange('nom', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Pr&eacute;nom</label>
            <input
              type="text"
              placeholder="Pr\u00E9nom de l'\u00E9poux"
              value={epoux.prenom}
              onChange={(e) => onEpouxChange('prenom', e.target.value)}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="form-section-title">
        <span>{'\u{1F491}'} Vos \u00E9pouse(s)</span>
        <button className="add-child-btn" onClick={onAddSpouse} type="button">
          + Ajouter
        </button>
      </div>
      {spouses.length === 0 ? (
        <div className="no-children">
          <p>Aucune \u00E9pouse ajout\u00E9e</p>
          <button className="add-first-child" onClick={onAddSpouse} type="button">
            + Ajouter une \u00E9pouse
          </button>
        </div>
      ) : (
        spouses.map((sp, idx) => (
          <div className="child-item" key={idx}>
            <div className="child-item-header">
              <span className="child-number">&Eacute;pouse {idx + 1}</span>
              <button
                className="remove-child"
                onClick={() => onRemoveSpouse(idx)}
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
                    value={sp.nom}
                    onChange={(e) => onSpouseChange(idx, 'nom', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Pr&eacute;nom</label>
                  <input
                    type="text"
                    placeholder="Pr\u00E9nom"
                    value={sp.prenom}
                    onChange={(e) =>
                      onSpouseChange(idx, 'prenom', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
