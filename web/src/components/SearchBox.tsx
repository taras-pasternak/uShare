import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import imgSearchPersonIcon from "../../assets/icons/imgSearchPersonIcon.svg";

interface SearchResult {
    id: string;
    username: string;
}

export const SearchBox = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchProfiles = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username')
                .ilike('username', `%${query}%`)
                .limit(5);

            if (error) {
                console.error('Error searching profiles:', error);
            } else {
                setResults(data || []);
                setIsOpen(true);
            }
            setIsLoading(false);
        };

        const timeoutId = setTimeout(searchProfiles, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (username: string) => {
        navigate(`/u/${username}`);
        setQuery('');
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (results.length > 0) {
                handleSelect(results[0].username);
            }
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm gap-2 min-w-[300px]">
                <img src={imgSearchPersonIcon} alt="Search" width={20} height={20} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-sm w-full font-['Inter_Tight',sans-serif]"
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-gray-100">
                    {results.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => handleSelect(result.username)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                                {result.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-['Inter_Tight',sans-serif] text-sm text-gray-700">
                                {result.username}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 border border-gray-100 p-4 text-center text-sm text-gray-500">
                    No users found
                </div>
            )}
        </div>
    );
};
