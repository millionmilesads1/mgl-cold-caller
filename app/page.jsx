"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const OPENERS = [
  '"Hey [NAME], this is Hitesh. I will be honest, this is a cold call. You can hang up or give me 20 seconds. What do you say?"',
  '"Hey [NAME], this is Hitesh. I know you were not hoping a stranger calls right now. Give me 20 seconds, if I waste your time I will disappear. Deal?"',
  '"Hey [NAME], this is Hitesh. Before you hang up, this is not about your car warranty. I looked at your business and have a real question. Got 20 seconds?"',
];
const HOOKS = [
  'I pulled up [WEBSITE] on my phone. If I was a homeowner in [CITY] needing [SERVICE], honestly I would call [COMPETITOR] first. Not because they are better. Their site just looks like they have their act together.',
  'I Googled "[SERVICE] in [CITY]" and found you. Great reviews. But your website tells a different story. Looks like it was built a few years back and might be turning customers away.',
];
const ASK = 'I can put together a quick before-and-after mockup. Takes me 20 minutes. No charge, no pitch. I send it and you decide if a 10 minute chat is worth it. Fair enough?';
const CLOSE = 'Awesome. I will send that by [DAY]. Look for an email from Hitesh at MGL. Appreciate your time [NAME].';
const OBJECTIONS = [
  ["I have a website guy", 'When did they last update the design, not content? What looked pro in 2022 looks outdated in 2026. Not saying fire them. Let me show you the gap.'],
  ["Not interested", 'Fair. If I could show you in ONE screenshot why [COMPETITOR] looks more trustworthy than your site, worth a 2 min email?'],
  ["How much?", 'Most [INDUSTRY] clients are $2,500 to $7,000. But let me show the gap first. If the value is not obvious, price does not matter.'],
  ["Send me an email", 'Happy to. I will send one screenshot comparing your site to [COMPETITOR]. If it grabs you, reply. Best email?'],
  ["I am busy", 'Respect that. When is better for a 2 min call? Morning or afternoon?'],
];
const DISPS = [
  { id: "interested", l: "Interested", c: "#22c55e", i: "🎯" },
  { id: "callback", l: "Callback", c: "#f59e0b", i: "📞" },
  { id: "followup", l: "Follow-up", c: "#3b82f6", i: "📧" },
  { id: "declined", l: "Declined", c: "#ef4444", i: "✕" },
  { id: "no_answer", l: "No Answer", c: "#6b7280", i: "—" },
  { id: "voicemail", l: "Voicemail", c: "#8b5cf6", i: "💬" },
];
const INDS = ["Roofing", "HVAC", "Plumbing", "Electrical", "Landscaping", "Pest Control", "Painting", "Other"];
const STATE_TZ = { AZ:"America/Phoenix",AL:"America/Chicago",AK:"America/Anchorage",AR:"America/Chicago",CA:"America/Los_Angeles",CO:"America/Denver",CT:"America/New_York",DE:"America/New_York",FL:"America/New_York",GA:"America/New_York",HI:"Pacific/Honolulu",ID:"America/Boise",IL:"America/Chicago",IN:"America/Indiana/Indianapolis",IA:"America/Chicago",KS:"America/Chicago",KY:"America/New_York",LA:"America/Chicago",ME:"America/New_York",MD:"America/New_York",MA:"America/New_York",MI:"America/Detroit",MN:"America/Chicago",MS:"America/Chicago",MO:"America/Chicago",MT:"America/Denver",NE:"America/Chicago",NV:"America/Los_Angeles",NH:"America/New_York",NJ:"America/New_York",NM:"America/Denver",NY:"America/New_York",NC:"America/New_York",ND:"America/Chicago",OH:"America/New_York",OK:"America/Chicago",OR:"America/Los_Angeles",PA:"America/New_York",RI:"America/New_York",SC:"America/New_York",SD:"America/Chicago",TN:"America/Chicago",TX:"America/Chicago",UT:"America/Denver",VT:"America/New_York",VA:"America/New_York",WA:"America/Los_Angeles",WV:"America/New_York",WI:"America/Chicago",WY:"America/Denver",DC:"America/New_York" };
const STATES = Object.keys(STATE_TZ);
const STATE_NAMES = { ALABAMA:"AL",ALASKA:"AK",ARIZONA:"AZ",ARKANSAS:"AR",CALIFORNIA:"CA",COLORADO:"CO",CONNECTICUT:"CT",DELAWARE:"DE",FLORIDA:"FL",GEORGIA:"GA",HAWAII:"HI",IDAHO:"ID",ILLINOIS:"IL",INDIANA:"IN",IOWA:"IA",KANSAS:"KS",KENTUCKY:"KY",LOUISIANA:"LA",MAINE:"ME",MARYLAND:"MD",MASSACHUSETTS:"MA",MICHIGAN:"MI",MINNESOTA:"MN",MISSISSIPPI:"MS",MISSOURI:"MO",MONTANA:"MT",NEBRASKA:"NE",NEVADA:"NV","NEW HAMPSHIRE":"NH","NEW JERSEY":"NJ","NEW MEXICO":"NM","NEW YORK":"NY","NORTH CAROLINA":"NC","NORTH DAKOTA":"ND",OHIO:"OH",OKLAHOMA:"OK",OREGON:"OR",PENNSYLVANIA:"PA","RHODE ISLAND":"RI","SOUTH CAROLINA":"SC","SOUTH DAKOTA":"SD",TENNESSEE:"TN",TEXAS:"TX",UTAH:"UT",VERMONT:"VT",VIRGINIA:"VA",WASHINGTON:"WA","WEST VIRGINIA":"WV",WISCONSIN:"WI",WYOMING:"WY","DISTRICT OF COLUMBIA":"DC" };
const extractState = (p) => {
  if (p.state) { const s = p.state.trim().toUpperCase(); if (STATE_TZ[s]) return s; if (STATE_NAMES[s]) return STATE_NAMES[s]; }
  // Try to find state abbreviation in address like "Phoenix, AZ 85050"
  const fields = [p.address, p.city, p.notes].filter(Boolean).join(" ");
  for (const st of STATES) {
    const rx = new RegExp(`[,\\s]${st}[\\s,\\d]|[,\\s]${st}$`, "i");
    if (rx.test(fields)) return st;
  }
  return null;
};
const getTZ = (s) => s ? STATE_TZ[s.trim().toUpperCase()] || null : null;
const fmtTime = (tz) => { try { return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }); } catch { return null; } };
const fmtTZLabel = (tz) => { try { return tz.split("/").pop().replace(/_/g, " "); } catch { return tz; } };

