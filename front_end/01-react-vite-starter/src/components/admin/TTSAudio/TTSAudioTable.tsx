import { deleteTTSAudioAPI, getTTSAudiosAPI, type TTSAudio } from "@/api/tts.api";
import Restricted from "@/components/common/restricted";
import { config } from "@/config";
import { API_ENDPOINTS } from "@/constants";
import { logger } from "@/utils/logger";
import { DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined } from "@ant-design/icons";
import ProTable from "@ant-design/pro-table";
import { Button, message, Popconfirm, Space, Tag, Tooltip } from "antd";
import { useRef, useState } from "react";
import CreateTTSAudioModal from "./CreateTTSAudioModal";
import EditTTSAudioModal from "./EditTTSAudioModal";

const TTSAudioTable = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAudio, setEditingAudio] = useState<TTSAudio | null>(null);
  const actionRef = useRef<any>();

  const handleEdit = (record: TTSAudio) => {
    setEditingAudio(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTTSAudioAPI(id);
      message.success("Xóa audio thành công!");
      actionRef.current?.reload();
    } catch (error: any) {
      message.error("Xóa audio thất bại: " + (error?.message || "Lỗi không xác định"));
      logger.error("Delete TTS audio error:", error);
    }
  };

  const handlePlayAudio = (record: TTSAudio) => {
    // Luôn sử dụng endpoint backend để tránh Access Denied từ S3
    // Backend sẽ lấy file từ S3 và serve trực tiếp (không cần public access)
    const downloadUrl = `${config.api.baseURL}${API_ENDPOINTS.TTS.AUDIO_DOWNLOAD(record.id)}`;
    window.open(downloadUrl, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
      width: 80,
    },
    {
      title: "Text",
      dataIndex: "text",
      key: "text",
      ellipsis: true,
      width: 300,
      render: (_: any, record: TTSAudio) => (
        <Tooltip title={record.text}>
          <span>{record.text.length > 50 ? record.text.substring(0, 50) + "..." : record.text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Voice",
      dataIndex: "voice",
      key: "voice",
      width: 150,
      render: (_: any, record: TTSAudio) => <Tag color="blue">{record.voice}</Tag>,
    },
    {
      title: "Speed",
      dataIndex: "speed",
      key: "speed",
      hideInSearch: true,
      width: 100,
      render: (_: any, record: TTSAudio) => record.speed.toFixed(1),
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      hideInSearch: true,
      width: 100,
      render: (_: any, record: TTSAudio) => (
        <Tag color={record.format === 2 ? "green" : "orange"}>{record.format === 2 ? "WAV" : "MP3"}</Tag>
      ),
    },
    {
      title: "File Size",
      dataIndex: "fileSize",
      key: "fileSize",
      hideInSearch: true,
      width: 120,
      render: (_: any, record: TTSAudio) => formatFileSize(record.fileSize),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 150,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      width: 180,
      render: (_: any, record: TTSAudio) => formatDate(record.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      hideInSearch: true,
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: TTSAudio) => (
        <Space>
          <Tooltip title={record.s3Url ? "Phát audio từ S3" : "Phát audio (regenerate)"}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handlePlayAudio(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa audio"
            description="Bạn có chắc chắn muốn xóa audio này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Restricted
        permission="/api/v1/tts/audios"
        method="GET"
        fallback={<div style={{ padding: 20 }}>Bạn không có quyền xem danh sách TTS audios</div>}
      >
        <ProTable<TTSAudio>
          headerTitle="Quản lý TTS Audios"
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: "auto",
          }}
          request={async (params) => {
            try {
              const response: any = await getTTSAudiosAPI(params.current || 1, params.pageSize || 10);
              
              logger.debug("TTS Audios response:", response);
              logger.debug("Response type:", typeof response);
              logger.debug("Response keys:", response ? Object.keys(response) : "null");
              
              // Response bị wrap trong RestResponse: { statusCode, error, message, data: { meta, result } }
              // Axios interceptor đã unwrap response.data, nên response chính là RestResponse<IModelPaginate<TTSAudio>>
              
              // Kiểm tra nếu bị wrap trong RestResponse (có data field chứa IModelPaginate)
              if (response?.data?.meta && response?.data?.result) {
                return {
                  data: Array.isArray(response.data.result) ? response.data.result : [],
                  success: true,
                  total: response.data.meta.total || 0,
                };
              }
              
              // Kiểm tra nếu response có meta và result trực tiếp (fallback)
              if (response?.meta && response?.result) {
                return {
                  data: Array.isArray(response.result) ? response.result : [],
                  success: true,
                  total: response.meta.total || 0,
                };
              }
              
              logger.warn("Invalid response format:", response);
              logger.warn("Expected format: { meta: {...}, result: [...] } or { data: { meta: {...}, result: [...] } }");
              return {
                data: [],
                success: false,
                total: 0,
              };
            } catch (error) {
              logger.error("Fetch TTS audios error:", error);
              message.error("Không thể tải danh sách TTS audios");
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          columns={columns as any}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Tạo mới
            </Button>,
            <Button key="refresh" onClick={() => actionRef.current?.reload()}>
              Làm mới
            </Button>,
          ]}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} audio`,
          }}
        />
      </Restricted>

      <CreateTTSAudioModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          actionRef.current?.reload();
        }}
      />

      {editingAudio && (
        <EditTTSAudioModal
          open={isEditModalOpen}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingAudio(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingAudio(null);
            actionRef.current?.reload();
          }}
          audio={editingAudio}
        />
      )}
    </div>
  );
};

export default TTSAudioTable;
