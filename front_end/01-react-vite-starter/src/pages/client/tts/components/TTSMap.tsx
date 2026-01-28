import { Button } from "antd";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Map } from "leaflet";
import React from "react";
import type { TTSAudio } from "@/api/tts.api";
import { GeoPosition } from "../types";
import { MapCenter } from "./MapCenter";
import { createUserIcon, createFoodIcon } from "./MapIcons";

interface TTSMapProps {
  center: GeoPosition;
  position: GeoPosition | null;
  audios: TTSAudio[];
  selected: TTSAudio | null;
  onMarkerDrag: (lat: number, lng: number) => void;
  onMarkerClick: (id: number) => void;
  mapRef: React.MutableRefObject<Map | null>;
  hasManualPanRef: React.MutableRefObject<boolean>;
}

export const TTSMap = ({
  center,
  position,
  audios,
  selected,
  onMarkerDrag,
  onMarkerClick,
  mapRef,
  hasManualPanRef,
}: TTSMapProps) => {
  return (
    <div className="gps-map-frame">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={18}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenter
          position={position}
          hasManualPan={hasManualPanRef.current}
          onMapReady={(map) => {
            mapRef.current = map;
          }}
          onDragStart={() => {
            hasManualPanRef.current = true;
          }}
        />

        {/* User location marker */}
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={createUserIcon()}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const newPos = marker.getLatLng();
                onMarkerDrag(newPos.lat, newPos.lng);
              },
            }}
          />
        )}

        {/* Food markers and circles */}
        {audios
          .filter((a) => a.latitude != null && a.longitude != null)
          .map((audio) => {
            const isSelected = audio.id === selected?.id;
            const radius = audio.accuracy ?? 30;
            const label = audio.foodName
              ? audio.foodName.split(" ")[0].substring(0, 4)
              : "Food";

            return (
              <React.Fragment key={audio.id}>
                <Circle
                  center={[audio.latitude!, audio.longitude!]}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? "#ff6b35" : "#9ca3af",
                    fillColor: isSelected ? "#ff6b35" : "#9ca3af",
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: "5, 5",
                  }}
                />
                <Marker
                  position={[audio.latitude!, audio.longitude!]}
                  icon={createFoodIcon(isSelected, label)}
                  eventHandlers={{
                    click: () => {
                      onMarkerClick(audio.id);
                    },
                  }}
                />
              </React.Fragment>
            );
          })}
      </MapContainer>
      <div className="map-controls">
        <Button
          size="small"
          onClick={() => {
            if (mapRef.current && position) {
              mapRef.current.setView([position.lat, position.lng], mapRef.current.getZoom(), {
                animate: true,
              });
              hasManualPanRef.current = false;
            }
          }}
          title="Reset view"
        >
          ⟲
        </Button>
      </div>
    </div>
  );
};
