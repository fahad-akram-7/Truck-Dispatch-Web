import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { supabase } from "./supabaseClient";

const STATUS_OPTIONS = ["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

const formatMoney = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)}`;
};

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function PaginationControls({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="toolbar">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="muted">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}

function MiniBarChart({ title, data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <article className="card">
      <h3>{title}</h3>
      <div className="chart-list">
        {data.map((item) => (
          <div key={item.label} className="chart-row">
            <span>{item.label}</span>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function Home() {
  const [estimate, setEstimate] = useState({
    distanceKm: 500,
    weightKg: 1200,
    priority: "STANDARD"
  });

  const estimatedPrice = useMemo(() => {
    const baseCost = Number(estimate.distanceKm) * 2.5;
    const weightCharge = Number(estimate.weightKg) * 0.1;
    const fuelSurcharge = baseCost * 0.15;
    const priorityCharge = estimate.priority === "EXPRESS" ? 150 : 0;
    return baseCost + weightCharge + fuelSurcharge + priorityCharge;
  }, [estimate]);

  return (
    <section className="page">
      <div className="hero card gradient-card">
        <p className="eyebrow">Modern Freight Operations</p>
        <h2>FastLane Dispatch Logistics</h2>
        <p>
          Dispatch, quote, assign, and monitor shipments through one centralized logistics platform.
        </p>
        <div className="toolbar">
          <Link className="chip chip-fill" to="/request-load">Request a Load</Link>
          <Link className="chip" to="/track">Track Shipment</Link>
        </div>
      </div>

      <div className="kpi-grid">
        <article className="card"><strong>24/7 Operations Desk</strong><p>Always-on support for active dispatches.</p></article>
        <article className="card"><strong>Verified Driver Network</strong><p>Professional fleet partner management.</p></article>
        <article className="card"><strong>Realtime Progress</strong><p>Live status updates from dispatch board.</p></article>
      </div>

      <div className="card">
        <SectionHeader
          title="Quick Quote Estimator"
          subtitle="Get an instant estimated cost before creating a load request."
        />
        <div className="grid three-cols">
          <label>
            Distance (km)
            <input
              type="number"
              value={estimate.distanceKm}
              onChange={(e) => setEstimate((prev) => ({ ...prev, distanceKm: e.target.value }))}
            />
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              value={estimate.weightKg}
              onChange={(e) => setEstimate((prev) => ({ ...prev, weightKg: e.target.value }))}
            />
          </label>
          <label>
            Priority
            <select
              value={estimate.priority}
              onChange={(e) => setEstimate((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="STANDARD">STANDARD</option>
              <option value="EXPRESS">EXPRESS</option>
            </select>
          </label>
        </div>
        <p className="price-tag">Estimated Cost: {formatMoney(estimatedPrice)}</p>
      </div>

      <div className="kpi-grid">
        <article className="card">
          <h3>Why Teams Trust Us</h3>
          <p className="muted">Trusted by logistics coordinators, manufacturers, and freight brokers.</p>
          <div className="badge-grid">
            <span className="chip">ISO-ready ops</span>
            <span className="chip">Verified carriers</span>
            <span className="chip">SLA tracking</span>
          </div>
        </article>
        <article className="card">
          <h3>Testimonials</h3>
          <p>"We cut dispatch response time by 40% in 2 weeks."</p>
          <p className="muted">- Operations Lead, NorthLine Cargo</p>
          <p>"Simple dashboard, strong visibility, and reliable status updates."</p>
          <p className="muted">- Fleet Manager, Apex Freight</p>
        </article>
        <article className="card">
          <h3>Pricing Snapshot</h3>
          <p><strong>Starter</strong>: Small dispatch teams</p>
          <p><strong>Pro</strong>: Multi-branch operations</p>
          <p><strong>Enterprise</strong>: Advanced workflow automation</p>
        </article>
      </div>
    </section>
  );
}

function Services() {
  const [openFaq, setOpenFaq] = useState("faq-1");
  const faqs = [
    {
      id: "faq-1",
      q: "How quickly can a load be dispatched?",
      a: "Most requests are reviewed within minutes and assigned based on driver availability."
    },
    {
      id: "faq-2",
      q: "Do you support express deliveries?",
      a: "Yes, select EXPRESS priority while creating your load request."
    },
    {
      id: "faq-3",
      q: "Can I monitor progress in real time?",
      a: "Yes, the system supports dispatch status updates and customer tracking."
    }
  ];

  return (
    <section className="page">
      <SectionHeader
        title="Our Services"
        subtitle="Built for operational speed, reliability, and shipment visibility."
      />
      <div className="kpi-grid">
        <article className="card"><strong>FTL / LTL Dispatching</strong><p>Optimized assignment and route planning.</p></article>
        <article className="card"><strong>Dynamic Quotation</strong><p>Distance and load-based pricing engine.</p></article>
        <article className="card"><strong>Fleet Orchestration</strong><p>Driver performance and utilization management.</p></article>
      </div>
      <div className="card">
        <h3>Frequently Asked Questions</h3>
        {faqs.map((item) => (
          <div key={item.id} className="faq-item">
            <button className="faq-btn" onClick={() => setOpenFaq(openFaq === item.id ? "" : item.id)}>
              {item.q}
            </button>
            {openFaq === item.id ? <p>{item.a}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact({ onNotify }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [msg, setMsg] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setMsg("Please complete all contact fields.");
      if (onNotify) onNotify("Please complete all contact fields.", "error");
      return;
    }
    setMsg("Thanks! Our team will contact you shortly.");
    if (onNotify) onNotify("Message sent successfully.", "success");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="page">
      <SectionHeader title="Contact Us" subtitle="Reach our dispatch coordination team." />
      <div className="card">
        <p>Email: support@fastlane-dispatch.com</p>
        <p>Phone: +1 555 980 1234</p>
        <p>Office: 24 Logistics Ave, Dispatch City</p>
      </div>
      <form className="card" onSubmit={onSubmit}>
        <h3>Send Message</h3>
        <div className="grid">
          <input value={form.name} placeholder="Name" onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input value={form.email} placeholder="Email" onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
        </div>
        <textarea
          rows={4}
          value={form.message}
          placeholder="How can we help?"
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
        />
        <button type="submit">Send</button>
        <small>{msg}</small>
      </form>
    </section>
  );
}

function Auth({ onNotify }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("userRole", res.data.user.role || "CUSTOMER");
      setMsg(`Logged in as ${res.data.user.role}`);
      if (onNotify) onNotify(`Welcome back, ${res.data.user.fullName}.`, "success");
      navigate(res.data.user.role === "ADMIN" ? "/admin" : res.data.user.role === "DRIVER" ? "/driver" : "/");
    } catch (err) {
      setMsg(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <SectionHeader title="Login" subtitle="Access your dashboard based on your role." />
      <form onSubmit={onLogin} className="card">
        <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
      <small>{msg}</small>
    </section>
  );
}

function Register({ onNotify }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    licenseNo: "",
    phone: ""
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === "DRIVER" ? { licenseNo: form.licenseNo, phone: form.phone } : {})
      };
      await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });
      setMsg("Registration successful, please login.");
      if (onNotify) onNotify("Account created successfully.", "success");
    } catch (err) {
      setMsg(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <SectionHeader title="Create Account" subtitle="Register as customer or driver." />
      <form onSubmit={onSubmit} className="card grid">
        <input placeholder="Full Name" onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="CUSTOMER">Customer</option>
          <option value="DRIVER">Driver</option>
        </select>
        {form.role === "DRIVER" && (
          <>
            <input placeholder="License No" onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
            <input placeholder="Phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </>
        )}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
      </form>
      <small>{msg}</small>
    </section>
  );
}

function LoadRequestForm({ onNotify }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    origin: "",
    destination: "",
    weightKg: 0,
    distanceKm: 0,
    requestedDate: new Date().toISOString(),
    priority: "STANDARD",
    notes: ""
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        weightKg: Number(form.weightKg),
        distanceKm: Number(form.distanceKm),
        requestedDate: new Date(form.requestedDate).toISOString()
      };
      const res = await api("/loads", { method: "POST", body: JSON.stringify(payload) });
      setMsg(`Request submitted: ${res.data.id}`);
      if (onNotify) onNotify(`Load request created: ${res.data.id}`, "success");
    } catch (err) {
      setMsg(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <SectionHeader title="Submit Load Request" subtitle="Share shipment details and get assigned quickly." />
      <form onSubmit={onSubmit} className="card grid">
        <input placeholder="Customer Name" onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input placeholder="Customer Email" onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
        <input placeholder="Origin" onChange={(e) => setForm({ ...form, origin: e.target.value })} />
        <input placeholder="Destination" onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        <input placeholder="Weight (kg)" type="number" onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
        <input
          placeholder="Distance (km)"
          type="number"
          onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
        />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="STANDARD">STANDARD</option>
          <option value="EXPRESS">EXPRESS</option>
        </select>
        <input
          placeholder="Preferred pickup date/time"
          type="datetime-local"
          onChange={(e) => setForm({ ...form, requestedDate: new Date(e.target.value).toISOString() })}
        />
        <textarea
          rows={3}
          placeholder="Special instructions"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
      </form>
      <small>{msg}</small>
    </section>
  );
}

function TrackRequest({ onNotify }) {
  const [requestId, setRequestId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api(`/loads/track/${requestId}?email=${encodeURIComponent(email)}`);
      setResult(res.data);
      setMsg("");
      if (onNotify) onNotify("Tracking details loaded.", "success");
    } catch (err) {
      setResult(null);
      setMsg(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <SectionHeader title="Track Request" subtitle="Use request ID and customer email." />
      <form className="card grid" onSubmit={onTrack}>
        <input placeholder="Request ID" value={requestId} onChange={(e) => setRequestId(e.target.value)} />
        <input placeholder="Customer Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? "Tracking..." : "Track"}</button>
      </form>
      {msg && <small>{msg}</small>}
      {result && (
        <article className="card status-card">
          <strong>{result.origin} to {result.destination}</strong>
          <p>Status: <span className={`status-pill ${result.status.toLowerCase()}`}>{result.status}</span></p>
          <p>Quote: {result.quote ? `$${result.quote.totalAmount.toFixed(2)}` : "Not generated"}</p>
          <p>Driver: {result.dispatch?.driver?.user?.fullName || "Not assigned"}</p>
          <p>Priority: {result.priority}</p>
        </article>
      )}
    </section>
  );
}

function AdminPanel({ onNotify }) {
  const [drivers, setDrivers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [message, setMessage] = useState("");
  const [driverForm, setDriverForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    licenseNo: "",
    currentCity: ""
  });
  const [activeTab, setActiveTab] = useState("drivers");
  const [loadSearch, setLoadSearch] = useState("");
  const [loadStatusFilter, setLoadStatusFilter] = useState("ALL");
  const [driverPage, setDriverPage] = useState(1);
  const [loadPage, setLoadPage] = useState(1);
  const [dispatchPage, setDispatchPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const isAdmin = useMemo(() => localStorage.getItem("userRole") === "ADMIN", []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const channel = supabase
      .channel("dispatch-status-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Dispatch" },
        (payload) => {
          setMessage(`Dispatch ${payload.new.id} updated to ${payload.new.currentStatus}`);
          fetchDispatches();
          fetchLoads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchDrivers = async () => {
    try {
      setBusy(true);
      const res = await api("/drivers");
      setDrivers(res.data);
      setDriverPage(1);
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const fetchLoads = async () => {
    try {
      setBusy(true);
      const res = await api("/loads");
      setLoads(res.data);
      setLoadPage(1);
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const fetchDispatches = async () => {
    try {
      setBusy(true);
      const res = await api("/dispatch");
      setDispatches(res.data);
      setDispatchPage(1);
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const createDriver = async (e) => {
    e.preventDefault();
    try {
      await api("/drivers", { method: "POST", body: JSON.stringify(driverForm) });
      setMessage("Driver created");
      if (onNotify) onNotify("Driver added successfully.", "success");
      setDriverForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        licenseNo: "",
        currentCity: ""
      });
      fetchDrivers();
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  const deleteDriver = async (id) => {
    try {
      await api(`/drivers/${id}`, { method: "DELETE" });
      setMessage("Driver deleted");
      if (onNotify) onNotify("Driver removed.", "success");
      fetchDrivers();
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  const generateQuote = async (id) => {
    try {
      await api(`/quotes/generate/${id}`, { method: "POST" });
      setMessage("Quote generated");
      if (onNotify) onNotify("Quote generated.", "success");
      fetchLoads();
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  const assignDriver = async (loadRequestId, driverId) => {
    try {
      await api("/dispatch/assign", {
        method: "POST",
        body: JSON.stringify({ loadRequestId, driverId })
      });
      setMessage("Driver assigned");
      if (onNotify) onNotify("Driver assigned to load.", "success");
      fetchLoads();
      fetchDispatches();
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  const updateDispatchStatus = async (dispatchId, status) => {
    try {
      await api(`/dispatch/${dispatchId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, note: "Updated from admin panel" })
      });
      setMessage(`Status updated to ${status}`);
      if (onNotify) onNotify(`Dispatch updated to ${status}.`, "success");
      fetchDispatches();
      fetchLoads();
    } catch (err) {
      setMessage(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  const filteredLoads = loads.filter((row) => {
    const matchesSearch = `${row.origin} ${row.destination} ${row.customerName}`
      .toLowerCase()
      .includes(loadSearch.toLowerCase());
    const matchesStatus = loadStatusFilter === "ALL" || row.status === loadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const adminKpis = useMemo(
    () => ({
      totalDrivers: drivers.length,
      pendingLoads: loads.filter((l) => l.status === "PENDING").length,
      activeDispatches: dispatches.filter((d) => d.currentStatus === "ASSIGNED" || d.currentStatus === "IN_TRANSIT").length
    }),
    [drivers, loads, dispatches]
  );
  const perPage = 5;
  const pagedDrivers = drivers.slice((driverPage - 1) * perPage, driverPage * perPage);
  const loadPages = Math.max(1, Math.ceil(filteredLoads.length / perPage));
  const driverPages = Math.max(1, Math.ceil(drivers.length / perPage));
  const dispatchPages = Math.max(1, Math.ceil(dispatches.length / perPage));
  const pagedLoads = filteredLoads.slice((loadPage - 1) * perPage, loadPage * perPage);
  const pagedDispatches = dispatches.slice((dispatchPage - 1) * perPage, dispatchPage * perPage);
  const dispatchStatusData = [
    { label: "ASSIGNED", value: dispatches.filter((d) => d.currentStatus === "ASSIGNED").length },
    { label: "IN_TRANSIT", value: dispatches.filter((d) => d.currentStatus === "IN_TRANSIT").length },
    { label: "DELIVERED", value: dispatches.filter((d) => d.currentStatus === "DELIVERED").length },
    { label: "CANCELLED", value: dispatches.filter((d) => d.currentStatus === "CANCELLED").length }
  ];

  if (!isAdmin) return <p>Admin access only.</p>;

  return (
    <section className="page">
      <SectionHeader title="Admin Command Center" subtitle="Manage drivers, load queue, and dispatch lifecycle." />
      <div className="kpi-grid">
        <article className="card"><strong>{adminKpis.totalDrivers}</strong><p>Total Drivers</p></article>
        <article className="card"><strong>{adminKpis.pendingLoads}</strong><p>Pending Loads</p></article>
        <article className="card"><strong>{adminKpis.activeDispatches}</strong><p>Active Dispatches</p></article>
      </div>
      <MiniBarChart title="Dispatch Status Snapshot" data={dispatchStatusData} />
      <div className="toolbar">
        <button onClick={() => { setActiveTab("drivers"); fetchDrivers(); }}>Drivers</button>
        <button onClick={() => { setActiveTab("loads"); fetchLoads(); fetchDrivers(); }}>Loads</button>
        <button onClick={() => { setActiveTab("dispatch"); fetchDispatches(); }}>Dispatch Board</button>
      </div>
      <small>{busy ? "Loading..." : message}</small>

      {activeTab === "drivers" && (
        <div className="table">
          <form className="card grid" onSubmit={createDriver}>
            <input value={driverForm.fullName} placeholder="Full Name" onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })} />
            <input value={driverForm.email} placeholder="Email" onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })} />
            <input value={driverForm.password} type="password" placeholder="Password" onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })} />
            <input value={driverForm.phone} placeholder="Phone" onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} />
            <input value={driverForm.licenseNo} placeholder="License No" onChange={(e) => setDriverForm({ ...driverForm, licenseNo: e.target.value })} />
            <input value={driverForm.currentCity} placeholder="Current City" onChange={(e) => setDriverForm({ ...driverForm, currentCity: e.target.value })} />
            <button type="submit">Create Driver</button>
          </form>
          {pagedDrivers.map((driver) => (
            <article className="card" key={driver.id}>
              <strong>{driver.user.fullName}</strong>
              <p>{driver.user.email}</p>
              <p>License: {driver.licenseNo}</p>
              <p>Availability: {driver.availability}</p>
              <button className="danger" onClick={() => deleteDriver(driver.id)}>Delete</button>
            </article>
          ))}
          <PaginationControls page={driverPage} totalPages={driverPages} onChange={setDriverPage} />
        </div>
      )}

      {activeTab === "loads" && (
        <div className="table">
          <div className="card grid three-cols">
            <input
              placeholder="Search by customer/origin/destination"
              value={loadSearch}
              onChange={(e) => setLoadSearch(e.target.value)}
            />
            <select value={loadStatusFilter} onChange={(e) => setLoadStatusFilter(e.target.value)}>
              <option value="ALL">ALL STATUSES</option>
              <option value="PENDING">PENDING</option>
              <option value="QUOTED">QUOTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <button onClick={fetchLoads}>Refresh Loads</button>
          </div>
          {pagedLoads.map((row) => (
            <article key={row.id} className="card">
              <strong>{row.origin} to {row.destination}</strong>
              <p>Customer: {row.customerName}</p>
              <p>Status: <span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span></p>
              <p>Quote: {row.quote ? formatMoney(row.quote.totalAmount) : "Not generated"}</p>
              <div className="toolbar">
                <button onClick={() => generateQuote(row.id)}>Generate Quote</button>
                <select defaultValue="" onChange={(e) => e.target.value && assignDriver(row.id, e.target.value)}>
                  <option value="" disabled>Assign Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.user.fullName}</option>
                  ))}
                </select>
              </div>
            </article>
          ))}
          <PaginationControls page={loadPage} totalPages={loadPages} onChange={setLoadPage} />
        </div>
      )}

      {activeTab === "dispatch" && (
        <div className="table">
          {pagedDispatches.map((item) => (
            <article key={item.id} className="card">
              <strong>{item.loadRequest.origin} to {item.loadRequest.destination}</strong>
              <p>Driver: {item.driver.user.fullName}</p>
              <p>Status: <span className={`status-pill ${item.currentStatus.toLowerCase()}`}>{item.currentStatus}</span></p>
              <div className="toolbar">
                {STATUS_OPTIONS.map((status) => (
                  <button key={status} onClick={() => updateDispatchStatus(item.id, status)}>{status}</button>
                ))}
              </div>
            </article>
          ))}
          <PaginationControls page={dispatchPage} totalPages={dispatchPages} onChange={setDispatchPage} />
        </div>
      )}
    </section>
  );
}

