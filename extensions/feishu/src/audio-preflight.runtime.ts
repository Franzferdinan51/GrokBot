// Feishu plugin module implements audio preflight behavior.
import { transcribeFirstAudio as transcribeFirstAudioImpl } from "grokbot/plugin-sdk/media-runtime";

type TranscribeFirstAudio = typeof import("grokbot/plugin-sdk/media-runtime").transcribeFirstAudio;

export async function transcribeFirstAudio(
  ...args: Parameters<TranscribeFirstAudio>
): ReturnType<TranscribeFirstAudio> {
  return await transcribeFirstAudioImpl(...args);
}
