import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Incident, Shelter, FleetUnit, Sensor, WeatherStation } from "../types";

interface RecifeMapProps {
  incidents: Incident[];
  shelters: Shelter[];
  fleet: FleetUnit[];
  sensors: Sensor[];
  stations: WeatherStation[];
  selectedNeighborhood: string | null;
  onSelectNeighborhood: (neighborhood: string | null) => void;
  activeLayer: "all" | "flood" | "slide" | "assets";
  theme?: "light" | "dark";
}

// Coordinate mapping for Recife neighborhoods
const neighborhoodCoords: Record<string, [number, number]> = {
  "Bairro do Recife": [-8.0631, -34.8711],
  "Santo Amaro": [-8.0515, -34.8790],
  "Santo Antônio": [-8.0645, -34.8785],
  "Arruda": [-8.0260, -34.8960],
  "Beberibe": [-8.0167, -34.8889],
  "Cajueiro": [-8.0245, -34.8820],
  "Dois Unidos": [-8.0150, -34.9120],
  "Casa Amarela": [-8.0240, -34.9100],
  "Graças": [-8.0450, -34.8950],
  "Vasco da Gama": [-8.0290, -34.9200],
  "Iputinga": [-8.0350, -34.9380],
  "Cordeiro": [-8.0480, -34.9250],
  "Areias": [-8.0780, -34.9220],
  "San Martin": [-8.0690, -34.9180],
  "Sancho": [-8.0850, -34.9450],
  "Boa Viagem": [-8.1180, -34.9040],
  "Imbiribeira": [-8.0980, -34.9060],
  "Ibura": [-8.1250, -34.9450],
  "Coqueiral": [-8.0833, -34.9351]
};

// Sensors coordinates assignment
const sensorCoords: Record<string, [number, number]> = {
  "sens-001": [-8.0583, -34.8878], // Capibaribe
  "sens-002": [-8.0167, -34.8889], // Beberibe
  "sens-003": [-8.0833, -34.9351], // Tejipió
  "sens-004": [-8.0526, -34.8856]  // Canal Agamenon
};

// Weather stations coordinates assignment
const stationCoords: Record<string, [number, number]> = {
  "sta-001": [-8.0631, -34.8711], // Recife Antigo
  "sta-002": [-8.1250, -34.9450], // Ibura
  "sta-003": [-8.0150, -34.9120], // Dois Unidos
  "sta-004": [-8.0260, -34.8960], // Arruda
  "sta-005": [-8.1180, -34.9040], // Boa Viagem
};

// Custom Styles Injection to make Leaflet fit into theme beautifully
const LeafletStyles = ({ theme }: { theme: "light" | "dark" }) => {
  const isDark = theme === "dark";
  return (
    <style>{`
      .leaflet-container {
        background: ${isDark ? "#0c0d12" : "#f1f5f9"} !important;
        font-family: inherit;
      }
      .leaflet-bar {
        border: 1px solid ${isDark ? "rgba(139, 92, 246, 0.2)" : "#cbd5e1"} !important;
        border-radius: 4px !important;
        box-shadow: none !important;
        overflow: hidden;
      }
      .leaflet-bar a {
        background-color: ${isDark ? "#0c022e" : "#ffffff"} !important;
        color: ${isDark ? "#a78bfa" : "#334155"} !important;
        border-bottom: 1px solid ${isDark ? "rgba(139, 92, 246, 0.2)" : "#e2e8f0"} !important;
        transition: all 0.2s;
      }
      .leaflet-bar a:hover {
        background-color: ${isDark ? "#231263" : "#f1f5f9"} !important;
        color: ${isDark ? "#ffffff" : "#0f172a"} !important;
      }
      .leaflet-popup-content-wrapper, .leaflet-popup-tip {
        background: ${isDark ? "#0c022e" : "#ffffff"} !important;
        color: ${isDark ? "#f1f5f9" : "#1e293b"} !important;
        border: 1px solid ${isDark ? "rgba(139, 92, 246, 0.3)" : "#e2e8f0"} !important;
        border-radius: 6px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, ${isDark ? "0.6" : "0.08"}) !important;
      }
      .leaflet-popup-content {
        margin: 11px 15px !important;
        line-height: 1.5 !important;
      }
      .leaflet-popup-close-button {
        color: ${isDark ? "#a78bfa" : "#64748b"} !important;
      }
      .leaflet-control-attribution {
        background: ${isDark ? "rgba(0, 0, 0, 0.82)" : "rgba(255, 255, 255, 0.85)"} !important;
        color: ${isDark ? "#64748b" : "#475569"} !important;
        font-size: 8px !important;
      }
    `}</style>
  );
};

