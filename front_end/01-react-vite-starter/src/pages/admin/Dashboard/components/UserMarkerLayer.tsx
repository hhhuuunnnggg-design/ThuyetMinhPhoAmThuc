import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { ActiveNarration } from "@/api/app.api";

const LANGUAGE_COLORS: Record<string, string> = {
  vi: "#ff6b35",
  en: "#3b82f6",
  zh: "#ef4444",
  ja: "#ec4899",
  ko: "#8b5cf6",
  fr: "#10b981",
};

function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang?.toLowerCase()] ?? "#6b7280";
}

function buildUserIcon(lang: string, deviceId: string): L.DivIcon {
  const color = getLangColor(lang);
  const initials = (lang || "?").slice(0, 2).toUpperCase();
  const shortId = deviceId ? deviceId.slice(-4) : "????";

  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <!-- Pulse ring -->
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.25;
          animation:userPulse 1.8s ease-out infinite;
        "></div>
        <!-- Outer ring -->
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:${color};opacity:0.35;
          animation:userPulse 1.8s ease-out infinite;
          animation-delay:0.4s;
        "></div>
        <!-- Core -->
        <div style="
          position:absolute;inset:8px;border-radius:50%;
          background:${color};
          border:2.5px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:700;font-size:8px;letter-spacing:0.5px;
          flex-direction:column;line-height:1.1;
        ">
          <span>${initials}</span>
          <span style="font-size:6px;opacity:0.85">${shortId}</span>
        </div>
      </div>
      <style>
        @keyframes userPulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  });
}

function buildPopupHtml(n: ActiveNarration): string {
  const color = getLangColor(n.languageCode);
  const started = n.startedAt
    ? new Date(n.startedAt).toLocaleTimeString("vi-VN")
    : "—";
  const estimated = n.estimatedEndAt
    ? new Date(n.estimatedEndAt).toLocaleTimeString("vi-VN")
    : "—";
  const lat = n.latitude?.toFixed(5) ?? "—";
  const lng = n.longitude?.toFixed(5) ?? "—";

  return `
    <div style="
      min-width:200px;font-family:'Inter',sans-serif;font-size:13px;line-height:1.6;
    ">
      <div style="
        display:flex;align-items:center;gap:8px;
        margin-bottom:8px;padding-bottom:8px;
        border-bottom:1px solid #f0f0f0;
      ">
        <div style="
          width:10px;height:10px;border-radius:50%;
          background:${color};flex-shrink:0;
        "></div>
        <span style="font-weight:700;color:#1a1a1a">Người dùng mobile</span>
        <span style="
          margin-left:auto;padding:2px 7px;border-radius:99px;
          background:${color}20;color:${color};font-weight:700;font-size:11px;
        ">${(n.languageCode || "").toUpperCase()}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#888;padding:2px 0;white-space:nowrap">📱 Device</td>
          <td style="padding:2px 0 2px 8px;font-family:monospace;font-size:11px;color:#333;word-break:break-all">
            ${n.deviceId || "—"}
          </td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;white-space:nowrap">📍 POI</td>
          <td style="padding:2px 0 2px 8px;font-weight:600;color:#1a1a1a">${n.poiName || "—"}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;white-space:nowrap">🕐 Bắt đầu</td>
          <td style="padding:2px 0 2px 8px">${started}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;white-space:nowrap">⏱ Kết thúc</td>
          <td style="padding:2px 0 2px 8px">${estimated}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:2px 0;white-space:nowrap">🌐 Tọa độ</td>
          <td style="padding:2px 0 2px 8px;font-family:monospace;font-size:11px">${lat}, ${lng}</td>
        </tr>
      </table>
      <div style="
        margin-top:8px;padding:4px 8px;border-radius:6px;
        background:#22c55e15;color:#16a34a;font-size:11px;font-weight:600;
        display:flex;align-items:center;gap:4px;
      ">
        <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>
        ĐANG PHÁT
      </div>
    </div>
  `;
}

interface UserMarkerLayerProps {
  onlineDevices: {
    deviceId: string;
    lat: number;
    lng: number;
  }[];
}

function buildSimpleUserIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="position:relative;width:30px;height:30px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:#3b82f6;opacity:0.3;
          animation:userPulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:8px;border-radius:50%;
          background:#3b82f6;
          border:2px solid #fff;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
        "></div>
      </div>
      <style>
        @keyframes userPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      </style>
    `,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15], // Tâm nằm ở giữa thay vì gốc offset mặc định
  });
}

export const UserMarkerLayer = ({ onlineDevices }: UserMarkerLayerProps) => {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const incoming = onlineDevices.filter((d) => d.lat != null && d.lng != null);
    const incomingIds = new Set(incoming.map((d) => d.deviceId));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    incoming.forEach((d) => {
      // Offset marker một xíu xíu (random nhiễu) để nếu nhiều thiết bị trùng vị trí 100% thì mờ mờ thấy nhiều chấm
      const noiseLat = (Math.random() - 0.5) * 0.0001;
      const noiseLng = (Math.random() - 0.5) * 0.0001;
      const latlng: [number, number] = [d.lat! + noiseLat, d.lng! + noiseLng];

      if (markersRef.current.has(d.deviceId)) {
        const existing = markersRef.current.get(d.deviceId)!;
        existing.setLatLng(latlng);
      } else {
        const icon = buildSimpleUserIcon();
        const marker = L.marker(latlng, { icon })
          .bindPopup(`<b>📱 Thiết bị:</b> <span style="font-family:monospace">${d.deviceId.slice(-6)}...</span></br><span style="color:#22c55e;font-size:11px">Đang mở app</span>`)
          .addTo(map);
        markersRef.current.set(d.deviceId, marker);
      }
    });
  }, [map, onlineDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current.clear();
    };
  }, [map]);

  return null;
};
