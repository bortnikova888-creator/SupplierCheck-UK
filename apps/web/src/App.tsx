import { useState, useEffect, useRef, type FormEvent } from 'react';
import './App.css';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
}

interface CompanySearchItem {
  companyNumber: string;
  name: string;
  status?: string;
  addressSnippet?: string;
}

const API_KEY_PENDING_MESSAGE = 'Companies House API key pending';

const apiBase = (() => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  return raw.trim().replace(/\/$/, '');
})();

const buildApiUrl = (path: string) => (apiBase ? `${apiBase}${path}` : path);

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchItem[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [keyPending, setKeyPending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanySearchItem[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const healthUrl = buildApiUrl('/health');
    fetch(healthUrl)
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    setSuggestError(null);

    if (keyPending || trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      const searchUrl = `${buildApiUrl('/api/search')}?q=${encodeURIComponent(trimmed)}`;

      try {
        const response = await fetch(searchUrl, { signal: controller.signal });
        const payload = await response.json().catch(() => null);

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!response.ok) {
          const message = payload?.error?.message ?? 'Request failed';
          if ((response.status === 503 || response.status === 412) && message === API_KEY_PENDING_MESSAGE) {
            setSuggestError(API_KEY_PENDING_MESSAGE);
            setSuggestions([]);
            return;
          }
          setSuggestError(message);
          setSuggestions([]);
          return;
        }

        const items = (payload?.results ?? []) as CompanySearchItem[];
        setSuggestions(items.slice(0, 6));
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setSuggestError(err instanceof Error ? err.message : 'Unable to load suggestions');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSuggesting(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, keyPending]);

  const performSearch = async (term: string) => {
    setSearchError(null);
    setKeyPending(false);
    setIsSearching(true);
    setResults(null);

    const trimmed = term.trim();
    if (!trimmed) {
      setSearchError('Please enter a company name or number.');
      setIsSearching(false);
      return;
    }

    const searchUrl = `${buildApiUrl('/api/search')}?q=${encodeURIComponent(trimmed)}`;

    try {
      const response = await fetch(searchUrl);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.error?.message ?? 'Request failed';
        if ((response.status === 503 || response.status === 412) && message === API_KEY_PENDING_MESSAGE) {
          setKeyPending(true);
        } else {
          setSearchError(message);
        }
        return;
      }

      setResults((payload?.results ?? []) as CompanySearchItem[]);
      setSuggestions([]);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performSearch(query);
  };

  const handleSuggestionClick = async (item: CompanySearchItem) => {
    const term = item.companyNumber || item.name;
    setQuery(term);
    await performSearch(term);
  };

  const showSuggestions = suggestions.length > 0 && !isSearching && !keyPending;

  return (
    <div className="page">
      <div className="orb orb--one" />
      <div className="orb orb--two" />
      <div className="grid" />

      <header className="hero">
        <div className="hero__content">
          <span className="eyebrow">SupplierCheck UK</span>
          <h1>Know a supplier in minutes, not days.</h1>
          <p className="subtitle">
            Search Companies House, review key filings, and export a shareable dossier from a
            single workspace.
          </p>

          <div className="hero__points">
            <div>
              <h3>Live company lookup</h3>
              <p>Start typing a name or number and choose from live results.</p>
            </div>
            <div>
              <h3>Risk flags in one place</h3>
              <p>Combine officers, PSCs, and registry checks into one report.</p>
            </div>
          </div>

          <div className="status">
            <span className={`status__dot ${health ? 'status__dot--ok' : ''}`} />
            <span>{health ? 'API online' : 'Checking API health...'}</span>
            {error && <span className="status__error">{error}</span>}
          </div>
        </div>

        <div className="hero__card">
          <div className="card__header">
            <div>
              <h2>Company search</h2>
              <p>Find a supplier by name or registration number.</p>
            </div>
            <span className="badge">UK</span>
          </div>

          {keyPending && (
            <div className="banner" role="status">
              <strong>Companies House API key pending.</strong>
              <span>Add COMPANIES_HOUSE_API_KEY to enable lookups.</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="search">
            <label className="sr-only" htmlFor="company-search">
              Search companies
            </label>
            <input
              id="company-search"
              type="text"
              placeholder="Search companies"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              className="search__input"
            />
            <button type="submit" className="search__button" disabled={isSearching}>
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {isSuggesting && !isSearching && <p className="hint">Loading suggestions…</p>}
          {suggestError && !isSearching && <p className="error">{suggestError}</p>}

          {showSuggestions && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((item) => (
                <li key={item.companyNumber}>
                  <button
                    type="button"
                    className="suggestions__item"
                    onClick={() => void handleSuggestionClick(item)}
                  >
                    <span className="suggestions__name">{item.name}</span>
                    <span className="suggestions__meta">
                      {item.companyNumber}
                      {item.status ? ` · ${item.status}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchError && <p className="error">{searchError}</p>}

          {results && (
            <div className="results">
              <div className="results__header">
                <h3>Results</h3>
                <span>{results.length} found</span>
              </div>
              <ul>
                {results.length === 0 && <li>No results yet.</li>}
                {results.map((item) => (
                  <li key={item.companyNumber}>
                    <div className="results__name">{item.name}</div>
                    <div className="results__meta">
                      {item.companyNumber}
                      {item.status ? ` · ${item.status}` : ''}
                      {item.addressSnippet ? ` · ${item.addressSnippet}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
