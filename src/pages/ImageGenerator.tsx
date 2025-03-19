
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
);

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt first");
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The response format depends on the API implementation
      // This assumes the API returns a b64_json format
      if (data && data.data && data.data.length > 0) {
        const imageData = data.data[0];
        const base64Image = `data:image/webp;base64,${imageData.b64_json}`;
        setGeneratedImage(base64Image);
        toast.success("Image generated successfully!");
      } else {
        throw new Error("No image data received");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(`Failed to generate image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Image Generator</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Create stunning images with AI by providing detailed text prompts.
      </p>

      <div className="grid gap-8">
        <div className="space-y-4">
          <Label htmlFor="prompt">Describe your image</Label>
          <Textarea
            id="prompt"
            placeholder="A realistic portrait of a futuristic city with floating buildings and flying vehicles..."
            className="min-h-32"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button 
            onClick={handleGenerateImage} 
            disabled={loading || !prompt}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">●</span> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Generate Image
              </span>
            )}
          </Button>
        </div>

        {generatedImage && (
          <>
            <Separator />
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generated Image</h2>
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={generatedImage} 
                  alt="AI generated image" 
                  className="w-full object-contain max-h-[600px]" 
                />
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = generatedImage;
                    a.download = `ai-generated-image-${Date.now()}.webp`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  Download
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setGeneratedImage(null)}
                >
                  Clear
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
