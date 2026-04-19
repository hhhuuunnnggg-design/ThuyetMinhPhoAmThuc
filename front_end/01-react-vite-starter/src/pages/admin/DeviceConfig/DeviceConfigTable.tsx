import { getDeviceConfigsAPI, getActiveDeviceConfigCountAPI } from "@/api/deviceConfig.api";
import { logger } from "@/utils/logger";
import ProTable from "@ant-design/pro-table";
import { Button, Tag } from "antd";
import { useEffect, useRef, useState } from "react";

export interface DeviceConfig {
  id: number;
  deviceId: string;
  osVersion: string;
  appVersion: string;
  ramMB: number;
  storageFreeMB: number;
  networkType: string;
  offlineModeEnabled: boolean;
  totalDownloadedMB: number;
  lastLat: number;
  lastLng: number;
  lastSeenAt: string;
  runningMode: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const DeviceConfigTable = () => {
  const actionRef = useRef<any>();
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res: any = await getActiveDeviceConfigCountAPI();
        if (res && res.data !== undefined) {
          setActiveCount(res.data);
        }
      } catch (e) {
        logger.error("Fetch count err", e);
      }
    };
    fetchCount();

    // 5 seconds refresh
    const interval = setInterval(() => {
      if (actionRef.current) {
        actionRef.current.reload();
      }
      fetchCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getRunningModeTag = (mode: string) => {
    if (!mode) return <Tag>—</Tag>;
    if (mode === "OFFLINE") {
      return <Tag color="success">Offline (Local)</Tag>;
    }
    if (mode === "STREAMING") {
      return <Tag color="warning">Streaming</Tag>;
    }
    return <Tag>{mode}</Tag>;
  };

  const formatMB = (mb: number | null | undefined) => {
    if (mb == null) return "—";
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb} MB`;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      hideInSearch: true,
      width: 60,
    },
    {
      title: "Mã Thiết Bị",
      dataIndex: "deviceId",
      key: "deviceId",
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{text}</span>
      ),
    },
    {
      title: "Hệ Điều Hành",
      dataIndex: "osVersion",
      key: "osVersion",
      width: 120,
      render: (text: string) => text || "—",
    },
    {
      title: "Bản App",
      dataIndex: "appVersion",
      key: "appVersion",
      width: 80,
      hideInSearch: true,
      render: (text: string) => text || "—",
    },
    {
      title: "Cấu hình",
      key: "hardware",
      hideInSearch: true,
      width: 150,
      render: (_: any, record: DeviceConfig) => (
        <div style={{ fontSize: 13 }}>
          <div>RAM: <b>{formatMB(record.ramMB)}</b></div>
          <div>Trống: <b>{formatMB(record.storageFreeMB)}</b></div>
        </div>
      ),
    },
    {
      title: "Mạng",
      dataIndex: "networkType",
      key: "networkType",
      hideInSearch: true,
      width: 100,
      render: (text: string) => {
        if (!text) return "—";
        let color = "default";
        if (text.includes("WIFI")) color = "blue";
        if (text.includes("5G")) color = "purple";
        if (text.includes("4G")) color = "cyan";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Chế Độ Chạy",
      dataIndex: "runningMode",
      key: "runningMode",
      width: 120,
      render: (_: any, record: DeviceConfig) => getRunningModeTag(record.runningMode),
    },
    {
      title: "Vị Trí Cuối",
      key: "location",
      hideInSearch: true,
      width: 160,
      render: (_: any, record: DeviceConfig) => {
        if (!record.lastLat || !record.lastLng) return "—";
        return (
          <div style={{ fontSize: 12 }}>
            Lat: {record.lastLat.toFixed(5)}<br/>Lng: {record.lastLng.toFixed(5)}
          </div>
        )
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (_: any, record: DeviceConfig) => {
        return record.isActive ? (
          <Tag color="success">Đang hoạt động</Tag>
        ) : (
          <Tag color="error">Ngừng hoạt động</Tag>
        );
      },
    },
    {
      title: "Cập nhật lúc",
      dataIndex: "lastSeenAt",
      key: "lastSeenAt",
      hideInSearch: true,
      width: 160,
      render: (_: any, record: DeviceConfig) => formatDate(record.lastSeenAt || record.createdAt),
      sorter: true,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<DeviceConfig>
        headerTitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Theo Dõi Cấu Hình Thiết Bị (Cập nhật 5s/lần)</span>
            <Tag color="#108ee9" style={{ fontSize: 13, padding: '2px 8px' }}>
              Đang hoạt động: {activeCount}
            </Tag>
          </div>
        }
        actionRef={actionRef}
        rowKey="id"
        search={false} // Disable search params for simplicity right now
        request={async (params, _sort) => {
          try {
            const response: any = await getDeviceConfigsAPI(params.current || 1, params.pageSize || 10);
            
            if (response?.data?.meta && response?.data?.result) {
              return {
                data: Array.isArray(response.data.result) ? response.data.result : [],
                success: true,
                total: response.data.meta.total || 0,
              };
            }

            if (response?.meta && response?.result) {
              return {
                data: Array.isArray(response.result) ? response.result : [],
                success: true,
                total: response.meta.total || 0,
              };
            }

            return { data: [], success: false, total: 0 };
          } catch (error) {
            logger.error("Fetch device configs error:", error);
            // Don't show toast on 5s refresh fail to avoid annoying user
            return { data: [], success: false, total: 0 };
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
          showTotal: (total) => `Tổng ${total} máy`,
        }}
      />
    </div>
  );
};

export default DeviceConfigTable;
