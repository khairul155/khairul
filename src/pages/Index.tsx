import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Image, Wand2, LightbulbIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Create and inject the ad script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl26017063.effectiveratecpm.com/7ec2a540577d91506873402442fdb671/invoke.js';
    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const inspirationGallery = [
    {
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      prompt: "Majestic mountain peak at sunset with purple and orange sky",
      category: "Nature"
    },
    {
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5",
      prompt: "Futuristic cyber city at night with neon lights and flying cars",
      category: "Sci-Fi"
    },
    {
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401",
      prompt: "Magical floating islands with waterfalls and rainbow bridges",
      category: "Fantasy"
    },
    {
      image: "https://images.unsplash.com/photo-1563089145-599997674d42",
      prompt: "Abstract fluid art with swirling colors of blue and gold",
      category: "Abstract"
    }
  ];

  const handlePromptClick = (promptText: string) => {
    setPrompt(promptText);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-8 relative">
        <div className="flex justify-end">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"
          >
            Sign Out
          </Button>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 -left-32 -top-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute w-64 h-64 -right-32 -top-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute w-64 h-64 -left-32 -bottom-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center space-y-6 py-12 relative">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-20 animate-pulse"></div>
            <h1 className="text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
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
            <Image className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>

        {/* Advertisement Banner */}
        <div className="my-6 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 shadow-md">
          <div id="container-7ec2a540577d91506873402442fdb671" ref={adContainerRef}></div>
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
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-lg p-4 shadow-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Prompt:</span> {prompt}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="py-16 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
              <LightbulbIcon className="w-8 h-8 text-yellow-500" />
              Need Inspiration?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Click on any prompt below to try it out!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inspirationGallery.map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <span className="inline-block px-2 py-1 mb-2 text-xs font-semibold bg-purple-500 rounded-full">
                      {item.category}
                    </span>
                    <p className="text-sm line-clamp-2 mb-2">{item.prompt}</p>
                    <Button
                      onClick={() => handlePromptClick(item.prompt)}
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
                    >
                      Try this prompt <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8">
          <p>Powered by advanced AI technology • Create stunning visuals instantly</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
