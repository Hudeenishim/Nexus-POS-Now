// Import the Express framework for building the backend server
import express from "express";
// Import path module for handling and transforming file paths
import path from "path";
// Import fileURLToPath from url module to handle ES module path resolution
import { fileURLToPath } from "url";
// Import file system module for interacting with the server's file system
import fs from "fs";
// Import dotenv for loading environment variables from a .env file
import dotenv from "dotenv";

// Load environment variables from .env file into process.env
dotenv.config();

// Get the current file's path from the import meta
const __filename = fileURLToPath(import.meta.url);
// Get the current directory's path from the filename
const __dirname = path.dirname(__filename);

// Create an instance of the Express application
export const app = express();
// Define the port number the server will listen on
const PORT = 3000;

// Utility function for logging messages with a timestamp
const log = (msg: string) => {
  // Log the message to the console with an ISO timestamp
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Middleware to log all incoming requests with their method and URL
app.use((req, res, next) => {
  // Log the request method and URL
  log(`${req.method} ${req.url}`);
  // Pass control to the next middleware function
  next();
});

// API Route for testing server availability
app.get("/test-mayback", (req, res) => {
  // Send a simple string response confirming the server is alive
  res.send("MAYBACK SERVER IS ALIVE");
});

// API Route for checking the health and timestamp of the server
app.get("/api/health", (req, res) => {
  // Return a JSON response with the status and current timestamp
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route for receiving and logging notifications
app.post("/api/notify", async (req, res) => {
  // Extract name, email, and message from the request body
  const { name, email, message } = req.body;
  // Log the received notification details to the console
  console.log(`Notification received: ${name} (${email}): ${message}`);
  // Return a success response
  res.json({ success: true, message: "Notification received" });
});

// API Route for debugging server environment and file structure
app.get("/api/debug", (req, res) => {
  // Define the path to the production build directory
  const distPath = path.join(__dirname, "dist");
  // Check if the dist directory exists
  const distExists = fs.existsSync(distPath);
  // Initialize an empty array for directory contents
  let distContents: string[] = [];
  if (distExists) {
    // Read the contents of the dist directory if it exists
    distContents = fs.readdirSync(distPath);
  }
  // Return a JSON response with environment and file system information
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

// Asynchronous function to set up static file serving or Vite middleware
async function startServer() {
  const distPath = path.join(__dirname, "dist");
  const distExists = fs.existsSync(distPath);

  log(`Starting server... NODE_ENV=${process.env.NODE_ENV}, distExists=${distExists}`);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  app.get("/test-mayback", (req, res) => {
    res.send("MAYBACK SERVER IS ALIVE");
  });

  // Setup serving logic
  const isDev = process.env.NODE_ENV !== "production";
  
  if (isDev || !distExists) {
    log(`${isDev ? "Dev mode" : "dist missing"}: using Vite middleware...`);
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      log("Vite middleware attached.");
    } catch (e) {
      log(`Vite failed to start: ${e}`);
      app.get("*", (req, res) => {
        res.status(500).send("Server Error: Vite failed to start and dist is missing.");
      });
    }
  } else {
    log("Production mode: Serving static files from dist...");
    serveStaticDist(distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    log(`Server listening on port ${PORT}`);
  });
}

function serveStaticDist(distPath: string) {
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    fallthrough: false,
  }));
  
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    if (req.url.startsWith("/api/")) {
      log(`API 404: ${req.url}`);
      return res.status(404).json({ error: "Not Found" });
    }
    
    if (path.extname(req.url)) {
      log(`Asset 404: ${req.url}`);
      return res.status(404).send("Not Found");
    }
    
    log(`Serving index.html for SPA route: ${req.url}`);
    res.sendFile(path.join(distPath, "index.html"));
  });
}

startServer().catch((err) => {
  console.error("CRITICAL STARTUP ERROR:", err);
});

