import {
  deleteTTSGroupAPI,
  generateMultilingualForGroupAPI,
  getTTSGroupsAPI,
  type TTSAudioGroup,
} from "@/api/tts.api";
import { config } from "@/config";
import { API_ENDPOINTS, ROUTES } from "@/constants";
import EditTTSAudioGroupModal from "@/pages/admin/TTSAudioGroup/EditTTSAudioGroupModal";
import { logger } from "@/utils/logger";
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Button, message, Popconfirm, Space, Tag, Tooltip } from "antd";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  fr: "Français",
};

const TTSAudioGroupsPage = () => {
  const navigate = useNavigate();
  const [generatingGroupId, setGeneratingGroupId] = useState<number | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const actionRef = useRef<any>();

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteTTSGroupAPI(id);
      message.success("Xóa nhóm audio thành công!");
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Xóa nhóm audio thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Delete TTS group error:", error);
    }
  };

  const handleGenerateMultilingual = async (groupId: number) => {
    try {
      setGeneratingGroupId(groupId);
      await generateMultilingualForGroupAPI(groupId);
      message.success("Đã tạo audio đa ngôn ngữ thành công!");
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Tạo audio đa ngôn ngữ thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Generate multilingual error:", error);
    } finally {
      setGeneratingGroupId(null);
    }
  };

  const handlePlayAudio = (audioId: number) => {
    const url = `${config.api.baseURL}${API_ENDPOINTS.TTS.AUDIO_DOWNLOAD(audioId)}`;
    const audio = new Audio(url);
    audio.play().catch(() => message.error("Không thể phát audio"));
    setPlayingAudioId(audioId);
    audio.onended = () => setPlayingAudioId(null);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
      width: 70,
    },
    {
      title: "Nhóm / Món ăn",
      dataIndex: "foodName",
      key: "foodName",
      width: 280,
      render: (_: any, record: TTSAudioGroup) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>{record.foodName || "—"}</span>
          <span style={{ fontSize: 12, color: "#888" }}>
            {record.groupKey || `Group #${record.id}`}
          </span>
          {record.originalText && (
            <span style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {record.originalText.length > 60 ? record.originalText.substring(0, 60) + "..." : record.originalText}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "audios",
      key: "languages",
      hideInSearch: true,
      width: 200,
      render: (_: any, record: TTSAudioGroup) => {
        const langs = record.audios.map((a) => a.languageCode);
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {langs.length === 0 ? (
              <span style={{ color: "#999", fontSize: 12 }}>Chưa có</span>
            ) : (
              langs.map((lang) => (
                <Tag
                  key={lang}
                  color={LANGUAGE_COLORS[lang] || "default"}
                  style={{ fontWeight: 600, fontSize: 11 }}
                >
                  {lang?.toUpperCase()}
                </Tag>
              ))
            )}
          </div>
        );
      },
    },
    {
      title: "Giọng gốc",
      dataIndex: "originalVoice",
      key: "originalVoice",
      hideInSearch: true,
      width: 150,
      render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : <span style={{ color: "#999" }}>—</span>),
    },
    {
      title: "Audio",
      dataIndex: "audios",
      key: "audioCount",
      hideInSearch: true,
      width: 90,
      render: (_: any, record: TTSAudioGroup) => (
        <Tag color={record.audios.length > 0 ? "green" : "default"}>
          {record.audios.length} audio{record.audios.length !== 1 ? "s" : ""}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      width: 160,
      render: (v: string) => new Date(v).toLocaleString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      hideInSearch: true,
      width: 280,
      fixed: "right" as const,
      render: (_: any, record: TTSAudioGroup) => (
        <Space size={4} wrap>
          {record.audios.map((audio) => (
            <Tooltip key={audio.id} title={`Phát ${LANGUAGE_LABELS[audio.languageCode] || audio.languageCode}`}>
              <Button
                type={playingAudioId === audio.id ? "primary" : "default"}
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlayAudio(audio.id)}
                style={{ padding: "0 6px", minWidth: 28 }}
              />
            </Tooltip>
          ))}
          <Tooltip title="Tạo/make audio đa ngôn ngữ">
            <Button
              type="default"
              icon={<GlobalOutlined />}
              size="small"
              loading={generatingGroupId === record.id}
              onClick={() => handleGenerateMultilingual(record.id)}
            />
          </Tooltip>
          <Tooltip title="Sửa thông tin nhóm (món, GPS, text gốc)">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => setEditGroupId(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa nhóm audio"
            description="Xóa nhóm sẽ xóa tất cả audio trong nhóm. Bạn có chắc?"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa nhóm">
              <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <EditTTSAudioGroupModal
        open={editGroupId != null}
        groupId={editGroupId}
        onCancel={() => setEditGroupId(null)}
        onSuccess={() => {
          setEditGroupId(null);
          actionRef.current?.reload();
        }}
      />
      <ProTable<TTSAudioGroup>
        headerTitle="Quản lý Nhóm Audio TTS"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          try {
            const response = await getTTSGroupsAPI(params.current || 1, params.pageSize || 10);
            // Unwrap: backend wraps in { data: { meta, result } }
            const data = response as any;
            if (data?.data?.meta && data?.data?.result) {
              return {
                data: data.data.result || [],
                success: true,
                total: data.data.meta.total || 0,
              };
            }
            if (data?.meta && data?.result) {
              return {
                data: data.result || [],
                success: true,
                total: data.meta.total || 0,
              };
            }
            return { data: [], success: false, total: 0 };
          } catch (error) {
            logger.error("Fetch TTS groups error:", error);
            message.error("Không thể tải danh sách nhóm audio");
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns as any}
        expandable={{
          expandedRowRender: (record: TTSAudioGroup) => (
            <div style={{ padding: "8px 0 16px 40px" }}>
              <div style={{ marginBottom: 12, fontWeight: 600, color: "#374151" }}>
                Chi tiết audio trong nhóm
              </div>
              {record.audios.length === 0 ? (
                <div style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>
                  Chưa có audio nào. Nhấn nút <GlobalOutlined /> để tạo audio đa ngôn ngữ.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {record.audios.map((audio) => (
                    <div
                      key={audio.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        background: "#fafafa",
                      }}
                    >
                      <Tag
                        color={LANGUAGE_COLORS[audio.languageCode] || "default"}
                        style={{ fontWeight: 700, fontSize: 12, minWidth: 36, textAlign: "center" }}
                      >
                        {(audio.languageCode || "").toUpperCase()}
                      </Tag>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {LANGUAGE_LABELS[audio.languageCode] || audio.languageCode}
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          {audio.fileSize > 0 ? `${(audio.fileSize / 1024).toFixed(1)} KB` : "—"}
                          {audio.s3Url && (
                            <span style={{ color: "#22c55e", marginLeft: 6 }}>✓ Đã lưu S3</span>
                          )}
                          {!audio.s3Url && (
                            <span style={{ color: "#f59e0b", marginLeft: 6 }}>⚠ Chưa lưu</span>
                          )}
                        </div>
                      </div>
                      <Space size={4}>
                        {audio.s3Url && (
                          <Tooltip title="Phát">
                            <Button
                              type={playingAudioId === audio.id ? "primary" : "default"}
                              icon={<PlayCircleOutlined />}
                              size="small"
                              onClick={() => handlePlayAudio(audio.id)}
                            />
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
          rowExpandable: () => true,
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(ROUTES.ADMIN.TTS_AUDIO)}
          >
            Tạo nhóm mới
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            Làm mới
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} nhóm`,
        }}
      />
    </div>
  );
};

export default TTSAudioGroupsPage;
