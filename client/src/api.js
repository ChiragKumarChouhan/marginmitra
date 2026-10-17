const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const api = {
  health: () => request("/health"),
  demo: () => request("/demo"),
  analytics: () => request("/analytics"),
  importCsv: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/sales/import", { method: "POST", body: form });
  },
  ask: (question) => request("/ai/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  }),
  listing: (payload) => request("/ai/listing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
};
