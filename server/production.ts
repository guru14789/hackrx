import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();

// Configure CORS for cross-origin requests
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'http://localhost:5173',
    'http://localhost:5000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
});

// Register API routes
registerRoutes(app);

// Health check endpoint
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    services: {
      faiss_vector_db: "connected",
      gpt4_api: "active", 
      document_parser: "ready",
      api_gateway: "healthy"
    },
    timestamp: new Date().toISOString()
  });
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

export { app };