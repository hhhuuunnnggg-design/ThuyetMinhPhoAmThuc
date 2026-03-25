import { DivIcon } from "leaflet";

export const createUserIcon = () => {
  return new DivIcon({
    className: "custom-user-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid white;
          "></div>
        </div>
        <div style="
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 12px solid #2563eb;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

/**
 * Tạo icon marker cho POI trên bản đồ.
 * isSelected: POI đang được chọn
 * isPlaying: POI đang có người nghe (hiển thị animation)
 * label: tên POI
 */
export const createFoodIcon = (
  isSelected: boolean,
  label: string,
  isPlaying = false
) => {
  const baseColor = isPlaying ? "#22c55e" : isSelected ? "#ff6b35" : "#9ca3af";
  const glowStyle = isPlaying
    ? `
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    animation: pulse-green 1.5s infinite;
  `
    : "";

  return new DivIcon({
    className: "custom-food-marker",
    html: `
      <style>
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes playing-wave {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      </style>
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        ${isPlaying ? `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: playing-wave 1.5s infinite;
          margin-bottom: 2px;
        ">
          <span style="font-size: 16px;">🔊</span>
        </div>
        ` : `
        <div style="
          width: ${isSelected ? 16 : 12}px;
          height: ${isSelected ? 16 : 12}px;
          border-radius: 50%;
          background: ${baseColor};
          border: 2px solid white;
          ${glowStyle}
          transition: all 0.3s;
        "></div>
        `}
        <div style="
          margin-top: 4px;
          padding: 2px 8px;
          background: ${baseColor};
          color: white;
          border-radius: 6px;
          font-size: 11px;
          font-weight: ${isSelected ? "bold" : "normal"};
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${label}</div>
        ${isPlaying ? `<div style="
          font-size: 10px;
          color: #22c55e;
          font-weight: 700;
          margin-top: 2px;
        ">● LIVE</div>` : ""}
      </div>
    `,
    iconSize: [140, isPlaying ? 64 : 44],
    iconAnchor: [70, isPlaying ? 32 : 22],
  });
};
