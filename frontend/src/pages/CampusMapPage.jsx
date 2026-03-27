import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import DepartmentCard from "../components/DepartmentCard";
import { departmentAPI, locationAPI } from "../services/api";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

function FlyTo({ lat, lng, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.flyTo([lat, lng], zoom, { duration: 0.8 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

export default function CampusMapPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedLocation, setSelectedLocation] = useState(null); // location payload
  const [selectedDepartment, setSelectedDepartment] = useState(null); // full department payload
  const [showDetails, setShowDetails] = useState(false);

  const defaultCenter = useMemo(() => [24.8609, 67.0018], []);

  const doSearch = useCallback(async (q) => {
    const trimmed = (q || "").trim();
    if (!trimmed) {
      setResults([]);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await locationAPI.search(trimmed);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err.response?.status;
      setResults([]);
      setError(
        status
          ? `Search failed (HTTP ${status}).`
          : "Cannot reach the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDepartment = useCallback(async (loc) => {
    setSelectedLocation(loc);
    setSelectedDepartment(null);
    setShowDetails(false);

    try {
      const deptRes = await departmentAPI.getById(loc.id);
      setSelectedDepartment(deptRes.data || null);
    } catch {
      // Keep the map highlight even if full details fail
      setSelectedDepartment({
        id: loc.id,
        name: loc.name,
        building_location: loc.building_location,
      });
    }
  }, []);

  const selectedLat = selectedLocation?.building_lat;
  const selectedLng = selectedLocation?.building_lng;
  const hasCoords = typeof selectedLat === "number" && typeof selectedLng === "number";

  const openDirectionsForLocation = useCallback((loc) => {
    if (!loc) return;
    const query = encodeURIComponent(
      `${loc.name} ${loc.building_location || ""} SUMIS campus`
    );
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener"
    );
  }, []);

  const handleGetDirections = useCallback(() => {
    openDirectionsForLocation(selectedLocation);
  }, [openDirectionsForLocation, selectedLocation]);

  const openLocationDetailForLocation = useCallback(
    (loc) => {
      selectDepartment(loc);
      setShowDetails(true);
    },
    [selectDepartment]
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>FR-01 · Campus Location</p>
            <h1 style={styles.title}>Campus Map</h1>
            <p style={styles.subtitle}>
              Search a department and jump straight to its building on the map.
            </p>
          </div>
        </header>

        <section style={styles.shell}>
          {/* Left: Controls + Selected summary card */}
          <aside style={styles.sidebar}>
            <div style={styles.searchCard}>
              {/* Big search bar like the wireframe */}
              <div style={styles.searchRow}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search labs, departments, library…"
                  style={styles.searchInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") doSearch(query);
                  }}
                />
                <button
                  style={styles.searchBtn}
                  disabled={loading}
                  onClick={() => doSearch(query)}
                >
                  {loading ? "Searching…" : "Search"}
                </button>
              </div>

              {/* Selected location summary card */}
              <div style={styles.selectedCard}>
                {selectedLocation ? (
                  <>
                    <div style={styles.selectedHeader}>
                      <div>
                        <p style={styles.selectedTitle}>{selectedLocation.name}</p>
                        <p style={styles.selectedMeta}>
                          {selectedLocation.building_location || "Location not specified"}
                        </p>
                      </div>
                      <button
                        style={styles.directionsBtn}
                        type="button"
                        onClick={handleGetDirections}
                      >
                        Get Directions
                      </button>
                    </div>

                    <div style={styles.selectedBullets}>
                      <div style={styles.bulletRow}>
                        <span style={styles.bulletIcon}>📍</span>
                        <span style={styles.bulletText}>
                          Coordinates:{" "}
                          {selectedLocation.building_lat?.toFixed(5)},{" "}
                          {selectedLocation.building_lng?.toFixed(5)}
                        </span>
                      </div>
                      {selectedDepartment?.services && (
                        <div style={styles.bulletRow}>
                          <span style={styles.bulletIcon}>🛠</span>
                          <span style={styles.bulletText}>{selectedDepartment.services}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      style={styles.detailsToggle}
                      onClick={() => setShowDetails((v) => !v)}
                    >
                      Location Detail
                      <span style={styles.detailsToggleIcon}>{showDetails ? "▲" : "▼"}</span>
                    </button>

                    {showDetails && selectedDepartment && (
                      <div style={styles.selectedDetails}>
                        <DepartmentCard department={selectedDepartment} />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.emptyDetails}>
                    <span style={styles.emptyIcon}>⌕</span>
                    <p style={styles.emptyText}>
                      Search and select a location to view its details here.
                    </p>
                  </div>
                )}
              </div>

              {/* Error + results list under the main card */}
              {error && (
                <div style={styles.errorBox}>
                  <span style={styles.errorTitle}>Search error</span>
                  <span style={styles.errorMsg}>{error}</span>
                </div>
              )}

              {results.length > 0 && (
                <div style={styles.results}>
                  <div style={styles.resultsHeader}>
                    <span style={styles.resultsTitle}>Matching locations</span>
                    <span style={styles.resultsCount}>{results.length}</span>
                  </div>
                  <div style={styles.resultsList}>
                    {results.map((r) => {
                      const active = selectedLocation?.id === r.id;
                      const coordMissing =
                        typeof r.building_lat !== "number" || typeof r.building_lng !== "number";
                      return (
                        <button
                          key={r.id}
                          type="button"
                          style={active ? { ...styles.resultBtn, ...styles.resultBtnActive } : styles.resultBtn}
                          onClick={() => selectDepartment(r)}
                        >
                          <div style={styles.resultTopRow}>
                            <span style={styles.resultName}>{r.name}</span>
                            {coordMissing && <span style={styles.badgeWarn}>No coords</span>}
                          </div>
                          <span style={styles.resultMeta}>
                            {r.building_location || "Location not specified"}
                          </span>
                          <div style={styles.resultActions}>
                            <span
                              style={styles.actionLink}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDirectionsForLocation(r);
                              }}
                            >
                              Get Directions
                            </span>
                            <span
                              style={styles.actionLink}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openLocationDetailForLocation(r);
                              }}
                            >
                              Location Detail
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right: Map */}
          <div style={styles.mapWrap}>
            <MapContainer
              center={hasCoords ? [selectedLat, selectedLng] : defaultCenter}
              zoom={hasCoords ? 17 : 15}
              style={styles.map}
              scrollWheelZoom
            >
              {hasCoords && <FlyTo lat={selectedLat} lng={selectedLng} />}

              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {results.map((r) => {
                const lat = r?.building_lat;
                const lng = r?.building_lng;
                const valid = typeof lat === "number" && typeof lng === "number";
                if (!valid) return null;

                const active = selectedLocation?.id === r.id;
                const radius = active ? 18 : 12;
                const color = active ? "#6366f1" : "#94a3b8";

                return (
                  <CircleMarker
                    key={r.id}
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{
                      color,
                      weight: 2,
                      fillColor: color,
                      fillOpacity: active ? 0.18 : 0.1,
                    }}
                    eventHandlers={{
                      click: () => selectDepartment(r),
                    }}
                  >
                    <Popup>
                      <div style={{ fontFamily: "monospace" }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.name}</div>
                        <div style={{ color: "#475569" }}>{r.building_location}</div>
                        <div style={{ color: "#94a3b8", marginTop: 6 }}>
                          lat={lat.toFixed(5)} lng={lng.toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0a0a0f" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "48px 32px" },

  header: { marginBottom: 20 },
  eyebrow: {
    margin: "0 0 6px",
    fontSize: 11,
    color: "#475569",
    fontFamily: "monospace",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  title: { margin: "0 0 8px", fontSize: 32, color: "#e2e8f0", fontFamily: "'Georgia', serif", fontWeight: "normal" },
  subtitle: { margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.6, maxWidth: 720 },

  shell: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 16,
    alignItems: "start",
  },

  sidebar: { display: "flex", flexDirection: "column", gap: 16 },

  searchCard: {
    padding: 20,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(15,23,42,0.7)",
    backdropFilter: "blur(12px)",
  },
  searchRow: { display: "flex", gap: 8, alignItems: "center" },
  searchInput: {
    flex: 1,
    padding: "11px 14px",
    background: "rgba(2,6,23,0.65)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 8,
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "monospace",
    outline: "none",
  },
  searchBtn: {
    padding: "11px 16px",
    background: "rgba(99,102,241,0.14)",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: 8,
    color: "#a5b4fc",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "0.05em",
  },

  hintRow: { display: "flex", gap: 10, alignItems: "center", marginTop: 12 },
  hintPill: {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(99,102,241,0.25)",
    color: "#a5b4fc",
    fontFamily: "monospace",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  hintText: { fontSize: 12, color: "#64748b" },

  // Selected location summary card (wireframe-style)
  selectedCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(15,23,42,0.9)",
  },
  selectedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  selectedTitle: {
    margin: "0 0 4px",
    fontSize: 16,
    color: "#e2e8f0",
    fontFamily: "'Georgia', serif",
  },
  selectedMeta: {
    margin: 0,
    fontSize: 12,
    color: "#94a3b8",
  },
  directionsBtn: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.4)",
    background: "rgba(15,23,42,0.9)",
    color: "#e2e8f0",
    fontSize: 12,
    fontFamily: "monospace",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  selectedBullets: {
    marginTop: 4,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  bulletRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  bulletIcon: { fontSize: 14 },
  bulletText: { fontSize: 12, color: "#cbd5e1", fontFamily: "monospace" },
  detailsToggle: {
    width: "100%",
    marginTop: 4,
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(15,23,42,0.9)",
    color: "#94a3b8",
    fontSize: 11,
    fontFamily: "monospace",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsToggleIcon: { marginLeft: 6 },
  selectedDetails: {
    marginTop: 10,
  },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.22)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  errorTitle: { fontSize: 11, color: "#fecaca", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" },
  errorMsg: { fontSize: 12, color: "#fca5a5", fontFamily: "monospace" },

  results: { marginTop: 14 },
  resultsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  resultsTitle: { fontSize: 11, color: "#475569", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" },
  resultsCount: { fontSize: 11, color: "#94a3b8", fontFamily: "monospace" },
  resultsList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto", paddingRight: 4 },
  resultBtn: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(2,6,23,0.5)",
    cursor: "pointer",
  },
  resultBtnActive: {
    borderColor: "rgba(99,102,241,0.5)",
    background: "rgba(99,102,241,0.12)",
  },
  resultTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  resultName: { fontSize: 13, color: "#e2e8f0", fontFamily: "'Georgia', serif" },
  resultMeta: { display: "block", marginTop: 4, fontSize: 11, color: "#64748b", fontFamily: "monospace" },
  badgeWarn: {
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(245,158,11,0.35)",
    color: "#fbbf24",
    fontFamily: "monospace",
  },
  resultActions: {
    display: "flex",
    gap: 12,
    marginTop: 10,
    alignItems: "center",
  },
  actionLink: {
    fontSize: 11,
    color: "#818cf8",
    fontFamily: "monospace",
    cursor: "pointer",
    textDecoration: "underline",
    userSelect: "none",
  },

  emptyDetails: { padding: "22px 10px", textAlign: "center" },
  emptyIcon: { display: "block", fontSize: 28, color: "#6366f1", marginBottom: 8 },
  emptyText: { margin: 0, fontSize: 12, color: "#64748b", fontFamily: "monospace", lineHeight: 1.6 },

  mapWrap: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(148,163,184,0.15)",
    background: "rgba(2,6,23,0.4)",
    minHeight: 660,
  },
  map: { height: 660, width: "100%" },
  mapOverlay: { position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 14 },
  overlayCard: {
    pointerEvents: "none",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(2,6,23,0.75)",
    border: "1px solid rgba(148,163,184,0.18)",
    backdropFilter: "blur(10px)",
    maxWidth: 300,
  },
  overlayTitle: { margin: "0 0 4px", fontSize: 12, color: "#e2e8f0", fontFamily: "monospace" },
  overlayText: { margin: 0, fontSize: 11, color: "#64748b", fontFamily: "monospace", lineHeight: 1.5 },
};

