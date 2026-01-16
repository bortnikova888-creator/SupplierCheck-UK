import { useState, useEffect } from 'react';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/healthz')
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>SupplierCheck UK</h1>
      <p>Status: OK</p>
      <h2>API Health Check</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {health && (
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
      {!health && !error && <p>Loading...</p>}
    </div>
  );
}

export default App;
