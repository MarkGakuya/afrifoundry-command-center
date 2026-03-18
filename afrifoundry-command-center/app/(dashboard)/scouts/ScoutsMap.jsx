'use client';
import { useEffect, useRef, useState } from 'react';

const SCOUT_LOCATIONS = [
  { name: 'Kongowea Market', lat: -4.0222, lng: 39.6833, count: 1240, scout: 'Mark G.', status: 'active' },
  { name: 'Gikomba Market', lat: -1.2896, lng: 36.8425, count: 980, scout: 'James O.', status: 'active' },
  { name: 'Wakulima Market', lat: -1.2833, lng: 36.8219, count: 870, scout: 'James O.', status: 'active' },
  { name: 'Kibuye Market', lat: -0.0830, lng: 34.7510, count: 620, scout: 'Grace A.', status: 'active' },
  { name: 'Limuru', lat: -1.1000, lng: 36.6500, count: 380, scout: 'Faith W.', status: 'active' },
  { name: 'Nakuru Town', lat: -0.2827, lng: 36.0661, count: 290, scout: 'Peter K.', status: 'idle' },
  { name: 'Marikiti Market', lat: -4.0614, lng: 39.6636, count: 510, scout: 'Mark G.', status: 'active' },
  { name: 'Likoni', lat: -4.0834, lng: 39.6664, count: 240, scout: 'Mark G.', status: 'active' },
  { name: 'Eastleigh', lat: -1.2757, lng: 36.8534, count: 190, scout: 'Unassigned', status: 'gap' },
  { name: 'Eldoret', lat: 0.5143, lng: 35.2698, count: 0, scout: 'Unassigned', status: 'gap' },
  { name: 'Kisumu CBD', lat: -0.1022, lng: 34.7617, count: 140, scout: 'Grace A.', status: 'active' },
  { name: 'Nyeri', lat: -0.4167, lng: 36.9500, count: 0, scout: 'Unassigned', status: 'gap' },
];

const STATUS_COLOR = { active: '#00ff88', idle: '#ffaa00', gap: '#3f3f46' };

export default function ScoutsMap() {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl;

      const map = L.map(mapRef.current, {
        center: [-1.0, 37.5],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      leafletRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);

      SCOUT_LOCATIONS.forEach(loc => {
        const color = STATUS_COLOR[loc.status];
        const radius = loc.count > 0 ? Math.max(6, Math.min(18, 6 + Math.sqrt(loc.count) * 0.4)) : 5;

        // Glow ring
        L.circleMarker([loc.lat, loc.lng], {
          radius: radius + 5, fillColor: color, fillOpacity: 0.08,
          color: 'transparent', weight: 0,
        }).addTo(map);

        // Main dot
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius, fillColor: color, fillOpacity: loc.count > 0 ? 0.75 : 0.3,
          color: color, weight: 1.5, opacity: 0.8,
        }).addTo(map);

        circle.on('mouseover', function(e) {
          this.setStyle({ fillOpacity: 1, weight: 2 });
          const pt = map.latLngToContainerPoint([loc.lat, loc.lng]);
          setTooltip({ x: pt.x, y: pt.y, ...loc });
        });
        circle.on('mouseout', function() {
          this.setStyle({ fillOpacity: loc.count > 0 ? 0.75 : 0.3, weight: 1.5 });
          setTooltip(null);
        });
      });

      setReady(true);
    });

    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />

      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a2a', position: 'relative' }}>
        {!ready && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, border: '2px solid rgba(0,255,136,0.2)', borderTop: '2px solid #00ff88', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        <div ref={mapRef} style={{ height: 340, width: '100%', background: '#0d1117' }} />

        {tooltip && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, 400),
            top: Math.max(tooltip.y - 70, 8),
            zIndex: 1000, pointerEvents: 'none',
            background: 'rgba(14,14,14,0.96)',
            border: `1px solid ${STATUS_COLOR[tooltip.status]}40`,
            borderLeft: `3px solid ${STATUS_COLOR[tooltip.status]}`,
            borderRadius: 8, padding: '8px 12px', minWidth: 160,
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{tooltip.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: STATUS_COLOR[tooltip.status], marginBottom: 2 }}>
              {tooltip.count > 0 ? `${tooltip.count.toLocaleString()} datapoints` : 'No data yet'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>Scout: {tooltip.scout}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[
          { color: '#00ff88', label: 'Active scout' },
          { color: '#ffaa00', label: 'Idle scout' },
          { color: '#3f3f46', label: 'Coverage gap' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#71717a' }}>{l.label}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
