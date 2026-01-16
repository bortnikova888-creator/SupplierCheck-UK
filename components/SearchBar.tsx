import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Building2 } from 'lucide-react';
import { useSearchCompanies, COMPANY_NUMBER_REGEX } from '../lib/hooks';
import { SearchResult } from '../types';

const SearchBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 400);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const { data, isLoading, isError } = useSearchCompanies(debouncedValue);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (companyNumber: string) => {
    setIsOpen(false);
    navigate(`/company/${companyNumber}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = inputValue.trim().toUpperCase();
    if (COMPANY_NUMBER_REGEX.test(cleanInput)) {
      navigate(`/company/${cleanInput}`);
    } else if (data?.results?.[0]) {
      // If user presses enter and we have results, go to first one
      navigate(`/company/${data.results[0].companyNumber}`);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Enter company name or number..."
          className="w-full pl-12 pr-4 py-4 rounded-lg border border-slate-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg transition-all"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
        </div>
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Go
        </button>
      </form>

      {isOpen && inputValue.length >= 2 && (
        <div className="absolute w-full bg-white mt-2 rounded-lg shadow-xl border border-slate-100 overflow-hidden z-20 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
          ) : isError ? (
            <div className="p-4 text-center text-red-500 text-sm">Error occurred during search.</div>
          ) : data?.results && data.results.length > 0 ? (
            <ul>
              {data.results.map((result: SearchResult) => (
                <li key={result.companyNumber}>
                  <button
                    onClick={() => handleSelect(result.companyNumber)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3"
                  >
                    <div className="mt-1 bg-slate-100 p-2 rounded-full">
                      <Building2 className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{result.name}</div>
                      <div className="text-sm text-slate-500 flex gap-2">
                        <span>#{result.companyNumber}</span>
                        <span>•</span>
                        <span className={result.status === 'active' ? 'text-green-600' : 'text-orange-600'}>
                          {result.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{result.addressSnippet}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             !isLoading && debouncedValue.length >= 2 && (
              <div className="p-4 text-center text-slate-500 text-sm">No companies found.</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;