import type { CircleResponse } from '../types';

interface CirclePickerProps {
  circles: CircleResponse[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function CirclePicker({ circles, selected, onChange }: CirclePickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">Share to circles</label>
      {circles.length === 0 && (
        <p className="text-text-muted text-sm">No circles yet. Create one first.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {circles.map((c) => {
          const isSelected = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                isSelected
                  ? 'bg-primary border-primary text-white'
                  : 'bg-bg-card border-gray-700 text-text-secondary hover:border-primary'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
