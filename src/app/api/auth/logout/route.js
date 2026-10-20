import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('arus_token');
  return Response.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete('arus_token');
  return Response.json({ success: true });
}
