import type { TTSAudio } from "@/api/tts.api";

const LANG_PRIORITY = ["vi", "en", "ko", "ja", "fr", "zh"] as const;

function langScore(code: string): number {
  const i = LANG_PRIORITY.indexOf(code.toLowerCase() as (typeof LANG_PRIORITY)[number]);
  return i === -1 ? 99 : i;
}

function clusterKey(a: TTSAudio): string {
  if (a.groupId != null) return `gid:${a.groupId}`;
  if (a.groupKey) return `gkey:${a.groupKey}`;
  return `aid:${a.id}`;
}

/** Một dòng TTSAudio / ngôn ngữ → sidebar cần một dòng / nhóm TTS (giống admin “Nhóm thuyết minh”). */
export function dedupeTTSAudiosByGroup(audios: TTSAudio[]): TTSAudio[] {
  const best = new Map<string, TTSAudio>();

  for (const a of audios) {
    const key = clusterKey(a);
    const cur = best.get(key);
    if (!cur) {
      best.set(key, a);
      continue;
    }
    const sNew = langScore(a.languageCode || "");
    const sOld = langScore(cur.languageCode || "");
    if (sNew < sOld) best.set(key, a);
    else if (sNew === sOld && a.id < cur.id) best.set(key, a);
  }

  return Array.from(best.values());
}
