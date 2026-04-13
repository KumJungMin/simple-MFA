const remoteLoads = new Map<string, Promise<void>>();

export function loadRemoteModule(remoteUrl: string) {
  if (customElements.get('mfe-kyc-app')) {
    return Promise.resolve();
  }

  const existingLoad = remoteLoads.get(remoteUrl);
  if (existingLoad) {
    return existingLoad;
  }

  const nextLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = remoteUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load remote entry: ${remoteUrl}`));
    document.head.appendChild(script);
  });

  remoteLoads.set(remoteUrl, nextLoad);
  return nextLoad;
}
