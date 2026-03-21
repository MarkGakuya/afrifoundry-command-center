import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE  = process.env.API_BASE  || 'https://afrifoundry-api.onrender.com';
const API_TOKEN = process.env.API_TOKEN || '';

async function handler(request, { params }) {
  const cookieStore = cookies();
  const token = cookieStore.get('cc_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const path  = params.path.join('/');
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url   = `${API_BASE}/${path}${query ? `?${query}` : ''}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
  };

  const init = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const res  = await fetch(url, init);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: 'API unreachable', detail: err.message }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
