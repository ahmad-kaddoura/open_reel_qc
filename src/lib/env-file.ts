import fs from 'fs/promises';
import path from 'path';
import { isEnvValueConfigured, PLACEHOLDER_VALUES } from '@/core/config/env-keys';

const ENV_PATH = path.join(process.cwd(), '.env');

export type EnvFileValues = Record<string, string>;

export async function readEnvFile(): Promise<EnvFileValues> {
  try {
    const content = await fs.readFile(ENV_PATH, 'utf-8');
    return parseEnvContent(content);
  } catch {
    return {};
  }
}

export async function writeEnvFile(updates: EnvFileValues): Promise<void> {
  let content: string;

  try {
    content = await fs.readFile(ENV_PATH, 'utf-8');
  } catch {
    content = '';
  }

  const lines = content.length > 0 ? content.split('\n') : [];
  const updatedKeys = new Set<string>();

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) return line;

    const key = match[1];
    if (!(key in updates)) return line;

    updatedKeys.add(key);
    return formatEnvLine(key, updates[key]);
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      nextLines.push(formatEnvLine(key, value));
    }
  }

  const output = nextLines.join('\n').replace(/\n+$/, '') + '\n';
  await fs.writeFile(ENV_PATH, output, 'utf-8');
}

function parseEnvContent(content: string): EnvFileValues {
  const values: EnvFileValues = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function formatEnvLine(key: string, value: string): string {
  const needsQuotes = /\s|#/.test(value);
  return needsQuotes ? `${key}="${value}"` : `${key}=${value}`;
}

export function maskSecret(value: string | undefined): string | null {
  if (!isEnvValueConfigured(value)) return null;
  const trimmed = value!.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 3)}${'•'.repeat(Math.min(trimmed.length - 7, 20))}${trimmed.slice(-4)}`;
}

export function sanitizeIncomingSecret(
  incoming: string | undefined,
  existing: string | undefined
): string | undefined {
  if (incoming === undefined) return undefined;
  const trimmed = incoming.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return undefined;
  return trimmed;
}
