
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting metadata generation process");
    
    let { image, apiKey, filename } = await req.json();
    
    if (!image || !apiKey) {
      console.error("Missing required parameters: image or apiKey");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: image or apiKey" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate filename or use a default
    if (!filename) {
      filename = "image.jpg";
      console.log("No filename provided, using default:", filename);
    }
    
    console.log(`Processing image: ${filename}`);
    
    // Using the latest Gemini API endpoint
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "I need metadata for this image. Please analyze it and provide the following in JSON format: 1) A descriptive title, 2) A detailed description (50-100 words), 3) 5-10 relevant keywords (as an array). Use only this format: {\"title\": \"...\", \"description\": \"...\", \"keywords\": [\"word1\", \"word2\", ...]}. Only output valid JSON."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${response.status}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Received successful response from Gemini API");
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      console.error("Unexpected API response structure:", data);
      return new Response(
        JSON.stringify({ error: "Invalid API response structure" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const textContent = data.candidates[0].content.parts[0].text;
    console.log("Raw text response:", textContent);
    
    // Extract JSON from response
    let jsonMatch;
    
    try {
      // First try direct JSON parsing
      const parsedResult = JSON.parse(textContent);
      console.log("Successfully parsed JSON directly");
      
      // Add filename to the result
      const result = {
        filename,
        title: parsedResult.title || "Untitled Image",
        description: parsedResult.description || "No description available",
        keywords: Array.isArray(parsedResult.keywords) ? parsedResult.keywords : []
      };
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      console.log("Direct JSON parsing failed, attempting to extract JSON from text");
      
      // Try to extract JSON from the text using regex
      jsonMatch = textContent.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch && jsonMatch[0]) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted and parsed JSON using regex");
          
          // Add filename to the result
          const result = {
            filename,
            title: extractedJson.title || "Untitled Image",
            description: extractedJson.description || "No description available",
            keywords: Array.isArray(extractedJson.keywords) ? extractedJson.keywords : []
          };
          
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
        }
      }
      
      // If both methods fail, use fallback parsing
      console.log("Using fallback parsing method for unstructured text");
      
      // Simple fallback extraction
      const titleMatch = textContent.match(/title["\s:]+([^"]+)/i);
      const descriptionMatch = textContent.match(/description["\s:]+([^"]+)/i);
      
      // Extract keywords by finding anything that looks like an array
      const keywordsMatch = textContent.match(/\[(.*?)\]/s);
      
      const result = {
        filename,
        title: titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Untitled Image",
        description: descriptionMatch && descriptionMatch[1] ? descriptionMatch[1].trim() : "No description available",
        keywords: keywordsMatch && keywordsMatch[1] ? 
          keywordsMatch[1].split(',').map(k => k.trim().replace(/"/g, '').replace(/'/g, '')) : 
          ["image", "photo"]
      };
      
      console.log("Fallback parsed result:", result);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
