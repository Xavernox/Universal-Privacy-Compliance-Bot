export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>U-PCB MVP - Unified Cloud Security Platform</h1>
      <p>Welcome to the U-PCB MVP dashboard.</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>API Endpoints</h2>
        <ul>
          <li>
            <strong>Authentication:</strong> <code>/api/auth</code>
          </li>
          <li>
            <strong>Scans:</strong> <code>/api/scan</code>
          </li>
          <li>
            <strong>Policies:</strong> <code>/api/policy</code>
          </li>
          <li>
            <strong>Monitoring:</strong> <code>/api/monitor</code>
          </li>
          <li>
            <strong>Alerts:</strong> <code>/api/alert</code>
          </li>
          <li>
            <strong>Admin:</strong> <code>/api/admin</code> (requires Basic token)
          </li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Getting Started</h2>
        <ol>
          <li>Configure your environment variables in .env</li>
          <li>Ensure MongoDB connection is established</li>
          <li>Use the API endpoints to manage cloud security</li>
        </ol>
      </section>
    </main>
  );
}