function DriverPortal({ onNotify }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const isDriver = useMemo(() => localStorage.getItem("userRole") === "DRIVER", []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api("/dispatch/my-assignments");
      setRows(res.data);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/dispatch/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, note: "Updated by assigned driver" })
      });
      setMsg(`Updated to ${status}`);
      if (onNotify) onNotify(`Marked load as ${status}.`, "success");
      fetchAssignments();
    } catch (err) {
      setMsg(err.message);
      if (onNotify) onNotify(err.message, "error");
    }
  };

  if (!isDriver) return <p>Driver access only.</p>;

  const visibleRows = rows.filter((item) => statusFilter === "ALL" || item.currentStatus === statusFilter);

  return (
    <section className="page">
      <SectionHeader title="Driver Portal" subtitle="Track and update your assigned deliveries." />
      <div className="toolbar">
        <button onClick={fetchAssignments}>{loading ? "Loading..." : "Load My Assignments"}</button>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">ALL</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <small>{msg}</small>
      <div className="table">
        {visibleRows.map((item) => (
          <article key={item.id} className="card">
            <strong>{item.loadRequest.origin} to {item.loadRequest.destination}</strong>
            <p>Status: <span className={`status-pill ${item.currentStatus.toLowerCase()}`}>{item.currentStatus}</span></p>
            <p>ETA: {item.etaDate ? new Date(item.etaDate).toLocaleString() : "TBD"}</p>
            <div className="toolbar">
              <button onClick={() => updateStatus(item.id, "IN_TRANSIT")}>IN_TRANSIT</button>
              <button onClick={() => updateStatus(item.id, "DELIVERED")}>DELIVERED</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [sessionInfo, setSessionInfo] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [toasts, setToasts] = useState([]);

  const notify = (message, kind = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadSession = async () => {
    if (!localStorage.getItem("accessToken")) {
      setSessionInfo("Guest");
      return;
    }
    try {
      const res = await api("/auth/me");
      setSessionInfo(`${res.data.fullName} (${res.data.role})`);
    } catch {
      setSessionInfo("Session expired");
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    setSessionInfo("Guest");
    notify("Logged out successfully.", "info");
  };

  return (
    <main className="container">
      <header className="topbar card">
        <div>
          <h1>Truck Dispatching Management System</h1>
          <p>Current user: {sessionInfo}</p>
        </div>
        <div className="toolbar">
          <button onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
        <Link to="/request-load">Load Request</Link>
        <Link to="/track">Track Request</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/driver">Driver</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact onNotify={notify} />} />
        <Route path="/register" element={<Register onNotify={notify} />} />
        <Route path="/login" element={<Auth onNotify={notify} />} />
        <Route path="/request-load" element={<LoadRequestForm onNotify={notify} />} />
        <Route path="/track" element={<TrackRequest onNotify={notify} />} />
        <Route path="/admin" element={<AdminPanel onNotify={notify} />} />
        <Route path="/driver" element={<DriverPortal onNotify={notify} />} />
      </Routes>
      <div className="toast-wrap">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`}>{toast.message}</div>
        ))}
      </div>
    </main>
  );
}
