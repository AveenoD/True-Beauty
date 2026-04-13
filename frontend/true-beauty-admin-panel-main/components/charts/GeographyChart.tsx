"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, MapPin } from "lucide-react";
import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";

type RegionStats = { orders: number; revenue: number };

type TabId = "worldwide" | "country" | "stateCity";

const TABS: { id: TabId; label: string }[] = [
  { id: "worldwide", label: "Worldwide" },
  { id: "country", label: "Country" },
  { id: "stateCity", label: "State & City" },
];

// Heat scale: light pink → dark pink (no labels, clean heatmap)
const HEAT = {
  none: "#f1f5f9",
  strokeNone: "#cbd5e1",
  strokeHover: "#9d174d",
  light: "#fce7f3",
  dark: "#be185d",
  hoverFill: "#fbcfe8",
};

// World sales data: country name → orders & revenue (dummy data for all major countries)
const worldwideData: Record<string, RegionStats> = {
  India: { orders: 12450, revenue: 2845000 },
  "United States of America": { orders: 8920, revenue: 2120000 },
  "United Kingdom": { orders: 4320, revenue: 980000 },
  "United Arab Emirates": { orders: 2100, revenue: 520000 },
  Canada: { orders: 1850, revenue: 440000 },
  Australia: { orders: 1620, revenue: 385000 },
  Germany: { orders: 3200, revenue: 760000 },
  France: { orders: 2890, revenue: 692000 },
  Singapore: { orders: 1560, revenue: 412000 },
  Malaysia: { orders: 980, revenue: 228000 },
  "Saudi Arabia": { orders: 1450, revenue: 358000 },
  Japan: { orders: 2340, revenue: 588000 },
  "South Korea": { orders: 1180, revenue: 295000 },
  Brazil: { orders: 760, revenue: 178000 },
  "South Africa": { orders: 540, revenue: 125000 },
  Nigeria: { orders: 420, revenue: 98000 },
  Indonesia: { orders: 890, revenue: 198000 },
  Thailand: { orders: 670, revenue: 152000 },
  Philippines: { orders: 430, revenue: 102000 },
  Pakistan: { orders: 380, revenue: 88000 },
  Bangladesh: { orders: 290, revenue: 72000 },
  "Sri Lanka": { orders: 180, revenue: 45000 },
  Nepal: { orders: 150, revenue: 38000 },
  China: { orders: 4100, revenue: 920000 },
  Russia: { orders: 1250, revenue: 310000 },
  Mexico: { orders: 1680, revenue: 398000 },
  Argentina: { orders: 520, revenue: 118000 },
  Turkey: { orders: 1890, revenue: 445000 },
  Italy: { orders: 2100, revenue: 502000 },
  Spain: { orders: 1650, revenue: 392000 },
  Netherlands: { orders: 1320, revenue: 318000 },
  Poland: { orders: 980, revenue: 228000 },
  Ukraine: { orders: 420, revenue: 95000 },
  Iran: { orders: 680, revenue: 158000 },
  Egypt: { orders: 520, revenue: 122000 },
  Algeria: { orders: 280, revenue: 62000 },
  Morocco: { orders: 390, revenue: 88000 },
  Kenya: { orders: 310, revenue: 72000 },
  Tanzania: { orders: 185, revenue: 42000 },
  Vietnam: { orders: 720, revenue: 168000 },
  "Taiwan": { orders: 890, revenue: 212000 },
  Myanmar: { orders: 340, revenue: 78000 },
  Afghanistan: { orders: 120, revenue: 28000 },
  Kazakhstan: { orders: 260, revenue: 58000 },
  Iraq: { orders: 380, revenue: 88000 },
  Israel: { orders: 620, revenue: 148000 },
  Sweden: { orders: 780, revenue: 185000 },
  Belgium: { orders: 650, revenue: 152000 },
  Switzerland: { orders: 540, revenue: 132000 },
  Austria: { orders: 480, revenue: 112000 },
  "Hong Kong": { orders: 1120, revenue: 268000 },
  Colombia: { orders: 420, revenue: 98000 },
  Chile: { orders: 380, revenue: 88000 },
  Peru: { orders: 290, revenue: 68000 },
  Ecuador: { orders: 180, revenue: 42000 },
  Venezuela: { orders: 95, revenue: 22000 },
  "South Sudan": { orders: 45, revenue: 10500 },
  Ethiopia: { orders: 220, revenue: 52000 },
  Ghana: { orders: 195, revenue: 45000 },
  "Ivory Coast": { orders: 165, revenue: 38000 },
  Cameroon: { orders: 140, revenue: 32000 },
  Angola: { orders: 120, revenue: 28000 },
  "Democratic Republic of the Congo": { orders: 85, revenue: 19800 },
  Zimbabwe: { orders: 95, revenue: 22000 },
  Zambia: { orders: 72, revenue: 16800 },
  Mozambique: { orders: 88, revenue: 20500 },
  Madagascar: { orders: 65, revenue: 15200 },
  Tunisia: { orders: 210, revenue: 48000 },
  Libya: { orders: 125, revenue: 29000 },
  Sudan: { orders: 98, revenue: 22800 },
  Yemen: { orders: 85, revenue: 19800 },
  Syria: { orders: 62, revenue: 14500 },
  Jordan: { orders: 280, revenue: 65000 },
  Lebanon: { orders: 195, revenue: 45000 },
  Qatar: { orders: 420, revenue: 102000 },
  Kuwait: { orders: 380, revenue: 88000 },
  Bahrain: { orders: 185, revenue: 42000 },
  Oman: { orders: 260, revenue: 58000 },
  Azerbaijan: { orders: 220, revenue: 52000 },
  Georgia: { orders: 145, revenue: 34000 },
  Armenia: { orders: 98, revenue: 22800 },
  Uzbekistan: { orders: 180, revenue: 42000 },
  Cambodia: { orders: 165, revenue: 38000 },
  Laos: { orders: 95, revenue: 22000 },
  Mongolia: { orders: 72, revenue: 16800 },
  "North Korea": { orders: 28, revenue: 6500 },
  "New Zealand": { orders: 420, revenue: 98000 },
  Ireland: { orders: 580, revenue: 138000 },
  Portugal: { orders: 480, revenue: 112000 },
  Greece: { orders: 420, revenue: 98000 },
  Romania: { orders: 320, revenue: 75000 },
  Hungary: { orders: 280, revenue: 65000 },
  "Czech Republic": { orders: 350, revenue: 82000 },
  Norway: { orders: 520, revenue: 122000 },
  Finland: { orders: 380, revenue: 88000 },
  Denmark: { orders: 450, revenue: 105000 },
  Croatia: { orders: 195, revenue: 45000 },
  Serbia: { orders: 165, revenue: 38000 },
  Bulgaria: { orders: 145, revenue: 34000 },
  Belarus: { orders: 125, revenue: 29000 },
  Slovakia: { orders: 180, revenue: 42000 },
  Cuba: { orders: 95, revenue: 22000 },
  "Dominican Republic": { orders: 165, revenue: 38000 },
  Guatemala: { orders: 145, revenue: 34000 },
  Honduras: { orders: 88, revenue: 20500 },
  "Costa Rica": { orders: 125, revenue: 29000 },
  Panama: { orders: 165, revenue: 38000 },
  Bolivia: { orders: 125, revenue: 29000 },
  Paraguay: { orders: 95, revenue: 22000 },
  Uruguay: { orders: 145, revenue: 34000 },
  "Burkina Faso": { orders: 65, revenue: 15200 },
  Mali: { orders: 55, revenue: 12800 },
  Niger: { orders: 48, revenue: 11200 },
  Senegal: { orders: 95, revenue: 22000 },
};

