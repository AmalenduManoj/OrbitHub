import { useState, useRef, useEffect, useCallback } from 'react';
import { searchUsers } from '../api/users';
import UserSearchCard from '../components/UserSearchCard';
import type { UserSearchResult } from '../types';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const data = await searchUsers(q.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search for people..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-bg-card border border-gray-700 text-text-primary placeholder-text-muted text-sm outline-none focus:border-primary transition"
        />
      </div>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!searching && query.trim() === '' && !searched && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">Search for people by username</p>
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <p className="text-sm">No users found</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="divide-y divide-gray-800 -mx-4">
          {results.map((u) => (
            <UserSearchCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
