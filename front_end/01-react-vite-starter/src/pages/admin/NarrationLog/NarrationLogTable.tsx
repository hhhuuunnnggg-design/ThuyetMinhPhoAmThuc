import { getNarrationLogsAPI, type NarrationLog } from "@/api/narrationLog.api";
import Restricted from "@/components/common/restricted";
import { logger } from "@/utils/logger";
import ProTable from "@ant-design/pro-table";
import { Button, message, Tag } from "antd";
import { useRef } from "react";

const NarrationLogTable = () => {
  const actionRef = useRef<any>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds == null) return "—";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusTag = (status: string | null | undefined) => {
    if (!status) return <Tag>—</Tag>;
    switch (status.toUpperCase()) {
      case "PLAYING":
        return <Tag color="processing">Đang phát</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn thành</Tag>;
      case "SKIPPED":
        return <Tag color="warning">Bỏ qua</Tag>;
      case "ERROR":
        return <Tag color="error">Lỗi</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
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
      title: "Device ID",
      dataIndex: "deviceId",
      key: "deviceId",
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{text}</span>
      ),
    },
    {
      title: "POI / Audio",
      dataIndex: "ttsAudioName",
      key: "ttsAudioName",
      width: 250,
      ellipsis: true,
      render: (_: any, record: NarrationLog) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.ttsAudioName}</div>
          <div style={{ fontSize: 12, color: "#888" }}>Audio ID: {record.ttsAudioId}</div>
        </div>
      ),
    },
    {
      title: "Thời gian phát",
      dataIndex: "playedAt",
      key: "playedAt",
      hideInSearch: true,
      width: 180,
      render: (_: any, record: NarrationLog) => formatDate(record.playedAt),
      sorter: true,
    },
    {
      title: "Thời lượng",
      dataIndex: "durationSeconds",
      key: "durationSeconds",
      hideInSearch: true,
      width: 120,
      render: (_: any, record: NarrationLog) => formatDuration(record.durationSeconds),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (_: any, record: NarrationLog) => getStatusTag(record.status),
    },
    {
      title: "Thời gian tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      hideInSearch: true,
      width: 180,
      render: (_: any, record: NarrationLog) => formatDate(record.createdAt),
      sorter: true,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Restricted
        permission="/api/v1/admin/narration-logs"
        method="GET"
        fallback={<div style={{ padding: 20 }}>Bạn không có quyền xem narration logs</div>}
      >
        <ProTable<NarrationLog>
          headerTitle="Quản lý Narration Logs"
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: "auto",
          }}
          request={async (params, sort) => {
            try {
              const response: any = await getNarrationLogsAPI(params.current || 1, params.pageSize || 10);

              logger.debug("Narration logs response:", response);

              // Response bị wrap trong RestResponse: { statusCode, error, message, data: { meta, result } }
              if (response?.data?.meta && response?.data?.result) {
                return {
                  data: Array.isArray(response.data.result) ? response.data.result : [],
                  success: true,
                  total: response.data.meta.total || 0,
                };
              }

              // Fallback
              if (response?.meta && response?.result) {
                return {
                  data: Array.isArray(response.result) ? response.result : [],
                  success: true,
                  total: response.meta.total || 0,
                };
              }

              logger.warn("Invalid response format:", response);
              return {
                data: [],
                success: false,
                total: 0,
              };
            } catch (error) {
              logger.error("Fetch narration logs error:", error);
              message.error("Không thể tải danh sách narration logs");
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          columns={columns as any}
          toolBarRender={() => [
            <Button key="refresh" onClick={() => actionRef.current?.reload()}>
              Làm mới
            </Button>,
          ]}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} log`,
          }}
        />
      </Restricted>
    </div>
  );
};

export default NarrationLogTable;