// India states: state name → orders & revenue
const indiaStateData: Record<string, RegionStats> = {
  "Andhra Pradesh": { orders: 1420, revenue: 342000 },
  "Arunachal Pradesh": { orders: 85, revenue: 18500 },
  Assam: { orders: 320, revenue: 72000 },
  Bihar: { orders: 480, revenue: 108000 },
  Chhattisgarh: { orders: 210, revenue: 48000 },
  Goa: { orders: 180, revenue: 52000 },
  Gujarat: { orders: 1680, revenue: 412000 },
  Haryana: { orders: 920, revenue: 228000 },
  "Himachal Pradesh": { orders: 290, revenue: 72000 },
  Jharkhand: { orders: 340, revenue: 78000 },
  Karnataka: { orders: 1950, revenue: 485000 },
  Kerala: { orders: 1120, revenue: 268000 },
  "Madhya Pradesh": { orders: 580, revenue: 132000 },
  Maharashtra: { orders: 2450, revenue: 628000 },
  Manipur: { orders: 95, revenue: 22000 },
  Meghalaya: { orders: 72, revenue: 16800 },
  Mizoram: { orders: 48, revenue: 11200 },
  Nagaland: { orders: 55, revenue: 12800 },
  Odisha: { orders: 410, revenue: 92000 },
  Punjab: { orders: 780, revenue: 188000 },
  Rajasthan: { orders: 650, revenue: 158000 },
  Sikkim: { orders: 62, revenue: 15200 },
  "Tamil Nadu": { orders: 1890, revenue: 462000 },
  Telangana: { orders: 1180, revenue: 288000 },
  Tripura: { orders: 88, revenue: 20500 },
  "Uttar Pradesh": { orders: 1320, revenue: 312000 },
  Uttarakhand: { orders: 380, revenue: 92000 },
  "West Bengal": { orders: 980, revenue: 235000 },
  "Andaman and Nicobar Islands": { orders: 45, revenue: 11200 },
  Chandigarh: { orders: 120, revenue: 32000 },
  "Dadra and Nagar Haveli and Daman and Diu": { orders: 38, revenue: 9200 },
  Delhi: { orders: 1560, revenue: 428000 },
  "Jammu and Kashmir": { orders: 420, revenue: 102000 },
  Ladakh: { orders: 95, revenue: 24800 },
  Lakshadweep: { orders: 18, revenue: 4800 },
  Puducherry: { orders: 85, revenue: 19800 },
};

