import express from "express";
import cors from "cors";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { buildAnalytics, makeBusinessContext, normalizeRow } from "./analytics.js";
import { askBusinessQuestion, checkOllama, generateListing } from "./ai.js";
import { getSales, getSource, resetDemo, setSales } from "./data.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 5);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv") && file.mimetype !== "text/csv" && file.mimetype !== "application/vnd.ms-excel") {
      return cb(new Error("Please upload a CSV file."));
    }
    cb(null, true);
  }
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", async (_req, res) => {
  const ai = await checkOllama();
  res.json({ ok: true, service: "MarginMitra API", ai, source: getSource() });
});

app.get("/api/demo", (_req, res) => {
  resetDemo();
  res.json({ ok: true, source: getSource(), analytics: buildAnalytics(getSales()) });
});

app.post("/api/sales/import", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a CSV file first." });
  try {
    const records = parse(req.file.buffer.toString("utf8").replace(/^\uFEFF/, ""), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false
    });
    if (!records.length) return res.status(400).json({ error: "The CSV has a header but no data rows." });
    if (records.length > 10000) return res.status(400).json({ error: "Please keep each upload to 10,000 rows or fewer for this MVP." });
    const rows = records.map((row, index) => normalizeRow(row, index));
    setSales(rows, req.file.originalname);
    res.json({ ok: true, source: getSource(), rows_imported: rows.length, analytics: buildAnalytics(getSales()) });
  } catch (error) {
    res.status(400).json({ error: error.message || "Could not parse this CSV." });
  }
});

app.get("/api/analytics", (_req, res) => {
  res.json({ ok: true, source: getSource(), analytics: buildAnalytics(getSales()) });
});

app.post("/api/ai/ask", async (req, res) => {
  const question = String(req.body?.question || "").trim();
  if (!question) return res.status(400).json({ error: "Enter a question about your business." });
  if (question.length > 1000) return res.status(400).json({ error: "Question must be 1,000 characters or fewer." });
  try {
    const answer = await askBusinessQuestion(question, makeBusinessContext(buildAnalytics(getSales())));
    res.json({ ok: true, answer, model: process.env.OLLAMA_MODEL || "gemma3:1b" });
  } catch (error) {
    res.status(503).json({ error: error.message || "AI request failed." });
  }
});

app.post("/api/ai/listing", async (req, res) => {
  const product = String(req.body?.product || "").trim();
  const details = String(req.body?.details || "").trim();
  const language = String(req.body?.language || "English").trim().slice(0, 40);
  if (!product) return res.status(400).json({ error: "Enter a product name." });
  if (product.length > 180 || details.length > 2000) return res.status(400).json({ error: "Product name or details are too long." });
  try {
    const listing = await generateListing({ product, details, language });
    res.json({ ok: true, listing, model: process.env.OLLAMA_MODEL || "gemma3:1b" });
  } catch (error) {
    res.status(503).json({ error: error.message || "Listing generation failed." });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: `File is too large. Maximum size is ${MAX_UPLOAD_MB} MB.` });
  }
  res.status(400).json({ error: error.message || "Unexpected request error." });
});

app.listen(PORT, () => {
  console.log(`MarginMitra API running at http://localhost:${PORT}`);
});
