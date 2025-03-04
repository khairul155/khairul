
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
    console.log('API key length:', apiKey.length);  // Check if API key is not empty
    console.log('First few characters of API key:', apiKey.substring(0, 5) + '...');  // Don't log the full key

    // Explicitly formatting the Authorization header
    const authHeader = `Bearer ${apiKey.trim()}`; // Ensure no whitespace
    console.log('Auth header starts with:', authHeader.substring(0, 10) + '...');

    const headers = {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    };

    console.log('Making request to Nebius API...');
    
    const requestBody = {
      model: "black-forest-labs/flux-schnell",
      response_format: "b64_json",
      response_extension: "webp",
      width: 1024,
      height: 1024,
      num_inference_steps: 4,
      negative_prompt: "",
      seed: -1,
      prompt: prompt,
    };
    
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch("https://api.studio.nebius.com/v1/images/generations", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const responseHeaders = Object.fromEntries([...response.headers.entries()]);
    console.log('Response headers:', JSON.stringify(responseHeaders));
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Nebius API error response text:', responseText);
      throw new Error(`Failed to generate image: ${response.status} ${response.statusText} - ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Successfully parsed response data. Keys:', Object.keys(data));
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error(`Failed to parse API response: ${parseError.message} - Raw response: ${responseText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
