
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Image as ImageIcon, Wand2, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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

      const imageBase64 = data.data[0].b64_json;
      setGeneratedImage(`data:image/webp;base64,${imageBase64}`);
      toast({
        title: "Success",
        description: "Image generated successfully!",
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

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-image-${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -left-32 -top-32 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute w-64 h-64 -right-32 -top-32 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute w-64 h-64 -left-32 -bottom-32 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex justify-between items-center pt-4">
          <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            ← Back to Home
          </a>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-20 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                AI Image Generator
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into stunning visuals using advanced AI technology. 
            Just describe what you want to see, and watch the magic happen!
          </p>
          <div className="flex justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            <Wand2 className="w-6 h-6 text-purple-500 animate-bounce" />
            <ImageIcon className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>

        <div className="space-y-8 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                className="flex-1 h-12 text-lg backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 transition-all duration-300"
              />
              <Button 
                onClick={generateImage} 
                disabled={isLoading}
                className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-3">
                <Progress 
                  value={progress} 
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 animate-pulse">
                  Crafting your masterpiece... {progress}%
                </p>
              </div>
            )}
          </div>

          {generatedImage && !isLoading && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="Generated image"
                    className="w-full h-auto rounded-lg shadow-2xl transform transition duration-500 hover:scale-[1.01]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Button 
                  onClick={downloadImage}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </Button>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
                  onClick={() => {
                    navigator.clipboard.writeText(prompt);
                    toast({
                      title: "Copied!",
                      description: "Prompt copied to clipboard",
                    });
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Copy Prompt
                </Button>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Prompt:</span> {prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
