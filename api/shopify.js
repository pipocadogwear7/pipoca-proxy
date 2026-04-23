let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  
  const store = process.env.SHOPIFY_STORE;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_TOKEN;

  const res = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    })
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23h
  return cachedToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  try {
    const token = await getAccessToken();
    const store = process.env.SHOPIFY_STORE;
    const url = `https://${store}/admin/api/2024-01/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(500).json({ error: 'Invalid JSON', raw: text.slice(0, 500) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
