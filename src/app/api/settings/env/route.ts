import { NextRequest, NextResponse } from 'next/server';
import { ENV_KEY_GROUPS, isEnvValueConfigured } from '@/core/config/env-keys';
import {
  readEnvFile,
  writeEnvFile,
  maskSecret,
  sanitizeIncomingSecret,
  type EnvFileValues,
} from '@/lib/env-file';

export interface EnvKeyStatus {
  apiKey: { isSet: boolean; masked: string | null };
  baseUrl: string;
}

export interface EnvSettingsResponse {
  keys: Record<string, EnvKeyStatus>;
}

export async function GET() {
  try {
    const env = await readEnvFile();
    const keys: Record<string, EnvKeyStatus> = {};

    for (const group of ENV_KEY_GROUPS) {
      const rawBaseUrl = env[group.baseUrl];
      keys[group.id] = {
        apiKey: {
          isSet: Boolean(maskSecret(env[group.apiKey])),
          masked: maskSecret(env[group.apiKey]),
        },
        baseUrl: isEnvValueConfigured(rawBaseUrl) ? rawBaseUrl : group.defaultBaseUrl,
      };
    }

    return NextResponse.json({ keys } satisfies EnvSettingsResponse);
  } catch (error) {
    console.error('Failed to read env settings:', error);
    return NextResponse.json({ error: 'Failed to read API key settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = body.keys as Record<
      string,
      { apiKey?: string; baseUrl?: string }
    >;

    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const current = await readEnvFile();
    const updates: EnvFileValues = {};

    for (const group of ENV_KEY_GROUPS) {
      const patch = incoming[group.id];
      if (!patch) continue;

      const apiKey = sanitizeIncomingSecret(patch.apiKey, current[group.apiKey]);
      if (apiKey !== undefined) {
        updates[group.apiKey] = apiKey;
      }

      if (patch.baseUrl !== undefined && patch.baseUrl.trim()) {
        updates[group.baseUrl] = patch.baseUrl.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No changes to save' }, { status: 400 });
    }

    await writeEnvFile(updates);

    // Refresh process.env for keys that were updated (dev convenience)
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value;
    }

    return GET();
  } catch (error) {
    console.error('Failed to save env settings:', error);
    return NextResponse.json({ error: 'Failed to save API key settings' }, { status: 500 });
  }
}
