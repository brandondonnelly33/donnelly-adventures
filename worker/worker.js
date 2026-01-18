// Cloudflare Worker - Donnelly Adventures API
// This handles photo listing from Cloudinary and journal entries in KV

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/photos - List photos from Cloudinary
      if (path === '/api/photos' && request.method === 'GET') {
        const cloudName = env.CLOUDINARY_CLOUD_NAME;
        const apiKey = env.CLOUDINARY_API_KEY;
        const apiSecret = env.CLOUDINARY_API_SECRET;

        const auth = btoa(`${apiKey}:${apiSecret}`);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/tags/california2026?max_results=100`,
          {
            headers: { 'Authorization': `Basic ${auth}` }
          }
        );

        const data = await response.json();
        const photos = (data.resources || []).map(r => ({
          id: r.public_id,
          url: r.secure_url,
          created_at: r.created_at,
          // Extract metadata from context if available
          caption: r.context?.custom?.caption || '',
          uploaded_by: r.context?.custom?.uploaded_by || '',
          day_number: r.context?.custom?.day_number || ''
        }));

        return new Response(JSON.stringify(photos), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/journal - Get journal entries from KV
      if (path === '/api/journal' && request.method === 'GET') {
        const entries = await env.JOURNAL.get('entries', 'json') || [];
        return new Response(JSON.stringify(entries), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/journal - Add journal entry to KV
      if (path === '/api/journal' && request.method === 'POST') {
        const body = await request.json();
        const entries = await env.JOURNAL.get('entries', 'json') || [];

        entries.unshift({
          id: Date.now(),
          author: body.author || 'Anonymous',
          content: body.content,
          day_number: body.day_number || null,
          created_at: new Date().toISOString()
        });

        await env.JOURNAL.put('entries', JSON.stringify(entries));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
