/**
 * Resolves the Grok CLI binary path.
 *
 * Checks in order:
 *   1. GROK_BUILD_PATH env var (explicit override)
 *   2. grok CLI in PATH (via which/similar)
 *   3. ~/.local/bin/grok (common install location)
 *   4. /usr/local/bin/grok
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

export type GrokCliStatus =
  | { available: true; path: string; version?: string }
  | { available: false; path: string; error: string };

const FALLBACK_PATHS = [
  `${homedir()}/.local/bin/grok`,
  "/usr/local/bin/grok",
  "/opt/grok/bin/grok",
  "grok", // PATH search
];

async function getGrokVersion(command: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(command, ["--version"], { timeout: 5000 });
    // grok --version typically outputs: grok version 0.x.x or similar
    const match = stdout.match(/grok\s+version\s+([\d.]+)/i)
      ?? stdout.match(/grok\s+([\d.]+)/i);
    return match?.[1];
  } catch {
    return undefined;
  }
}

/**
 * Checks if grok CLI is available and returns its path + version.
 */
export async function grokCliStatus(): Promise<GrokCliStatus> {
  // 1. Explicit override
  const override = process.env.GROK_BUILD_PATH;
  if (override) {
    if (!existsSync(override)) {
      return { available: false, path: override, error: `GROK_BUILD_PATH is set but file not found: ${override}` };
    }
    const version = await getGrokVersion(override);
    return { available: true, path: override, version };
  }

  // 2. PATH search
  for (const cmd of ["grok", "Grok"]) {
    try {
      const { stdout } = await execFileAsync("which", [cmd], { timeout: 3000 });
      const resolved = stdout.trim();
      if (resolved && existsSync(resolved)) {
        const version = await getGrokVersion(resolved);
        return { available: true, path: resolved, version };
      }
    } catch {
      // not found in PATH
    }
  }

  // 3. Fallback install locations
  for (const fallbackPath of FALLBACK_PATHS) {
    if (existsSync(fallbackPath)) {
      const version = await getGrokVersion(fallbackPath);
      return { available: true, path: fallbackPath, version };
    }
  }

  return {
    available: false,
    path: "grok",
    error: "Grok CLI not found. Install from: https://grok.com/build",
  };
}

/** Returns true if the Grok CLI is available. */
export async function grokCliAvailable(): Promise<boolean> {
  const status = await grokCliStatus();
  return status.available;
}

/** Resolves the Grok CLI path, throwing if unavailable. */
export async function resolveGrokCliPath(): Promise<string> {
  const status = await grokCliStatus();
  if (!status.available) {
    throw new Error(
      `Grok CLI not available: ${status.error}\n` +
      `Install Grok CLI from https://grok.com/build or set GROK_BUILD_PATH env var.`,
    );
  }
  return status.path;
}
