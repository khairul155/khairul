
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
    console.log("Request received in generate-metadata function");
    
    // Parse request body
    const requestData = await req.json().catch(error => {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid JSON in request body");
    });
    
    console.log("Request data:", JSON.stringify(requestData));
    
    if (!requestData.imageBase64) {
      console.error("Missing imageBase64 in request");
      throw new Error("Missing imageBase64 data");
    }

    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY environment variable");
      throw new Error("API key not configured");
    }

    // Prepare data for Gemini API
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
    const apiUrlWithKey = `${apiUrl}?key=${GEMINI_API_KEY}`;

    const imageData = requestData.imageBase64;
    const fileName = requestData.fileName || "image.jpg";

    // Prepare the request payload for Gemini
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Generate SEO metadata for this image with the filename "${fileName}". Provide the following in JSON format with these exact keys:
                1. "title": A concise, SEO-friendly title
                2. "description": A detailed description (2-3 sentences)
                3. "keywords": A comma-separated list of relevant keywords (5-10 keywords)
                
                Return ONLY valid JSON without any other text, formatted like:
                {
                  "title": "...",
                  "description": "...",
                  "keywords": "..."
                }`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }
      ]
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
    console.log("Gemini API response:", JSON.stringify(data));

    // Extract the text from the Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error("Empty or invalid response from Gemini API");
      throw new Error("Empty or invalid response from Gemini API");
    }

    console.log("Raw text from Gemini:", responseText);

    // Extract the JSON part from the response text (in case there's extra text)
    let extractedJson;
    try {
      // Try to parse the response directly first
      extractedJson = JSON.parse(responseText);
      console.log("Successfully parsed JSON directly");
    } catch (error) {
      console.log("Direct JSON parsing failed, attempting to extract JSON from text");
      
      // Try to find JSON within the text
      const jsonMatch = responseText.match(/{[\s\S]*?}/);
      if (jsonMatch) {
        try {
          extractedJson = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted and parsed JSON from text");
        } catch (extractError) {
          console.error("Failed to parse extracted JSON:", extractError);
          throw new Error("Failed to parse metadata from API response");
        }
      } else {
        console.error("No JSON found in response text");
        throw new Error("No metadata found in API response");
      }
    }

    // Validate the extracted JSON
    if (!extractedJson.title || !extractedJson.description || !extractedJson.keywords) {
      console.error("Missing required fields in extracted JSON:", JSON.stringify(extractedJson));
      throw new Error("Missing required metadata fields in API response");
    }

    // Prepare the final response
    const result = {
      fileName: fileName,
      title: extractedJson.title,
      description: extractedJson.description,
      keywords: extractedJson.keywords
    };

    console.log("Returning successful response:", JSON.stringify(result));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error("Error in generate-metadata function:", error);
    
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
