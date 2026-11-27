import { cookies } from 'next/headers.js';
import { verifyLearnerIdentity, validateSameOrigin, buildAuthResponseHeaders } from '../../../../server/auth/index.ts';
import { loadLearnerProfile, patchLearnerProfile } from '../../../../server/profile/service.ts';
import { ContextServiceError } from '../../../../server/context/dto.ts';
export const dynamic = 'force-dynamic';
async function handle(request: Request, patch: boolean) {
  const headers = buildAuthResponseHeaders({ 'Cache-Control': 'no-store, private' });
  if (patch && !validateSameOrigin(request)) return Response.json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Yêu cầu không cùng nguồn gốc.' } }, {status:403, headers});
  if (patch && !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({error:{code:'UNSUPPORTED_MEDIA_TYPE',message:'Yêu cầu application/json.'}},{status:415,headers});
  try {
    const store = await cookies();
    if (!patch) {
      const result = await loadLearnerProfile(store, {responseHeaders:headers});
      return Response.json(result.ok ? {data:result.data} : {error:result.error},{status:result.status,headers});
    }
    const verified = await verifyLearnerIdentity({cookieStore:store,responseHeaders:headers});
    if (!verified.ok) return Response.json({error:verified.error},{status:verified.status,headers});
    let body: unknown;
    try {
      const reader = request.body?.getReader();
      if (!reader) throw new Error('Missing body');
      const chunks: Uint8Array[] = []; let size = 0;
      try { while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 4096) { await reader.cancel(); return Response.json({error:{code:'PAYLOAD_TOO_LARGE',message:'Dữ liệu hồ sơ quá lớn.'}},{status:413,headers}); } chunks.push(value); } } finally {reader.releaseLock();}
      const buffer = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) {buffer.set(chunk,offset);offset += chunk.byteLength;}
      body = JSON.parse(new TextDecoder().decode(buffer));
    } catch { return Response.json({error:{code:'VALIDATION_ERROR',message:'JSON không hợp lệ.'}},{status:400,headers}); }
    return Response.json({data:await patchLearnerProfile(verified.user.id,body)},{headers});
  } catch(error) {
    if(error instanceof ContextServiceError) return Response.json({error:{code:error.code,message:error.message}},{status:error.status,headers});
    return Response.json({error:{code:'SERVICE_UNAVAILABLE',message:'Không thể tải hoặc cập nhật hồ sơ.'}},{status:503,headers});
  }
}
export const GET = (request: Request) => handle(request,false);
export const PATCH = (request: Request) => handle(request,true);
