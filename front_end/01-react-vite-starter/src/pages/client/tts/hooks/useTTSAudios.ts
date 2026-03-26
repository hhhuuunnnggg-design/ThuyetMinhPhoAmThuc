import { getTTSAudiosAPI, type TTSAudio } from "@/api/tts.api";
import { message } from "antd";
import { useEffect, useState } from "react";
import { dedupeTTSAudiosByGroup } from "../utils/dedupeAudiosByGroup";

export const useTTSAudios = () => {
  const [audios, setAudios] = useState<TTSAudio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res: any = await getTTSAudiosAPI(1, 100);
        let data: TTSAudio[] = [];
        if (res?.data?.meta && res?.data?.result) {
          data = res.data.result as TTSAudio[];
        } else if (res?.meta && res?.result) {
          data = res.result as TTSAudio[];
        }
        /** API trả mỗi ngôn ngữ một bản ghi → gộp theo nhóm TTS (một dòng / POI+nhóm). */
        setAudios(dedupeTTSAudiosByGroup(data));
      } catch (err: any) {
        message.error("Không thể tải danh sách audio ẩm thực");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { audios, loading };
};
