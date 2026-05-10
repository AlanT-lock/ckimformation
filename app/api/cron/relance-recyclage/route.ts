import { NextResponse } from 'next/server';
import { isAuthorizedCron } from '@/lib/recommendations/cron-auth';
import { sendRelancesRecyclage } from '@/lib/recommendations/sender';

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const stats = await sendRelancesRecyclage();
  return NextResponse.json({ ok: true, context: 'recyclage', stats });
}
