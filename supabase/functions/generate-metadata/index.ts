
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { image, apiKey, maxKeywords } = await req.json();
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove data URL prefix if present to get the base64 data
    const base64Image = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    // Extract original filename if provided
    const filename = image.originalname || 'image';
    
    console.log("Calling Gemini API with max keywords:", maxKeywords);
    
    // Call Gemini API for image analysis
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and provide the following metadata in JSON format:\n1. An SEO-friendly title (max 60 characters)\n2. A detailed description (max 155 characters)\n3. Up to ${maxKeywords || 10} relevant keywords separated by commas.\n\nFormat your response as a valid JSON with these keys: "title", "description", "keywords". Only return the JSON, nothing else.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      })
    });

    const data = await response.json();
    console.log("Gemini API response received");

    if (data.error) {
      console.error("Gemini API error:", data.error);
      return new Response(
        JSON.stringify({ error: data.error.message || "Error calling Gemini API" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Extract the JSON string from the response
      const textContent = data.candidates[0].content.parts[0].text;
      console.log("Raw text response:", textContent);
      
      // Try to parse the JSON from the text response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      let metadata = {};
      
      if (jsonMatch) {
        metadata = JSON.parse(jsonMatch[0]);
      } else {
        // Attempt to parse by looking for the keys
        const titleMatch = textContent.match(/title["\s:]+([^"]+)/i);
        const descMatch = textContent.match(/description["\s:]+([^"]+)/i);
        const keywordsMatch = textContent.match(/keywords["\s:]+([^"]+)/i);
        
        metadata = {
          title: titleMatch ? titleMatch[1].trim() : "Untitled Image",
          description: descMatch ? descMatch[1].trim() : "No description available",
          keywords: keywordsMatch ? keywordsMatch[1].trim().split(',').map(k => k.trim()) : []
        };
      }
      
      // Add the filename
      metadata.filename = filename;
      console.log("Returning metadata:", JSON.stringify(metadata));
      
      return new Response(
        JSON.stringify(metadata),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse metadata from AI response", 
          rawResponse: data.candidates[0]?.content?.parts[0]?.text || "No text response" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-metadata function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
