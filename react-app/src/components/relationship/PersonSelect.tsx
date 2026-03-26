import type { Member } from '../../lib/types';

interface Props {
  label: string;
  value: string;
  members: Member[];
  onChange: (value: string) => void;
}

export default function PersonSelect({ label, value, members, onChange }: Props) {
  return (
    <div className="parente-select-group">
      <label>{label}</label>
      <select
        className="parente-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choisir...</option>
        {members.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.alias ? ` (${p.alias})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
