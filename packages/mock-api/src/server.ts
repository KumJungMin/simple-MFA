import cors from 'cors';
import express from 'express';
import type { AuthUser, KycStatus, KycStatusResponse } from '@mfe/shared-contracts';

const PORT = 4175;
const app = express();

app.use(cors());
app.use(express.json());

const usersByToken: Record<string, AuthUser> = {
  'valid-token-user-001': {
    id: 'user-001',
    email: 'user001@example.com',
    name: 'User One',
    channel: 'A',
    accessToken: 'valid-token-user-001',
    refreshToken: 'refresh-user-001',
    isAuthenticated: true
  },
  'valid-token-user-002': {
    id: 'user-002',
    email: 'user002@example.com',
    name: 'User Two',
    channel: 'B',
    accessToken: 'valid-token-user-002',
    refreshToken: 'refresh-user-002',
    isAuthenticated: true
  }
};

const kycStatusByUserId: Record<string, KycStatus> = {
  'user-001': 'pending',
  'user-002': 'approved'
};

function getTokenFromRequest(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  if (typeof req.query.token === 'string') {
    return req.query.token;
  }

  if (typeof req.body?.token === 'string') {
    return req.body.token;
  }

  return undefined;
}

function getUserByToken(token: string | undefined): AuthUser | undefined {
  if (!token) return undefined;
  return usersByToken[token];
}

function toKycStatusResponse(user: AuthUser): KycStatusResponse {
  return {
    userId: user.id,
    channel: user.channel,
    status: kycStatusByUserId[user.id] ?? 'not_started',
    updatedAt: new Date().toISOString()
  };
}

app.post('/auth/verify', (req, res) => {
  const token = getTokenFromRequest(req);
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token verification failed'
    });
  }

  return res.json({
    user
  });
});

app.get('/kyc/status', (req, res) => {
  const token = getTokenFromRequest(req);
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token verification failed'
    });
  }

  return res.json(toKycStatusResponse(user));
});

app.post('/kyc/complete', (req, res) => {
  const token = getTokenFromRequest(req);
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token verification failed'
    });
  }

  const current = kycStatusByUserId[user.id] ?? 'pending';
  kycStatusByUserId[user.id] = current === 'approved' ? 'pending' : 'approved';

  return res.json({
    message: 'KYC completion processed',
    result: toKycStatusResponse(user)
  });
});

app.listen(PORT, () => {
  console.log(`[mock-api] running at http://localhost:${PORT}`);
});
