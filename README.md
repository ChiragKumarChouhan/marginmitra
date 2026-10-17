# MarginMitra — AI Profit Copilot for Small Sellers

MarginMitra helps small sellers understand product profitability from their own sales CSV. It combines deterministic financial calculations with an optional locally hosted open-weight model (Gemma via Ollama).

## Features

- Import a CSV containing product sales and costs.
- Profit calculations use regular code—not an LLM.
- Identify low-margin and loss-making products.
- Ask questions about uploaded business data.
- Generate product listing copy in English or Hindi-English.
- Load a built-in demo dataset without uploading anything.
- Ollama integration is local by default. Uploaded data is held in the API process memory and is not written to a database.

## Requirements

- Node.js 20+
- npm
- Optional: [Ollama](https://ollama.com/) for local AI features

## Run locally

From the project root:

```bash
npm install
```

In a separate terminal, install and start the open-weight model:

```bash
ollama pull gemma3:1b
ollama serve
```

Then run the app from the project root:

```bash
npm run dev
```

Open the Vite URL printed by the client, usually `http://localhost:5173`.

The API runs on `http://localhost:5000`. You can use the app without Ollama; CSV analysis and profit calculations still work. AI actions show a clear error if Ollama is unavailable.

## CSV format

Required columns: `product` (or `product_name`), `quantity` (or `units_sold`), `selling_price` (or `price`).

Optional columns: `unit_cost` (or `cost`), `shipping_cost`, `marketplace_fee`, `packaging_cost`, `discount`, `returns`.

All costs and prices are per unit except `discount` and `returns`, which are interpreted as per-unit discount amount and returned units respectively. If your data uses different semantics, normalize the CSV before importing it.

Example:

```csv
product,quantity,selling_price,unit_cost,shipping_cost,marketplace_fee,packaging_cost,discount,returns
Cotton T-Shirt,120,499,220,45,35,12,20,3
Steel Bottle,70,349,145,35,25,10,0,1
Desk Lamp,35,899,510,65,65,18,50,2
```

## Profit model

For each row:

- Net units = `max(quantity - returns, 0)`
- Net revenue = `net units × max(selling price - discount, 0)`
- Estimated total cost = `net units × (unit cost + shipping + marketplace fee + packaging)`
- Estimated profit = net revenue − estimated total cost
- Margin = estimated profit ÷ net revenue × 100

This is an estimate, not accounting or tax advice. Include any other relevant costs in your source data before making business decisions.

## API endpoints

- `GET /api/health` — API and Ollama status
- `GET /api/demo` — load sample dataset
- `POST /api/sales/import` — upload CSV as multipart field `file`
- `GET /api/analytics` — computed metrics for current in-memory dataset
- `POST /api/ai/ask` — `{ "question": "..." }`
- `POST /api/ai/listing` — `{ "product": "...", "details": "...", "language": "English" }`

## Privacy notes

By default, the backend keeps the current dataset in process memory. Restarting the API clears it. The Ollama integration calls `http://localhost:11434` by default, so the model can run on your own machine. If you deploy this app, do not claim uploaded data remains local: deployment changes where data is processed. Add authentication, limits, and a deployment-specific privacy review before exposing it to the public internet.

## Production checklist

- Add authentication and per-user data isolation.
- Persist data only with explicit consent and a documented retention policy.
- Add file size limits and more robust CSV schema mapping.
- Add tests for the profit calculation model.
- Add rate limiting, logging with sensitive data redacted, and secure deployment settings.
- Validate all financial assumptions with a seller's real workflow.

## Tech stack

React, Vite, Recharts, Express, Node.js, `csv-parse`, and Ollama with Gemma 3 1B (optional local AI).

## Project status

This is a working MVP scaffold. Before entering a competition, test it with representative data, verify model output quality, and obtain genuine user feedback. Do not claim users, savings, or results you have not verified.


## Run automated tests

From the project root:

```bash
npm test --workspace server
```

The tests cover CSV normalization, net revenue, cost and profit calculations, loss-making products, invalid inputs, and aggregate metrics.
