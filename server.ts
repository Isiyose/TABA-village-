import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Twilio API Route
  app.post("/api/notifications/sms", async (req, res) => {
    const { to, message } = req.body;
    
    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.VITE_TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio credentials missing in environment. Checked VITE_ and non-prefixed versions.");
      return res.status(500).json({ success: false, error: "Twilio credentials not configured on server. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Settings." });
    }

    try {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body: message,
        from: fromNumber,
        to: to
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Twilio Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