const TH = {
  dark: { bg:"#0a0a0a",card:"#111",bd:"#1e1e1e",bd2:"#2a2a2a",inp:"#0d0d0d",inpB:"#222",tx:"#e0e0e0",tx2:"#888",tx3:"#555",tx4:"#444",tx5:"#333",acc:"#3b82f6",mono:"#ccc",scr:"#0d0d0d",modal:"rgba(0,0,0,.85)",hdr:"#1a1a1a",rHov:"#151515",rAct:"#0c1929",tbl:"#0a0a0a",pill:"1a",col:"#0a0a0a" },
  light: { bg:"#f5f5f5",card:"#fff",bd:"#e0e0e0",bd2:"#ccc",inp:"#fff",inpB:"#ccc",tx:"#1a1a1a",tx2:"#555",tx3:"#777",tx4:"#999",tx5:"#bbb",acc:"#2563eb",mono:"#333",scr:"#f9f9f9",modal:"rgba(0,0,0,.4)",hdr:"#e0e0e0",rHov:"#f0f0f0",rAct:"#e8f0fe",tbl:"#f9f9f9",pill:"22",col:"#f0f0f0" },
};

const pz = (t, p) => {
  if (!p) return t;
  const nd = new Date(); nd.setDate(nd.getDate() + 2);
  if (nd.getDay() === 0) nd.setDate(nd.getDate() + 1);
  if (nd.getDay() === 6) nd.setDate(nd.getDate() + 2);
  return t.replace(/\[NAME\]/g, p.name || "there").replace(/\[BUSINESS\]/g, p.business || "___").replace(/\[INDUSTRY\]/g, p.industry || "___").replace(/\[CITY\]/g, p.city || "___").replace(/\[WEBSITE\]/g, p.website || "___").replace(/\[COMPETITOR\]/g, p.competitor || "your top competitor").replace(/\[SERVICE\]/g, p.industry?.toLowerCase() || "___").replace(/\[DAY\]/g, nd.toLocaleDateString("en-US", { weekday: "long" }));
};

