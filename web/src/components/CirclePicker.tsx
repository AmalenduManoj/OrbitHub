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
    <div className="space-y-2.5">
      <label className="label block text-text-muted">Share to circles</label>
      {circles.length === 0 ? (
        <p className="text-text-muted text-sm">No circles yet. Create one first.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {circles.map((c) => {
            const isSelected = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'bg-bg-base text-text-secondary ring-1 ring-[#2C2C2E] hover:ring-primary/30 hover:text-text-primary'
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