const cityData: {
  city: string;
  state: string;
  coordinates: [number, number];
  orders: number;
  revenue: number;
}[] = [
  { city: "Mumbai", state: "Maharashtra", coordinates: [72.8777, 19.076], orders: 820, revenue: 248000 },
  { city: "Delhi", state: "Delhi", coordinates: [77.209, 28.6139], orders: 780, revenue: 228000 },
  { city: "Bangalore", state: "Karnataka", coordinates: [77.5946, 12.9716], orders: 690, revenue: 198000 },
  { city: "Chennai", state: "Tamil Nadu", coordinates: [80.2707, 13.0827], orders: 540, revenue: 158000 },
  { city: "Hyderabad", state: "Telangana", coordinates: [78.4867, 17.385], orders: 480, revenue: 142000 },
  { city: "Pune", state: "Maharashtra", coordinates: [73.8563, 18.5204], orders: 420, revenue: 125000 },
  { city: "Kolkata", state: "West Bengal", coordinates: [88.3639, 22.5726], orders: 380, revenue: 108000 },
  { city: "Ahmedabad", state: "Gujarat", coordinates: [72.5714, 23.0225], orders: 350, revenue: 98000 },
  { city: "Surat", state: "Gujarat", coordinates: [72.8311, 21.1702], orders: 220, revenue: 62000 },
  { city: "Jaipur", state: "Rajasthan", coordinates: [75.7873, 26.9124], orders: 190, revenue: 52000 },
];

// World map: GeoJSON (Natural Earth 110m) · India: GeoJSON
const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const INDIA_STATES_URL =
  "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

// react-simple-maps types omit onMoveEnd; it works at runtime
type ZoomableGroupProps = React.ComponentProps<typeof ZoomableGroup> & {
  onMoveEnd?: (args: { coordinates?: [number, number]; zoom?: number }) => void;
};
const ZoomableGroupWithMove = ZoomableGroup as React.FC<ZoomableGroupProps>;

