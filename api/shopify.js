export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  const store = process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_TOKEN;
  const url = `https://${store}/admin/api/2024-01/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch(e) {
      res.status(500).json({ error: 'Invalid JSON from Shopify', raw: text.slice(0, 500) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
