
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Image, Wand2, LightbulbIcon, ArrowRight, Star, LogOut, Download, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import PricingPlans from "@/components/PricingPlans";

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageError, setImageError] = useState(false);

  // To log when component mounts - for debugging
  useEffect(() => {
    console.log("Index component mounted");
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const suggestions = [
    "A dreamy landscape with mountains and a lake at sunset",
    "A futuristic cityscape with flying cars and neon lights",
    "A cute cat playing with a ball of yarn in a cozy living room",
    "An astronaut standing on an alien planet with two moons",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };

  const handleImageError = () => {
    console.log("Image failed to load, using fallback");
    setImageError(true);
    toast({
      title: "Image loading error",
      description: "Could not load the generated image. Using fallback image instead.",
      variant: "destructive",
    });
    // Set a fallback image
    setGeneratedImage("https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=1000&auto=format&fit=crop");
  };

  const simulateImageGeneration = () => {
    setIsGenerating(true);
    setProgress(0);
    setImageError(false);

    console.log("Starting image generation simulation");
    
    // We'll use a direct URL to ensure the image loads properly
    const imageUrl = "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?q=80&w=1000&auto=format&fit=crop";

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          
          console.log("Setting generated image URL:", imageUrl);
          setGeneratedImage(imageUrl);
          
          return 100;
        }
        return prevProgress + 5;
      });
    }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with prompt:", prompt);
    
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating image",
      description: "Your image is being generated based on your description.",
    });

    simulateImageGeneration();
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    console.log("Downloading image:", generatedImage);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded.",
    });
  };

  const handleShare = () => {
    if (!generatedImage) return;
    
    console.log("Sharing image:", generatedImage);
    
    if (navigator.share) {
      navigator.share({
        title: 'My AI Generated Image',
        text: 'Check out this image I created with AI!',
        url: generatedImage,
      })
      .then(() => {
        toast({
          title: "Shared successfully",
          description: "Your image has been shared.",
        });
      })
      .catch((error) => {
        console.error("Error sharing:", error);
        toast({
          title: "Error sharing",
          description: "There was an error sharing your image.",
          variant: "destructive",
        });
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(generatedImage);
      toast({
        title: "Image URL copied",
        description: "Image URL has been copied to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        {/* Add sign out button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 pt-16 pb-8">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              AI Image Generator
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mt-2"></div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your ideas into stunning visuals with the power of AI
          </p>
        </div>

        {/* Image Generation Form */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                placeholder="Describe the image you want to create..."
                className="pr-12 bg-white/50 dark:bg-gray-900/50 h-14 text-lg"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isGenerating}
                className="absolute right-1 top-1 h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {showSuggestions && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 absolute z-10 w-full max-w-3xl">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                  Suggestions:
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <LightbulbIcon className="h-4 w-4 text-yellow-500" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating your image...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </form>
        </div>

        {/* Generated Image Display */}
        {generatedImage && (
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Your Generated Image
            </h2>
            
            <div className="relative group">
              <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                {imageError ? (
                  <div className="flex items-center justify-center h-64 bg-gray-200 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Image could not be loaded</p>
                  </div>
                ) : (
                  <img 
                    src={generatedImage} 
                    alt="AI Generated" 
                    className="w-full h-auto rounded-lg transition-transform duration-500 group-hover:scale-105"
                    onError={handleImageError}
                    style={{ minHeight: "200px" }}
                  />
                )}
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 w-full flex justify-between items-center">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/40"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/40"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans Section */}
        <section className="py-16">
          <PricingPlans />
        </section>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by advanced AI technology • Create stunning visuals instantly
          </p>
          <div className="relative inline-block group">
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <h3 className="relative text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 animate-sparkle" />
              Created by Khairul
              <Star className="w-5 h-5 text-yellow-500 animate-sparkle" />
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
