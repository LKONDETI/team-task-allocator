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
    if (query.trim().length === 0) { setResults([]); setIsOpen(false); setIsSearching(false); return; }

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

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSelect(user: UserSearchResult) {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          {isSearching ? (
            <svg className="animate-spin" style={{width:15,height:15,color:'#6366f1'}} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg style={{width:15,height:15,color:'#9ca3af'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          placeholder="Search by name…"
          className="mgr-input"
          style={{paddingLeft: 36}}
        />
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {results.map((user, idx) => (
            <li
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${
                idx !== results.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              {user.skills.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {user.skills.slice(0, 2).map(skill => (
                    <span key={skill} className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                  {user.skills.length > 2 && <span className="text-xs text-gray-400">+{user.skills.length - 2}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && query.trim().length > 0 && !isSearching && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <p className="text-sm text-gray-400">No employees found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