const parseCSV = (text) => {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { err: "Need header + data rows", data: [] };
  const hdr = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const m = {};
  hdr.forEach((h, i) => {
    if (h.includes("name") && !h.includes("business") && !h.includes("company")) m.name = i;
    else if (h.includes("business") || h.includes("company")) m.business = i;
    else if (h.includes("phone") || h.includes("tel")) m.phone = i;
    else if (h.includes("email")) m.email = i;
    else if (h.includes("website") || h.includes("url") || h.includes("site")) m.website = i;
    else if (h.includes("address") || h.includes("street")) m.address = i;
    else if (h.includes("city") || h.includes("town")) m.city = i;
    else if (h.includes("postal") || h.includes("zip")) m.postal_code = i;
    else if (h.includes("state") || h.includes("province") || h.includes("region")) m.state = i;
    else if (h.includes("industry") || h.includes("niche") || h.includes("type") || h.includes("category")) m.industry = i;
    else if (h.includes("competitor")) m.competitor = i;
    else if (h.includes("note")) m.notes = i;
  });
  if (m.name === undefined && m.business === undefined) return { err: "No name or business column", data: [] };
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const v = []; let cur = "", inQ = false;
    for (const ch of lines[i]) { if (ch === '"') { inQ = !inQ; } else if (ch === ',' && !inQ) { v.push(cur.trim()); cur = ""; } else { cur += ch; } }
    v.push(cur.trim());
    const r = { name: v[m.name]||"", business: v[m.business]||"", phone: v[m.phone]||"", email: v[m.email]||"", website: v[m.website]||"", address: v[m.address]||"", city: v[m.city]||"", postal_code: v[m.postal_code]||"", state: v[m.state]||"", industry: v[m.industry]||"Other", competitor: v[m.competitor]||"", notes: v[m.notes]||"" };
    if (r.name || r.business) data.push(r);
  }
  return { err: data.length ? "" : "No valid rows", data };
};

