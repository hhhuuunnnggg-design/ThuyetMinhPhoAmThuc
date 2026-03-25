import { Button } from "antd";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Map } from "leaflet";
import React, { useEffect, useState } from "react";
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
  /** Tập hợp POI đang có người nghe */
  activePOIIds?: Set<number>;
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
  activePOIIds = new Set(),
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
            const isPlaying = activePOIIds.has(audio.id);
            const radius = audio.triggerRadiusMeters ?? audio.accuracy ?? 30;

            return (
              <React.Fragment key={audio.id}>
                <Circle
                  center={[audio.latitude!, audio.longitude!]}
                  radius={radius}
                  pathOptions={{
                    color: isPlaying ? "#22c55e" : isSelected ? "#ff6b35" : "#9ca3af",
                    fillColor: isPlaying ? "#22c55e" : isSelected ? "#ff6b35" : "#9ca3af",
                    fillOpacity: isPlaying ? 0.2 : 0.1,
                    weight: isPlaying ? 3 : 2,
                    dashArray: isPlaying ? undefined : "5, 5",
                  }}
                />
                <Marker
                  position={[audio.latitude!, audio.longitude!]}
                  icon={createFoodIcon(isSelected, audio.foodName || "Food", isPlaying)}
                  eventHandlers={{
                    click: () => {
                      onMarkerClick(audio.id);
                    },
                    mouseover: (e) => {
                      e.target.getElement()?.setAttribute("title", audio.foodName || "Food");
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
