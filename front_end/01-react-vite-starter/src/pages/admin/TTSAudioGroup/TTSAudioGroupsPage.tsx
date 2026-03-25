import {
  deleteTTSGroupAPI,
  generateMultilingualForGroupAPI,
  getGroupAudioAPI,
  getTTSGroupsAPI,
  type AudioData,
  type TTSAudioGroup,
} from "@/api/tts.api";
import { config } from "@/config";
import { API_ENDPOINTS, ROUTES } from "@/constants";
import CreateTTSAudioModal from "@/pages/admin/TTSAudio/CreateTTSAudioModal";
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
import { Alert, Button, message, Popconfirm, Space, Tag, Tooltip } from "antd";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Vietnamese",
  en: "English",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
};

const TTSAudioGroupsPage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generatingGroupId, setGeneratingGroupId] = useState<number | null>(null);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
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

  const handlePlayAudio = (groupKey: string, lang: string) => {
    const url = `${config.api.baseURL}${API_ENDPOINTS.TTS.GROUP_AUDIO(groupKey, lang)}`;
    const audio = new Audio(url);
    audio.play().catch(() => message.error("Không thể phát audio"));
    setPlayingAudioKey(`${groupKey}:${lang}`);
    audio.onended = () => setPlayingAudioKey(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

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
      title: "Nhóm / POI",
      dataIndex: "poiId",
      key: "poiId",
      width: 280,
      render: (_: any, record: TTSAudioGroup) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>POI #{record.poiId ?? "—"}</span>
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
      title: "Người tạo",
      dataIndex: "userEmail",
      key: "userEmail",
      hideInSearch: true,
      width: 180,
      render: (v: string | null | undefined) =>
        v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: "#999" }}>—</span>,
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "audioMap",
      key: "languages",
      hideInSearch: true,
      width: 200,
      render: (_: any, record: TTSAudioGroup) => {
        const langs = Object.keys(record.audioMap || {});
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
                  {(lang || "").toUpperCase()}
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
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      width: 160,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Thao tác",
      key: "actions",
      hideInSearch: true,
      width: 280,
      fixed: "right" as const,
      render: (_: any, record: TTSAudioGroup) => (
        <Space size={4} wrap>
          {/* Nút phát cho từng ngôn ngữ trong audioMap */}
          {Object.entries(record.audioMap || {}).map(([lang, audio]) => (
            <Tooltip key={lang} title={`Phát ${LANGUAGE_LABELS[lang] || lang}`}>
              <Button
                type={playingAudioKey === `${record.groupKey}:${lang}` ? "primary" : "default"}
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlayAudio(record.groupKey, lang)}
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
          <Tooltip title="Sửa text/giọng nhóm (thông tin ẩm thực ở POI)">
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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Nhóm thuyết minh TTS (audio đa ngôn ngữ)"
        description={
          <>
            Tạo/sửa <strong>audio đa ngôn ngữ</strong> tại đây. Mỗi nhóm gắn với một <strong>POI</strong> đã tạo trước.
            Thông tin ẩm thực (tên món, giá, mô tả, ảnh) nằm ở{" "}
            <Link to={ROUTES.ADMIN.POIS}>POI</Link>.
          </>
        }
      />
      <CreateTTSAudioModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          actionRef.current?.reload();
        }}
      />
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
        headerTitle="Nhóm thuyết minh TTS — món, GPS, audio đa ngôn ngữ"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: "auto" }}
        request={async (params) => {
          try {
            const response: any = await getTTSGroupsAPI(params.current || 1, params.pageSize || 10);
            if (response?.data?.meta && response?.data?.result) {
              return {
                data: response.data.result || [],
                success: true,
                total: response.data.meta.total || 0,
              };
            }
            if (response?.meta && response?.result) {
              return {
                data: response.result || [],
                success: true,
                total: response.meta.total || 0,
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
              {Object.keys(record.audioMap || {}).length === 0 ? (
                <div style={{ color: "#999", fontSize: 13, fontStyle: "italic" }}>
                  Chưa có audio nào. Nhấn nút <GlobalOutlined /> để tạo audio đa ngôn ngữ.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {Object.entries(record.audioMap).map(([lang, audio]: [string, AudioData]) => (
                    <div
                      key={lang}
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
                        color={LANGUAGE_COLORS[lang] || "default"}
                        style={{ fontWeight: 700, fontSize: 12, minWidth: 36, textAlign: "center" }}
                      >
                        {(lang || "").toUpperCase()}
                      </Tag>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {LANGUAGE_LABELS[lang] || lang}
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          {audio.fileSize > 0 ? `${formatFileSize(audio.fileSize)}` : "—"}
                          {audio.s3Url && (
                            <span style={{ color: "#22c55e", marginLeft: 6 }}>✓ Đã lưu</span>
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
                              type={playingAudioKey === `${record.groupKey}:${lang}` ? "primary" : "default"}
                              icon={<PlayCircleOutlined />}
                              size="small"
                              onClick={() => handlePlayAudio(record.groupKey, lang)}
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
            onClick={() => setCreateModalOpen(true)}
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
