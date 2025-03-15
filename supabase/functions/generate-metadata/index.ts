
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
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body successfully parsed");
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid request format: " + error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { image, apiKey, maxKeywords } = requestBody;
    
    console.log("Request received with:", {
      hasImage: !!image, 
      hasApiKey: !!apiKey, 
      maxKeywords, 
      imageSize: image ? image.length : 0
    });
    
    if (!apiKey) {
      console.error("Missing API key");
      return new Response(
        JSON.stringify({ error: "Gemini API key is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!image) {
      console.error("Missing image data");
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove data URL prefix if present to get the base64 data
    let base64Image;
    try {
      base64Image = image.includes('base64,') 
        ? image.split('base64,')[1] 
        : image;
      
      if (!base64Image || base64Image.trim() === '') {
        throw new Error("Invalid base64 image data");
      }
      console.log("Base64 image processed, length:", base64Image.length);
    } catch (error) {
      console.error("Error processing base64 image:", error);
      return new Response(
        JSON.stringify({ error: "Invalid image data: " + error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract original filename if provided
    const filename = requestBody.originalname || 'image';
    
    console.log("Calling Gemini API with max keywords:", maxKeywords);
    
    // Call Gemini API for image analysis
    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
    
    let response;
    try {
      response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
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

      console.log("Gemini API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API error response:", JSON.stringify(errorData));
        return new Response(
          JSON.stringify({ 
            error: errorData.error?.message || `API request failed with status ${response.status}`,
            details: errorData
          }),
          { 
            status: response.status >= 400 && response.status < 600 ? response.status : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (fetchError) {
      console.error("Network error calling Gemini API:", fetchError);
      return new Response(
        JSON.stringify({ error: `Network error calling Gemini API: ${fetchError.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      const data = await response.json();
      console.log("Gemini API response received:", JSON.stringify(data).substring(0, 200) + "...");

      if (data.error) {
        console.error("Gemini API returned error:", data.error);
        return new Response(
          JSON.stringify({ error: data.error.message || "Error calling Gemini API" }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Extract the JSON string from the response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textContent) {
        console.error("No text content found in Gemini API response:", JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: "No text content found in Gemini API response" }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log("Raw text response:", textContent);
      
      // Try to parse the JSON from the text response
      let metadata = {};
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          metadata = JSON.parse(jsonMatch[0]);
          console.log("Successfully parsed JSON from response:", JSON.stringify(metadata));
        } catch (parseError) {
          console.error("Error parsing JSON from response:", parseError);
          
          // Fallback parsing
          const titleMatch = textContent.match(/["']?title["']?\s*:\s*["']([^"']+)["']/i);
          const descMatch = textContent.match(/["']?description["']?\s*:\s*["']([^"']+)["']/i);
          const keywordsMatch = textContent.match(/["']?keywords["']?\s*:\s*\[(.*?)\]/i) || 
                               textContent.match(/["']?keywords["']?\s*:\s*["']([^"']+)["']/i);
          
          metadata = {
            title: titleMatch ? titleMatch[1].trim() : "Untitled Image",
            description: descMatch ? descMatch[1].trim() : "No description available",
            keywords: keywordsMatch 
              ? keywordsMatch[1].split(/,\s*/).map(k => 
                  k.replace(/^["']|["']$/g, '').trim()
                ).filter(Boolean)
              : []
          };
          console.log("Used fallback parsing for metadata:", JSON.stringify(metadata));
        }
      } else {
        // Attempt to parse by looking for the keys
        console.log("No JSON object found, using regex fallback");
        const titleMatch = textContent.match(/["']?title["']?\s*:\s*["']([^"']+)["']/i);
        const descMatch = textContent.match(/["']?description["']?\s*:\s*["']([^"']+)["']/i);
        const keywordsMatch = textContent.match(/["']?keywords["']?\s*:\s*\[(.*?)\]/i) || 
                             textContent.match(/["']?keywords["']?\s*:\s*["']([^"']+)["']/i);
        
        metadata = {
          title: titleMatch ? titleMatch[1].trim() : "Untitled Image",
          description: descMatch ? descMatch[1].trim() : "No description available",
          keywords: keywordsMatch 
            ? (keywordsMatch[1].includes('"') || keywordsMatch[1].includes("'"))
              ? keywordsMatch[1].split(/,\s*/).map(k => 
                  k.replace(/^["']|["']$/g, '').trim()
                ).filter(Boolean)
              : keywordsMatch[1].split(/,\s*/).map(k => k.trim()).filter(Boolean)
            : []
        };
        console.log("Used regex fallback for metadata:", JSON.stringify(metadata));
      }
      
      // Ensure all required fields are present
      if (!metadata.title) metadata.title = "Untitled Image";
      if (!metadata.description) metadata.description = "No description available";
      if (!Array.isArray(metadata.keywords)) metadata.keywords = [];
      
      // Add the filename
      metadata.filename = filename;
      console.log("Final metadata:", JSON.stringify(metadata));
      
      return new Response(
        JSON.stringify(metadata),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError, "Response:", response);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse metadata from AI response", 
          details: parseError.message,
          rawResponse: response ? "Response received but parsing failed" : "No response data" 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("Uncaught error in generate-metadata function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
