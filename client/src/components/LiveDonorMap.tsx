/**
 * LiveDonorMap
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-featured live donor map that:
 *  • Uses the browser's real geolocation (never faked)
 *  • Shows a "You are here" marker
 *  • Places donor markers colour-coded by blood group
 *  • Opens an info popup on marker click (blood group, distance, availability, last updated)
 *  • Provides a blood-group filter bar (All + 8 groups)
 *  • Falls back gracefully when permission is denied (shows manual-entry form)
 *  • Lists nearby donors sorted by distance below the map
 * ─────────────────────────────────────────────────────────────────────────────
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Crosshair,
  Droplets,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/Map";
import {
  ALL_BLOOD_GROUPS,
  type BloodGroupKey,
  type DonorWithDistance,
  useLiveMap,
} from "@/hooks/useLiveMap";

// ── Blood-group colour palette ────────────────────────────────────────────────
// Each group gets a distinct, accessible colour used for map markers and legend.
const BLOOD_GROUP_COLORS: Record<BloodGroupKey, string> = {
  "A+":  "#e05c5c", // red
  "A-":  "#c0392b", // dark red
  "B+":  "#2980b9", // blue
  "B-":  "#1a5276", // dark blue
  "AB+": "#8e44ad", // purple
  "AB-": "#6c3483", // dark purple
  "O+":  "#1fa091", // teal (brand)
  "O-":  "#148a7d", // dark teal
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatLastUpdated(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60); // minutes
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function availabilityClass(a: string): string {
  if (a === "Available now")   return "available-pill";
  if (a === "Available today") return "available-pill available-pill--today";
  return "available-pill available-pill--off";
}

// ── Manual location fallback form ─────────────────────────────────────────────

function ManualLocationForm({
  onSubmit,
  onRetry,
}: {
  onSubmit: (lat: number, lng: number) => void;
  onRetry: () => void;
}) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [err, setErr] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (isNaN(la) || la < -90 || la > 90) { setErr("Latitude must be between -90 and 90."); return; }
    if (isNaN(lo) || lo < -180 || lo > 180) { setErr("Longitude must be between -180 and 180."); return; }
    setErr("");
    onSubmit(la, lo);
  };

  return (
    <div className="geo-denied-card">
      <div className="geo-denied-card__icon">
        <AlertTriangle size={22} />
      </div>
      <div className="geo-denied-card__body">
        <strong>Location access was denied</strong>
        <p>
          LifeLink needs your location to show nearby donors. Allow location
          access in your browser settings, or enter your coordinates manually.
        </p>
        <div className="geo-denied-card__actions">
          <button className="button button--dark" onClick={onRetry} type="button">
            <RefreshCw size={14} /> Retry permission
          </button>
        </div>
        <div className="geo-manual-form">
          <span className="section-eyebrow" style={{ marginBottom: 10, display: "block" }}>
            Or enter coordinates manually
          </span>
          <form onSubmit={handle} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Latitude</span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 17.4381"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{
                  width: "100%", background: "var(--card)", border: "1px solid var(--line)",
                  borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--ink)", outline: "none",
                }}
              />
            </label>
            <label style={{ flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Longitude</span>
              <input
                type="number"
                step="any"
                placeholder="e.g. 78.3989"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{
                  width: "100%", background: "var(--card)", border: "1px solid var(--line)",
                  borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--ink)", outline: "none",
                }}
              />
            </label>
            <button type="submit" className="button button--dark" style={{ alignSelf: "flex-end" }}>
              <MapPin size={14} /> Use location
            </button>
          </form>
          {err && (
            <p style={{ color: "var(--coral)", fontSize: 11, marginTop: 8 }}>{err}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LiveDonorMapProps {
  onCreateRequest?: () => void;
  onViewDonorList?: () => void;
}

export function LiveDonorMap({ onCreateRequest, onViewDonorList }: LiveDonorMapProps) {
  const {
    geoStatus,
    userLocation,
    locationUpdatedAt,
    filteredDonors,
    activeFilter,
    setFilter,
    setManualLocation,
    retryGeolocation,
  } = useLiveMap();

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<DonorWithDistance | null>(null);

  // ── Place / refresh all markers when map or donors change ──────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation) return;
    const map = mapRef.current;

    // Close any open info window
    infoWindowRef.current?.close();

    // Remove old donor markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Remove old user marker
    userMarkerRef.current?.setMap(null);

    // ── "You are here" marker ──────────────────────────────────────────────
    userMarkerRef.current = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map,
      title: "You are here",
      zIndex: 1000,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 13,
        fillColor: "#ffffff",
        fillOpacity: 1,
        strokeColor: "#ef6e5b",
        strokeWeight: 4,
      },
      label: {
        text: "●",
        color: "#ef6e5b",
        fontSize: "10px",
        fontWeight: "800",
      },
    });

    // Pulsing outer ring for "You are here"
    new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map,
      title: "",
      zIndex: 999,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 22,
        fillColor: "#ef6e5b",
        fillOpacity: 0.18,
        strokeColor: "#ef6e5b",
        strokeWeight: 1.5,
      },
    });

    // Center map on user
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });

    // ── Donor markers ──────────────────────────────────────────────────────
    const iw = new window.google.maps.InfoWindow();
    infoWindowRef.current = iw;

    filteredDonors.forEach((donor) => {
      const color = BLOOD_GROUP_COLORS[donor.bloodGroup];
      const marker = new window.google.maps.Marker({
        position: { lat: donor.lat, lng: donor.lng },
        map,
        title: `${donor.name} · ${donor.bloodGroup}`,
        zIndex: 10,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
        label: {
          text: donor.bloodGroup.length <= 2 ? donor.bloodGroup : donor.bloodGroup.slice(0, 2),
          color: "#ffffff",
          fontSize: "8px",
          fontWeight: "800",
        },
      });

      marker.addListener("click", () => {
        setSelectedDonor(donor);
        iw.setContent(`
          <div style="
            font-family:'DM Sans',sans-serif;
            padding:4px 2px;
            min-width:180px;
            color:#17212b;
          ">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="
                display:inline-flex;align-items:center;justify-content:center;
                width:32px;height:32px;border-radius:50%;
                background:${color};color:#fff;
                font-size:11px;font-weight:800;
              ">${donor.bloodGroup}</span>
              <div>
                <strong style="font-size:13px;display:block">${donor.name}</strong>
                <span style="font-size:10px;color:#71808b;">Blood Group ${donor.bloodGroup}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;font-size:11px;">
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#71808b;">Distance</span>
                <strong>${formatDistance(donor.distanceKm)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#71808b;">Availability</span>
                <strong style="color:${donor.availability === 'Available now' ? '#1fa091' : donor.availability === 'Available today' ? '#e8a83d' : '#9aa5aa'}">${donor.availability}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#71808b;">Last updated</span>
                <strong>${formatLastUpdated(donor.lastUpdated)}</strong>
              </div>
            </div>
          </div>
        `);
        iw.open(map, marker);
      });

      markersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, filteredDonors, userLocation]);

  // ── Status line text ───────────────────────────────────────────────────────
  const statusText = (() => {
    if (geoStatus === "requesting") return "Acquiring your location…";
    if (geoStatus === "denied" || geoStatus === "unavailable") return "Location unavailable";
    if (geoStatus === "manual") return "Using manual location";
    if (locationUpdatedAt) {
      return `Location updated ${formatLastUpdated(locationUpdatedAt.toISOString())}`;
    }
    return "Waiting for location…";
  })();

  const isDenied = geoStatus === "denied" || geoStatus === "unavailable";
  const isReady  = (geoStatus === "granted" || geoStatus === "manual") && !!userLocation;

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="map-toolbar">
        <div className="map-status">
          <span className={cn("live-dot", isDenied && "live-dot--off")} />
          Live network · {statusText}
        </div>
        <div className="map-toolbar__actions">
          {/* Blood-group filter buttons */}
          <button
            className={cn("filter-button", activeFilter === "All" && "filter-button--active")}
            onClick={() => setFilter("All")}
          >
            <Droplets size={13} /> All
          </button>
          {ALL_BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              className={cn("filter-button", activeFilter === bg && "filter-button--active")}
              style={activeFilter === bg ? { borderColor: BLOOD_GROUP_COLORS[bg], color: BLOOD_GROUP_COLORS[bg] } : {}}
              onClick={() => setFilter(bg)}
            >
              {bg}
            </button>
          ))}
          <button
            className="filter-button"
            onClick={retryGeolocation}
            title="Re-request location"
          >
            <Navigation size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Denied / unavailable fallback ────────────────────────────────────── */}
      {isDenied && (
        <ManualLocationForm onSubmit={setManualLocation} onRetry={retryGeolocation} />
      )}

      {/* ── Requesting spinner ───────────────────────────────────────────────── */}
      {geoStatus === "requesting" && (
        <div className="geo-loading-card">
          <div className="geo-loading-card__spinner" />
          <span>Requesting your location…</span>
        </div>
      )}

      {/* ── Map panel ────────────────────────────────────────────────────────── */}
      {(isReady || geoStatus === "requesting") && (
        <section className="map-panel">
          <div className="map-canvas">
            {/* Fallback skeleton shown while Google Maps loads */}
            <div className={cn("map-fallback", mapReady && "map-fallback--hidden")} aria-hidden={mapReady}>
              <div className="fallback-road fallback-road--one" />
              <div className="fallback-road fallback-road--two" />
              <div className="fallback-road fallback-road--three" />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <Activity size={20} style={{ color: "var(--teal)", marginBottom: 6 }} />
                <p style={{ fontSize: 11, color: "var(--muted)" }}>Loading map…</p>
              </div>
            </div>

            <MapView
              initialCenter={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 20.5937, lng: 78.9629 }}
              initialZoom={13}
              onMapReady={(map) => {
                mapRef.current = map;
                setMapReady(true);
              }}
            />
          </div>

          {/* Top overlay */}
          <div className="map-overlay map-overlay--top">
            <div className="map-overlay__title">
              <span className="section-eyebrow">Live coordination view</span>
              <strong>
                {geoStatus === "manual" ? "Manual location" : "Your current location"} · {filteredDonors.length} donor{filteredDonors.length !== 1 ? "s" : ""} nearby
              </strong>
            </div>
            <span className="map-radius">
              <Crosshair size={13} /> Real location
            </span>
          </div>

          {/* Bottom legend */}
          <div className="map-overlay map-overlay--bottom">
            <div className="map-legend">
              <span>
                <i className="legend-dot" style={{ background: "#ef6e5b", display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 4 }} />
                You are here
              </span>
              {ALL_BLOOD_GROUPS.slice(0, 4).map((bg) => (
                <span key={bg}>
                  <i style={{ background: BLOOD_GROUP_COLORS[bg], display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 4 }} />
                  {bg}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Detail grid ──────────────────────────────────────────────────────── */}
      {isReady && (
        <div className="map-detail-grid">
          {/* Selected donor card */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow section-eyebrow--red">Tap a marker to select</span>
                <h3>{selectedDonor ? `${selectedDonor.name}` : "Select a donor on the map"}</h3>
              </div>
              {onCreateRequest && (
                <button className="text-button" onClick={onCreateRequest}>
                  New request <span style={{ fontSize: 14 }}>+</span>
                </button>
              )}
            </div>
            {selectedDonor ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: BLOOD_GROUP_COLORS[selectedDonor.bloodGroup],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 12,
                  }}>
                    {selectedDonor.bloodGroup}
                  </span>
                  <div>
                    <strong style={{ fontSize: 13 }}>{selectedDonor.name}</strong>
                    <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 2 }}>
                      {selectedDonor.donorId}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Blood group", value: selectedDonor.bloodGroup },
                    { label: "Distance", value: formatDistance(selectedDonor.distanceKm) },
                    { label: "Last updated", value: formatLastUpdated(selectedDonor.lastUpdated) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "var(--canvas)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>{value}</div>
                    </div>
                  ))}
                  <div style={{ background: "var(--canvas)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ color: "var(--muted)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Availability</div>
                    <span className={availabilityClass(selectedDonor.availability)} style={{ marginTop: 4, display: "inline-block" }}>
                      {selectedDonor.availability}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--muted)", fontSize: 11, padding: "8px 0" }}>
                Click any donor marker on the map to view their details here.
              </p>
            )}
          </section>

          {/* Nearby donors list sorted by distance */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">Sorted by distance</span>
                <h3>Nearby donors ({filteredDonors.length})</h3>
              </div>
              {onViewDonorList && (
                <button className="text-button" onClick={onViewDonorList}>
                  Full list <span style={{ fontSize: 14 }}>›</span>
                </button>
              )}
            </div>
            <div className="map-donor-list">
              {filteredDonors.slice(0, 6).map((donor) => (
                <div
                  key={donor.donorId}
                  className={cn("map-donor", selectedDonor?.donorId === donor.donorId && "map-donor--selected")}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedDonor(donor)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedDonor(donor)}
                  aria-label={`Select ${donor.name}`}
                >
                  <span
                    className="map-donor__dot"
                    style={{ background: BLOOD_GROUP_COLORS[donor.bloodGroup] }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 11 }}>{donor.name}</strong>
                    <small style={{ color: "var(--muted)" }}>
                      {donor.bloodGroup} · {formatDistance(donor.distanceKm)} away
                    </small>
                  </span>
                  <span className={availabilityClass(donor.availability)} style={{ flexShrink: 0 }}>
                    {donor.availability === "Available now" ? "Now" : donor.availability === "Available today" ? "Today" : "Away"}
                  </span>
                </div>
              ))}
              {filteredDonors.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 11, padding: "8px 0" }}>
                  No donors match the selected blood group filter.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
