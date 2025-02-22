
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (error) throw error;

      const images = data.data.map((img: { b64_json: string }) => 
        `data:image/webp;base64,${img.b64_json}`
      );
      setGeneratedImages(images);
      toast({
        title: "Success",
        description: "Images generated successfully!",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Welcome to{" "}
          <span className="relative inline-block">
            <span className="absolute inset-0 blur-sm bg-purple-400/50 animate-pulse rounded-lg"></span>
            <span className="relative text-purple-600 font-bold">Khairul's</span>
          </span>{" "}
          AI Image Generator
        </h1>
        <p className="text-muted-foreground">Enter a prompt to generate two images using Stable Diffusion</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={generateImage} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Generating your images...
            </p>
          </div>
        )}

        {generatedImages.length > 0 && !isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Prompt: {prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
