import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { analyticsAPI } from "../services/api";

function BarChart({ data, labelKey, valueKey, color = "#00ff9d", height = 120 }) {
  if (!data?.length) return <div style={{ color: "#475569", textAlign: "center", padding: "2rem" }}>No data</div>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, overflowX: "auto" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36, flex: 1 }}>
          <div style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: 2 }}>{d[valueKey]}</div>
          <div style={{ width: "100%", background: color + "88", borderRadius: "2px 2px 0 0", height: `${(d[valueKey] / max) * (height - 30)}px`, transition: "height 0.3s" }} />
          <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 2, textAlign: "center", maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data, labelKey = "label", valueKey = "count" }) {
  if (!data?.length) return <div style={{ color: "#475569", textAlign: "center", padding: "2rem" }}>No data</div>;
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  const COLORS = ["#00ff9d","#0ea5e9","#f59e0b","#a855f7","#dc2626","#ec4899","#14b8a6","#f97316"];
  let cumulAngle = 0;
  const cx = 80, cy = 80, r = 70;
  const slices = data.slice(0, 8).map((d, i) => {
    const angle = (d[valueKey] / total) * 360;
    const start = cumulAngle;
    cumulAngle += angle;
    const toRad = deg => (deg - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { path, color: COLORS[i % COLORS.length], label: d[labelKey], value: d[valueKey] };
  });

  return (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <svg width={160} height={160}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: s.color }} />
            <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{s.label}</span>
            <span style={{ color: "#64748b", fontSize: "0.7rem" }}>({Math.round((s.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemandAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trend, setTrend] = useState("monthly");

  const load = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.serviceDemand();
      setData(res.data);
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const header = "Type,Count\n";
    const rows = data.top_types.map(d => `"${d.type}",${d.count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demand_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trendData = data ? (trend === "weekly" ? data.weekly_trends : data.monthly_trends) : [];
  const trendLabel = trend === "weekly" ? "week" : "month";

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Demand Analytics</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Service request trends and patterns</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={load} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, padding: "0.5rem 1rem", color: "#64748b", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>Refresh</button>
            <button onClick={exportCSV} style={{ background: "#0ea5e922", border: "1px solid #0ea5e955", borderRadius: 6, padding: "0.5rem 1rem", color: "#0ea5e9", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>CSV</button>
          </div>
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : data ? (
          <>
            {/* Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                ["Current Month", data.comparison.current_month, "#00ff9d"],
                ["Previous Month", data.comparison.previous_month, "#0ea5e9"],
                ["Change", `${data.comparison.change_pct > 0 ? "+" : ""}${data.comparison.change_pct}%`, data.comparison.change_pct >= 0 ? "#00ff9d" : "#dc2626"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color }}>{value}</div>
                  <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "0.25rem" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Trends */}
              <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ color: "#e2e8f0", margin: 0, fontSize: "0.9rem" }}>Request Trends</h3>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {["weekly", "monthly"].map(t => (
                      <button key={t} onClick={() => setTrend(t)}
                        style={{ background: trend === t ? "#00ff9d22" : "none", border: `1px solid ${trend === t ? "#00ff9d55" : "#1e293b"}`, borderRadius: 4, padding: "3px 10px", color: trend === t ? "#00ff9d" : "#64748b", cursor: "pointer", fontFamily: "monospace", fontSize: "0.7rem" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <BarChart data={trendData} labelKey={trendLabel} valueKey="count" color="#00ff9d" height={140} />
              </div>

              {/* Top Types */}
              <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
                <h3 style={{ color: "#e2e8f0", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>Top Request Types</h3>
                <BarChart data={data.top_types} labelKey="type" valueKey="count" color="#0ea5e9" height={140} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Peak Days */}
              <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
                <h3 style={{ color: "#e2e8f0", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>Peak Days</h3>
                <BarChart data={data.peak_days} labelKey="day" valueKey="count" color="#a855f7" height={120} />
              </div>

              {/* Peak Hours */}
              <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
                <h3 style={{ color: "#e2e8f0", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>Peak Hours</h3>
                <BarChart data={data.peak_hours} labelKey="hour" valueKey="count" color="#f59e0b" height={120} />
              </div>
            </div>

            {/* By Category Pie */}
            <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem" }}>
              <h3 style={{ color: "#e2e8f0", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>By Category</h3>
              <PieChart data={data.by_category.map(d => ({ label: d.category, count: d.count }))} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
