import { NextResponse } from 'next/server';
import { getQwenConfig } from '@/lib/qwen-client';

export async function GET() {
  const config = await getQwenConfig();
  const qwenHost = config ? new URL(config.baseUrl).hostname : null;

  return NextResponse.json({
    ok: true,
    service: 'OpenScene backend',
    qwenConfigured: Boolean(config),
    qwenHost,
    runtime: 'Next.js API route',
    timestamp: new Date().toISOString(),
  });
}
