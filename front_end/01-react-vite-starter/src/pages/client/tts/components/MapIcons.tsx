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

export const createFoodIcon = (isSelected: boolean, label: string) => {
  return new DivIcon({
    className: "custom-food-marker",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: ${isSelected ? 20 : 16}px;
          height: ${isSelected ? 20 : 16}px;
          border-radius: 50%;
          background: ${isSelected ? "#ff6b35" : "#9ca3af"};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
        <div style="
          margin-top: 4px;
          padding: 2px 6px;
          background: ${isSelected ? "#ff6b35" : "#6b7280"};
          color: white;
          border-radius: 4px;
          font-size: 10px;
          font-weight: ${isSelected ? "bold" : "normal"};
          white-space: nowrap;
        ">${label}</div>
      </div>
    `,
    iconSize: [60, 40],
    iconAnchor: [30, 20],
  });
};
