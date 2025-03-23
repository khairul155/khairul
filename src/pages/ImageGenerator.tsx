
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ImageIcon, RefreshCw, LogIn, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import ImageGrid from "@/components/ImageGrid";
import { Link, useNavigate } from "react-router-dom";
import GenerationSidebar, { GenerationSettings } from "@/components/GenerationSidebar";
import { useAuth } from "@/components/AuthProvider";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Generation settings with updated default steps for fast mode
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    mode: "fast",
    steps: 7, // Default for fast mode updated to 7
    dimensionId: "1:1",
    width: 832,
    height: 832,
    negativePrompt: ""
  });

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated and redirect to auth page if not
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate images",
      });
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 400);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          width: generationSettings.width,
          height: generationSettings.height,
          negative_prompt: generationSettings.negativePrompt || "",
          num_images: 1,
          num_inference_steps: generationSettings.steps
        }
      });

      if (error) throw error;

      // Handle multiple images if the API supports it
      const images = data.data.map((item: any) => `data:image/webp;base64,${item.b64_json}`);
      setGeneratedImages(images);
      
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

  const handleRegenerate = () => {
    if (prompt) {
      generateImage();
    }
  };

  // Handle generation settings changes
  const handleSettingsChange = (settings: Partial<GenerationSettings>) => {
    setGenerationSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImage();
    }
  };

  // Get inspiration prompt
  const getInspiration = async () => {
    setIsLoadingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {}
      });

      if (error) throw error;

      if (data && data.prompt) {
        setPrompt(data.prompt);
        // Removed the toast notification for inspiration ready
      }
    } catch (error) {
      console.error('Error getting inspiration:', error);
      toast({
        title: "Error",
        description: "Failed to get inspiration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Top Navigation */}
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors mr-4">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#FFA725]">PixcraftAI</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <GenerationSidebar 
          settings={generationSettings}
          onSettingsChange={handleSettingsChange}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Main Content Area with animation */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
            {generatedImages.length > 0 && !isLoading ? (
              <div className="max-w-md w-full animate-fade-in">
                <ImageGrid 
                  images={generatedImages} 
                  prompt={prompt} 
                  onRegenerate={handleRegenerate}
                />
              </div>
            ) : isLoading ? (
              <div className="text-center max-w-md mx-auto animate-pulse">
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="rounded-full bg-gradient-to-br from-[#FF5353]/20 to-[#FFA725]/20 p-6">
                    <Loader2 className="h-12 w-12 text-[#FFA725] animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold">Creating your masterpiece...</h2>
                  <Progress value={progress} className="h-1 w-64 bg-gray-700" />
                </div>
              </div>
            ) : (
              <div className="text-center max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="rounded-full bg-gradient-to-br from-[#FF5353]/20 to-[#FFA725]/20 p-6">
                    <ImageIcon className="h-12 w-12 text-[#FFA725]" />
                  </div>
                  <h2 className="text-2xl font-bold">Turn your imagination into reality</h2>
                  <p className="text-gray-400">
                    We provide you only one best result✨
                  </p>
                  {!user && (
                    <div className="mt-4 text-sm text-gray-400">
                      <p className="mb-2">You need to sign in to generate images</p>
                      <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Prompt Bar with Generate button on right - Updated to fill width better */}
          <div className="border-t border-gray-800 p-2 md:p-4">
            <div className="flex flex-col w-full">
              <div className="relative w-full mb-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="min-h-[60px] px-4 py-3 bg-[#1A1A1A] rounded-lg border border-gray-800 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-0 w-full pr-32"
                />
                {isLoading && (
                  <div className="px-4 py-2">
                    <Progress value={progress} className="h-1 bg-gray-700" />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={getInspiration}
                  disabled={isLoadingPrompt}
                  className="bg-[#343434] hover:bg-[#444444] text-white rounded-full"
                  size="sm"
                >
                  {isLoadingPrompt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Get inspiration
                    </>
                  )}
                </Button>
              
                <Button
                  onClick={generateImage}
                  disabled={isLoading || !prompt.trim()}
                  className="bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full"
                  size="sm"
                >
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