function formatRevenue(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const WORLD_CENTER: [number, number] = [20, 20];
const INDIA_CENTER: [number, number] = [78, 22];

function MapZoomControls({
  mapZoom,
  setMapZoom,
}: {
  mapZoom: number;
  setMapZoom: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="absolute bottom-3 right-3 flex flex-col gap-0.5 rounded-lg border border-gray-200 bg-white/95 p-1 shadow-sm z-10">
      <button
        type="button"
        onClick={() => setMapZoom((z) => Math.min(z + 0.8, MAX_ZOOM))}
        disabled={mapZoom >= MAX_ZOOM}
        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setMapZoom((z) => Math.max(z - 0.8, MIN_ZOOM))}
        disabled={mapZoom <= MIN_ZOOM}
        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-colors"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function HeatLegend() {
  return (
    <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm z-10">
      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
        Sales volume
      </span>
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-20 rounded-full shrink-0"
          style={{
            background: `linear-gradient(to right, ${HEAT.light}, ${HEAT.dark})`,
          }}
        />
        <span className="text-[10px] text-gray-500">Low → High</span>
      </div>
    </div>
  );
}

export function GeographyChart() {
  const [activeTab, setActiveTab] = useState<TabId>("worldwide");
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>(WORLD_CENTER);

  const maxWorldOrders = useMemo(
    () => Math.max(...Object.values(worldwideData).map((d) => d.orders), 1),
    [],
  );

  const maxStateOrders = useMemo(
    () => Math.max(...Object.values(indiaStateData).map((d) => d.orders), 1),
    [],
  );

  useEffect(() => {
    if (activeTab === "worldwide") {
      setMapCenter(WORLD_CENTER);
      setMapZoom(1);
    } else {
      setMapCenter(INDIA_CENTER);
      setMapZoom(1.8);
    }
  }, [activeTab]);

  const getFill = useCallback(
    (orders: number, maxOrders: number): string => {
      if (orders <= 0) return HEAT.none;
      const scale = scaleLinear<string>()
        .domain([0, maxOrders])
        .range([HEAT.light, HEAT.dark])
        .clamp(true);
      return scale(orders);
    },
    [],
  );

  const getStroke = useCallback((orders: number): string => {
    return orders <= 0 ? HEAT.strokeNone : HEAT.strokeHover;
  }, []);

  const handleMoveEnd = useCallback(
    ({ coordinates, zoom }: { coordinates?: [number, number]; zoom?: number }) => {
      if (coordinates) setMapCenter(coordinates);
      if (typeof zoom === "number") setMapZoom(zoom);
    },
    [],
  );

  const renderTooltip = (name: string, orders: number, revenue: number) => (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="mt-1 text-xs text-gray-600">
        Orders: {orders.toLocaleString("en-IN")} · Sales: {formatRevenue(revenue)}
      </p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Sales by Geography</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Global sales volume · Hover for details
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full min-h-[320px] sm:min-h-[360px] mt-4">
        {/* ——— Worldwide map ——— */}
        {activeTab === "worldwide" && (
          <div className="w-full overflow-hidden rounded-xl bg-slate-50/30 px-5 pb-2">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 140, center: WORLD_CENTER }}
              width={800}
              height={400}
              className="w-full h-auto max-w-full"
              style={{ width: "100%", height: "auto" }}
            >
              <ZoomableGroupWithMove
                center={mapCenter}
                zoom={mapZoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={WORLD_GEOJSON_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const name = String(
                        geo.properties?.name ??
                          geo.properties?.NAME ??
                          geo.properties?.name_long ??
                          "",
                      );
                      const stats = worldwideData[name] ?? { orders: 0, revenue: 0 };
                      const fill = getFill(stats.orders, maxWorldOrders);
                      const stroke = getStroke(stats.orders);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={stats.orders > 0 ? 0.6 : 0.4}
                          onMouseEnter={() =>
                            setTooltipContent(
                              renderTooltip(name, stats.orders, stats.revenue),
                            )
                          }
                          onMouseLeave={() => setTooltipContent(null)}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              outline: "none",
                              fill: HEAT.hoverFill,
                              stroke: HEAT.strokeHover,
                              strokeWidth: 1,
                              cursor: "pointer",
                            },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroupWithMove>
            </ComposableMap>
            <MapZoomControls mapZoom={mapZoom} setMapZoom={setMapZoom} />
            <HeatLegend />
            {tooltipContent && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                {tooltipContent}
              </div>
            )}
          </div>
        )}

        {/* ——— Country (India) map ——— */}
        {activeTab === "country" && (
          <div className="w-full overflow-hidden rounded-xl bg-slate-50/30 px-5 pb-2">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 1200, center: INDIA_CENTER }}
              width={800}
              height={400}
              className="w-full h-auto max-w-full"
              style={{ width: "100%", height: "auto" }}
            >
              <ZoomableGroupWithMove
                center={mapCenter}
                zoom={mapZoom}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={INDIA_STATES_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const name = String(
                        geo.properties?.st_nm ??
                          geo.properties?.ST_NM ??
                          geo.properties?.STATE ??
                          geo.properties?.name ??
                          "",
                      );
                      const stats = indiaStateData[name] ?? { orders: 0, revenue: 0 };
                      const fill = getFill(stats.orders, maxStateOrders);
                      const stroke = getStroke(stats.orders);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={stats.orders > 0 ? 0.6 : 0.4}
                          onMouseEnter={() =>
                            setTooltipContent(
                              renderTooltip(name, stats.orders, stats.revenue),
                            )
                          }
                          onMouseLeave={() => setTooltipContent(null)}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              outline: "none",
                              fill: HEAT.hoverFill,
                              stroke: HEAT.strokeHover,
                              strokeWidth: 1,
                              cursor: "pointer",
                            },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroupWithMove>
            </ComposableMap>
            <MapZoomControls mapZoom={mapZoom} setMapZoom={setMapZoom} />
            <HeatLegend />
            {tooltipContent && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                {tooltipContent}
              </div>
            )}
          </div>
        )}

        {/* ——— State & City map ——— */}
        {activeTab === "stateCity" && (
          <div className="space-y-4 px-5 pb-4">
            <div className="w-full overflow-hidden rounded-xl bg-slate-50/30 relative">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 1200, center: INDIA_CENTER }}
                width={800}
                height={380}
                className="w-full h-auto max-w-full"
                style={{ width: "100%", height: "auto" }}
              >
                <ZoomableGroupWithMove
                  center={mapCenter}
                  zoom={mapZoom}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  onMoveEnd={handleMoveEnd}
                >
                  <Geographies geography={INDIA_STATES_URL}>
                    {({ geographies }) => (
                      <>
                        {geographies.map((geo) => {
                          const name = String(
                            geo.properties?.st_nm ??
                              geo.properties?.ST_NM ??
                              geo.properties?.STATE ??
                              geo.properties?.name ??
                              "",
                          );
                          const stats = indiaStateData[name] ?? { orders: 0, revenue: 0 };
                          const fill = getFill(stats.orders, maxStateOrders);
                          const stroke = getStroke(stats.orders);
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fill}
                              stroke={stroke}
                              strokeWidth={stats.orders > 0 ? 0.6 : 0.4}
                              onMouseEnter={() =>
                                setTooltipContent(
                                  renderTooltip(name, stats.orders, stats.revenue),
                                )
                              }
                              onMouseLeave={() => setTooltipContent(null)}
                              style={{
                                default: { outline: "none" },
                                hover: {
                                  outline: "none",
                                  fill: HEAT.hoverFill,
                                  stroke: HEAT.strokeHover,
                                  strokeWidth: 1,
                                  cursor: "pointer",
                                },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })}
                        {cityData.map((c) => (
                          <Marker
                            key={`${c.city}-${c.state}`}
                            coordinates={c.coordinates}
                            onMouseEnter={() =>
                              setTooltipContent(
                                renderTooltip(c.city, c.orders, c.revenue),
                              )
                            }
                            onMouseLeave={() => setTooltipContent(null)}
                          >
                            <g>
                              <circle
                                r={4}
                                fill={HEAT.dark}
                                stroke="#fff"
                                strokeWidth={1.5}
                              />
                            </g>
                          </Marker>
                        ))}
                      </>
                    )}
                  </Geographies>
                </ZoomableGroupWithMove>
              </ComposableMap>
              <MapZoomControls mapZoom={mapZoom} setMapZoom={setMapZoom} />
              <HeatLegend />
              {tooltipContent && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  {tooltipContent}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Top cities
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {cityData.map((c) => (
                  <div
                    key={`${c.city}-${c.state}`}
                    className="rounded-lg bg-white border border-gray-100 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{c.city}</p>
                    <p className="text-[11px] text-gray-500 truncate">{c.state}</p>
                    <p className="text-xs font-semibold text-pink-600 mt-0.5">
                      {c.orders.toLocaleString("en-IN")} orders · {formatRevenue(c.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="px-5 py-2 text-[11px] text-gray-400">
        Drag to pan · Scroll to zoom
      </p>
    </div>
  );
}
