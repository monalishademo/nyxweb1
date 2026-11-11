'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  lat: number;
  lon: number;
  onPick: (lat: number, lon: number) => void;
};

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46"><path d="M17 45C17 45 2 27 2 16.5C2 8 8.7 1.5 17 1.5S32 8 32 16.5C32 27 17 45 17 45Z" fill="#ea4335" stroke="#b3201a" stroke-width="2"/><circle cx="17" cy="16.5" r="6" fill="#fff"/></svg>`;

export default function MapPicker({ lat, lon, onPick }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Create the map once
  useEffect(() => {
    const el = elRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [lat, lon],
      zoom: 15,
      maxZoom: 22,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    const google = (lyrs: string, name: string) =>
      L.tileLayer(`https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`, {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 22,
        maxNativeZoom: 20,
        attribution: `${name} © Google`,
      });

    const hybrid = google('y', 'Hybrid');
    const satellite = google('s', 'Satellite');
    const road = google('m', 'Map');
    const esri = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 22, maxNativeZoom: 18, attribution: 'Tiles © Esri' }
    );
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      maxNativeZoom: 19,
      attribution: '© OpenStreetMap contributors',
    });

    hybrid.addTo(map);

    L.control
      .layers(
        {
          'Hybrid (Satellite + Labels)': hybrid,
          Satellite: satellite,
          Map: road,
          'Esri Satellite': esri,
          OpenStreetMap: osm,
        },
        {},
        { position: 'topright' }
      )
      .addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    // If Google tiles keep failing (blocked / offline), switch to Esri automatically
    let tileErrors = 0;
    hybrid.on('tileerror', () => {
      tileErrors += 1;
      if (tileErrors === 8 && map.hasLayer(hybrid)) {
        map.removeLayer(hybrid);
        esri.addTo(map);
      }
    });

    // Draggable pin
    const marker = L.marker([lat, lon], {
      draggable: true,
      icon: L.divIcon({
        html: PIN_SVG,
        className: '',
        iconSize: [34, 46],
        iconAnchor: [17, 45],
      }),
    }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const p = map.wrapLatLng(marker.getLatLng());
      marker.setLatLng(p);
      onPickRef.current(p.lat, p.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const p = map.wrapLatLng(e.latlng);
      marker.setLatLng(p);
      onPickRef.current(p.lat, p.lng);
    });

    // "My location" button
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Locate = (L.Control as any).extend({
      onAdd() {
        const btn = L.DomUtil.create('button', 'leaflet-bar');
        btn.type = 'button';
        btn.title = 'Go to my location';
        btn.innerHTML = '◎';
        btn.style.cssText =
          'width:30px;height:30px;background:#fff;color:#111;font-size:18px;line-height:28px;cursor:pointer;border:2px solid rgba(0,0,0,.2);border-radius:4px;';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              marker.setLatLng([latitude, longitude]);
              map.flyTo([latitude, longitude], 17);
              onPickRef.current(latitude, longitude);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
        return btn;
      },
    });
    new Locate({ position: 'topleft' }).addTo(map);

    // Keep the map correct when its box changes size
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move pin + map when lat/lon change from outside (search result)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const cur = marker.getLatLng();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lon) < 1e-7) return;
    marker.setLatLng([lat, lon]);
    map.flyTo([lat, lon], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [lat, lon]);

  return <div ref={elRef} className="h-full w-full bg-slate-900" style={{ minHeight: 300 }} />;
}