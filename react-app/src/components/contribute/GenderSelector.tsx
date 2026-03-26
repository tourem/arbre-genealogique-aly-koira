interface Props {
  value: string;
  onChange: (gender: string) => void;
}

export default function GenderSelector({ value, onChange }: Props) {
  return (
    <div className="gender-selector">
      <div
        className={`gender-option ${value === 'M' ? 'selected' : ''}`}
        onClick={() => onChange('M')}
      >
        <span>{'\u{1F468}'}</span>
        <small>Homme</small>
      </div>
      <div
        className={`gender-option ${value === 'F' ? 'selected' : ''}`}
        onClick={() => onChange('F')}
      >
        <span>{'\u{1F469}'}</span>
        <small>Femme</small>
      </div>
    </div>
  );
}
