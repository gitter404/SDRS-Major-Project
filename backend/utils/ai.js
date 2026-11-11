
// Calls Python AI service with 5s timeout; falls back so no report is lost
module.exports = async (text) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(`${process.env.AI_SERVICE_URL}/analyze-report`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }), signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('AI ' + r.status);
    const d = await r.json();
    const category = ['Medical', 'Rescue', 'Fire', 'Shelter'].includes(d.category) ? d.category : 'Rescue';
    const priority = Math.min(10, Math.max(1, Math.round(Number(d.priority)) || 5));
    return { category, priority, tokens: d.tokens || [], locations: d.locations || [] };
  } catch (e) {
    console.warn('AI fallback used:', e.message);
    return { category: 'Rescue', priority: 5, tokens: [], locations: [] };
  } finally { clearTimeout(t); }
};
 