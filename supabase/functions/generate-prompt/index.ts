
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
    const apiKey = Deno.env.get('NEBIUS_API_KEY')

    if (!apiKey) {
      throw new Error('API key not found')
    }

    console.log('Generating random prompt using DeepSeek-V3 model')

    const response = await fetch("https://api.studio.nebius.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        "model": "deepseek-ai/DeepSeek-V3",
        "max_tokens": 512,
        "temperature": 0.7, // Increased for more randomness
        "top_p": 0.95,
        "messages": [
          {
            "role": "user",
            "content": "Please give me a short random prompt for microstock site"
          }
        ]
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Nebius API error:', error)
      throw new Error('Failed to generate prompt')
    }

    const data = await response.json()
    const generatedPrompt = data.choices[0].message.content.trim()
    
    return new Response(JSON.stringify({ prompt: generatedPrompt }), {
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
