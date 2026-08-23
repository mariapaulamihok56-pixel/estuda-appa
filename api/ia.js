module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Garante que o corpo da requisição seja lido corretamente
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const prompt = body?.prompt;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt não encontrado na requisição.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada na Vercel.' });
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiResponse.json();

    if (data.error) {
      return res.status(400).json({ error: `Erro do Google: ${data.error.message || JSON.stringify(data.error)}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta gerada.';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: `Erro interno no servidor: ${err.message}` });
  }
};
