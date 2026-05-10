import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/recommendations/cron-auth';
import { sendRelancesVague } from '@/lib/recommendations/sender';

export const maxDuration = 300; // 5 min — Fluid Compute par défaut

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const stats = await sendRelancesVague('bimestrielle');
  return NextResponse.json({ ok: true, context: 'bimestrielle', stats });
}
