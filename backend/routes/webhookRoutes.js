import express from "express";
import { Webhook } from "svix";
import { inngest } from "../inngest/index.js";

const webhookRouter = express.Router();

// Clerk webhook endpoint
webhookRouter.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_KEY;

    if (!WEBHOOK_SECRET) {
      console.error("Missing CLERK_WEBHOOK_KEY environment variable");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing svix headers");
      return res.status(400).json({ error: "Missing svix headers" });
    }

    const body = req.body.toString();

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err.message);
      return res.status(400).json({ error: "Webhook verification failed" });
    }

    const eventType = evt.type;
    console.log(`\n=== Clerk Webhook Received: ${eventType} ===`);

    try {
      // Send event to Inngest with Clerk namespace
      await inngest.send({
        name: `clerk/${eventType}`,
        data: evt.data,
      });

      console.log(`✓ Event sent to Inngest: clerk/${eventType}`);
      res.status(200).json({ success: true, eventType });
    } catch (error) {
      console.error("Error sending event to Inngest:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  },
);

export default webhookRouter;
