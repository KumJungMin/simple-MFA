import type { PropsWithChildren } from 'react';

type ShellLayoutProps = PropsWithChildren<{
  current: 'home' | 'kyc';
  token: string;
  title: string;
  description: string;
}>;

export function ShellLayout({ children, current, token, title, description }: ShellLayoutProps) {
  const homeHref = `/?token=${encodeURIComponent(token)}`;
  const kycHref = `/kyc.html?token=${encodeURIComponent(token)}`;

  return (
    <main className="shell-page">
      <section className="shell-hero">
        <div className="shell-hero-copy">
          <p className="shell-badge">React shell + Vue micro frontend</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <nav className="shell-nav" aria-label="Primary">
          <a className={current === 'home' ? 'shell-nav-link is-active' : 'shell-nav-link'} href={homeHref}>
            Shell home
          </a>
          <a className={current === 'kyc' ? 'shell-nav-link is-active' : 'shell-nav-link'} href={kycHref}>
            KYC page
          </a>
        </nav>
      </section>

      <section className="shell-content">{children}</section>
    </main>
  );
}
