import { getMockKycStatus } from '@mfe/mock-api';

export default function App() {
  const status = getMockKycStatus('user-001');

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Shell (React)</h1>
      <p>Micro frontend host application</p>
      <p>
        Sample KYC status: <strong>{status.status}</strong>
      </p>
    </main>
  );
}
