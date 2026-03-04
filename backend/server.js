import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import taskRouter from "./routes/taskRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";

const app = express();

app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes("sync-member") || req.path.includes("workspaces")) {
    console.log(`\n📝 ${req.method} ${req.path}`);
  }
  next();
});

// Webhook route BEFORE express.json() - needs raw body
app.use("/api/webhooks", webhookRouter);

app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("server is running!");
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
