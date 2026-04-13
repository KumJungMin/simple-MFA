import { useEffect, useState } from 'react';
import type { AuthUser } from '@mfe/shared-contracts';
import { ShellLayout } from './components/ShellLayout';
import { verifyAuth } from './lib/mock-api';
import { getShellRuntime } from './lib/runtime';

const runtime = getShellRuntime();

export function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const nextUser = await verifyAuth(runtime.apiBase, runtime.token);
        if (!active) return;

        setUser(nextUser);
        setError(null);
      } catch (loadError) {
        if (!active) return;

        setUser(null);
        setError(loadError instanceof Error ? loadError.message : 'Failed to verify the user token.');
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ShellLayout
      current="home"
      token={runtime.token}
      title="Shell Home"
      description="The shell owns page routing, token hand-off, and the entry decision for which micro frontend should load next."
    >
      <section className="shell-card shell-stack">
        <p className="shell-eyebrow">MVP flow</p>
        <h2>1. Verify user in the shell</h2>
        <p>
          The shell reads the token from the URL, calls the Express mock API, and decides which page to open next.
        </p>
        <div className="shell-grid">
          <article className="shell-subcard">
            <p className="shell-label">Mock API</p>
            <strong>{runtime.apiBase}</strong>
          </article>
          <article className="shell-subcard">
            <p className="shell-label">Remote KYC entry</p>
            <strong>{runtime.kycRemoteUrl}</strong>
          </article>
          <article className="shell-subcard">
            <p className="shell-label">Current token</p>
            <strong>{runtime.token}</strong>
          </article>
        </div>
      </section>

      <section className="shell-card shell-stack">
        <h2>2. Authentication result</h2>
        {error ? (
          <div className="shell-alert shell-alert-error">
            <strong>Token verification failed.</strong>
            <span>{error}</span>
          </div>
        ) : user ? (
          <div className="shell-grid">
            <article className="shell-subcard">
              <p className="shell-label">User</p>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </article>
            <article className="shell-subcard">
              <p className="shell-label">Channel</p>
              <strong>{user.channel}</strong>
              <span>{user.id}</span>
            </article>
            <article className="shell-subcard">
              <p className="shell-label">Auth state</p>
              <strong>{user.isAuthenticated ? 'Authenticated' : 'Unknown'}</strong>
              <span>Token came from URL query params.</span>
            </article>
          </div>
        ) : (
          <div className="shell-alert">
            <strong>Checking token...</strong>
            <span>The shell is calling `/auth/verify` before routing onward.</span>
          </div>
        )}
      </section>

      <section className="shell-card shell-stack">
        <h2>3. Navigate into the KYC app</h2>
        <p>
          These links trigger a full page transition, so this is closer to an MPA flow than an in-memory SPA route.
        </p>
        <div className="shell-actions">
          <a className="shell-button" href={`/kyc.html?token=${encodeURIComponent(runtime.token)}`}>
            Open KYC through the shell
          </a>
          <a className="shell-button shell-button-secondary" href="/?token=valid-token-user-001">
            Switch to user-001
          </a>
          <a className="shell-button shell-button-secondary" href="/?token=valid-token-user-002">
            Switch to user-002
          </a>
          <a
            className="shell-button shell-button-secondary"
            href={`http://localhost:5174/?token=${encodeURIComponent(runtime.token)}`}
          >
            Open KYC standalone app
          </a>
        </div>
      </section>
    </ShellLayout>
  );
}
