import { useEffect, useState } from 'react';
import { ShellLayout } from './components/ShellLayout';
import { loadRemoteModule } from './lib/load-remote';
import { getShellRuntime } from './lib/runtime';

const runtime = getShellRuntime();

export function KycPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRemote() {
      try {
        await loadRemoteModule(runtime.kycRemoteUrl);
        if (!active) return;

        setStatus('ready');
      } catch (loadError) {
        if (!active) return;

        setStatus('error');
        setError(loadError instanceof Error ? loadError.message : 'Failed to load the KYC remote module.');
      }
    }

    void loadRemote();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ShellLayout
      current="kyc"
      token={runtime.token}
      title="KYC Route"
      description="This page belongs to the shell, but the KYC domain UI is owned by the Vue micro frontend."
    >
      <section className="shell-card shell-stack">
        <p className="shell-eyebrow">Composition</p>
        <h2>Shell page + remote app</h2>
        <p>
          The shell loaded the remote entry script, then mounted the Vue app as a custom element inside this page.
        </p>
        <div className="shell-grid">
          <article className="shell-subcard">
            <p className="shell-label">Remote entry</p>
            <strong>{runtime.kycRemoteUrl}</strong>
          </article>
          <article className="shell-subcard">
            <p className="shell-label">API base</p>
            <strong>{runtime.apiBase}</strong>
          </article>
          <article className="shell-subcard">
            <p className="shell-label">Status</p>
            <strong>{status === 'loading' ? 'Booting remote' : status === 'ready' ? 'Remote ready' : 'Load failed'}</strong>
          </article>
        </div>
      </section>

      <section className="shell-card shell-stack">
        {status === 'error' ? (
          <div className="shell-alert shell-alert-error">
            <strong>Remote app failed to load.</strong>
            <span>{error}</span>
          </div>
        ) : (
          <mfe-kyc-app token={runtime.token} api-base={runtime.apiBase} />
        )}
      </section>
    </ShellLayout>
  );
}
