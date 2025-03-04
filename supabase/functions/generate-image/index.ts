
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    console.log("Request data:", requestData);
    
    const { prompt } = requestData;
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    const apiKey = Deno.env.get('NEBIUS_API_KEY');

    if (!apiKey) {
      throw new Error('API key not found');
    }

    console.log('Generating image for prompt:', prompt);
    console.log('Using API key:', apiKey.substring(0, 5) + '...');  // Log first few chars of API key for debugging

    // Make sure we're properly formatting the Authorization header
    const headers = {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "Authorization": `Bearer ${apiKey}`,
    };
    
    console.log('Request headers:', JSON.stringify({
      ...headers,
      "Authorization": "Bearer [REDACTED]" // Don't log the full token
    }));

    const response = await fetch("https://api.studio.nebius.com/v1/images/generations", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        model: "black-forest-labs/flux-schnell",
        response_format: "b64_json",
        response_extension: "webp",
        width: 1024,
        height: 1024,
        num_inference_steps: 4,
        negative_prompt: "",
        seed: -1,
        prompt: prompt,
      }),
    });

    const responseText = await response.text();
    console.log('Raw response status:', response.status);
    console.log('Raw response headers:', JSON.stringify(Object.fromEntries([...response.headers.entries()])));
    
    if (!response.ok) {
      console.error('Nebius API error:', responseText);
      throw new Error(`Failed to generate image: ${response.status} ${response.statusText} - ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response data:', Object.keys(data));
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
