import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Incident, Ambulance, Hospital, RoadSegment } from '../types';

interface EmergencyMapProps {
  incidents: Incident[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  roads?: RoadSegment[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// Custom Leaflet DivIcons using inline HTML & Tailwind styles
const createCustomIcon = (type: 'incident' | 'ambulance' | 'hospital', label: string, status?: string) => {
  let bgClass = 'bg-cyan-500 text-black';
  let borderClass = 'border-cyan-300';
  let pulse = '';

  if (type === 'incident') {
    bgClass = status === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black';
    borderClass = 'border-white';
    pulse = 'animate-ping';
  } else if (type === 'ambulance') {
    bgClass = status === 'AVAILABLE' ? 'bg-emerald-500 text-black' : 'bg-blue-600 text-white';
    borderClass = 'border-gray-200';
  } else if (type === 'hospital') {
    bgClass = 'bg-indigo-600 text-white';
    borderClass = 'border-indigo-300';
  }

  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-7 h-7 rounded-full ${bgClass} border-2 ${borderClass} flex items-center justify-center text-[10px] font-black shadow-lg shadow-black/60">
        ${label}
      </div>
      ${type === 'incident' ? `<div class="absolute -inset-1 rounded-full bg-red-500 opacity-75 ${pulse}"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  incidents,
  ambulances,
  hospitals,
  roads = [],
  selectedIncidentId,
  onSelectIncident,
  center = [13.6288, 79.4192],
  zoom = 13,
  height = '420px',
}) => {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#1F293D] relative bg-[#070B14] shadow-inner" style={{ height }}>
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-[#0B0F19]/90 backdrop-blur border border-[#1F293D] p-2.5 rounded-lg text-[10px] space-y-1.5 shadow-xl select-none">
        <div className="font-bold text-gray-300 uppercase tracking-wider mb-1 font-mono">Emergency GIS Overlay</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-600 border border-white inline-block"></span>
          <span className="text-gray-300">Active Incident (Casualties)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600 border border-indigo-300 inline-block"></span>
          <span className="text-gray-300">Hospital (Trauma & ICU)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
          <span className="text-gray-300">Ambulance (Available)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-4 h-1 bg-red-500 inline-block border-b border-dashed border-red-200"></span>
          <span className="text-gray-300">Blocked / Severe Corridor</span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        {/* Road Segments */}
        {roads.map((road) => {
          const isBlocked = road.blocked || road.traffic_level === 'SEVERE';
          return (
            <Polyline
              key={road.road_id}
              positions={[
                [road.start_lat, road.start_lng],
                [road.end_lat, road.end_lng],
              ]}
              pathOptions={{
                color: isBlocked ? '#EF4444' : '#3B82F6',
                weight: isBlocked ? 4 : 2,
                dashArray: isBlocked ? '6, 6' : undefined,
                opacity: isBlocked ? 0.9 : 0.4,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="font-bold text-gray-200">{road.road_name}</div>
                  <div className="text-gray-400">{road.source_location} ➔ {road.destination_location}</div>
                  <div className={`mt-1 font-semibold ${isBlocked ? 'text-red-400' : 'text-blue-400'}`}>
                    {isBlocked ? '⚠️ BLOCKED / SEVERE TRAFFIC' : `Traffic: ${road.traffic_level}`}
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Hospital Markers */}
        {hospitals.slice(0, 30).map((hosp) => (
          <Marker
            key={hosp.hospital_id}
            position={[hosp.latitude, hosp.longitude]}
            icon={createCustomIcon('hospital', 'H')}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-cyan-300">{hosp.name}</div>
                <div className="text-[11px] text-gray-400 font-mono">{hosp.emergency_level} • {hosp.hospital_type.replace(/_/g, ' ')}</div>
                <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-gray-700 font-mono">
                  <div className="bg-gray-800 p-1 rounded">
                    <span className="text-gray-400 block text-[9px]">ICU BEDS</span>
                    <span className="text-cyan-400 font-bold">{hosp.icu_available} / {hosp.icu_total}</span>
                  </div>
                  <div className="bg-gray-800 p-1 rounded">
                    <span className="text-gray-400 block text-[9px]">EMERGENCY</span>
                    <span className="text-emerald-400 font-bold">{hosp.emergency_beds_available} / {hosp.emergency_beds_total}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ambulance Markers */}
        {ambulances.slice(0, 25).map((amb) => (
          <Marker
            key={amb.ambulance_id}
            position={[amb.latitude, amb.longitude]}
            icon={createCustomIcon('ambulance', 'A', amb.current_status)}
          >
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-gray-100">{amb.registration_number}</div>
                <div className="text-gray-400 font-mono">{amb.ambulance_type} Unit</div>
                <div className="mt-1 font-semibold text-emerald-400">Status: {amb.current_status}</div>
                {amb.speed > 0 && <div className="text-[10px] text-gray-400">Speed: {amb.speed} km/h</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Markers */}
        {incidents.map((inc) => (
          <Marker
            key={inc.incident_id}
            position={[inc.latitude, inc.longitude]}
            icon={createCustomIcon('incident', '!', inc.severity)}
            eventHandlers={{
              click: () => onSelectIncident && onSelectIncident(inc.incident_id),
            }}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-600/40">
                    {inc.severity}
                  </span>
                  <span className="font-bold text-gray-200">{inc.incident_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-gray-400">{inc.description}</div>
                <div className="text-[11px] text-amber-300 font-mono">
                  📍 {inc.location_name} • {inc.estimated_patient_count} Casualties
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
