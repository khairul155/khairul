
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Request received in graphic-designer-bot function");
    
    // Parse request body
    const requestData = await req.json().catch(error => {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid JSON in request body");
    });
    
    console.log("Request data:", JSON.stringify(requestData));
    
    if (!requestData.prompt) {
      console.error("Missing prompt in request");
      throw new Error("Missing prompt data");
    }

    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable");
      throw new Error("API key not configured");
    }

    // Prepare data for Gemini API
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    const apiUrlWithKey = `${apiUrl}?key=${GEMINI_API_KEY}`;

    // Create a system prompt to guide the model
    const systemPrompt = `You are a helpful Graphic Designer AI assistant specialized in creating 
    stock image descriptions, art prompts, and providing design advice.
    Focus on helping users with:
    1. Creating detailed vector prompts for stock images
    2. Finding trending topics and ideas for microstock platforms
    3. Giving advice on design trends and best practices
    
    Format your responses in a clear, organized manner with bullet points or numbered lists when appropriate.
    When listing trends, ideas or prompts, make each one unique and detailed.`;

    // Prepare the request payload for Gemini
    const payload = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            },
            {
              text: `User request: ${requestData.prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    console.log("Sending request to Gemini API");
    
    // Make request to Gemini API
    const response = await fetch(apiUrlWithKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Check for API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    // Parse API response
    const data = await response.json();
    console.log("Gemini API response received");

    // Extract the text from the Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error("Empty or invalid response from Gemini API");
      throw new Error("Empty or invalid response from Gemini API");
    }

    console.log("Returning successful response");
    
    return new Response(JSON.stringify({ generatedText: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error("Error in graphic-designer-bot function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