export default function Tracker() {
  const [ps, setPs] = useState([]);
  const [tab, setTab] = useState("dialer");
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState("");
  const [cbDate, setCbDate] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [csv, setCsv] = useState("");
  const [csvD, setCsvD] = useState(null);
  const [csvE, setCsvE] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [stab, setStab] = useState("flow");
  const [dark, setDark] = useState(false);
  const [now, setNow] = useState(new Date());
  const [np, setNp] = useState({ business:"",name:"",phone:"",website:"",address:"",city:"",postal_code:"",state:"",industry:"Roofing",competitor:"",email:"",notes:"" });
  const fr = useRef(null);
  const c = dark ? TH.dark : TH.light;

  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  useEffect(() => { (async () => { const { data } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }); if (data) setPs(data); setLoading(false); })(); }, []);

  const addOne = async () => { if (!np.business) return; setSaving(true); const { data } = await supabase.from("prospects").insert({ ...np, disposition: null, call_history: [], follow_up_date: null }).select(); if (data) setPs((p) => [data[0], ...p]); setNp({ business:"",name:"",phone:"",website:"",address:"",city:"",postal_code:"",state:"",industry:"Roofing",competitor:"",email:"",notes:"" }); setShowAdd(false); setSaving(false); };
  const log = async (id, d) => { const pr = ps.find((p) => p.id === id); if (!pr) return; setSaving(true); const { data } = await supabase.from("prospects").update({ disposition: d, call_history: [...(pr.call_history || []), { disposition: d, note, timestamp: new Date().toISOString(), cbDate: d === "callback" ? cbDate : null }], follow_up_date: d === "callback" ? cbDate : pr.follow_up_date }).eq("id", id).select(); if (data) { setPs((prev) => prev.map((p) => (p.id === id ? data[0] : p))); setSel(data[0]); } setNote(""); setCbDate(""); setSaving(false); };
  const del = async (id) => { await supabase.from("prospects").delete().eq("id", id); setPs((p) => p.filter((x) => x.id !== id)); if (sel?.id === id) setSel(null); };
  const clearAll = async () => { if (!confirm(`Delete all ${ps.length} prospects? This cannot be undone.`)) return; setSaving(true); await supabase.from("prospects").delete().neq("id", "00000000-0000-0000-0000-000000000000"); setPs([]); setSel(null); setSaving(false); };
  const imp = async () => { if (!csvD?.length) return; setSaving(true); const { data } = await supabase.from("prospects").insert(csvD.map((r) => ({ ...r, disposition: null, call_history: [], follow_up_date: null }))).select(); if (data) setPs((p) => [...data, ...p]); setCsv(""); setCsvD(null); setShowCsv(false); setSaving(false); };
  const prevC = () => { const r = parseCSV(csv); if (r.err) { setCsvE(r.err); setCsvD(null); } else { setCsvE(""); setCsvD(r.data); } };
  const exp = () => { const h = "business,name,phone,website,address,city,state,postal_code,industry,disposition,calls,notes\n"; const r = ps.map((p) => `"${p.business}","${p.name}","${p.phone}","${p.website}","${p.address||""}","${p.city}","${p.state}","${p.postal_code||""}","${p.industry}","${p.disposition||"fresh"}","${(p.call_history||[]).length}","${p.notes}"`).join("\n"); const b = new Blob([h + r], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "mgl-prospects.csv"; a.click(); };

  const fp = ps.filter((p) => { const ms = !search || [p.name, p.business, p.city].some((f) => f?.toLowerCase().includes(search.toLowerCase())); const mf = filter === "all" || p.disposition === filter || (filter === "fresh" && !p.disposition); return ms && mf; });
  const st = { total: ps.length, called: ps.filter((p) => p.disposition).length, interested: ps.filter((p) => p.disposition === "interested").length, fresh: ps.filter((p) => !p.disposition).length };
  st.rate = st.called ? ((st.interested / st.called) * 100).toFixed(1) : "0";

  const I = { background: c.inp, border: `1px solid ${c.inpB}`, borderRadius: 6, padding: "9px 11px", color: c.tx, fontSize: 13, width: "100%", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const gh = { background: "transparent", color: c.tx2, border: `1px solid ${c.bd}`, padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" };
  const selState = sel ? extractState(sel) : null;
  const selTZ = selState ? getTZ(selState) : null;

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: c.bg, color: c.tx2 }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.tx, fontFamily: "-apple-system, system-ui, sans-serif", fontSize: 13, transition: "background .3s, color .3s" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}.T{background:none;border:none;color:${c.tx3};padding:11px 14px;cursor:pointer;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;border-bottom:2px solid transparent;font-family:inherit}.T:hover{color:${c.tx2}}.T.on{color:${c.tx};border-bottom-color:${c.acc}}.P{display:flex;align-items:center;gap:10px;padding:9px 12px;background:${c.card};border:1px solid ${c.bd};border-radius:7px;margin-bottom:4px;cursor:pointer;transition:all .12s}.P:hover{border-color:${c.bd2};background:${c.rHov}}.P.on{border-color:${c.acc};background:${c.rAct}}.SL{padding:9px 12px;background:${c.scr};border-radius:5px;margin-bottom:5px;font-size:12px;line-height:1.65;color:${c.mono};border-left:3px solid ${c.acc};font-family:monospace}.DB{width:100%;border:none;border-radius:5px;padding:9px;font-size:11px;font-weight:600;font-family:inherit;cursor:pointer}.DB:hover{filter:brightness(1.1)}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${c.tx5};border-radius:2px}`}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px 0", borderBottom: `1px solid ${c.hdr}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800 }}><span style={{ color: c.acc }}>MGL</span> Cold Call Tracker {saving && <span style={{ fontSize: 10, color: "#f59e0b" }}>saving...</span>}</h1>
            <p style={{ fontSize: 10, color: c.tx4, marginTop: 1 }}>{st.total} prospects · {st.called} called · {st.rate}% conv</p>
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <button onClick={() => setDark(!dark)} style={{ ...gh, padding: "5px 10px", fontSize: 14 }}>{dark ? "☀️" : "🌙"}</button>
            <button onClick={() => setShowCsv(true)} style={gh}>📁 CSV</button>
            <button onClick={() => { setShowAdd(true); setTab("dialer"); }} style={{ ...gh, background: c.acc, color: "white", border: "none" }}>+ Add</button>
            {ps.length > 0 && <button onClick={exp} style={gh}>⬇</button>}
            {ps.length > 0 && <button onClick={clearAll} style={{ ...gh, color: "#ef4444" }}>🗑 Clear All</button>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 10, color: c.tx3, marginBottom: 8, fontFamily: "monospace" }}>
          <span>🇮🇳 IST <b style={{ color: c.tx }}>{fmtTime("Asia/Kolkata")}</b></span>
          {sel && selTZ && <span>📍 {sel.city || fmtTZLabel(selTZ)}{selState ? `, ${selState}` : ""} <b style={{ color: c.acc }}>{fmtTime(selTZ)}</b></span>}
        </div>
        <div style={{ display: "flex" }}>{["dialer","pipeline","script","stats"].map((tb) => <button key={tb} className={`T ${tab === tb ? "on" : ""}`} onClick={() => setTab(tb)}>{tb}</button>)}</div>
      </div>

      {/* CSV Modal */}
      {showCsv && <div style={{ position: "fixed", inset: 0, background: c.modal, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: c.card, border: `1px solid ${c.bd2}`, borderRadius: 10, padding: 20, maxWidth: 650, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><h2 style={{ fontSize: 15, fontWeight: 800 }}>📁 Import CSV</h2><button onClick={() => { setShowCsv(false); setCsv(""); setCsvD(null); setCsvE(""); }} style={{ background: "none", border: "none", color: c.tx2, cursor: "pointer", fontSize: 16 }}>✕</button></div>
          <p style={{ fontSize: 11, color: c.tx2, marginBottom: 10 }}>Need <b style={{ color: c.acc }}>business</b> column. Also: name, phone, website, address, city, state, postal_code, industry.</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input ref={fr} type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { setCsv(ev.target.result); setCsvE(""); setCsvD(null); }; r.readAsText(f); e.target.value = ""; }} style={{ display: "none" }} />
            <button onClick={() => fr.current?.click()} style={{ ...gh, background: dark ? "#1e293b" : "#e0e0e0", color: c.tx }}>Choose File</button>
            <button onClick={() => setCsv("business,phone,website,address,city,state,postal_code,industry\nSmith Roofing,+1-480-555-0101,smithroofing.com,1234 Main St,Scottsdale,AZ,85251,Roofing")} style={gh}>Example</button>
          </div>
          <textarea style={{ ...I, minHeight: 120, fontFamily: "monospace", fontSize: 11, resize: "vertical" }} placeholder="Paste CSV here..." value={csv} onChange={(e) => { setCsv(e.target.value); setCsvD(null); setCsvE(""); }} />
          {csvE && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>{csvE}</p>}
          <button onClick={prevC} disabled={!csv.trim()} style={{ ...gh, background: c.acc, color: "white", border: "none", marginTop: 10, padding: "7px 16px" }}>Preview</button>
          {csvD && csvD.length > 0 && <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, marginBottom: 6 }}>Found {csvD.length} prospects</p>
            <div style={{ maxHeight: 180, overflowY: "auto", border: `1px solid ${c.bd}`, borderRadius: 6 }}>
              <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}><thead><tr style={{ background: c.tbl }}>{["Business","Phone","City","State"].map((h) => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: c.tx3, borderBottom: `1px solid ${c.bd}` }}>{h}</th>)}</tr></thead>
              <tbody>{csvD.slice(0, 10).map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${c.bd}` }}><td style={{ padding: "5px 8px", fontWeight: 600 }}>{r.business}</td><td style={{ padding: "5px 8px", color: c.tx2 }}>{r.phone}</td><td style={{ padding: "5px 8px", color: c.tx2 }}>{r.city}</td><td style={{ padding: "5px 8px", color: c.acc }}>{r.state}</td></tr>)}</tbody></table>
            </div>
            <button onClick={imp} disabled={saving} style={{ background: "#22c55e", color: "#000", border: "none", padding: "10px 20px", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", marginTop: 10, width: "100%" }}>{saving ? "Importing..." : `Import ${csvD.length} Prospects`}</button>
          </div>}
        </div>
      </div>}

      <div style={{ padding: "14px 18px" }}>
        {/* DIALER */}
        {tab === "dialer" && <div>
          {showAdd && <div style={{ background: c.card, border: `1px solid ${c.acc}33`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><b style={{ fontSize: 12 }}>Quick Add</b><button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: c.tx3, cursor: "pointer" }}>✕</button></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[["business","Business *"],["name","Contact Name (later)"],["phone","Phone"],["website","Website"],["address","Street Address"],["city","City"],["state","State"],["postal_code","Postal Code"]].map(([k,p]) => <input key={k} style={I} placeholder={p} value={np[k]} onChange={(e) => setNp((x) => ({ ...x, [k]: e.target.value }))} />)}
              <select style={I} value={np.industry} onChange={(e) => setNp((x) => ({ ...x, industry: e.target.value }))}>{INDS.map((i) => <option key={i}>{i}</option>)}</select>
              <input style={I} placeholder="Notes" value={np.notes} onChange={(e) => setNp((x) => ({ ...x, notes: e.target.value }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><button onClick={addOne} disabled={saving} style={{ ...gh, background: c.acc, color: "white", border: "none" }}>{saving ? "Saving..." : "Add"}</button></div>
          </div>}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input style={{ ...I, flex: 1 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select style={{ ...I, width: 130 }} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All ({st.total})</option><option value="fresh">Fresh ({st.fresh})</option>{DISPS.map((d) => <option key={d.id} value={d.id}>{d.l} ({ps.filter((p) => p.disposition === d.id).length})</option>)}</select>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px", maxHeight: 500, overflowY: "auto" }}>
              {fp.length === 0 && <div style={{ textAlign: "center", padding: 36, color: c.tx4 }}><p style={{ fontSize: 24 }}>📁</p><p style={{ fontSize: 12, marginTop: 6 }}>No prospects.</p></div>}
              {fp.map((p) => { const d = DISPS.find((x) => x.id === p.disposition); return (
                <div key={p.id} className={`P ${sel?.id === p.id ? "on" : ""}`} onClick={() => setSel(p)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <b style={{ fontSize: 11 }}>{p.business || p.name}</b>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 12, background: (d?.c || "#22c55e") + c.pill, color: d?.c || "#22c55e" }}>{d ? `${d.i} ${d.l}` : "NEW"}</span>
                    </div>
                    <div style={{ fontSize: 9, color: c.tx3, marginTop: 1 }}>{p.name ? `${p.name} · ` : ""}{p.city||""}{p.state ? `, ${p.state}` : ""} · {p.industry}{p.phone ? <span style={{ color: c.acc }}> · 📞 {p.phone}</span> : ""}</div>
                  </div>
                  <span style={{ fontSize: 9, color: c.tx5 }}>{(p.call_history || []).length}</span>
                </div>
              ); })}
            </div>
            {sel && <div style={{ flex: "1 1 350px" }}>
              <div style={{ background: c.card, border: `1px solid ${c.acc}33`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div><b style={{ fontSize: 14 }}>{sel.business}</b><p style={{ fontSize: 10, color: c.tx3 }}>{sel.name ? `${sel.name} · ` : ""}{sel.industry} · {sel.city}{sel.state ? `, ${sel.state}` : ""}{sel.postal_code ? ` ${sel.postal_code}` : ""}</p></div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => del(sel.id)} style={{ ...gh, color: "#ef4444", padding: "2px 6px", fontSize: 9 }}>Del</button>
                    <button onClick={() => setSel(null)} style={{ ...gh, padding: "2px 6px", fontSize: 9 }}>✕</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, fontSize: 10 }}>
                  {sel.phone && <span style={{ color: c.acc }}>📞 {sel.phone}</span>}
                  {sel.website && <span style={{ color: "#22c55e" }}>🌐 {sel.website}</span>}
                  {sel.address && <span style={{ color: c.tx2 }}>📍 {sel.address}</span>}
                </div>
                {/* Live timezone */}
                {selTZ && <div style={{ background: c.scr, border: `1px solid ${c.bd}`, borderRadius: 6, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11 }}>
                  <div><span style={{ color: c.tx3 }}>🇮🇳 You </span><b style={{ color: c.tx }}>{fmtTime("Asia/Kolkata")}</b></div>
                  <div><span style={{ color: c.tx3 }}>📍 {sel.city||fmtTZLabel(selTZ)} </span><b style={{ color: c.acc }}>{fmtTime(selTZ)}</b></div>
                </div>}
                <details style={{ marginBottom: 10 }}>
                  <summary style={{ fontSize: 10, fontWeight: 700, color: c.acc, cursor: "pointer" }}>📋 Script</summary>
                  <div style={{ marginTop: 6 }}>
                    <p style={{ fontSize: 9, color: c.tx3, fontWeight: 700, marginBottom: 4 }}>OPENER:</p>
                    {OPENERS.map((o, i) => <div key={i} className="SL" style={{ fontSize: 11 }}>{pz(o, sel)}</div>)}
                    <p style={{ fontSize: 9, color: c.tx3, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>HOOK:</p>
                    {HOOKS.map((h, i) => <div key={i} className="SL" style={{ fontSize: 11 }}>{pz(h, sel)}</div>)}
                    <p style={{ fontSize: 9, color: c.tx3, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>ASK:</p>
                    <div className="SL" style={{ fontSize: 11, borderLeftColor: "#22c55e" }}>{pz(ASK, sel)}</div>
                  </div>
                </details>
                <textarea style={{ ...I, minHeight: 50, resize: "vertical", marginBottom: 6 }} placeholder="Call notes..." value={note} onChange={(e) => setNote(e.target.value)} />
                <input type="date" style={{ ...I, marginBottom: 8 }} value={cbDate} onChange={(e) => setCbDate(e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {DISPS.map((d) => <button key={d.id} className="DB" disabled={saving} onClick={() => log(sel.id, d.id)} style={{ background: d.c + c.pill, color: d.c, border: `1px solid ${d.c}33`, opacity: saving ? 0.5 : 1 }}>{d.i} {d.l}</button>)}
                </div>
                {sel.call_history?.length > 0 && <div style={{ marginTop: 10, borderTop: `1px solid ${c.bd}`, paddingTop: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: c.tx3, marginBottom: 4 }}>HISTORY</p>
                  {[...sel.call_history].reverse().slice(0, 5).map((ch, i) => { const dd = DISPS.find((x) => x.id === ch.disposition); return (
                    <div key={i} style={{ fontSize: 10, padding: "3px 0", borderBottom: `1px solid ${c.bd}` }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: (dd?.c || "#666") + c.pill, color: dd?.c }}>{dd?.i} {dd?.l}</span>
                      <span style={{ color: c.tx4, marginLeft: 6, fontSize: 9 }}>{new Date(ch.timestamp).toLocaleDateString()}</span>
                      {ch.note && <span style={{ color: c.tx3, marginLeft: 6, fontSize: 9 }}>{ch.note}</span>}
                    </div>
                  ); })}
                </div>}
              </div>
            </div>}
          </div>
        </div>}

        {/* PIPELINE */}
        {tab === "pipeline" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 8 }}>
          {[{id:"fresh",l:"Fresh",co:"#22c55e",it:ps.filter(p=>!p.disposition)},{id:"callback",l:"Callback",co:"#f59e0b",it:ps.filter(p=>p.disposition==="callback")},{id:"followup",l:"Follow-up",co:"#3b82f6",it:ps.filter(p=>p.disposition==="followup")},{id:"interested",l:"Interested",co:"#22c55e",it:ps.filter(p=>p.disposition==="interested")},{id:"no_answer",l:"No Answer",co:"#6b7280",it:ps.filter(p=>p.disposition==="no_answer"||p.disposition==="voicemail")},{id:"declined",l:"Declined",co:"#ef4444",it:ps.filter(p=>p.disposition==="declined")}].map((col) => (
            <div key={col.id} style={{ background: c.card, border: `1px solid ${c.bd}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 10, fontWeight: 700, color: col.co, textTransform: "uppercase" }}>{col.l}</span><b style={{ color: col.co }}>{col.it.length}</b></div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>{col.it.map((p) => <div key={p.id} style={{ padding: "5px 7px", background: c.col, borderRadius: 4, marginBottom: 3, cursor: "pointer", border: `1px solid ${c.bd}` }} onClick={() => { setSel(p); setTab("dialer"); }}><div style={{ fontSize: 10, fontWeight: 600 }}>{p.business}</div><div style={{ fontSize: 8, color: c.tx3 }}>{p.city}{p.state ? `, ${p.state}` : ""}</div></div>)}{col.it.length === 0 && <p style={{ fontSize: 9, color: c.tx5, textAlign: "center", padding: 12 }}>Empty</p>}</div>
            </div>
          ))}
        </div>}

        {/* SCRIPT */}
        {tab === "script" && <div>
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>{[["flow","Call Flow"],["obj","Objections"],["tips","Tips"]].map(([id,l]) => <button key={id} onClick={() => setStab(id)} style={{ background: stab===id ? c.acc : c.inp, color: stab===id ? "white" : c.tx3, border: `1px solid ${stab===id ? c.acc : c.inpB}`, padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>{l}</button>)}</div>
          {stab === "flow" && <div>
            <p style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, marginBottom: 12 }}>Pick one opener, one hook, deliver the ask. Under 45 seconds.</p>
            <p style={{ fontSize: 9, color: c.acc, fontWeight: 700, marginBottom: 6 }}>STEP 1 — OPENER</p>
            {OPENERS.map((o, i) => <div key={i} className="SL">{sel ? pz(o, sel) : o}</div>)}
            <p style={{ fontSize: 9, color: c.acc, fontWeight: 700, marginTop: 14, marginBottom: 6 }}>STEP 2 — HOOK</p>
            {HOOKS.map((h, i) => <div key={i} className="SL">{sel ? pz(h, sel) : h}</div>)}
            <p style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginTop: 14, marginBottom: 6 }}>STEP 3 — ASK</p>
            <div className="SL" style={{ borderLeftColor: "#22c55e" }}>{sel ? pz(ASK, sel) : ASK}</div>
            <p style={{ fontSize: 9, color: "#8b5cf6", fontWeight: 700, marginTop: 14, marginBottom: 6 }}>STEP 4 — CLOSE</p>
            <div className="SL" style={{ borderLeftColor: "#8b5cf6" }}>{sel ? pz(CLOSE, sel) : CLOSE}</div>
          </div>}
          {stab === "obj" && <div>{OBJECTIONS.map(([q, a], i) => <div key={i} style={{ background: c.scr, border: `1px solid ${c.bd}`, borderRadius: 6, padding: "9px 12px", marginBottom: 5 }}><p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 3 }}>"{q}"</p><p style={{ fontSize: 11, color: c.mono, lineHeight: 1.6, fontFamily: "monospace" }}>{sel ? pz(a, sel) : a}</p></div>)}</div>}
          {stab === "tips" && <div>{[["🎯 Timing","Call 7-8 AM or 5-6 PM their time. From India = early morning or late night IST."],["🗣️ Tone","Talk like calling a friend. Smile while talking. Confidence + warmth = trust."],["📊 Volume","2-3% conversion. 100 calls = 2-3 yeses. 5 clients/month = 25 calls/day."],["🔄 Follow Up","Day 1: call. Day 3: screenshot email. Day 7: call. Day 14: value email. Day 21: final."],["🌍 Edge","Name their competitor, street, city. They stop caring where you call from."]].map(([tt, d], i) => <div key={i} style={{ background: c.scr, border: `1px solid ${c.bd}`, borderRadius: 6, padding: "9px 12px", marginBottom: 5 }}><p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 2 }}>{tt}</p><p style={{ fontSize: 11, color: c.tx2, lineHeight: 1.6 }}>{d}</p></div>)}</div>}
        </div>}

        {/* STATS */}
        {tab === "stats" && <div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
            {[{n:st.total,l:"Total",co:c.tx},{n:st.called,l:"Called",co:c.acc},{n:st.interested,l:"Interested",co:"#22c55e"},{n:ps.filter(p=>p.disposition==="callback").length,l:"Callback",co:"#f59e0b"},{n:ps.filter(p=>p.disposition==="declined").length,l:"Declined",co:"#ef4444"},{n:st.rate+"%",l:"Conv",co:"#22c55e"},{n:st.fresh,l:"Fresh",co:"#8b5cf6"}].map((s, i) => (
              <div key={i} style={{ background: c.card, border: `1px solid ${c.bd}`, borderRadius: 8, padding: "12px 16px", textAlign: "center", flex: "1 1 80px" }}><div style={{ fontSize: 20, fontWeight: 800, color: s.co, fontFamily: "monospace" }}>{s.n}</div><div style={{ fontSize: 8, color: c.tx3, textTransform: "uppercase", letterSpacing: .8, marginTop: 2 }}>{s.l}</div></div>
            ))}
          </div>
          <div style={{ background: c.card, border: `1px solid ${c.bd}`, borderRadius: 8, padding: 14 }}>
            <b style={{ fontSize: 12 }}>📋 Research Workflow</b>
            <div style={{ fontSize: 11, color: c.tx2, lineHeight: 1.8, marginTop: 8 }}>
              <p><b style={{ color: c.acc }}>FIND →</b> Google Maps "[industry] [city]". Target page 2-3.</p>
              <p><b style={{ color: c.acc }}>QUALIFY →</b> Old design, broken mobile, no SSL, no CTA, PageSpeed under 50.</p>
              <p><b style={{ color: c.acc }}>COMPETITOR →</b> Google main keyword, screenshot top ranker.</p>
              <p><b style={{ color: c.acc }}>CONTACT →</b> GBP, website, Apollo.io, Hunter.io.</p>
              <p><b style={{ color: c.acc }}>LOAD →</b> CSV: business, phone, website, address, city, state, postal_code, industry.</p>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}
