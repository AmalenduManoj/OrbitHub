import { useState, useEffect } from 'react';
import { createHighlight } from '../api/highlights';

interface CreateHighlightModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  preSelectedStoryId?: string;
}

export default function CreateHighlightModal({
  open, onClose, onCreated, preSelectedStoryId,
}: CreateHighlightModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createHighlight({
        name: name.trim(),
        cover_story_id: preSelectedStoryId,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error?: string } } }).response?.data?.error || 'Failed to create'
          : 'Failed to create highlight';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div className="bg-bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-sm transition">
            Cancel
          </button>
          <h2 className="font-semibold text-white">New Highlight</h2>
          <div className="w-12" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="hl_name" className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              id="hl_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-bg-base border border-gray-700 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Best of 2026"
            />
          </div>
          {preSelectedStoryId && (
            <p className="text-xs text-text-muted">Story will be added as cover</p>
          )}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Highlight'}
          </button>
        </form>
      </div>
    </div>
  );
}