// High quality custom Div-based icons
const getIncidentIcon = (category: string, severity: string) => {
  const color =
    severity === "critico"
      ? "#a78bfa" // Monochromatic premium purple glow
      : severity === "alto"
      ? "#f59e0b" // amber
      : severity === "medio"
      ? "#eab308" // yellow
      : "#3b82f6"; // blue

  const symbol =
    category === "deslizamento"
      ? "▲"
      : category === "alagamento"
      ? "≈"
      : category === "arvore_caida"
      ? "♣"
      : "!";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="position: absolute; bottom: 12px; width: 26px; height: 26px; border-radius: 50%; background-color: #0c022e; display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; box-shadow: 0 0 10px ${color}80, 0 4px 6px rgba(0,0,0,0.6);">
          <span style="font-size: 11px; font-weight: bold; color: #ffffff; line-height: 1;">${symbol}</span>
        </div>
        <div style="position: absolute; bottom: 2px; width: 0px; height: 0px; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 10px solid ${color};"></div>
      </div>
    `,
    iconSize: [32, 28],
    iconAnchor: [16, 28],
  });
};

const getShelterIcon = (occupants: number, capacity: number) => {
  const occupancyPct = occupants / capacity;
  const color = occupancyPct > 0.9 ? "#ec4899" : occupancyPct > 0.7 ? "#f59e0b" : "#38bdf8";
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
        <div style="position: absolute; bottom: 10px; width: 24px; height: 24px; border-radius: 6px; background-color: #0c022e; display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">
          <span style="font-size: 8px; font-weight: bold; color: ${color}; font-family: monospace; letter-spacing: -0.5px;">ABR</span>
        </div>
        <div style="position: absolute; bottom: 2px; width: 2px; height: 8px; background-color: ${color};"></div>
      </div>
    `,
    iconSize: [30, 26],
    iconAnchor: [15, 26],
  });
};

const getSensorIcon = (status: string) => {
  const color = status === "critico" ? "#ec4899" : "#10b981";
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
        <div style="position: absolute; bottom: 10px; width: 18px; height: 18px; border-radius: 50%; background-color: #0c022e; display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; box-shadow: 0 0 8px ${color}bf, 0 2px 4px rgba(0,0,0,0.5);">
          <span style="font-size: 8px; font-weight: bold; color: ${color}; font-family: monospace;">H2O</span>
        </div>
        <div style="position: absolute; bottom: 2px; width: 2px; height: 8px; background-color: ${color};"></div>
      </div>
    `,
    iconSize: [28, 24],
    iconAnchor: [14, 24],
  });
};

const getStationIcon = (alertStatus: string) => {
  const color =
    alertStatus === "vermelho"
      ? "#ef4444"
      : alertStatus === "laranja"
      ? "#f59e0b"
      : alertStatus === "amarelo"
      ? "#eab308"
      : "#10b981";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
        <div style="position: absolute; bottom: 10px; width: 18px; height: 18px; border-radius: 2px; background-color: #0c022e; display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
          <span style="font-size: 8px; font-weight: bold; color: ${color}; font-family: monospace;">CHV</span>
        </div>
        <div style="position: absolute; bottom: 2px; width: 2px; height: 8px; background-color: ${color};"></div>
      </div>
    `,
    iconSize: [28, 24],
    iconAnchor: [14, 24],
  });
};

