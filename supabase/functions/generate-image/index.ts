
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
    const { 
      prompt, 
      width = 1024, 
      height = 1024,
      negative_prompt = "",
      num_inference_steps = 7, // Default to fast mode (7 steps)
      num_images = 1
    } = await req.json()
    
    const apiKey = Deno.env.get('NEBIUS_API_KEY1')

    if (!apiKey) {
      throw new Error('API key not found')
    }

    console.log(`Generating ${num_images} image(s) for prompt: ${prompt} with size: ${width}x${height} and steps: ${num_inference_steps}`)

    const response = await fetch("https://api.studio.nebius.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-schnell",
        response_format: "b64_json",
        response_extension: "webp", // Keep webp format for API response
        width: parseInt(String(width)),
        height: parseInt(String(height)),
        num_inference_steps: parseInt(String(num_inference_steps)),
        negative_prompt: negative_prompt,
        seed: -1,
        prompt: prompt,
        n: parseInt(String(num_images)),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Nebius API error:', error)
      throw new Error('Failed to generate image')
    }

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
