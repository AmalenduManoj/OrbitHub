import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCircle, updateCircle, deleteCircle, listMembers, addMembers, removeMember } from '../api/circles';
import { searchUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import type { CircleResponse, CircleMemberResponse, UserSearchResult } from '../types';

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [circle, setCircle] = useState<CircleResponse | null>(null);
  const [members, setMembers] = useState<CircleMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // rename
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // add member — search + select
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const isOwner = circle && user && circle.owner_id === user.id;

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [circleData, membersData] = await Promise.all([
        getCircle(id),
        listMembers(id),
      ]);
      setCircle(circleData);
      setMembers(membersData);
      setName(circleData.name);
    } catch {
      setError('Failed to load circle');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Auto-focus search input when add panel opens
  useEffect(() => {
    if (showAdd) searchRef.current?.focus();
  }, [showAdd]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(value.trim());
        // Filter out already selected and already members
        const memberIds = new Set(members.map((m) => m.id));
        const selectedIds = new Set(selectedUsers.map((u) => u.id));
        setSearchResults(results.filter((r) => !memberIds.has(r.id) && !selectedIds.has(r.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [members, selectedUsers]);

  const addToSelection = (u: UserSearchResult) => {
    setSelectedUsers((prev) => [...prev, u]);
    setSearchResults([]);
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const removeFromSelection = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddMembers = async () => {
    if (!id || selectedUsers.length === 0) return;
    setAddingMember(true);
    try {
      await addMembers(id, { user_ids: selectedUsers.map((u) => u.id) });
      setSelectedUsers([]);
      setSearchQuery('');
      setShowAdd(false);
      const refreshed = await listMembers(id);
      setMembers(refreshed);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error?: string } } }).response?.data?.error || 'Failed to add members'
          : 'Failed to add members';
      setError(msg);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRename = async () => {
    if (!id || !name.trim() || name.trim() === circle?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateCircle(id, { name: name.trim() });
      setCircle(updated);
      setEditingName(false);
    } catch {
      setError('Failed to rename');
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this circle? This cannot be undone.')) return;
    try {
      await deleteCircle(id);
      navigate('/circles', { replace: true });
    } catch {
      setError('Failed to delete');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    try {
      await removeMember(id, userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch {
      setError('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-text-muted">{error || 'Circle not found'}</p>
        <button
          onClick={() => navigate('/circles')}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
        >
          Back to circles
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/circles')}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Circles
      </button>

      {/* Circle name */}
      <div className="bg-bg-card rounded-2xl p-5 mb-4">
        {editingName ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl bg-bg-base border border-gray-700 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleRename}
              disabled={savingName}
              className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all duration-150 disabled:opacity-50"
            >
              {savingName ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditingName(false); setName(circle.name); }}
              className="px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary text-sm transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{circle.name}</h1>
              <p className="text-sm text-text-muted">{circle.member_count} member{circle.member_count !== 1 ? 's' : ''}</p>
            </div>
            {isOwner && (
              <button
                onClick={() => setEditingName(true)}
                className="text-text-secondary hover:text-primary transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <button
            onClick={handleDelete}
            className="mt-3 text-sm text-red-400 hover:text-red-300 transition-all duration-150"
          >
            Delete circle
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {/* Members */}
      <div className="bg-bg-card rounded-2xl overflow-hidden border border-[#2C2C2E]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2C2C2E]">
          <h2 className="font-semibold text-white">Members ({members.length})</h2>
          {isOwner && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-primary hover:text-primary-light text-sm font-medium transition-all duration-150"
            >
              + Add
            </button>
          )}
        </div>

        {/* Add panel — search + select */}
        {showAdd && (
          <div className="border-b border-[#2C2C2E]">
            <div className="p-4">
              {/* Search input */}
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by username…"
                  className="w-full px-3 py-2 rounded-xl bg-bg-base border border-gray-700 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-[1.5px] border-primary border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                  <div className="mt-2 bg-bg-base rounded-xl border border-gray-700 max-h-40 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => addToSelection(r)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-hover transition-all duration-150 text-left"
                    >
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-white">
                          {r.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-white">@{r.username}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected users chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-sm"
                    >
                      @{u.username}
                      <button
                        type="button"
                        onClick={() => removeFromSelection(u.id)}
                        className="hover:text-white transition-all duration-150"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Confirm button */}
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={addingMember}
                  className="mt-3 w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all duration-150 disabled:opacity-50"
                >
                  {addingMember ? 'Adding…' : `Add ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm">
            No members yet
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-white">
                      {m.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">{m.username}</p>
                    <p className="text-xs text-text-muted">Added {new Date(m.added_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-text-muted hover:text-red-400 transition-all duration-150 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
