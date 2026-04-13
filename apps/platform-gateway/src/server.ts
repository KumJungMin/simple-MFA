import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = Number(process.env.PORT ?? 3000);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isProduction = NODE_ENV === 'production';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const shellDistDir = resolve(appRoot, '../shell-react/dist');
const kycDistDir = resolve(appRoot, '../kyc-vue/dist');

const shellDevTarget = process.env.SHELL_DEV_TARGET ?? 'http://localhost:5173';
const kycDevTarget = process.env.KYC_DEV_TARGET ?? 'http://localhost:5174';
const apiTarget = process.env.API_TARGET ?? 'http://localhost:4175';

const app = express();

function createApiProxy() {
  return createProxyMiddleware({
    changeOrigin: true,
    pathRewrite: {
      '^/api': ''
    },
    target: apiTarget
  });
}

if (isProduction) {
  app.use('/api', createApiProxy());
  app.use('/mfe/kyc', express.static(kycDistDir, { index: false }));
  app.use(express.static(shellDistDir, { index: false }));

  app.get('/mfe/kyc', (_req, res) => {
    res.redirect('/mfe/kyc/');
  });

  app.get('/mfe/kyc/', (_req, res) => {
    res.sendFile(resolve(kycDistDir, 'index.html'));
  });

  app.get('/', (_req, res) => {
    res.sendFile(resolve(shellDistDir, 'index.html'));
  });

  app.get('/kyc.html', (_req, res) => {
    res.sendFile(resolve(shellDistDir, 'kyc.html'));
  });
} else {
  app.use('/api', createApiProxy());
  app.use(
    createProxyMiddleware({
      changeOrigin: true,
      pathFilter: '/mfe/kyc',
      target: kycDevTarget,
      ws: true
    })
  );
  app.use(
    '/',
    createProxyMiddleware({
      changeOrigin: true,
      target: shellDevTarget,
      ws: true
    })
  );
}

app.listen(PORT, () => {
  console.log(`[platform-gateway] ${isProduction ? 'production' : 'development'} server running at http://localhost:${PORT}`);
});
