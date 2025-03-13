
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
      model = "black-forest-labs/flux-schnell", 
      response_extension = "jpg" 
    } = await req.json()
    
    const apiKey = Deno.env.get('NEBIUS_API_KEY')

    if (!apiKey) {
      throw new Error('API key not found')
    }

    console.log('Generating image for prompt:', prompt, 'with dimensions:', width, 'x', height, 'using model:', model)

    const response = await fetch("https://api.studio.nebius.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        response_format: "b64_json",
        response_extension: response_extension,
        width: width,
        height: height,
        num_inference_steps: 4,
        negative_prompt: "",
        seed: -1,
        prompt: prompt,
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
