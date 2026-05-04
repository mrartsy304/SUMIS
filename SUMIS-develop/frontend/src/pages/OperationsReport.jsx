import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { reportsAPI } from "../services/api";

function StatBox({ label, value, sub, color = "#00ff9d" }) {
  return (
    <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>{value ?? "—"}</div>
      <div style={{ color: "#e2e8f0", fontSize: "0.85rem", margin: "0.25rem 0" }}>{label}</div>
      {sub && <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{sub}</div>}
    </div>
  );
}

export default function OperationsReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.operations();
      setData(res.data);
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const header = "Department,Total,Completed,Pending\n";
    const rows = data.by_department.map(d =>
      `"${d.department}",${d.total},${d.completed},${d.pending}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `operations_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", fontFamily: "monospace", color: "#e2e8f0" }}>
      <Navbar />
      <div ref={printRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "#00ff9d", marginBottom: "0.25rem" }}>Operations Report</h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>SLA: 48 hours · Generated {new Date().toLocaleString()}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={load} style={{ background: "none", border: "1px solid #334155", borderRadius: 6, padding: "0.5rem 1rem", color: "#64748b", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>Refresh</button>
            <button onClick={exportCSV} style={{ background: "#0ea5e922", border: "1px solid #0ea5e955", borderRadius: 6, padding: "0.5rem 1rem", color: "#0ea5e9", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>CSV</button>
            <button onClick={printReport} style={{ background: "#00ff9d22", border: "1px solid #00ff9d55", borderRadius: 6, padding: "0.5rem 1rem", color: "#00ff9d", cursor: "pointer", fontFamily: "monospace", fontSize: "0.8rem" }}>Print PDF</button>
          </div>
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #dc2626", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", color: "#00ff9d", padding: "3rem" }}>Loading...</div>
        ) : data ? (
          <>
            <h2 style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", letterSpacing: "0.1em" }}>COMPLAINTS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <StatBox label="Total" value={data.complaints.total} />
              <StatBox label="Resolved" value={data.complaints.resolved} color="#00ff9d" />
              <StatBox label="Pending" value={data.complaints.pending} color="#f59e0b" />
              <StatBox label="In Progress" value={data.complaints.in_progress} color="#0ea5e9" />
              <StatBox label="Avg Resolution" value={`${data.complaints.avg_resolution_hours}h`} color="#a855f7" />
            </div>

            <h2 style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", letterSpacing: "0.1em" }}>SERVICE REQUESTS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <StatBox label="Total" value={data.services.total} />
              <StatBox label="Completed" value={data.services.completed} color="#00ff9d" />
              <StatBox label="Pending" value={data.services.pending} color="#f59e0b" />
              <StatBox label="Rejected" value={data.services.rejected} color="#dc2626" />
              <StatBox label="Avg Completion" value={`${data.services.avg_completion_hours}h`} color="#a855f7" />
              <StatBox label="SLA Breaches" value={data.services.breached_sla} color="#dc2626" sub={`>${data.services.sla_hours}h`} />
            </div>

            <h2 style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", letterSpacing: "0.1em" }}>BY DEPARTMENT</h2>
            <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden", marginBottom: "2rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b" }}>
                    {["Department", "Total", "Completed", "Pending", "Completion %"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#64748b", fontSize: "0.75rem", fontWeight: "normal" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.by_department.map((d, i) => {
                    const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #1e293b11" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#e2e8f0" }}>{d.department}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#94a3b8" }}>{d.total}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#00ff9d" }}>{d.completed}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#f59e0b" }}>{d.pending}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, background: "#00ff9d", height: "100%", borderRadius: 4 }} />
                            </div>
                            <span style={{ color: "#64748b", fontSize: "0.75rem", minWidth: 36 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Simple bar chart */}
            <h2 style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem", letterSpacing: "0.1em" }}>DEPARTMENT CHART</h2>
            <div style={{ background: "#0f0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "1.25rem", marginBottom: "2rem" }}>
              {data.by_department.map((d, i) => {
                const maxTotal = Math.max(...data.by_department.map(x => x.total), 1);
                return (
                  <div key={i} style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{d.department}</span>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{d.total}</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 4, height: 20, overflow: "hidden", position: "relative" }}>
                      <div style={{ width: `${(d.completed / maxTotal) * 100}%`, background: "#00ff9d", height: "100%", position: "absolute", left: 0 }} />
                      <div style={{ width: `${(d.pending / maxTotal) * 100}%`, background: "#f59e0b55", height: "100%", position: "absolute", left: `${(d.completed / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem" }}>
                <span style={{ color: "#64748b", fontSize: "0.75rem" }}><span style={{ color: "#00ff9d" }}>■</span> Completed</span>
                <span style={{ color: "#64748b", fontSize: "0.75rem" }}><span style={{ color: "#f59e0b" }}>■</span> Pending</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
