import { useEffect, useMemo, useRef, useState } from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  LoaderCircle,
  Menu,
  MessageSquareText,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "./api.js";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const moneyExact = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function MetricCard({ title, value, note, icon: Icon, tone = "green" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </div>

      <div className="metric-label">{title}</div>

      <div className="metric-value">{value}</div>

      <div className="metric-note">{note}</div>
    </article>
  );
}

function Badge({ children, variant = "neutral" }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

function App() {
  const [analytics, setAnalytics] = useState(null);

  const [source, setSource] = useState("Demo dataset");

  const [aiStatus, setAiStatus] = useState({
    available: false,
    installed: false,
    model: "gemma3:1b",
  });

  const [busy, setBusy] = useState("");

  const [notice, setNotice] = useState({ type: "", text: "" });

  const [activeTab, setActiveTab] = useState("Overview");

  const [mobileNav, setMobileNav] = useState(false);

  const [question, setQuestion] = useState("");

  const [chat, setChat] = useState([]);

  const [product, setProduct] = useState("");

  const [details, setDetails] = useState("");

  const [language, setLanguage] = useState("English");

  const [listing, setListing] = useState("");

  const fileRef = useRef(null);

  const loadAnalytics = async () => {
    try {
      const data = await api.analytics();

      setAnalytics(data.analytics);

      setSource(data.source);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  };

  useEffect(() => {
    let live = true;

    Promise.allSettled([api.analytics(), api.health()]).then(
      ([dataResult, healthResult]) => {
        if (!live) return;

        if (dataResult.status === "fulfilled") {
          setAnalytics(dataResult.value.analytics);

          setSource(dataResult.value.source);
        } else {
          setNotice({
            type: "error",
            text: `Could not connect to API: ${dataResult.reason.message}. Start the server with npm run dev from the project root.`,
          });
        }

        if (healthResult.status === "fulfilled")
          setAiStatus(healthResult.value.ai || {});
      },
    );

    return () => {
      live = false;
    };
  }, []);

  const products = analytics?.products || [];

  const summary = analytics?.summary;

  const chartData = analytics?.chart || [];

  const lossProducts = useMemo(
    () => products.filter((item) => item.profit < 0),
    [products],
  );

  const lowMarginProducts = useMemo(
    () =>
      products.filter(
        (item) => item.profit >= 0 && item.revenue > 0 && item.margin < 15,
      ),
    [products],
  );

  const notify = (type, text) => {
    setNotice({ type, text });

    window.setTimeout(
      () =>
        setNotice((current) =>
          current.text === text ? { type: "", text: "" } : current,
        ),
      5500,
    );
  };

  const importCsv = async (file) => {
    if (!file) return;

    setBusy("upload");

    try {
      const result = await api.importCsv(file);

      setAnalytics(result.analytics);

      setSource(result.source);

      setActiveTab("Overview");

      setChat([]);

      setListing("");

      notify(
        "success",
        `Imported ${number(result.rows_imported)} product rows from ${result.source}.`,
      );
    } catch (error) {
      notify("error", error.message);
    } finally {
      setBusy("");

      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const loadDemo = async () => {
    setBusy("demo");

    try {
      const result = await api.demo();

      setAnalytics(result.analytics);

      setSource(result.source);

      setChat([]);

      notify("success", "Demo data loaded.");
    } catch (error) {
      notify("error", error.message);
    } finally {
      setBusy("");
    }
  };

  const askQuestion = async (value = question) => {
    const prompt = value.trim();

    if (!prompt || busy === "ask") return;

    setChat((items) => [...items, { role: "user", text: prompt }]);

    setQuestion("");

    setBusy("ask");

    try {
      const result = await api.ask(prompt);

      setChat((items) => [
        ...items,
        { role: "assistant", text: result.answer },
      ]);
    } catch (error) {
      setChat((items) => [...items, { role: "error", text: error.message }]);
    } finally {
      setBusy("");
    }
  };

  const createListing = async (event) => {
    event.preventDefault();

    setBusy("listing");

    setListing("");

    try {
      const result = await api.listing({ product, details, language });

      setListing(result.listing);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setBusy("");
    }
  };

  const navItems = [
    { label: "Overview", icon: Activity },

    { label: "Profit analysis", icon: Wallet },

    { label: "AI business chat", icon: MessageSquareText },

    { label: "Listing studio", icon: Sparkles },
  ];

  const navTo = (label) => {
    setActiveTab(label);

    setMobileNav(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Activity size={21} strokeWidth={2.5} />
          </div>

          <div>
            <div className="brand-name">marginmitra</div>
            <div className="brand-subtitle">PROFIT COPILOT</div>
          </div>

          <button
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">S</div>

          <div className="workspace-copy">
            <strong>Seller workspace</strong>
            <span>Local business data</span>
          </div>

          <ChevronDown size={15} />
        </div>

        <div className="nav-section-label">WORKSPACE</div>

        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeTab === label ? "active" : ""}`}
              onClick={() => navTo(label)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === "AI business chat" && <span className="nav-ai-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={18} />

            <div>
              <strong>Local-first by design</strong>
              <p>
                Data stays in this API session. AI runs through your local
                Ollama setup.
              </p>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">SM</div>

            <div className="user-details">
              <strong>Shop Manager</strong>
              <span>Free workspace</span>
            </div>

            <button
              className="icon-button"
              onClick={() =>
                notify("info", "This MVP has no account system yet.")
              }
              aria-label="Account information"
            >
              <CircleHelp size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>

            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{activeTab}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div
              className={`ai-status ${aiStatus.available && aiStatus.installed ? "online" : ""}`}
            >
              <span className="status-dot" />{" "}
              {aiStatus.available && aiStatus.installed
                ? "Local AI connected"
                : "Local AI not connected"}
            </div>

            <button className="avatar-button" title="Workspace profile">
              SM
            </button>
          </div>
        </header>

        <div className="page-content">
          {notice.text && (
            <div className={`notice ${notice.type}`} role="status">
              {notice.type === "success" ? (
                <Check size={17} />
              ) : (
                <CircleHelp size={17} />
              )}

              <span>{notice.text}</span>
              <button
                onClick={() => setNotice({ type: "", text: "" })}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> YOUR BUSINESS, AT A GLANCE
              </div>

              <h1>
                {activeTab === "Overview"
                  ? "Good business starts with clarity."
                  : activeTab}
              </h1>

              <p className="page-description">
                {activeTab === "Overview"
                  ? "Know what you earn, where margin leaks, and what to do next."
                  : pageDescription(activeTab)}
              </p>
            </div>

            <div className="heading-actions">
              <button
                className="button secondary"
                onClick={loadDemo}
                disabled={!!busy}
              >
                <RefreshCw
                  size={15}
                  className={busy === "demo" ? "spin" : ""}
                />{" "}
                Reset demo
              </button>

              <button
                className="button primary"
                onClick={() => fileRef.current?.click()}
                disabled={busy === "upload"}
              >
                {busy === "upload" ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Upload size={16} />
                )}{" "}
                Import CSV
              </button>

              <input
                ref={fileRef}
                className="hidden-input"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => importCsv(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="source-line">
            <FileSpreadsheet size={14} /> Current dataset:{" "}
            <strong>{source}</strong>
            <span className="source-separator">·</span>
            {number(summary?.product_count || 0)} product rows{" "}
            <span className="source-separator">·</span>
            <button
              onClick={() =>
                notify(
                  "info",
                  "CSV data is held in server memory and is cleared when the API restarts.",
                )
              }
            >
              Data handling
            </button>
          </div>

          {activeTab === "Overview" && (
            <Overview
              summary={summary}
              chartData={chartData}
              products={products}
              lossProducts={lossProducts}
              lowMarginProducts={lowMarginProducts}
              recommendations={analytics?.recommendations || []}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "Profit analysis" && (
            <ProfitAnalysis products={products} summary={summary} />
          )}

          {activeTab === "AI business chat" && (
            <BusinessChat
              chat={chat}
              question={question}
              setQuestion={setQuestion}
              askQuestion={askQuestion}
              busy={busy}
              aiStatus={aiStatus}
            />
          )}

          {activeTab === "Listing studio" && (
            <ListingStudio
              product={product}
              setProduct={setProduct}
              details={details}
              setDetails={setDetails}
              language={language}
              setLanguage={setLanguage}
              listing={listing}
              createListing={createListing}
              busy={busy}
              aiStatus={aiStatus}
            />
          )}

          <footer className="footer">
            <span>
              MarginMitra <span className="footer-dot">·</span> Open-weight AI
              for small business
            </span>
            <span>
              <ShieldCheck size={13} /> Estimates only, not accounting advice
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function pageDescription(tab) {
  if (tab === "Profit analysis")
    return "Explore product-level revenue, estimated costs and margin performance.";

  if (tab === "AI business chat")
    return "Ask questions about this dataset and get practical, data-grounded answers.";

  return "Create honest, marketplace-ready copy from the product details you provide.";
}

function Overview({
  summary,
  chartData,
  products,
  lossProducts,
  lowMarginProducts,
  recommendations = [],
  setActiveTab,
}) {
  if (!summary) return <LoadingState />;

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          title="Net revenue"
          value={currency(summary.revenue)}
          note={`${number(summary.units_sold)} net units sold`}
          icon={Wallet}
        />

        <MetricCard
          title="Estimated profit"
          value={currency(summary.estimated_profit)}
          note={`${summary.overall_margin.toFixed(1)}% overall margin`}
          icon={Activity}
          tone="blue"
        />

        <MetricCard
          title="Estimated costs"
          value={currency(summary.estimated_cost)}
          note="Product + fulfilment + fees"
          icon={Package}
          tone="orange"
        />

        <MetricCard
          title="Products to review"
          value={number(
            summary.loss_making_products + summary.low_margin_products,
          )}
          note={`${summary.loss_making_products} loss-making · ${summary.low_margin_products} low margin`}
          icon={Lightbulb}
          tone="red"
        />
      </section>

      <section className="overview-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Revenue & profit by product</h2>
              <p>Top products by revenue in the current dataset</p>
            </div>

            <Badge variant="neutral">INR</Badge>
          </div>

          {chartData.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 8, left: 2, bottom: 12 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#1c8b67"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="100%"
                        stopColor="#1c8b67"
                        stopOpacity={0.01}
                      />
                    </linearGradient>

                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#4e83d5"
                        stopOpacity={0.16}
                      />
                      <stop
                        offset="100%"
                        stopColor="#4e83d5"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 4"
                    vertical={false}
                    stroke="#e9eeeb"
                  />

                  <XAxis
                    dataKey="product"
                    tick={{ fill: "#7b8781", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-13}
                    textAnchor="end"
                    height={45}
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `₹${Math.round(value / 1000)}k`
                        : `₹${value}`
                    }
                    tick={{ fill: "#7b8781", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />

                  <Tooltip
                    formatter={(value) => moneyExact(value)}
                    contentStyle={{
                      border: "1px solid #e3e9e5",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#1c8b67"
                    strokeWidth={2.2}
                    fill="url(#revenueFill)"
                  />

                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#4e83d5"
                    strokeWidth={2.2}
                    fill="url(#profitFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}

          <div className="chart-legend">
            <span>
              <i className="legend-dot revenue" /> Revenue
            </span>
            <span>
              <i className="legend-dot profit" /> Profit
            </span>
            <span className="chart-footnote">
              Calculated from supplied unit costs
            </span>
          </div>
        </article>

        <article className="panel insights-panel">
          <div className="panel-header">
            <div>
              <h2>What needs attention</h2>
              <p>Based on your current product data</p>
            </div>
            <Lightbulb size={18} className="panel-header-icon" />
          </div>

          <div className="insight-item">
            <div className="insight-icon red">
              <ArrowDownRight size={17} />
            </div>

            <div className="insight-copy">
              <strong>
                {lossProducts.length} loss-making{" "}
                {lossProducts.length === 1 ? "product" : "products"}
              </strong>
              <p>
                {lossProducts.length
                  ? `${lossProducts
                      .slice(0, 2)
                      .map((item) => item.product)
                      .join(
                        ", ",
                      )}${lossProducts.length > 2 ? " and more" : ""} currently show negative estimated profit.`
                  : "No products show negative estimated profit."}
              </p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon amber">
              <Activity size={16} />
            </div>

            <div className="insight-copy">
              <strong>{lowMarginProducts.length} low-margin products</strong>
              <p>
                {lowMarginProducts.length
                  ? "These products have estimated margin below 15%. Review fees, fulfilment costs or pricing."
                  : "No profitable products fall below the 15% margin review threshold."}
              </p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon green">
              <ArrowUpRight size={17} />
            </div>

            <div className="insight-copy">
              <strong>Top profit contributor</strong>
              <p>
                {summary.best_product
                  ? `${summary.best_product} is the highest profit contributor in this dataset.`
                  : "Import product data to find your top contributor."}
              </p>
            </div>
          </div>

          <button
            className="text-link"
            onClick={() => setActiveTab("Profit analysis")}
          >
            Review product margins <span>→</span>
          </button>
        </article>
      </section>

      <section className="panel products-panel">
        <div className="panel-header">
          <div>
            <h2>Recommended actions</h2>
            <p>Product priorities based on calculated profit metrics</p>
          </div>
          <Badge variant="neutral">{recommendations.length} priorities</Badge>
        </div>

        {recommendations.length > 0 ? (
          <div className="recommendation-list">
            {recommendations.map((item, index) => {
              const isLoss = Number(item.profit) < 0;
              const isNoRevenue = Number(item.revenue) === 0;
              const isLowMargin =
                Number(item.revenue) > 0 &&
                Number(item.profit) >= 0 &&
                Number(item.margin) < 15;

              const status = isLoss
                ? "Loss-making"
                : isNoRevenue
                  ? "No revenue"
                  : isLowMargin
                    ? "Low margin"
                    : "Review opportunity";

              const variant =
                isLoss || isNoRevenue
                  ? "red"
                  : isLowMargin
                    ? "amber"
                    : "neutral";

              return (
                <article
                  className="insight-item recommendation-item"
                  key={`${item.product}-${index}`}
                >
                  <div
                    className={`insight-icon ${isLoss || isNoRevenue ? "red" : isLowMargin ? "amber" : "green"}`}
                  >
                    <Lightbulb size={17} />
                  </div>

                  <div className="insight-copy recommendation-copy">
                    <div className="recommendation-title-row">
                      <strong>
                        {index + 1}. {item.product}
                      </strong>
                      <Badge variant={variant}>{status}</Badge>
                    </div>
                    <p>
                      {item.reason ||
                        "Review product costs and pricing using the supplied figures."}
                    </p>

                    <div className="recommendation-metrics">
                      <div>
                        <div className="metric-label">Revenue</div>
                        <strong>{moneyExact(item.revenue)}</strong>
                      </div>
                      <div>
                        <div className="metric-label">Est. cost</div>
                        <strong>{moneyExact(item.total_cost)}</strong>
                      </div>
                      <div>
                        <div className="metric-label">Est. profit</div>
                        <strong
                          className={
                            Number(item.profit) < 0
                              ? "negative-value"
                              : "positive-value"
                          }
                        >
                          {moneyExact(item.profit)}
                        </strong>
                      </div>
                      <div>
                        <div className="metric-label">Margin</div>
                        <strong>{Number(item.margin || 0).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState />
        )}

        <button
          className="text-link"
          onClick={() => setActiveTab("Profit analysis")}
        >
          Review all product margins <span>→</span>
        </button>
      </section>

      <section className="panel products-panel">
        <div className="panel-header">
          <div>
            <h2>Product performance</h2>
            <p>Ranked by estimated profit, highest first</p>
          </div>
          <button
            className="text-link"
            onClick={() => setActiveTab("Profit analysis")}
          >
            View all <span>→</span>
          </button>
        </div>

        <ProductTable products={products.slice(0, 6)} />
      </section>

      <div className="callout-row">
        <div className="callout-icon">
          <Bot size={20} />
        </div>
        <div className="callout-copy">
          <strong>Have a business question?</strong>
          <p>
            Ask the local AI to explain product performance using the current
            dataset.
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => setActiveTab("AI business chat")}
        >
          Ask MarginMitra <Sparkles size={15} />
        </button>
      </div>
    </>
  );
}

function ProfitAnalysis({ products, summary }) {
  return (
    <div className="stacked-content">
      <section className="metrics-grid compact">
        <MetricCard
          title="Products analysed"
          value={number(summary?.product_count)}
          note="Rows in current dataset"
          icon={Package}
        />

        <MetricCard
          title="Overall margin"
          value={`${(summary?.overall_margin || 0).toFixed(1)}%`}
          note="Profit as a share of revenue"
          icon={Activity}
          tone="blue"
        />

        <MetricCard
          title="Loss-making"
          value={number(summary?.loss_making_products)}
          note="Negative estimated profit"
          icon={ArrowDownRight}
          tone="red"
        />
      </section>

      <section className="panel products-panel">
        <div className="panel-header">
          <div>
            <h2>All product margins</h2>
            <p>Estimates based on the costs supplied in your CSV</p>
          </div>
          <Badge>{number(products.length)} rows</Badge>
        </div>

        <ProductTable products={products} showCost />
      </section>

      <div className="note-box">
        <CircleHelp size={17} />
        <p>
          <strong>How these estimates work:</strong> net revenue subtracts
          per-unit discounts and returned units. Estimated cost includes unit
          cost, shipping, marketplace fees and packaging. Add any missing costs
          to your CSV for more complete estimates.
        </p>
      </div>
    </div>
  );
}

function ProductTable({ products, showCost = false }) {
  if (!products.length) return <EmptyState />;

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Net units</th>
            <th>Revenue</th>
            {showCost && <th>Est. cost</th>}
            <th>Est. profit</th>
            <th>Margin</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {products.map((item, index) => {
            const status =
              item.profit < 0
                ? "Loss-making"
                : item.margin < 15
                  ? "Low margin"
                  : "Healthy";

            const variant =
              item.profit < 0 ? "red" : item.margin < 15 ? "amber" : "green";

            return (
              <tr key={`${item.product}-${index}`}>
                <td>
                  <div className="product-cell">
                    <span className="product-mini-icon">
                      <Package size={15} />
                    </span>
                    <strong>{item.product}</strong>
                  </div>
                </td>

                <td>{number(item.net_units)}</td>
                <td>{moneyExact(item.revenue)}</td>
                {showCost && <td>{moneyExact(item.total_cost)}</td>}

                <td
                  className={
                    item.profit < 0 ? "negative-value" : "positive-value"
                  }
                >
                  {moneyExact(item.profit)}
                </td>

                <td>
                  <div className="margin-cell">
                    <span>{item.margin.toFixed(1)}%</span>
                    <span className="margin-track">
                      <i
                        style={{
                          width: `${Math.min(Math.max(item.margin, 0), 100)}%`,
                        }}
                      />
                    </span>
                  </div>
                </td>

                <td>
                  <Badge variant={variant}>{status}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BusinessChat({
  chat,
  question,
  setQuestion,
  askQuestion,
  busy,
  aiStatus,
}) {
  const suggestions = [
    "Which products make the most profit?",

    "What should I review first?",

    "Explain my lowest-margin products.",
  ];

  return (
    <div className="ai-layout">
      <section className="panel chat-panel">
        <div className="chat-top">
          <div className="chat-avatar">
            <Bot size={21} />
          </div>

          <div>
            <h2>MarginMitra assistant</h2>
            <p>
              <span
                className={`status-dot ${aiStatus.available && aiStatus.installed ? "active" : ""}`}
              />{" "}
              {aiStatus.available && aiStatus.installed
                ? `Connected to ${aiStatus.model}`
                : `Waiting for local model · ${aiStatus.model || "Gemma"}`}
            </p>
          </div>

          <Badge variant="green">DATA-GROUNDED</Badge>
        </div>

        <div className="chat-messages">
          {chat.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-sparkle">
                <Sparkles size={22} />
              </div>
              <h3>Let's make your numbers useful.</h3>

              <p>
                Ask a question about the current product dataset. Answers are
                generated by your local open-weight model and should be checked
                before acting on them.
              </p>

              <div className="suggestion-list">
                {suggestions.map((item) => (
                  <button key={item} onClick={() => askQuestion(item)}>
                    {item}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((item, index) => (
            <div
              className={`chat-message ${item.role}`}
              key={`${item.role}-${index}`}
            >
              <div className="message-avatar">
                {item.role === "user" ? "You" : <Bot size={16} />}
              </div>

              <div className="message-body">
                <span className="message-author">
                  {item.role === "user"
                    ? "You"
                    : item.role === "error"
                      ? "Connection issue"
                      : "MarginMitra"}
                </span>
                <p>{item.text}</p>
              </div>
            </div>
          ))}

          {busy === "ask" && (
            <div className="chat-message assistant">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
              <div className="message-body">
                <span className="message-author">MarginMitra</span>
                <p className="thinking">
                  <LoaderCircle size={14} className="spin" /> Reviewing your
                  data…
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          className="chat-input-area"
          onSubmit={(event) => {
            event.preventDefault();
            askQuestion();
          }}
        >
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your product margins…"
            rows={2}
            maxLength={1000}
          />

          <div className="chat-input-bottom">
            <span>AI can make mistakes. Verify important decisions.</span>
            <button
              className="button primary"
              type="submit"
              disabled={!question.trim() || busy === "ask"}
            >
              Ask <Sparkles size={14} />
            </button>
          </div>
        </form>
      </section>

      <aside className="panel ai-side-panel">
        <div className="ai-side-heading">
          <ShieldCheck size={18} />
          <strong>Privacy by default</strong>
        </div>

        <p>
          The app sends the business summary to the Ollama service configured on
          your machine. With the default local URL, inference runs locally.
        </p>

        <div className="side-divider" />

        <strong className="side-label">Current model</strong>
        <div className="model-pill">
          <span className="model-dot" />
          {aiStatus.model || "gemma3:1b"}{" "}
          <Badge
            variant={
              aiStatus.available && aiStatus.installed ? "green" : "amber"
            }
          >
            {aiStatus.available && aiStatus.installed ? "Ready" : "Offline"}
          </Badge>
        </div>

        <div className="side-divider" />

        <strong className="side-label">Try asking</strong>

        {suggestions.map((item) => (
          <button
            className="side-prompt"
            key={item}
            onClick={() => askQuestion(item)}
          >
            {item}
            <span>→</span>
          </button>
        ))}

        {!(aiStatus.available && aiStatus.installed) && (
          <div className="setup-hint">
            <strong>Start local AI</strong>
            <code>ollama pull gemma3:1b</code>
            <code>ollama serve</code>
            <p>Keep Ollama running, then refresh the page.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ListingStudio({
  product,
  setProduct,
  details,
  setDetails,
  language,
  setLanguage,
  listing,
  createListing,
  busy,
  aiStatus,
}) {
  return (
    <div className="listing-layout">
      <section className="panel listing-form-panel">
        <div className="panel-header">
          <div>
            <h2>Product details</h2>
            <p>Share only facts you can verify about the product.</p>
          </div>
          <div className="listing-form-icon">
            <FileText size={18} />
          </div>
        </div>

        <form onSubmit={createListing} className="listing-form">
          <label>
            Product name <span>\*</span>
            <input
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="e.g. Stainless steel water bottle"
              maxLength={180}
              required
            />
          </label>

          <label>
            Product details
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Material, capacity, dimensions, use cases, what's included…"
              rows={6}
              maxLength={2000}
            />
            <small>
              Only include verified details. The AI should not invent
              specifications.
            </small>
          </label>

          <label>
            Listing language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Hinglish</option>
            </select>
          </label>

          <div className="form-footnote">
            <ShieldCheck size={15} /> Listing generated through your configured
            local model.
          </div>

          <button
            className="button primary full-button"
            type="submit"
            disabled={!product.trim() || busy === "listing"}
          >
            {busy === "listing" ? (
              <>
                <LoaderCircle size={16} className="spin" /> Writing listing…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate listing
              </>
            )}
          </button>
        </form>

        {!(aiStatus.available && aiStatus.installed) && (
          <div className="inline-warning">
            <CircleHelp size={16} />
            <span>
              Ollama isn't connected. Start it locally and install the
              configured model to generate copy.
            </span>
          </div>
        )}
      </section>

      <section className="panel listing-output-panel">
        <div className="panel-header">
          <div>
            <h2>Listing preview</h2>
            <p>Generated copy appears here</p>
          </div>
          <Badge variant="neutral">AI DRAFT</Badge>
        </div>

        {listing ? (
          <div className="listing-output">
            <pre>{listing}</pre>
            <button
              className="button secondary"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(listing)
                  .then(() => window.alert("Listing copied."))
                  .catch(() =>
                    window.alert(
                      "Copy failed. Select the text and copy manually.",
                    ),
                  )
              }
            >
              Copy listing
            </button>
            <p className="output-disclaimer">
              Review all claims and product details before publishing.
            </p>
          </div>
        ) : (
          <div className="output-empty">
            <div className="output-empty-icon">
              <FileText size={25} />
            </div>
            <h3>Your next product listing starts here.</h3>
            <p>
              Fill in product details, choose a language, and generate a first
              draft. The AI is instructed to avoid unsupported product claims.
            </p>
            <div className="output-preview-lines">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="panel loading-state">
      <LoaderCircle size={20} className="spin" /> Loading business data…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <FileSpreadsheet size={23} />
      <strong>No product data yet</strong>
      <p>Load demo data or import a CSV to see product analysis.</p>
    </div>
  );
}

export default App;
