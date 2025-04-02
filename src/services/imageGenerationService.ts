
import { NEBIUS_API_KEY } from "@/utils/apiKeys";
import { doc, addDoc, serverTimestamp, collection } from "firebase/firestore";
import { db, imagePromptHistoryCollection } from "@/integrations/firebase/client";

type GenerationOptions = {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
};

export const generateImage = async (
  options: GenerationOptions,
  userId?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Construct request to Nebius API
    const response = await fetch("https://api.nebius.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NEBIUS_API_KEY}`
      },
      body: JSON.stringify({
        prompt: options.prompt,
        negative_prompt: options.negativePrompt || "",
        width: options.width || 1024,
        height: options.height || 1024,
        num_inference_steps: options.steps || 30,
        seed: options.seed || -1,
        guidance_scale: options.guidance || 7.5,
        num_images: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to generate image");
    }

    const data = await response.json();
    
    // Save prompt history if user is logged in
    if (userId) {
      await addDoc(imagePromptHistoryCollection, {
        userId,
        prompt: options.prompt,
        negativePrompt: options.negativePrompt || "",
        width: options.width || 1024,
        height: options.height || 1024,
        settings: {
          steps: options.steps || 30,
          seed: options.seed || -1,
          guidance: options.guidance || 7.5
        },
        createdAt: serverTimestamp()
      });
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error generating image:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Function to save generated image to user's collection
export const saveGeneratedImage = async (
  userId: string,
  imageUrl: string, 
  prompt: string,
  settings: Record<string, any>
) => {
  try {
    // Create a reference to the user's saved_images collection
    const userImagesCollection = collection(db, "users", userId, "saved_images");
    
    // Add a new document to the collection
    await addDoc(userImagesCollection, {
      imageUrl,
      prompt,
      settings,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error saving image:", error);
    return { success: false, error };
  }
};
