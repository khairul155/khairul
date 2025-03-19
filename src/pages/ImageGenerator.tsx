
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImageGeneratorSettingsPanel, { ImageGeneratorSettings } from "@/components/ImageGeneratorSettings";
import ImageGrid from "@/components/ImageGrid";
import { Link } from "react-router-dom";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [settings, setSettings] = useState<ImageGeneratorSettings>({
    aspectRatio: { id: "1:1", label: "1:1", width: 1024, height: 1024 },
    numImages: 1,
    negativePrompt: "",
    displayCredits: true,
    privateMode: false,
  });

  // Update settings handler
  const handleSettingsChange = (newSettings: Partial<ImageGeneratorSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
      const { width, height } = settings.aspectRatio;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          width,
          height,
          negative_prompt: settings.negativePrompt,
          num_images: settings.numImages
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="flex justify-between items-center pt-4">
          <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6 py-6 relative">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-green-400 to-yellow-300 opacity-20 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-bold relative flex items-center justify-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-yellow-300 to-green-300">
                AI Image Creator
              </span>
              <span className="text-white text-3xl">✨</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Unleash Your Creativity with AI-Powered Image Generation
          </p>
        </div>

        <div className="space-y-6 backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-gray-700 shadow-xl">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Enter a prompt, and AI will create images for you."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="min-h-[120px] py-4 px-5 pr-20 text-base backdrop-blur-sm bg-black/30 border-gray-600 text-white placeholder:text-gray-400 resize-none rounded-xl focus:border-green-500 focus:ring-green-500"
            />
            
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <ImageGeneratorSettingsPanel 
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
              
              <Button 
                onClick={generateImage} 
                disabled={isLoading}
                className="rounded-full bg-gradient-to-r from-green-400 to-yellow-300 hover:from-green-500 hover:to-yellow-400 text-gray-900 font-semibold px-5 transition-all duration-300"
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
            <ImageGrid 
              images={generatedImages} 
              prompt={prompt}
            />
          )}
        </div>

        <div className="pt-8 pb-4 text-center">
          <p className="text-sm text-gray-400">
            Create stunning visuals with advanced AI technology • {settings.displayCredits && "Credits: ∞"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