// Simulated Flooded Streets & Alternative Routes data for Map Rendering
const floodedStreetsData = [
  {
    id: "str-001",
    name: "Av. Marechal Mascarenhas de Morais",
    status: "Alagamento Crítico (Próximo à UPA)",
    coordinates: [[-8.0910, -34.9070], [-8.0990, -34.9060], [-8.1070, -34.9055]] as [number, number][],
    alternativeName: "Pista Leste / Av. Sul",
    alternativeCoordinates: [[-8.0910, -34.9040], [-8.0990, -34.9030], [-8.1070, -34.9020]] as [number, number][],
    details: "Alagamento severo próximo à UPA Imbiribeira. Recomenda-se utilizar as faixas exclusivas em contrafluxo operadas pela CTTU ou a Av. Sul."
  },
  {
    id: "str-002",
    name: "Avenida Sul",
    status: "Bloqueio Total (Pontilhão de Ferro)",
    coordinates: [[-8.0720, -34.8900], [-8.0750, -34.8950]] as [number, number][],
    alternativeName: "Av. Agamenon Magalhães / Rua São Miguel",
    alternativeCoordinates: [[-8.0680, -34.8880], [-8.0770, -34.8970], [-8.0820, -34.9050]] as [number, number][],
    details: "Ponto intransitável sob a ferrovia na área de São José. Altura da água impede circulação. Rota recomendada: seguir por Afogados."
  },
  {
    id: "str-003",
    name: "Av. Dr. José Rufino",
    status: "Rico de Alagamento (Imediações do Colégio Auxiliadora)",
    coordinates: [[-8.0790, -34.9250], [-8.0810, -34.9310]] as [number, number][],
    alternativeName: "Av. Recife / Av. San Martin",
    alternativeCoordinates: [[-8.0730, -34.9150], [-8.0840, -34.9220]] as [number, number][],
    details: "Pontos de desborde perto do Colégio Maria Auxiliadora. Trânsito lento, mas trafegável pelas faixas centrais, ou desvios por San Martin."
  },
  {
    id: "str-004",
    name: "Av. Governador Agamenon Magalhães",
    status: "Alagamento Parcial nas faixas laterais (Derby/Rui Barbosa)",
    coordinates: [[-8.0420, -34.8960], [-8.0470, -34.8930]] as [number, number][],
    alternativeName: "Faixas Centrais Expressas",
    alternativeCoordinates: [[-8.0420, -34.8950], [-8.0470, -34.8920]] as [number, number][],
    details: "As faixas centrais expressas estão desobstruídas e secas. Evitar faixas laterais devido ao acúmulo de água junto à sarjeta."
  },
  {
    id: "str-005",
    name: "Avenida Caxangá",
    status: "Risco de Alagamento de maré (Proximidades do Hospital Getúlio Vargas)",
    coordinates: [[-8.0440, -34.9310], [-8.0480, -34.9240]] as [number, number][],
    alternativeName: "Corredor Exclusivo Metropolitano (BRT)",
    alternativeCoordinates: [[-8.0435, -34.9300], [-8.0475, -34.9230]] as [number, number][],
    details: "A pista exclusiva central elevada está seca e liberada para o fluxo. Pista de veículos leves em processo de elevação."
  }
];

