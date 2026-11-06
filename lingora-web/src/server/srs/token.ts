import crypto from 'node:crypto';
import { SrsServiceError } from './dto.ts';

export interface SrsTokenPayload {
  v: 1;
  learnerId: string;
  cardId: string;
  expectedRowVersion: string;
  sessionKey: string;
  exp: number; // Unix timestamp in seconds
}

export function getSrsSigningSecret(): string {
  const secret = process.env.LINGORA_SRS_SIGNING_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new SrsServiceError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ ôn tập tạm thời không khả dụng.');
  }
  return secret;
}

export function createSrsToken(payload: Omit<SrsTokenPayload, 'v'>): string {
  const secret = getSrsSigningSecret();
  const fullPayload: SrsTokenPayload = {
    v: 1,
    ...payload,
  };
  const payloadJson = JSON.stringify(fullPayload);
  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySrsToken(tokenString: string, expectedLearnerId: string): SrsTokenPayload {
  const secret = getSrsSigningSecret();
  if (typeof tokenString !== 'string' || !tokenString.includes('.')) {
    throw new SrsServiceError(400, 'INVALID_TOKEN', 'Token ôn tập không hợp lệ.');
  }
  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    throw new SrsServiceError(400, 'INVALID_TOKEN', 'Token ôn tập không hợp lệ.');
  }
  const [payloadB64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedSigBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expectedSigBuf.length || !crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
    throw new SrsServiceError(400, 'INVALID_TOKEN', 'Token ôn tập không hợp lệ hoặc đã bị thay đổi.');
  }

  let payload: SrsTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw new SrsServiceError(400, 'INVALID_TOKEN', 'Token ôn tập không hợp lệ.');
  }

  if (
    payload.v !== 1 ||
    !payload.learnerId ||
    !payload.cardId ||
    !payload.expectedRowVersion ||
    !payload.sessionKey ||
    typeof payload.exp !== 'number'
  ) {
    throw new SrsServiceError(400, 'INVALID_TOKEN', 'Token ôn tập không hợp lệ.');
  }

  if (payload.learnerId !== expectedLearnerId) {
    throw new SrsServiceError(403, 'FORBIDDEN', 'Token ôn tập không thuộc về người học này.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > payload.exp) {
    throw new SrsServiceError(409, 'SESSION_EXPIRED', 'Phiên ôn tập đã hết hạn. Vui lòng bắt đầu lại.');
  }

  return payload;
}

export function computeSrsInputHash(input: { cardId: string; rating: string; sessionKey: string }): string {
  const canonical = JSON.stringify({
    cardId: input.cardId,
    rating: input.rating,
    sessionKey: input.sessionKey,
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
