module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Lê o corpo da requisição diretamente do stream para nunca falhar
    let rawBody = '';
    await new Promise((resolve) => {
      req.on('data', chunk => { rawBody += chunk; });
      req.on('end', resolve);
    });
    let body = {};
    try {
      body = JSON.parse(rawBody || '{}');
    } catch (e) {
      body = req.body || {};
    }
    const prompt = body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt não encontrado no corpo da requisição.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel.' });
    }
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await apiResponse.json();
    if (data.error) {
      console.error('Erro retornado pela API do Google:', data.error);
      return res.status(400).json({ error: `Google API: ${data.error.message || JSON.stringify(data.error)}` });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta gerada pela IA.';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Erro interno no servidor:', err);
    return res.status(500).json({ error: `Erro interno: ${err.message}` });
  }
};
