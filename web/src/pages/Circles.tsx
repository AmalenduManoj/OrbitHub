import { useState, useEffect, useCallback } from 'react';
import { listCircles, createCircle, deleteCircle } from '../api/circles';
import type { CircleResponse } from '../types';
import CircleCard from '../components/CircleCard';

export default function Circles() {
  const [circles, setCircles] = useState<CircleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCircles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCircles();
      setCircles(data);
    } catch {
      setError('Failed to load circles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createCircle({ name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      await fetchCircles();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error?: string } } }).response?.data?.error || 'Failed to create'
          : 'Failed to create circle';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this circle? Members will not be notified.')) return;
    try {
      await deleteCircle(id);
      setCircles((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Failed to delete circle');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Circles</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {/* Create inline */}
      {showCreate && (
        <div className="bg-bg-card rounded-2xl p-5 mb-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Circle name"
            maxLength={50}
            autoFocus
            className="flex-1 px-3 py-2 rounded-xl bg-bg-base border border-gray-700 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all duration-150 disabled:opacity-50"
          >
            {creating ? '…' : 'Create'}
          </button>
          <button
            onClick={() => setShowCreate(false)}
            className="px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary text-sm transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
        </div>
      ) : circles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-text-secondary font-medium">No circles yet</p>
          <p className="text-text-muted text-sm">Create a circle to organize your audience</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-150"
          >
            Create Circle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {circles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
