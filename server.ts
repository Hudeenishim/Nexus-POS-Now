import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

const log = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

async function setupApp() {
  app.use(express.json());

  // Log all requests
  app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
  });

  app.get("/test-nexus", (req, res) => {
    res.send("NEXUS SERVER IS ALIVE");
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/notify", async (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Notification received: ${name} (${email}): ${message}`);
    res.json({ success: true, message: "Notification received" });
  });

  app.get("/api/debug", (req, res) => {
    const distPath = path.join(process.cwd(), "dist");
    const distExists = fs.existsSync(distPath);
    let distContents: string[] = [];
    if (distExists) {
      distContents = fs.readdirSync(distPath);
    }
    res.json({
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      distPath,
      distExists,
      distContents,
      port: PORT,
      url: req.url,
      headers: req.headers
    });
  });

  const distPath = path.join(process.cwd(), "dist");
  const distExists = fs.existsSync(distPath);

  if (distExists) {
    log("Serving static files from dist...");
    app.use(express.static(distPath));
    
    // Catch-all for SPA
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) {
        log(`API 404: ${req.url}`);
        return res.status(404).json({ error: "Not Found" });
      }
      log(`Serving index.html for: ${req.url}`);
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    log("Dist missing, using Vite middleware...");
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "custom", // Use custom to handle fallback manually
      });
      app.use(vite.middlewares);
      log("Vite middleware attached.");

      // Catch-all for SPA in dev mode
      app.get("*", async (req, res, next) => {
        // Skip API routes
        if (req.url.startsWith("/api/")) {
          return next();
        }
        
        // Skip static assets (usually have extensions)
        if (req.url.includes(".")) {
          return next();
        }

        try {
          const url = req.originalUrl;
          log(`SPA Fallback (Vite Custom) for: ${url}`);
          const template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (e) {
          log(`Vite transform error: ${e}`);
          next(e);
        }
      });
    } catch (e) {
      log(`Vite failed to start: ${e}`);
      app.get("*", (req, res) => {
        res.status(500).send("Server Error: Dist missing and Vite failed to start.");
      });
    }
  }
}

// Only listen if not running as a Vercel function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  setupApp().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      log(`Server listening on port ${PORT}`);
    });
  }).catch((err) => {
    console.error("CRITICAL STARTUP ERROR:", err);
  });
} else {
  // In Vercel, setupApp will be called by the function entry point
  setupApp();
}
