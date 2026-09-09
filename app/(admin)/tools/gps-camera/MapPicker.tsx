'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  lat: number;
  lon: number;
  onPick: (lat: number, lon: number) => void;
};

const PIN_HTML = `<div class="gpin"><div class="gpin-body"></div><div class="gpin-hole"></div><div class="gpin-dot"></div></div>`;

const pinIcon = L.divIcon({
  className: '',
  html: PIN_HTML,
  iconSize: [28, 40],
  iconAnchor: [14, 38],
});

export default function MapPicker({ lat, lon, onPick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!wrapRef.current || mapRef.current) return;

    const map = L.map(wrapRef.current, {
      center: [lat, lon],
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    });

    const roadmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    });

    satellite.addTo(map);
    L.control
      .layers(
        {
          Satellite: satellite,
          Map: roadmap,
        },
        {},
        { position: 'topright' },
      )
      .addTo(map);

    const marker = L.marker([lat, lon], { icon: pinIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const p = marker.getLatLng();
      onPickRef.current(p.lat, p.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 80);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (Math.abs(current.lat - lat) < 1e-7 && Math.abs(current.lng - lon) < 1e-7) return;
    marker.setLatLng([lat, lon]);
    map.setView([lat, lon], Math.max(map.getZoom(), 16), { animate: true });
  }, [lat, lon]);

  return <div ref={wrapRef} className="h-full w-full overflow-hidden rounded-xl" />;
}