import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Wand2, ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageGrid from "@/components/ImageGrid";
import { Link, useNavigate } from "react-router-dom";
import GenerationSidebar, { GenerationSettings } from "@/components/GenerationSidebar";
import { useAuth } from "@/components/AuthProvider";
import TypingEffect from "@/components/TypingEffect";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationTime, setGenerationTime] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { deductCredits, credits } = useAuth();
  const navigate = useNavigate();
  
  // Generation settings with updated default steps for fast mode
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    mode: "fast",
    steps: 7, // Default for fast mode updated to 7
    dimensionId: "1:1",
    width: 832,
    height: 832,
    negativePrompt: "",
    seed: -1, // Add seed with default value of -1 (random)
    useSeed: false // Add flag to track if seed should be used
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

    // Validate that the user has credits available
    if (credits <= 0) {
      toast({
        title: "No credits available",
        description: "You don't have enough credits to generate an image.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 400);

    // Record start time
    const startTime = new Date();

    try {
      // Deduct credits before generating image
      const deductResult = await deductCredits(4);
      console.log("Deduct result:", deductResult);
      
      if (!deductResult.success) {
        clearInterval(progressInterval);
        setIsLoading(false);
        // Toast is already handled in the deductCredits function
        return;
      }

      const seedToUse = generationSettings.useSeed ? generationSettings.seed : -1;
      
      // Proceed with image generation only if credit deduction was successful
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt,
          width: generationSettings.width,
          height: generationSettings.height,
          negative_prompt: generationSettings.negativePrompt || "",
          num_images: 1,
          num_inference_steps: generationSettings.steps,
          seed: seedToUse
        }
      });

      if (error) throw error;

      // Calculate generation time
      const endTime = new Date();
      const timeDiff = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
      setGenerationTime(`${timeDiff.toFixed(1)}s`);

      // Handle multiple images if the API supports it
      const images = data.data.map((item: any) => `data:image/webp;base64,${item.b64_json}`);
      setGeneratedImages(images);
      
      toast({
        title: "Image Generated",
        description: `Used 4 credits. You have ${deductResult.remaining} credits remaining.`,
      });
      
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
      setGenerationTime("");
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
      {/* Top Navigation - Simplified to just PixcraftAI */}
      <div className="border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 transition-colors mr-4">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
        
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#FFA725] flex items-center">
            <Sparkles className="w-5 h-5 mr-1.5 text-[#FFA725]" /> {/* Changed icon to Sparkles */}
            PixcraftAI
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Space for balance */}
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <GenerationSidebar 
          settings={generationSettings}
          onSettingsChange={handleSettingsChange}
        />

        {/* Main Content and Footer Structure */}
        <div className="flex-1 flex flex-col h-[calc(100vh-73px)]">
          {/* Main Content Area (expanded to take most space) */}
          <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
            {generatedImages.length > 0 && !isLoading ? (
              <div className="w-full max-w-5xl mx-auto animate-fade-in">
                <ImageGrid 
                  images={generatedImages} 
                  prompt={prompt} 
                  onRegenerate={handleRegenerate}
                  generationTime={generationTime}
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
                  <div>
                    <ImageIcon className="h-24 w-24 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold">PixCraftAI Provides You Only One Best Result.✨</h2>
                  <p className="text-gray-400">
                    Try Now!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Prompt Bar - Styled like the reference image and positioned at the bottom */}
          <div className="bg-[#0A0A0A] border-t border-gray-800 p-5">
            <div className="max-w-5xl mx-auto">
              <div className="mb-4">
                <Textarea
                  ref={textareaRef}
                  placeholder="Describe the image you want to generate"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="min-h-[35px] max-h-[35px] px-4 py-1.5 bg-[#171717] rounded-lg border border-gray-800 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-0 w-full"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  onClick={getInspiration}
                  disabled={isLoadingPrompt}
                  variant="outline"
                  className="bg-[#171717] hover:bg-[#2a2a2a] text-white border-gray-700 rounded-md px-4"
                >
                  {isLoadingPrompt ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="h-5 w-5 mr-2" />
                  )}
                  Get Inspiration
                </Button>
              
                <Button
                  onClick={generateImage}
                  disabled={isLoading || !prompt.trim()}
                  className="bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-md px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
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
