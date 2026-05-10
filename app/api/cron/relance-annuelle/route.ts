import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/recommendations/cron-auth';
import { sendRelancesVague } from '@/lib/recommendations/sender';

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const stats = await sendRelancesVague('annuelle');
  return NextResponse.json({ ok: true, context: 'annuelle', stats });
}
