import { useEffect, useRef, useState } from 'react';
import { searchUsers } from '../api/users';
import type { UserSearchResult } from '../types/user';

interface Props {
  onSelect: (user: UserSearchResult) => void;
}

export default function EmployeeSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query.trim());
        setResults(users);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(user: UserSearchResult) {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          {isSearching ? (
            <svg className="animate-spin w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-purple-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          id="employee-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or skill…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden max-h-52 overflow-y-auto">
          {results.map((user, idx) => (
            <li
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-purple-500/10 ${
                idx !== results.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              {/* Avatar initial */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-purple-400/70 truncate">{user.email}</p>
              </div>

              {/* Skills pills */}
              {user.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[140px]">
                  {user.skills.slice(0, 2).map((skill) => (
                    <span
                      key={skill}
                      className="bg-purple-500/15 text-purple-300 border border-purple-500/20 text-xs px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 2 && (
                    <span className="text-xs text-purple-400/60 self-center">
                      +{user.skills.length - 2}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && results.length === 0 && query.trim().length > 0 && !isSearching && (
        <div className="absolute z-20 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-4 py-4 flex items-center gap-3">
          <svg className="w-4 h-4 text-purple-400/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-purple-300/60">No employees found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
