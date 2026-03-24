import { getTTSAudiosAPI, type TTSAudio } from "@/api/tts.api";
import { logger } from "@/utils/logger";
import ProTable from "@ant-design/pro-table";
import { Tag, message } from "antd";
import { useRef } from "react";

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

const TTSAudioTable = () => {
  const actionRef = useRef<any>();

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString("vi-VN");

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
      width: 70,
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "languageCode",
      key: "languageCode",
      hideInSearch: true,
      width: 100,
      render: (v: string) => (
        <Tag color={LANGUAGE_COLORS[v] || "default"} style={{ fontWeight: 600 }}>
          {(v || "").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "text",
      key: "text",
      width: 400,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: 13 }}>{v}</span>
      ),
    },
    {
      title: "Giọng đọc",
      dataIndex: "voice",
      key: "voice",
      hideInSearch: true,
      width: 150,
      render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : "—"),
    },
    {
      title: "Tốc độ",
      dataIndex: "speed",
      key: "speed",
      hideInSearch: true,
      width: 90,
      render: (v: number) => (v != null ? `x${v.toFixed(1)}` : "—"),
    },
    {
      title: "Group",
      dataIndex: "groupKey",
      key: "groupKey",
      hideInSearch: true,
      width: 280,
      render: (_: any, record: TTSAudio) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, fontSize: 12 }}>{record.groupKey || `Group #${record.groupId}`}</span>
          {record.translatedText && record.translatedText !== record.text && (
            <span style={{ fontSize: 11, color: "#888" }}>
              → {record.translatedText.length > 40 ? record.translatedText.substring(0, 40) + "..." : record.translatedText}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      width: 170,
      render: (v: string) => formatDate(v),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<TTSAudio>
        headerTitle="Danh sách TTS Audio (Chỉ xem)"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          try {
            const response: any = await getTTSAudiosAPI(params.current || 1, params.pageSize || 10);
            if (response?.data?.meta && response?.data?.result) {
              return { data: response.data.result || [], success: true, total: response.data.meta.total || 0 };
            }
            if (response?.meta && response?.result) {
              return { data: response.result || [], success: true, total: response.meta.total || 0 };
            }
            return { data: [], success: false, total: 0 };
          } catch (error) {
            logger.error("Fetch TTS audios error:", error);
            message.error("Không thể tải danh sách TTS audios");
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns as any}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} audio`,
        }}
      />
    </div>
  );
};

export default TTSAudioTable;
