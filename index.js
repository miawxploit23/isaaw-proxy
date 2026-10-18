const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const API_BASE = "https://skyp.isaaw.web.id";

app.use(cors({
  origin: "*",
  methods: ["GET", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-API-Key"]
}));

app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "iSaaw API Proxy is running"
  });
});

// Express 5 (path-to-regexp v8): wildcard harus diberi nama
app.get("/*splat", async (req, res) => {
  try {
    const apiKey = process.env.ISAAW_KEY;

    if (!apiKey) {
      return res.status(500).json({
        status: false,
        error: "API key belum dikonfigurasi"
      });
    }

    // Gabungkan sebagai string agar "//host" tidak bisa mengganti domain
    const targetUrl = new URL(API_BASE + req.originalUrl);

    if (targetUrl.origin !== new URL(API_BASE).origin) {
      return res.status(400).json({
        status: false,
        error: "Path tidak valid"
      });
    }

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(20000)
    });

    const body = await response.text();

    res.status(response.status);
    res.set("Content-Type", "application/json");
    res.send(body);

  } catch (error) {
    console.error("Proxy error:", error.message);

    res.status(502).json({
      status: false,
      error: "Gagal menghubungi API upstream"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`iSaaw Proxy berjalan di port ${PORT}`);
});
