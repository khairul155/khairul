
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImageGrid from "@/components/ImageGrid";
import { Link } from "react-router-dom";
import GenerationSidebar, { GenerationSettings } from "@/components/GenerationSidebar";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    mode: "fast",
    steps: 8,
    dimensionId: "1:1",
    width: 832,
    height: 832
  });

  // Update settings handler
  const handleSettingsChange = (newSettings: Partial<GenerationSettings>) => {
    setGenerationSettings(prev => ({ ...prev, ...newSettings }));
  };

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
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 400);

    try {
      const { width, height } = generationSettings;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          width,
          height,
          negative_prompt: "",
          num_images: 1,
          num_inference_steps: generationSettings.steps
        }
      });

      if (error) throw error;

      // Handle multiple images if the API supports it
      const images = data.data.map((item: any) => `data:image/webp;base64,${item.b64_json}`);
      setGeneratedImages(images);
      
      toast({
        title: "Success",
        description: `Generated ${images.length} image${images.length > 1 ? 's' : ''}!`,
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex">
      <GenerationSidebar 
        settings={generationSettings}
        onSettingsChange={handleSettingsChange}
      />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center pt-4">
            <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center space-y-6 py-6 relative">
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
              <h1 className="text-4xl md:text-5xl font-bold relative leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  We Provides You
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Only One Best Result
                  </span>
                </span>
              </h1>
            </div>
          </div>

          <div className="space-y-6 backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Enter a prompt, and AI will create images for you."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                className="min-h-[120px] py-4 px-5 pr-20 text-base backdrop-blur-sm bg-black/30 border-gray-600 text-white placeholder:text-gray-400 resize-none rounded-xl focus:border-purple-500 focus:ring-purple-500"
              />
              
              <div className="absolute bottom-4 right-4">
                <Button 
                  onClick={generateImage} 
                  disabled={isLoading}
                  className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-5 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-gray-700"
                />
                <p className="text-sm text-center text-gray-400 animate-pulse">
                  Creating your masterpiece... {progress}%
                </p>
              </div>
            )}

            {generatedImages.length > 0 && !isLoading && (
              <div className="flex justify-center">
                <div className="max-w-xl">
                  <ImageGrid 
                    images={generatedImages} 
                    prompt={prompt}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-8 pb-4 text-center">
            <p className="text-sm text-gray-400">
              Create stunning visuals with advanced AI technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
