import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import FinanceCursor from "./components/FinanceCursor";
import {
  Activity,
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  History,
  Layers3,
  Link2,
  Loader2,
  LogOut,
  Menu,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  Analysis,
  Api,
  analyzeText,
  download,
  initialSample,
  normalizeBackend,
  registry,
  sampleText,
} from "./lib/workbench";
import { defaultApiUrl, hostedDemo, request } from "./lib/api";

type View = "workspace" | "registry" | "history" | "settings" | "account";
type Stage = "requirements" | "mapping" | "simulation";
const viewNames = {
  workspace: "Integration desk",
  registry: "API registry",
  history: "Run history",
  settings: "Settings",
  account: "Account",
};

export default function App() {
  const [view, setView] = useState<View>("workspace");
  const [stage, setStage] = useState<Stage>("requirements");
  const [analysis, setAnalysis] = useState<Analysis>(initialSample);
  const [selected, setSelected] = useState("REQ-01");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [runs, setRuns] = useState<Analysis[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [simulationBusy, setSimulationBusy] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    () => localStorage.getItem("finspark_service_url") ?? defaultApiUrl,
  );
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem("finspark_session"),
  );
  const [user, setUser] = useState(
    () => sessionStorage.getItem("finspark_name") || "",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedApi, setSelectedApi] = useState<Api | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const req =
    analysis.requirements.find((x) => x.id === selected) ||
    analysis.requirements[0];
  const mapped = analysis.requirements.filter((x) => x.apis.length > 0).length;
  const apiIds = [...new Set(analysis.requirements.flatMap((x) => x.apis))];
  const matchingApis = registry.filter((api) => apiIds.includes(api.id));
  const currentAnalysis = useRef(analysis);
  currentAnalysis.current = analysis;
  useEffect(() => {
    const context = (document as Document & { modelContext?: any })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: "select_requirement",
      title: "Inspect a requirement",
      description:
        "Select an existing requirement in the current FinSpark analysis and open its visible API mapping. Does not process, upload, or send documents.",
      inputSchema: {
        type: "object",
        properties: { requirement_id: { type: "string" } },
        required: ["requirement_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input: unknown) {
        if (
          !input ||
          typeof input !== "object" ||
          !("requirement_id" in input) ||
          typeof input.requirement_id !== "string"
        )
          throw new Error("A requirement_id string is required.");
        const id = input.requirement_id;
        const requirement = currentAnalysis.current.requirements.find(
          (req) => req.id === id,
        );
        if (!requirement)
          throw new Error("Requirement not found in the current analysis.");
        flushSync(() => {
          setSelected(requirement.id);
          setStage("mapping");
          setView("workspace");
        });
        return { selected_id: requirement.id, adapter_ids: requirement.apis };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function navigate(next: View) {
    setView(next);
    setError("");
    setMobileNav(false);
  }
  function updateAnalysis(next: Analysis) {
    setAnalysis(next);
    setSelected(next.requirements[0]?.id || "");
    setSimulation(null);
    setStage("requirements");
    setRuns((prev) => [next, ...prev].slice(0, 30));
    navigate("workspace");
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose a document smaller than 10 MB.");
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["txt", "pdf", "docx"].includes(extension || ""))
        throw new Error("Choose a TXT, PDF, or DOCX document.");
      if (apiUrl && token) {
        const form = new FormData();
        form.append("file", file);
        const raw = await request(apiUrl, "/process/", token, {
          method: "POST",
          body: form,
        });
        updateAnalysis(normalizeBackend(raw, file.name));
      } else {
        if (extension !== "txt")
          throw new Error(
            "PDF and DOCX processing needs a connected session. Open Account to start a demo session or sign in, or try a TXT document locally.",
          );
        const text = await file.text();
        if (!text.trim())
          throw new Error(
            "This document is empty. Choose a document with readable text.",
          );
        const result = analyzeText(text, file.name);
        if (!result.requirements.length)
          throw new Error(
            "No requirement sentences found. Use one requirement per line, with at least 13 characters.",
          );
        updateAnalysis(result);
      }
      setNotice("Document analysis is ready.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to read this document.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function simulate() {
    setSimulationBusy(true);
    setError("");
    try {
      if (analysis.mode === "backend") {
        const data = analysis.raw.intelligent_analysis;
        setSimulation(
          await request(apiUrl, "/execute-pipeline/", token, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }),
        );
      } else {
        setSimulation({
          execution_log: matchingApis.map((api) => ({
            api: api.id,
            step: api.name,
            status: "SIMULATED",
            details: {
              mapped_requirements: analysis.requirements.filter((req) =>
                req.apis.includes(api.id),
              ).length,
            },
          })),
        });
      }
      setStage("simulation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setSimulationBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <FinanceCursor />
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      <aside className={`sidebar ${mobileNav ? "nav-open" : ""}`}>
        <a
          className="brand"
          href="#workspace"
          onClick={() => navigate("workspace")}
          aria-label="FinSpark home"
        >
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            FinSpark<span className="brand-period">.</span>
          </span>
        </a>
        <div className="workspace-switch">
          <span className="workspace-initial">F</span>
          <span>
            Finance workspace<small>Integration orchestrator</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {(
            [
              ["workspace", Layers3, "Integration desk"],
              ["registry", BookOpen, "API registry"],
              ["history", History, "Run history"],
              ["settings", Settings2, "Settings"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              className={`nav-item ${view === key ? "active" : ""}`}
              onClick={() => navigate(key)}
              aria-current={view === key ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {view === key && <span className="nav-active-mark" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={21} />
            <strong>Explore with a sample.</strong>
            <p>Trace requirements through a simulated financial workflow.</p>
            <button
              onClick={() => {
                updateAnalysis(initialSample());
                setNotice("Sample specification loaded.");
              }}
            >
              Open sample <Plus size={14} />
            </button>
          </div>
          <button className="user-button" onClick={() => navigate("account")}>
            <span className="avatar">
              <UserRound size={17} />
            </span>
            <span>
              {user || "Guest workspace"}
              <small>{token ? "Signed in" : "Sample & local analysis"}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="mobile-toggle icon-button"
              aria-label="Toggle navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span>WORKSPACE</span>
            <ChevronRight size={12} />
            <strong>{viewNames[view]}</strong>
          </div>
          <div className="topbar-right">
            <span className="mode-tag">
              {token && apiUrl
                ? user === "Demo session"
                  ? "CONNECTED DEMO"
                  : "Connected account"
                : "DEMO WORKSPACE"}
            </span>
            <button
              className="help-button"
              onClick={() => navigate("settings")}
            >
              <CircleHelp size={17} />
              <span>Help & connection</span>
            </button>
          </div>
        </header>
        <main id="main-content">
          {error && (
            <div className="alert error-alert" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={17} />
              </button>
            </div>
          )}
          {view === "workspace" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="small-line" /> FINANCIAL INTEGRATION
                    WORKBENCH
                  </div>
                  <h1>
                    Every requirement.
                    <br />
                    <em>A clear connection.</em>
                  </h1>
                  <p>
                    Turn financial documents into an inspectable integration
                    plan.
                  </p>
                </div>
                <div className="heading-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      updateAnalysis(initialSample());
                      setNotice("Sample specification loaded.");
                    }}
                  >
                    <FileText size={16} />
                    Load sample
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                  >
                    {busy ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}{" "}
                    {busy ? "Processing…" : "Upload document"}
                  </button>
                </div>
              </div>
              <input
                ref={input}
                type="file"
                className="visually-hidden"
                accept=".txt,.pdf,.docx"
                onChange={(e) => upload(e.target.files?.[0])}
                aria-label="Upload financial document"
              />
              <div className="overview-strip">
                <div>
                  <span className="strip-label">CURRENT DOCUMENT</span>
                  <strong>
                    <FileText size={15} />
                    {analysis.filename}
                  </strong>
                </div>
                <div>
                  <span className="strip-label">REQUIREMENTS</span>
                  <strong>
                    {String(analysis.requirements.length).padStart(2, "0")}
                    <small>identified</small>
                  </strong>
                </div>
                <div>
                  <span className="strip-label">API ADAPTERS</span>
                  <strong>
                    {String(apiIds.length).padStart(2, "0")}
                    <small>matched</small>
                  </strong>
                </div>
                <div>
                  <span className="strip-label">MAPPING COVERAGE</span>
                  <strong>
                    {analysis.requirements.length
                      ? Math.round(
                          (mapped / analysis.requirements.length) * 100,
                        )
                      : 0}
                    %
                    <small>
                      {mapped}/{analysis.requirements.length} requirements
                    </small>
                  </strong>
                </div>
              </div>
              <div
                className={`workbench ${dragging ? "drag-active" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  upload(e.dataTransfer.files[0]);
                }}
              >
                <section className="document-pane" aria-label="Source document">
                  <div className="pane-heading">
                    <span>
                      <FileText size={16} />
                      SOURCE DOCUMENT
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Download source document"
                      onClick={() =>
                        download(analysis.filename, analysis.text, "text/plain")
                      }
                    >
                      <ArrowDownToLine size={17} />
                    </button>
                  </div>
                  <div className="document-paper">
                    <div className="document-meta">
                      <span>
                        BRD /{" "}
                        {analysis.mode === "sample" ? "SAMPLE" : "UPLOADED"}
                      </span>
                      <span>01</span>
                    </div>
                    <h2>{analysis.title}</h2>
                    <div className="document-rule" />
                    <p className="document-intro">
                      {analysis.mode === "sample"
                        ? "Business requirements for a digital lending workflow."
                        : "Select a requirement to inspect its source and suggested connections."}
                    </p>
                    <div className="source-sections">
                      {analysis.requirements.map((item, i) => (
                        <button
                          key={item.id}
                          className={`source-section ${req?.id === item.id ? "selected" : ""}`}
                          onClick={() => setSelected(item.id)}
                        >
                          <span className="source-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <span>{item.evidence}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="document-foot">
                      FINSPARK <span>REQUIREMENTS SPECIFICATION</span>
                    </div>
                  </div>
                  <div className="document-caption">
                    <ShieldCheck size={14} />
                    {analysis.mode === "sample"
                      ? "Fictional sample. No customer data."
                      : analysis.mode === "backend"
                        ? "Processed and stored by your connected service."
                        : "Local document held in this browser session."}
                  </div>
                </section>
                <section className="analysis-pane" aria-label="Analysis">
                  <div className="analysis-header">
                    <div>
                      <span className="eyebrow">THE INTEGRATION PLAN</span>
                      <h2>Make the connections.</h2>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Export integration plan"
                      onClick={() =>
                        download(
                          "finspark-integration-plan.json",
                          JSON.stringify(analysis, null, 2),
                        )
                      }
                    >
                      <ArrowDownToLine size={19} />
                    </button>
                  </div>
                  <div
                    className="stage-tabs"
                    role="tablist"
                    aria-label="Analysis views"
                  >
                    {(["requirements", "mapping", "simulation"] as const).map(
                      (tab, i) => (
                        <button
                          key={tab}
                          role="tab"
                          id={`tab-${tab}`}
                          aria-controls="analysis-tabpanel"
                          aria-selected={stage === tab}
                          className={stage === tab ? "selected" : ""}
                          onClick={() => setStage(tab)}
                        >
                          <span>0{i + 1}</span>
                          {tab === "requirements"
                            ? "Requirements"
                            : tab === "mapping"
                              ? "API mapping"
                              : "Simulation"}
                        </button>
                      ),
                    )}
                  </div>
                  <div
                    role="tabpanel"
                    id="analysis-tabpanel"
                    aria-labelledby={`tab-${stage}`}
                  >
                    {stage === "requirements" && (
                      <>
                        <div className="list-caption">
                          <span>EXTRACTED REQUIREMENT</span>
                          <span>ADAPTERS</span>
                        </div>
                        <div className="requirement-list">
                          {analysis.requirements.map((item) => (
                            <button
                              key={item.id}
                              className={`requirement-row ${req?.id === item.id ? "selected" : ""}`}
                              onClick={() => setSelected(item.id)}
                            >
                              <span className="req-index">
                                {item.id.slice(-2)}
                              </span>
                              <span className="req-content">
                                <strong>{item.title}</strong>
                                <small>
                                  {item.fields.length
                                    ? item.fields
                                        .slice(0, 2)
                                        .map((f) => f.replaceAll("_", " "))
                                        .join(" · ")
                                    : "Review source requirement"}
                                </small>
                              </span>
                              <span
                                className={`mapping-count ${!item.apis.length ? "unmapped" : ""}`}
                              >
                                {item.apis.length
                                  ? `${item.apis.length} matched`
                                  : "Unmapped"}
                              </span>
                              <ChevronRight size={15} />
                            </button>
                          ))}
                        </div>
                        <div className="analysis-note">
                          <Link2 size={17} />
                          <p>
                            {analysis.mode === "backend"
                              ? "Mappings returned by the connected processing service. Review source evidence before integrating."
                              : "Keyword-based suggestions. Select a requirement to review its source and matched adapters."}
                          </p>
                        </div>
                      </>
                    )}
                    {stage === "mapping" && (
                      <div className="mapping-view">
                        <p className="view-intro">
                          {req
                            ? "Select a requirement on the left to trace its adapters."
                            : "No requirements to map yet."}
                        </p>
                        <div className="mapping-origin">
                          <span>{req?.id}</span>
                          <strong>{req?.title}</strong>
                        </div>
                        <div className="mapping-branch" />
                        <div className="mapped-adapters">
                          {registry
                            .filter((api) => req?.apis.includes(api.id))
                            .map((api) => (
                              <button
                                className="mapped-adapter"
                                key={api.id}
                                onClick={() => setSelectedApi(api)}
                              >
                                <span className="adapter-symbol">
                                  <Link2 size={17} />
                                </span>
                                <span>
                                  <strong>{api.name}</strong>
                                  <small>
                                    {api.category} / {api.id}
                                  </small>
                                </span>
                                <ChevronRight size={16} />
                              </button>
                            ))}
                        </div>
                        {!req?.apis.length && (
                          <div className="empty-state">
                            <Link2 size={26} />
                            <h3>No adapter match</h3>
                            <p>
                              This requirement needs manual review. Browse the
                              registry for available adapter templates.
                            </p>
                          </div>
                        )}
                        <p className="small-muted">
                          Adapter definitions describe intended integration
                          fields. They are not live provider connections.
                        </p>
                      </div>
                    )}
                    {stage === "simulation" && (
                      <div className="simulation-view">
                        <div className="simulation-banner">
                          <Activity size={22} />
                          <div>
                            <strong>
                              Inspect the workflow before integrating.
                            </strong>
                            <p>
                              Simulation only. No identity checks, messages or
                              payments are sent.
                            </p>
                          </div>
                        </div>
                        {simulation ? (
                          <ol className="execution-log">
                            {simulation.execution_log.map(
                              (entry: any, i: number) => (
                                <li key={i}>
                                  <span className="execution-number">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <div>
                                    <strong>{entry.step}</strong>
                                    <small>{entry.api}</small>
                                  </div>
                                  <span className="simulated-tag">
                                    SIMULATED
                                  </span>
                                </li>
                              ),
                            )}
                          </ol>
                        ) : (
                          <div className="simulation-empty">
                            <div className="simulation-diagram">
                              <FileText size={25} />
                              <span />
                              <Link2 size={25} />
                              <span />
                              <ShieldCheck size={25} />
                            </div>
                            <h3>Your plan is ready to inspect.</h3>
                            <p>
                              Walk through {apiIds.length} matched adapters
                              using a simulated execution log.
                            </p>
                          </div>
                        )}
                        <button
                          className="button primary"
                          disabled={simulationBusy || !apiIds.length}
                          onClick={simulate}
                        >
                          {simulationBusy ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <Play size={16} />
                          )}{" "}
                          {simulation ? "Run again" : "Run simulation"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="analysis-footer">
                    <span>
                      {analysis.mode === "backend"
                        ? "SERVICE ANALYSIS"
                        : analysis.mode === "sample"
                          ? "SAMPLE / KEYWORD ANALYSIS"
                          : "LOCAL / KEYWORD ANALYSIS"}
                    </span>
                    <span>Review before use</span>
                  </div>
                </section>
                <aside
                  className="inspector-pane"
                  aria-label="Requirement inspector"
                >
                  <span className="eyebrow">CONNECTION INSPECTOR</span>
                  <div className="inspector-id">
                    {req?.id || "NO SELECTION"}
                    <span>Selected</span>
                  </div>
                  <h3>{req?.title || "Upload a document"}</h3>
                  <div className="inspector-section">
                    <span className="inspector-label">SOURCE EVIDENCE</span>
                    <blockquote>
                      {req?.evidence || "Your source text will appear here."}
                    </blockquote>
                  </div>
                  <div className="inspector-section">
                    <span className="inspector-label">SUGGESTED ADAPTERS</span>
                    <div className="inspector-adapters">
                      {registry
                        .filter((api) => req?.apis.includes(api.id))
                        .map((api) => (
                          <button
                            key={api.id}
                            onClick={() => setSelectedApi(api)}
                          >
                            <span>
                              {api.name}
                              <small>{api.category}</small>
                            </span>
                            <ChevronRight size={15} />
                          </button>
                        ))}
                    </div>
                    {!req?.apis.length && (
                      <p className="small-muted">
                        No match. Manual review required.
                      </p>
                    )}
                  </div>
                  <div className="inspector-section">
                    <span className="inspector-label">RELEVANT FIELDS</span>
                    <div className="field-tags">
                      {req?.fields.map((field) => (
                        <code key={field}>{field}</code>
                      ))}
                    </div>
                    {!req?.fields.length && (
                      <p className="small-muted">
                        No explicit fields identified.
                      </p>
                    )}
                  </div>
                  <div className="inspector-review">
                    <ShieldCheck size={18} />
                    <p>
                      Every suggestion should be checked against the source
                      specification.
                    </p>
                  </div>
                </aside>
              </div>
              <div className="workspace-bottom">
                <span>
                  <span className="keycap">01</span>Read the source
                </span>
                <span>
                  <span className="keycap">02</span>Inspect the mapping
                </span>
                <span>
                  <span className="keycap">03</span>Simulate the workflow
                </span>
                <button onClick={() => navigate("registry")}>
                  Browse all {registry.length} adapters <BookOpen size={15} />
                </button>
              </div>
            </>
          )}
          {view === "registry" && (
            <>
              <PageHeading
                eyebrow="CONNECTION LIBRARY"
                title="A considered set of connections."
                description="Explore the financial adapter templates used by the mapping engine."
              />
              <div className="registry-toolbar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search adapters or fields"
                    aria-label="Search adapters"
                  />
                </label>
                <label className="category-field">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[
                      "All",
                      ...new Set(registry.map((api) => api.category)),
                    ].map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="registry-grid">
                {registry
                  .filter(
                    (api) =>
                      (category === "All" || api.category === category) &&
                      [api.name, api.description, ...api.fields]
                        .join(" ")
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                  )
                  .map((api, i) => (
                    <button
                      className="registry-card"
                      key={api.id}
                      onClick={() => setSelectedApi(api)}
                    >
                      <div className="registry-card-top">
                        <span className="adapter-symbol">
                          <Link2 size={22} />
                        </span>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <span className="eyebrow">{api.category}</span>
                      <h2>{api.name}</h2>
                      <p>{api.description}</p>
                      <div className="registry-card-bottom">
                        <code>{api.id}</code>
                        <span>
                          View definition <ChevronRight size={16} />
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
              {!registry.some(
                (api) =>
                  (category === "All" || api.category === category) &&
                  [api.name, api.description, ...api.fields]
                    .join(" ")
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              ) && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No matching adapters</h3>
                  <p>Try another field name or category.</p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <p className="registry-footnote">
                These are integration templates. Provider credentials and live
                connections are not configured.
              </p>
            </>
          )}
          {view === "history" && (
            <>
              <PageHeading
                eyebrow="WORKSPACE ACTIVITY"
                title="The work, recorded."
                description="Reopen analyses from this browser session. Export a plan to keep a copy."
              />
              <div className="history-header">
                <strong>{runs.length} analyses this session</strong>
                <button
                  className="button secondary"
                  disabled={!runs.length}
                  onClick={() => {
                    setRuns([]);
                    setNotice("Session history cleared.");
                  }}
                >
                  Clear history
                </button>
              </div>
              {runs.length ? (
                <div className="history-list">
                  {runs.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => {
                        setAnalysis(run);
                        setSelected(run.requirements[0]?.id || "");
                        setSimulation(null);
                        navigate("workspace");
                      }}
                    >
                      <FileText size={21} />
                      <span>
                        <strong>{run.filename}</strong>
                        <small>
                          {run.requirements.length} requirements ·{" "}
                          {run.mode === "backend"
                            ? "Service analysis"
                            : run.mode === "sample"
                              ? "Sample"
                              : "Local analysis"}
                        </small>
                      </span>
                      <time>
                        {new Date(run.created).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state large-empty">
                  <History size={38} />
                  <h2>A fresh start.</h2>
                  <p>
                    Upload a document or load the sample to record your first
                    analysis.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => updateAnalysis(initialSample())}
                  >
                    Load sample
                  </button>
                </div>
              )}
            </>
          )}
          {view === "settings" && (
            <SettingsView
              apiUrl={apiUrl}
              onSave={(url) => {
                setApiUrl(url);
                localStorage.setItem("finspark_service_url", url);
                setNotice("Connection settings saved.");
              }}
              onAccount={() => navigate("account")}
            />
          )}
          {view === "account" && (
            <AccountView
              apiUrl={apiUrl}
              token={token}
              user={user}
              onLogin={(name, next) => {
                setUser(name);
                setToken(next);
                sessionStorage.setItem("finspark_session", next);
                sessionStorage.setItem("finspark_name", name);
                setNotice("Signed in. Service processing is now available.");
                navigate("workspace");
              }}
              onLogout={async () => {
                try {
                  if (apiUrl && token)
                    await request(apiUrl, "/api/auth/logout", token, {
                      method: "POST",
                    });
                } catch {}
                setToken(null);
                setUser("");
                sessionStorage.removeItem("finspark_session");
                sessionStorage.removeItem("finspark_name");
                setNotice("Signed out.");
              }}
              onSettings={() => navigate("settings")}
            />
          )}
        </main>
        <footer className="site-footer">
          <span>
            FinSpark<span className="brand-period">.</span>
            <small>Financial integration, made inspectable.</small>
          </span>
          <a
            href="https://github.com/yatharth7115/FinSpark"
            target="_blank"
            rel="noreferrer"
          >
            View project on GitHub
          </a>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {selectedApi && (
        <ApiDialog api={selectedApi} onClose={() => setSelectedApi(null)} />
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading simple-heading">
      <div>
        <div className="eyebrow">
          <span className="small-line" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function ApiDialog({ api, onClose }: { api: Api; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="api-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <span className="eyebrow">{api.category} / ADAPTER DEFINITION</span>
        <button
          className="icon-button"
          aria-label="Close adapter details"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <h2>{api.name}</h2>
      <p>{api.description}</p>
      <code className="api-id">{api.id}</code>
      <h3>Integration fields</h3>
      <div className="dialog-fields">
        {api.fields.map((field) => (
          <div key={field}>
            <code>{field}</code>
            <span>Template field</span>
          </div>
        ))}
      </div>
      <div className="dialog-note">
        <ShieldCheck size={20} />
        <p>
          This adapter is a template used for analysis and simulation. No live
          provider requests are made.
        </p>
      </div>
      <button className="button primary" onClick={onClose}>
        Done
      </button>
    </dialog>
  );
}
function SettingsView({
  apiUrl,
  onSave,
  onAccount,
}: {
  apiUrl: string;
  onSave: (url: string) => void;
  onAccount: () => void;
}) {
  const [url, setUrl] = useState(apiUrl),
    [status, setStatus] = useState(""),
    [checking, setChecking] = useState(false);
  async function check() {
    setChecking(true);
    try {
      const parsed = new URL(url);
      if (!["https:", "http:"].includes(parsed.protocol))
        throw new Error("Use an HTTPS service URL.");
      if (
        parsed.protocol === "http:" &&
        !["localhost", "127.0.0.1"].includes(parsed.hostname)
      )
        throw new Error("Remote services must use HTTPS.");
      const data = await request(url, "/health", null);
      if (data.service !== "FinSpark" || data.status !== "healthy")
        throw new Error("This URL did not return a healthy FinSpark service.");
      onSave(url.replace(/\/$/, ""));
      setStatus("Connected. Sign in to process PDF, DOCX and TXT documents.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setChecking(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE SETTINGS"
        title="Connect your processing service."
        description="Use the sample immediately, or connect the Python service for document processing."
      />
      <div className="settings-layout">
        <section className="settings-card">
          <h2>Processing service</h2>
          <p>
            PDF and DOCX analysis runs on your FinSpark backend. TXT files can
            also be analyzed locally using keyword rules.
          </p>
          <label className="form-label" htmlFor="api-url">
            Service URL
          </label>
          <input
            id="api-url"
            className="text-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-finspark-service.onrender.com"
            type="url"
          />
          <div className="settings-actions">
            <button
              className="button primary"
              onClick={check}
              disabled={checking || !url}
            >
              {checking ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Link2 size={16} />
              )}
              Test & save connection
            </button>
            <button
              className="button secondary"
              onClick={() => {
                onSave("");
                setUrl("");
                setStatus("Using local analysis.");
              }}
            >
              Use local analysis
            </button>
          </div>
          {status && (
            <p className="connection-result" role="status">
              {status}
            </p>
          )}
          <button className="text-button" onClick={onAccount}>
            Open account sign-in
          </button>
        </section>
        <aside className="settings-info">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>
            Clear boundaries.
            <br />
            Useful results.
          </h2>
          <ul>
            <li>
              <strong>Sample workspace</strong>
              <span>
                Fictional requirements and keyword-based mappings. Always
                available.
              </span>
            </li>
            <li>
              <strong>Local TXT analysis</strong>
              <span>
                Runs in your browser. Uploaded content is held in memory for
                this session.
              </span>
            </li>
            <li>
              <strong>Connected processing</strong>
              <span>
                Documents are sent to your configured service. Sign-in is
                required; results may be stored in server history.
              </span>
            </li>
            <li>
              <strong>Simulation</strong>
              <span>
                Builds an execution log. It never moves money or contacts bank
                providers.
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </>
  );
}
function AccountView({
  apiUrl,
  token,
  user,
  onLogin,
  onLogout,
  onSettings,
}: {
  apiUrl: string;
  token: string | null;
  user: string;
  onLogin: (name: string, token: string) => void;
  onLogout: () => void;
  onSettings: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [otp, setOtp] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const demo = hostedDemo && apiUrl === defaultApiUrl;
  async function startDemo() {
    setBusy(true);
    setError("");
    try {
      const data = await request(apiUrl, "/api/auth/demo-session", null, {
        method: "POST",
      });
      onLogin(data.user.full_name, data.access_token);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to start a demo session.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const path =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup-verify";
      const data = await request(apiUrl, path, null, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { email, password, full_name: name, otp },
        ),
      });
      if (!data.access_token) throw new Error("No session token returned.");
      onLogin(
        data.user?.full_name || name || email.split("@")[0],
        data.access_token,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  async function sendOtp() {
    setBusy(true);
    setError("");
    try {
      await request(apiUrl, "/api/auth/send-otp", null, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to send verification code.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ACCOUNT ACCESS"
        title={token ? "Your connected workspace." : "A workspace of your own."}
        description="Sign in to use the connected service. Samples and local TXT analysis are available without an account."
      />
      {token ? (
        <section className="settings-card account-card">
          <UserRound size={28} />
          <h2>{user}</h2>
          <p>
            {demo
              ? "Disposable demo session. Stored results reset when the free service restarts. Use fictional documents for this demonstration."
              : "You are signed in for this browser session."}
          </p>
          <button className="button secondary" onClick={onLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </section>
      ) : (
        <section className="settings-card account-card">
          {!apiUrl ? (
            <>
              <Link2 size={27} />
              <h2>Connect the service first.</h2>
              <p>Account access needs a hosted FinSpark backend.</p>
              <button className="button primary" onClick={onSettings}>
                Open settings
              </button>
            </>
          ) : demo ? (
            <>
              <Activity size={28} />
              <h2>Try connected document processing.</h2>
              <p>
                Start a separate demo session to analyze PDF, DOCX and TXT
                documents. No email or password needed. Results reset when the
                free service restarts.
              </p>
              <p className="small-muted">
                Use fictional documents for this demonstration. Your documents
                are sent to the FinSpark demo service.
              </p>
              <button
                className="button primary"
                onClick={startDemo}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Play size={16} />
                )}
                Start demo session
              </button>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="account-tabs">
                <button
                  className={mode === "login" ? "selected" : ""}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in
                </button>
                <button
                  className={mode === "signup" ? "selected" : ""}
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  Create account
                </button>
              </div>
              <form onSubmit={submit}>
                {mode === "signup" && (
                  <label className="form-label">
                    Full name
                    <input
                      className="text-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label className="form-label">
                  Email
                  <input
                    className="text-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>
                <label className="form-label">
                  Password
                  <input
                    className="text-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
                {mode === "signup" && (
                  <>
                    <p className="small-muted">
                      Use at least 8 characters with uppercase, lowercase, a
                      number and a special character.
                    </p>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={busy || !email}
                      onClick={sendOtp}
                    >
                      {sent
                        ? "Resend verification code"
                        : "Send verification code"}
                    </button>
                    <label className="form-label">
                      Verification code
                      <input
                        className="text-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        minLength={6}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </label>
                  </>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="spin" size={16} />
                  ) : (
                    <UserRound size={16} />
                  )}{" "}
                  {mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
