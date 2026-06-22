import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listHighlights, createHighlight, deleteHighlight } from '../api/highlights';
import type { HighlightResponse } from '../types';
import HighlightCard from '../components/HighlightCard';
import CreateHighlightModal from '../components/CreateHighlightModal';

export default function Highlights() {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<HighlightResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchHighlights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listHighlights();
      setHighlights(data);
    } catch {
      setError('Failed to load highlights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this highlight?')) return;
    try {
      await deleteHighlight(id);
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch {
      setError('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Saved</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : highlights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-text-secondary font-medium">No saved highlights</p>
          <p className="text-text-muted text-sm">Save stories to highlights to keep them forever</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
          >
            Create Highlight
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {highlights.map((hl) => (
            <div key={hl.id} className="relative group">
              <HighlightCard highlight={hl} />
              <button
                onClick={() => handleDelete(hl.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs hover:bg-red-500/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateHighlightModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchHighlights}
      />
    </div>
  );
}
