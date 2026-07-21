// Checks package compatibility metadata for plugin manifests.
import { isRecord } from "@grokbot/normalization-core/record-coerce";

/** Result of reading package.json grokbot.compat.pluginApi metadata. */
type PackagePluginApiRangeResult = { ok: true; range?: string } | { ok: false; error: string };

/** Resolves the plugin API compatibility range declared by package metadata. */
export function resolvePackagePluginApiRange(
  packageMetadata: unknown,
): PackagePluginApiRangeResult {
  if (packageMetadata === undefined || packageMetadata === null) {
    return { ok: true };
  }
  if (!isRecord(packageMetadata)) {
    return { ok: true };
  }
  if (!("compat" in packageMetadata)) {
    return { ok: true };
  }
  const compat = packageMetadata.compat;
  if (compat === undefined || compat === null) {
    return { ok: true };
  }
  if (!isRecord(compat)) {
    return { ok: false, error: "package.json grokbot.compat must be an object" };
  }
  if (!("pluginApi" in compat)) {
    return { ok: true };
  }
  const pluginApi = compat.pluginApi;
  if (typeof pluginApi !== "string") {
    return { ok: false, error: "package.json grokbot.compat.pluginApi must be a string" };
  }
  const range = pluginApi.trim();
  if (!range) {
    return { ok: false, error: "package.json grokbot.compat.pluginApi must not be empty" };
  }
  return { ok: true, range };
}
