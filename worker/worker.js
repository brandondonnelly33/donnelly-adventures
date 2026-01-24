// Cloudflare Worker - Donnelly Adventures API
// This handles photo listing from Cloudinary and journal entries in KV

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        // Fetch from the donnelly-adventures folder
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?prefix=donnelly-adventures&max_results=100&type=upload&context=true`,
          {
            headers: { 'Authorization': `Basic ${auth}` }
          }
        );

        const data = await response.json();
        const photos = (data.resources || [])
          .filter(r => r.asset_folder === 'donnelly-adventures')
          .map(r => ({
            id: r.public_id,
            public_id: r.public_id,
            url: r.secure_url,
            created_at: r.created_at,
            uploaded_by: r.context?.custom?.uploaded_by || '',
            day_number: r.context?.custom?.day_number || '',
            caption: r.context?.custom?.caption || ''
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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

      // PUT /api/photos/:publicId - Update photo caption
      if (path.startsWith('/api/photos/') && request.method === 'PUT') {
        const publicId = decodeURIComponent(path.replace('/api/photos/', ''));
        const body = await request.json();
        const cloudName = env.CLOUDINARY_CLOUD_NAME;
        const apiKey = env.CLOUDINARY_API_KEY;
        const apiSecret = env.CLOUDINARY_API_SECRET;

        const timestamp = Math.floor(Date.now() / 1000);

        // Build context string
        const contextParts = [];
        if (body.caption) contextParts.push(`caption=${body.caption}`);
        if (body.uploaded_by) contextParts.push(`uploaded_by=${body.uploaded_by}`);
        if (body.day_number) contextParts.push(`day_number=${body.day_number}`);
        const context = contextParts.join('|');

        // Generate signature for explicit API
        const signatureString = `context=${context}&public_id=${publicId}&timestamp=${timestamp}&type=upload${apiSecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp);
        formData.append('api_key', apiKey);
        formData.append('signature', signature);
        formData.append('type', 'upload');
        formData.append('context', context);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/explicit`,
          {
            method: 'POST',
            body: formData
          }
        );

        const result = await response.json();

        if (result.public_id) {
          return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ error: 'Failed to update', details: result }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // DELETE /api/photos/:publicId - Delete photo from Cloudinary
      if (path.startsWith('/api/photos/') && request.method === 'DELETE') {
        const publicId = decodeURIComponent(path.replace('/api/photos/', ''));
        const cloudName = env.CLOUDINARY_CLOUD_NAME;
        const apiKey = env.CLOUDINARY_API_KEY;
        const apiSecret = env.CLOUDINARY_API_SECRET;

        const auth = btoa(`${apiKey}:${apiSecret}`);
        const timestamp = Math.floor(Date.now() / 1000);

        // Generate signature for destroy
        const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureString);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp);
        formData.append('api_key', apiKey);
        formData.append('signature', signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            body: formData
          }
        );

        const result = await response.json();

        if (result.result === 'ok') {
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ error: 'Failed to delete' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
