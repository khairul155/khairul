
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Get the API key from environment variables
    const apiKey = Deno.env.get("PICSART_API_KEY");
    
    if (!apiKey) {
      console.error("PICSART_API_KEY is not configured");
      throw new Error("PICSART_API_KEY is not configured");
    }

    // Get the image file from the request
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file || !(file instanceof File)) {
      console.error("No valid file provided");
      throw new Error("No valid file provided");
    }

    console.log("Received file:", file.name, "Size:", file.size);

    // Create a new FormData object for the Picsart API
    const picsartForm = new FormData();
    picsartForm.append("upscale_factor", "2"); // Set upscale factor to 2x
    picsartForm.append("format", "JPG"); // Output format
    picsartForm.append("file", file, file.name);

    console.log("Sending request to Picsart API...");
    
    // Send the request to the Picsart API
    const response = await fetch("https://api.picsart.io/tools/1.0/upscale", {
      method: "POST",
      headers: {
        "X-Picsart-API-Key": apiKey,
      },
      body: picsartForm,
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Picsart API error response:", errorText);
      throw new Error(`Picsart API returned status ${response.status}: ${errorText}`);
    }

    // Get the response from the Picsart API
    const data = await response.json();
    console.log("Picsart API response:", data);

    if (data.data && data.data.url) {
      // Return the upscaled image URL
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: data.data.url,
          width: data.data.width,
          height: data.data.height,
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } else {
      throw new Error(data.message || "Failed to upscale image");
    }
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
