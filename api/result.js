import { json, isAdmin, hasEventCode, isFalUrl, falGet } from './_lib.js';

// GET /api/result?status_url=...&response_url=...&code=...  (ou admin=...)
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const q = Object.fromEntries(url.searchParams.entries());
  if (!isAdmin(q, req) && !hasEventCode(q, req)) return json(res, 401, { error: 'não autorizado' });
  const statusUrl = q.status_url;
  const responseUrl = q.response_url;
  if (!isFalUrl(statusUrl) || !isFalUrl(responseUrl)) return json(res, 400, { error: 'URLs inválidas' });
  try {
    const st = await falGet(`${statusUrl}${statusUrl.includes('?') ? '&' : '?'}logs=1`);
    if (!st.ok) return json(res, 502, { error: `fal status ${st.status}`, detail: st.data });
    const status = st.data.status; // IN_QUEUE | IN_PROGRESS | COMPLETED
    const logs = (st.data.logs || []).map((l) => l.message).slice(-8);
    if (status !== 'COMPLETED') {
      return json(res, 200, { status, queue_position: st.data.queue_position, logs });
    }
    const out = await falGet(responseUrl);
    if (!out.ok) return json(res, 200, { status: 'FAILED', error: `fal result ${out.status}`, detail: out.data, logs });
    return json(res, 200, { status: 'COMPLETED', output: out.data, logs });
  } catch (e) {
    return json(res, 500, { error: e.message || String(e) });
  }
}
