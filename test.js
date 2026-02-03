import express from "express";
import dotenv from "dotenv"
const app = express();
dotenv.config()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, state } = req.query;

  if (client_id !== process.env.CLIENT_ID) {
    return res.status(400).send('Invalid client_id');
  }

  if (!state) {
    return res.status(400).send('Missing state');
  }

  // generate auth code (mock)
  const code = 'authcode_42';

  // 🚨 IMPORTANT: return state back to Zapier
  res.redirect(
    `${redirect_uri}?code=${code}&state=${state}`
  );
});


app.post('/oauth/token', (req, res) => {
  const { client_id, client_secret, code } = req.body;

  if (
    client_id !== process.env.CLIENT_ID ||
    client_secret !== process.env.CLIENT_SECRET
  ) {
    return res.status(401).json({ error: 'Invalid client' });
  }

  res.json({
    access_token: 'access_42',
    refresh_token: 'refresh_42',
    expires_in: 3600,
    user_id: '42',
    email: 'aditya@example.com',
    name: 'Aditya Kurani'
  });
});
app.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  console.log(auth)
  if (!auth) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = auth.replace('Bearer ', '');

  // TEMP: accept any token for debugging
  res.status(200).json({
    id: 'debug-user',
    email: 'debug@example.com',
    name: 'Debug User'
  });
});


export default app