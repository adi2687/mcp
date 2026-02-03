import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * TEMP in-memory stores (OK for testing)
 */
const authCodes = new Map();        // code -> user
const enabledTools = new Map();     // userId -> Set(toolIds)

/**
 * 1️⃣ OAuth authorize
 */
app.get("/oauth/authorize", (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  if (client_id !== process.env.CLIENT_ID) {
    return res.status(400).send("Invalid client_id");
  }

  if (!state) {
    return res.status(400).send("Missing state");
  }

  // fake logged-in user
  const user = {
    id: "42",
    email: "adityakritikakurani@gmail.com",
    name: "Aditya Kurani"
  };

  const code = `code_${Date.now()}`;
  authCodes.set(code, user);

  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
});

/**
 * 2️⃣ OAuth token
 */
app.post("/oauth/token", (req, res) => {
  const { client_id, client_secret, code } = req.body;

  if (
    client_id !== process.env.CLIENT_ID ||
    client_secret !== process.env.CLIENT_SECRET
  ) {
    return res.status(401).json({ error: "Invalid client" });
  }

  const user = authCodes.get(code);
  if (!user) {
    return res.status(400).json({ error: "Invalid code" });
  }

  authCodes.delete(code);

  const accessToken = `token_${user.id}`;

  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    user_id: user.id,
    email: user.email,
    name: user.name
  });
});

/**
 * 3️⃣ /me (Zapier auth test)
 */
app.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = auth.replace("Bearer ", "");
  const userId = token.split("_")[1];

  res.json({
    id: userId,
    email: "adityakritikakurani@gmail.com",
    name: "Aditya Kurani"
  });
});

/**
 * 4️⃣ Run a tool (THIS is where tools become enabled)
 */
app.post("/tools/:toolId/run", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const userId = auth.replace("Bearer ", "").split("_")[1];
  const { toolId } = req.params;

  if (!enabledTools.has(userId)) {
    enabledTools.set(userId, new Set());
  }

  enabledTools.get(userId).add(toolId);

  res.json({
    success: true,
    toolId,
    enabled: true
  });
});

/**
 * 5️⃣ Get tools enabled for Zapier
 */
app.get("/tools", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const userId = auth.replace("Bearer ", "").split("_")[1];
  const tools = Array.from(enabledTools.get(userId) || []);

  res.json(
    tools.map(t => ({
      id: t,
      status: "enabled"
    }))
  );
});

export default app;
