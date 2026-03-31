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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query.trim());
        setResults(users);
        setIsOpen(true);
      } catch {
        setResults([]);
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
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or skill…"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map((user) => (
            <li
              key={user.id}
              onClick={() => handleSelect(user)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
            >
              <span className="font-medium text-gray-800">{user.name}</span>
              <span className="text-gray-500 ml-2 text-xs">{user.email}</span>
              {user.skills.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && query.trim().length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 px-3 py-2 text-sm text-gray-500">
          No employees found.
        </div>
      )}
    </div>
  );
}