export default function RecifeMap({
  incidents,
  shelters,
  fleet,
  sensors,
  stations,
  selectedNeighborhood,
  onSelectNeighborhood,
  activeLayer,
  theme = "light"
}: RecifeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [clickedPin, setClickedPin] = useState<any | null>(null);

  const isDark = theme === "dark";

  // Group Layers with refs to draw & clear on demand
  const incidentGroupRef = useRef<L.LayerGroup | null>(null);
  const shelterGroupRef = useRef<L.LayerGroup | null>(null);
  const fleetGroupRef = useRef<L.LayerGroup | null>(null);
  const sensorGroupRef = useRef<L.LayerGroup | null>(null);
  const stationGroupRef = useRef<L.LayerGroup | null>(null);
  const riverGroupRef = useRef<L.LayerGroup | null>(null);
  const floodedStreetsGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center of Recife
    const map = L.map(mapContainerRef.current, {
      center: [-8.057833, -34.882897],
      zoom: 12.5,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    // Dynamic map tiles based on theme
    const tileUrl = isDark 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Init Layer groups
    incidentGroupRef.current = L.layerGroup().addTo(map);
    shelterGroupRef.current = L.layerGroup().addTo(map);
    fleetGroupRef.current = L.layerGroup().addTo(map);
    sensorGroupRef.current = L.layerGroup().addTo(map);
    stationGroupRef.current = L.layerGroup().addTo(map);
    riverGroupRef.current = L.layerGroup().addTo(map);
    floodedStreetsGroupRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [theme]); // Rebuild map when the light/dark theme switches

  // Update Map Markers dynamically as filter or data dependencies update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous elements
    incidentGroupRef.current?.clearLayers();
    shelterGroupRef.current?.clearLayers();
    fleetGroupRef.current?.clearLayers();
    sensorGroupRef.current?.clearLayers();
    stationGroupRef.current?.clearLayers();
    riverGroupRef.current?.clearLayers();
    floodedStreetsGroupRef.current?.clearLayers();

    // 1. Draw Rivers / Canals
    if (activeLayer === "all" || activeLayer === "flood") {
      // Rio Capibaribe
      L.polyline(
        [[-8.0435, -34.9450], [-8.0450, -34.9250], [-8.0550, -34.9100], [-8.0595, -34.8950], [-8.0570, -34.8810], [-8.0620, -34.8720]],
        {
          color: sensors.find((s) => s.id === "sens-001")?.status === "critico" ? "#a78bfa" : "#3b82f6",
          weight: 4,
          opacity: 0.8
        }
      ).addTo(riverGroupRef.current!);

      // Rio Beberibe
      L.polyline(
        [[-8.0050, -34.8950], [-8.0200, -34.8900], [-8.0400, -34.8850], [-8.0500, -34.8780]],
        {
          color: sensors.find((s) => s.id === "sens-002")?.status === "critico" ? "#a78bfa" : "#3b82f6",
          weight: 3,
          opacity: 0.8
        }
      ).addTo(riverGroupRef.current!);

      // Rio Tejipió
      L.polyline(
        [[-8.0950, -34.9520], [-8.0850, -34.9350], [-8.0780, -34.9200], [-8.0720, -34.9080]],
        {
          color: sensors.find((s) => s.id === "sens-003")?.status === "critico" ? "#a78bfa" : "#3b82f6",
          weight: 3.5,
          opacity: 0.8
        }
      ).addTo(riverGroupRef.current!);

      // Canal Agamenon
      L.polyline(
        [[-8.0400, -34.8850], [-8.0600, -34.8850]],
        {
          color: sensors.find((s) => s.id === "sens-004")?.status === "critico" ? "#ef4444" : "#4f46e5",
          weight: 3,
          opacity: 0.8
        }
      ).addTo(riverGroupRef.current!);

      // 1b. Draw Flooded Streets with glowing backings, hover interactivity, and pulsing midpoint alerts
      floodedStreetsData.forEach((street) => {
        // Red glowing backing line for flooded street
        const floodGlow = L.polyline(street.coordinates, {
          color: "#dc2626",
          weight: 14,
          opacity: 0.35,
          lineCap: "round"
        }).addTo(floodedStreetsGroupRef.current!);

        // Red dashed foreground line for flooded street
        const floodLine = L.polyline(street.coordinates, {
          color: "#f87171",
          weight: 5.5,
          dashArray: "8, 12",
          opacity: 0.95,
          lineCap: "round"
        }).addTo(floodedStreetsGroupRef.current!);

        // Mouse hover interactivity for flooded street
        const handleFloodOver = () => {
          floodLine.setStyle({ color: "#fca5a5", weight: 7 });
          floodGlow.setStyle({ opacity: 0.55, weight: 18 });
        };
        const handleFloodOut = () => {
          floodLine.setStyle({ color: "#f87171", weight: 5.5 });
          floodGlow.setStyle({ opacity: 0.35, weight: 14 });
        };

        floodGlow.on("mouseover", handleFloodOver);
        floodLine.on("mouseover", handleFloodOver);
        floodGlow.on("mouseout", handleFloodOut);
        floodLine.on("mouseout", handleFloodOut);

        floodLine.on("click", () => {
          setClickedPin({ type: "street", data: street });
        });
        floodGlow.on("click", () => {
          setClickedPin({ type: "street", data: street });
        });

        // Green glowing backing line for alternative route
        const altGlow = L.polyline(street.alternativeCoordinates, {
          color: "#10b981",
          weight: 12,
          opacity: 0.25,
          lineCap: "round"
        }).addTo(floodedStreetsGroupRef.current!);

        // Green solid foreground line for alternative route
        const altLine = L.polyline(street.alternativeCoordinates, {
          color: "#34d399",
          weight: 4.5,
          opacity: 0.95,
          lineCap: "round"
        }).addTo(floodedStreetsGroupRef.current!);

        // Mouse hover interactivity for alternative route
        const handleAltOver = () => {
          altLine.setStyle({ color: "#6ee7b7", weight: 6 });
          altGlow.setStyle({ opacity: 0.45, weight: 16 });
        };
        const handleAltOut = () => {
          altLine.setStyle({ color: "#34d399", weight: 4.5 });
          altGlow.setStyle({ opacity: 0.25, weight: 12 });
        };

        altGlow.on("mouseover", handleAltOver);
        altLine.on("mouseover", handleAltOver);
        altGlow.on("mouseout", handleAltOut);
        altLine.on("mouseout", handleAltOut);

        altLine.on("click", () => {
          setClickedPin({ type: "street", data: street });
        });
        altGlow.on("click", () => {
          setClickedPin({ type: "street", data: street });
        });

        // Pulse warning marker at the midpoint of coordinates
        const midpointIndex = Math.floor(street.coordinates.length / 2);
        const midpoint = street.coordinates[midpointIndex];
        
        const pulseIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 select-none">
              <span class="absolute inline-flex h-full w-full rounded-full bg-red-550 opacity-75 animate-ping"></span>
              <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-red-650 text-white border border-white/80 shadow-md text-[10px] font-bold cursor-pointer hover:scale-115 transition-transform duration-200">
                ⚠️
              </div>
            </div>
          `,
          className: "custom-leaflet-pulse-parent",
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const midpointMarker = L.marker(midpoint as [number, number], { icon: pulseIcon })
          .addTo(floodedStreetsGroupRef.current!);

        midpointMarker.on("click", () => {
          setClickedPin({ type: "street", data: street });
        });
      });
    }

    // 2. Draw Incidents markers
    if (activeLayer === "all" || activeLayer === "flood" || activeLayer === "slide") {
      incidents.forEach((inc) => {
        // Apply categories filters depending on layers
        if (activeLayer === "flood" && inc.category !== "alagamento" && inc.category !== "bueiro_entupido") return;
        if (activeLayer === "slide" && inc.category !== "deslizamento") return;

        const coords = neighborhoodCoords[inc.neighborhood];
        if (coords) {
          // Add subtle randomness to scatter pins in standard areas slightly
          const latOffset = (Math.random() - 0.5) * 0.009;
          const lngOffset = (Math.random() - 0.5) * 0.009;
          const pinLat = coords[0] + (inc.id.charCodeAt(0) % 10) * 0.0004 - 0.002;
          const pinLng = coords[1] + (inc.id.charCodeAt(1) % 10) * 0.0004 - 0.002;

          const marker = L.marker([pinLat, pinLng], {
            icon: getIncidentIcon(inc.category, inc.severity)
          });

          marker.on("click", () => {
            setClickedPin({ type: "incident", data: inc });
          });

          marker.addTo(incidentGroupRef.current!);
        }
      });
    }

    // 3. Draw Shelters
    if (activeLayer === "all" || activeLayer === "assets") {
      shelters.forEach((she) => {
        const coords = neighborhoodCoords[she.neighborhood];
        if (coords) {
          const pinLat = coords[0] + 0.003; // shift slight north
          const pinLng = coords[1] - 0.003; // shift slight west

          const marker = L.marker([pinLat, pinLng], {
            icon: getShelterIcon(she.currentOccupants, she.capacity)
          });

          marker.on("click", () => {
            setClickedPin({ type: "shelter", data: she });
          });

          marker.addTo(shelterGroupRef.current!);
        }
      });
    }

    // 4. Draw Fleet
    if (activeLayer === "all" || activeLayer === "assets") {
      fleet.forEach((f) => {
        const marker = L.marker([f.latitude, f.longitude], {
          icon: L.divIcon({
            className: "fleet-radar-point",
            html: `<div style="width: 10px; height: 10px; border-radius: 50%; background-color: #818cf8; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #818cf8, 0 2px 4px rgba(0,0,0,0.5);"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })
        });

        marker.on("click", () => {
          setClickedPin({ type: "fleet", data: f });
        });

        marker.addTo(fleetGroupRef.current!);
      });
    }

    // 5. IoT River Hydrometers
    if (activeLayer === "all" || activeLayer === "flood") {
      sensors.forEach((s) => {
        const coords = sensorCoords[s.id];
        if (coords) {
          const marker = L.marker(coords, {
            icon: getSensorIcon(s.status)
          });
          marker.on("click", () => {
            setClickedPin({ type: "sensor", data: s });
          });
          marker.addTo(sensorGroupRef.current!);
        }
      });
    }

    // 6. Pluviometers
    if (activeLayer === "all" || activeLayer === "flood") {
      stations.forEach((st) => {
        const coords = stationCoords[st.id];
        if (coords) {
          const marker = L.marker(coords, {
            icon: getStationIcon(st.alertStatus)
          });
          marker.on("click", () => {
            setClickedPin({ type: "station", data: st });
          });
          marker.addTo(stationGroupRef.current!);
        }
      });
    }

  }, [incidents, shelters, fleet, sensors, stations, activeLayer, theme]);

  // Handle selected neighborhood zooms
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedNeighborhood) {
      const coords = neighborhoodCoords[selectedNeighborhood];
      if (coords) {
        map.setView(coords, 14, { animate: false });
      }
    } else {
      map.setView([-8.057833, -34.882897], 12.5, { animate: false });
    }
  }, [selectedNeighborhood]);

  return (
    <div 
      className={`relative border rounded-none p-4 overflow-hidden transition-colors duration-300 ${
        isDark 
          ? "bg-[#0c0d12] border-zinc-805" 
          : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      <LeafletStyles theme={theme} />

      {/* Top Header Controls Info */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3 ${
        isDark ? "border-zinc-800" : "border-slate-200"
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#a78bfa] rounded-full animate-pulse shadow-[0_0_8px_#a78bfa] shrink-0" />
          <h3 className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isDark ? "text-slate-200" : "text-slate-800"}`}>
            Cartografia Climatológica Integrada
          </h3>
        </div>
        
        {/* Dropdown selector */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedNeighborhood || ""}
            onChange={(e) => onSelectNeighborhood(e.target.value || null)}
            className={`border font-mono text-[10px] uppercase px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 rounded-none cursor-pointer ${
              isDark ? "bg-[#0a0224] border-white/10 text-slate-200" : "bg-white border-slate-350 text-slate-700"
            }`}
          >
            <option value="">Filtro: Bairros</option>
            {Object.keys(neighborhoodCoords).sort().map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          
          {selectedNeighborhood && (
            <button
              onClick={() => onSelectNeighborhood(null)}
              className={`px-2.5 py-1.5 font-mono text-[10px] rounded-none uppercase transition-all cursor-pointer ${
                isDark 
                  ? "bg-[#0b0c24] hover:bg-zinc-900 border border-[#a78bfa]/40 text-slate-300" 
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 shadow-3xs"
              }`}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Actual Map Container */}
      <div className={`relative w-full h-[380px] overflow-hidden border ${
        isDark ? "bg-black border-zinc-900" : "bg-slate-100 border-slate-200"
      }`}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Detailed Info cards overlay overlaying on map */}
        {clickedPin && (
          <div 
            className={`absolute bottom-3 left-3 right-3 border text-xs shadow-xl p-4 rounded-none z-[400] transition-all max-w-lg mx-auto ${
              isDark 
                ? "bg-[#0c0d16] border-[#8b5cf6]/40 text-slate-200" 
                : "bg-white border-slate-300 text-slate-800"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono tracking-wider font-bold text-indigo-500 dark:text-[#a78bfa] uppercase">
                {clickedPin.type === "incident" && `OCORRÊNCIA: ${clickedPin.data.id}`}
                {clickedPin.type === "sensor" && `MONITORAMENTO HIDROLÓGICO`}
                {clickedPin.type === "shelter" && `ABRIGO CIVIL ATIVO`}
                {clickedPin.type === "fleet" && `VIATURA SEGUIDA`}
                {clickedPin.type === "station" && `ESTAÇÃO DE CHUVA`}
                {clickedPin.type === "street" && `MONITORAMENTO DE VIÁRIO`}
              </span>
              <button
                onClick={() => setClickedPin(null)}
                className={`font-mono font-bold text-[9px] px-2 py-0.5 border transition-all cursor-pointer ${
                  isDark 
                    ? "bg-black/45 border-zinc-800 text-slate-300 hover:text-white" 
                    : "bg-slate-150 border-slate-250 text-slate-600 hover:text-slate-900"
                }`}
              >
                FECHAR
              </button>
            </div>

            {clickedPin.type === "incident" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">{clickedPin.data.title}</h4>
                <p className={`text-[11px] leading-relaxed mb-2.5 ${isDark ? "text-slate-300":"text-slate-600"}`}>{clickedPin.data.description}</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-mono border-t pt-2 border-slate-200 dark:border-zinc-900 text-slate-500">
                  <div>Bairro: <span className="text-slate-800 dark:text-white font-sans font-bold">{clickedPin.data.neighborhood}</span></div>
                  <div>Severidade: <span className="text-red-500 font-bold">{clickedPin.data.severity.toUpperCase()}</span></div>
                  <div>Estado: <span className="text-amber-500 dark:text-amber-400 uppercase font-bold">{clickedPin.data.status}</span></div>
                  <div>Registrado: {new Date(clickedPin.data.reportingTime).toLocaleTimeString("pt-BR")}</div>
                </div>
              </div>
            )}

            {clickedPin.type === "sensor" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">{clickedPin.data.riverName}</h4>
                <p className="text-[10px] text-slate-400 mb-2 font-mono">📍 {clickedPin.data.name} ({clickedPin.data.neighborhood})</p>
                <div className="flex items-center gap-2 mb-2 border-t pt-2 border-slate-200 dark:border-zinc-950 font-mono">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold border ${
                    clickedPin.data.status === "critico" 
                      ? "bg-red-50 text-red-600 border-red-300 dark:bg-black dark:text-[#a78bfa] dark:border-[#a78bfa]" 
                      : "bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400"
                  }`}>
                    {clickedPin.data.status.toUpperCase()}
                  </span>
                  <span className="text-[11px]">Nível Fluvial: <strong>{clickedPin.data.currentLevel.toFixed(2)}m</strong></span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-900 h-1.5 overflow-hidden mb-1">
                  <div
                    className={`h-full ${clickedPin.data.status === "critico" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`}
                    style={{ width: `${Math.min(100, (clickedPin.data.currentLevel / clickedPin.data.criticalLevel) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-400">
                  <span>Atenção: {clickedPin.data.warningLevel}m</span>
                  <span>Transbordo: {clickedPin.data.criticalLevel}m</span>
                </div>
              </div>
            )}

            {clickedPin.type === "shelter" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Escola / Abrigo: {clickedPin.data.name}</h4>
                <p className="text-[10px] text-slate-400 mb-2 font-mono">📍 Bairro: {clickedPin.data.neighborhood}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t pt-2 border-slate-200 dark:border-zinc-900">
                  <div>Acolhidos: <strong className="dark:text-white">{clickedPin.data.currentOccupants}</strong> / {clickedPin.data.capacity} total</div>
                  <div>Ocupação: <strong className="text-amber-500 font-bold">{Math.round((clickedPin.data.currentOccupants / clickedPin.data.capacity) * 100)}%</strong></div>
                  <div className="col-span-2 text-slate-500 font-mono">Necessita de: <span className="text-indigo-600 dark:text-sky-300 font-sans font-bold">{clickedPin.data.itemsNeeded.join(", ")}</span></div>
                  <div className="col-span-2 font-mono text-slate-400">Contato: <strong className="text-indigo-600 dark:text-sky-300">{clickedPin.data.phone}</strong></div>
                </div>
              </div>
            )}

            {clickedPin.type === "fleet" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Equipe {clickedPin.data.code} — {clickedPin.data.service}</h4>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono mt-2 border-t pt-2 border-slate-200 dark:border-zinc-900 text-slate-500">
                  <div>Motorista: <span className="text-slate-800 dark:text-white font-bold">{clickedPin.data.driver}</span></div>
                  <div>Rastreado: <span className="text-emerald-500 uppercase font-bold">{clickedPin.data.status}</span></div>
                  <div>Lat: {clickedPin.data.latitude.toFixed(4)}</div>
                  <div>Lng: {clickedPin.data.longitude.toFixed(4)}</div>
                </div>
              </div>
            )}

            {clickedPin.type === "station" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">{clickedPin.data.name}</h4>
                <p className="text-[10px] text-slate-400 mb-2 font-mono">📍 Localização: {clickedPin.data.neighborhood}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t pt-2 border-slate-200 dark:border-zinc-900">
                  <div>Acumulado (24h): <strong className="dark:text-white">{clickedPin.data.rainAmount24h} mm</strong></div>
                  <div>Instável (3h): <strong className="dark:text-white">{clickedPin.data.rainAmount3h} mm</strong></div>
                  <div className="col-span-2 mt-1">
                    Nível de Alerta:{" "}
                    <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-bold ${
                      clickedPin.data.alertStatus === "vermelho" ? "bg-red-100 text-red-600 dark:bg-black dark:text-[#a78bfa] border border-red-300" :
                      clickedPin.data.alertStatus === "laranja" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border border-orange-200" :
                      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border border-green-200"
                    }`}>
                      RISCO {clickedPin.data.alertStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {clickedPin.type === "street" && (
              <div>
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">{clickedPin.data.name}</h4>
                <div className="space-y-1.5 mt-2 border-t pt-2 border-slate-200 dark:border-zinc-900">
                  <div>
                    <span className="text-[8px] font-mono font-bold block text-red-450 dark:text-red-400 uppercase">Estado da Via:</span>
                    <strong className="text-red-600 dark:text-red-400 font-mono text-[11px] uppercase">⚠️ {clickedPin.data.status}</strong>
                  </div>
                  <div className="border-l-2 border-emerald-500 pl-2 py-0.5 bg-emerald-500/5 mt-2">
                    <span className="text-[8px] font-mono font-bold block text-emerald-600 dark:text-emerald-400 uppercase">Rota de Escape Sugerida:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-xs font-sans">{clickedPin.data.alternativeName}</strong>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 font-sans mt-0.5 leading-relaxed">
                      {clickedPin.data.details}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Legend Block */}
      <div className={`grid grid-cols-2 lg:grid-cols-7 gap-2 mt-3 pt-3 border-t text-[8px] font-mono transition-colors duration-300 ${
        isDark ? "border-zinc-800 bg-black/40 text-slate-400 p-2.5":"border-slate-200 bg-slate-50 text-slate-505 p-3"
      }`}>
        <div className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", border: "2.5px solid #a78bfa", backgroundColor: "#0c022e" }} />
          <span>Ocorrências</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", border: "2.5px solid #38bdf8", backgroundColor: "#0c022e" }} />
          <span>Abrigo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", border: "2.5px solid #10b981", backgroundColor: "#0c022e" }} />
          <span>Sensores H2O</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", border: "2.5px solid #eab308", backgroundColor: "#0c022e" }} />
          <span>Pluviômetros</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#818cf8" }} />
          <span>Frotas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-red-500 border-dashed border-b border-red-500" style={{ borderStyle: "dashed" }} />
          <span>Via Alagada</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-emerald-500" />
          <span>Rota Desvio</span>
        </div>
      </div>
    </div>
  );
}
