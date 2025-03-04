import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Wand2, Image, Download, Copy, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AppIconsSection from "@/components/AppIconsSection";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const adContainerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadAdsense = () => {
      if (isAdLoaded) return;

      try {
        const script = document.createElement("script");
        script.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3446887631324249";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
          setIsAdLoaded(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Failed to load AdSense:", error);
      }
    };

    loadAdsense();

    return () => {
      document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach((script) => {
        script.remove();
      });
      setIsAdLoaded(false);
    };
  }, [isAdLoaded]);

  const inspirationGallery = [
    {
      prompt: "A futuristic cityscape at dusk, neon lights reflecting on wet streets, flying vehicles, cyberpunk style",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/city.webp",
    },
    {
      prompt: "A serene mountain landscape with a clear lake, vibrant autumn colors, and a cozy cabin in the distance",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/autumn.webp",
    },
    {
      prompt: "An astronaut standing on a distant planet, looking at a swirling galaxy, stars, cosmic dust, science fiction",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/astronaut.webp",
    },
    {
      prompt: "A majestic dragon soaring through a stormy sky, lightning, dark clouds, fantasy art",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/dragon.webp",
    },
    {
      prompt: "A vibrant coral reef teeming with marine life, colorful fish, clear water, underwater photography",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/coral.webp",
    },
    {
      prompt: "A mysterious forest with glowing mushrooms, fireflies, ancient trees, magical atmosphere",
      url: "https://pub-179a9494949a4577a35ff05c14949c55.r2.dev/forest.webp",
    },
  ];

  const handlePromptSubmit = async () => {
    setIsLoading(true);
    setImageUrl("");
    setProgress(0);

    try {
      console.log("Sending generate image request with prompt:", prompt);
      
      const response = await fetch("https://napbrxjntjvkjwlcpwql.supabase.co/functions/v1/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to generate image: ${errorText}`);
      }

      const data = await response.json();
      console.log("Image generation response:", data);
      
      if (data.b64_json) {
        const imageData = `data:image/webp;base64,${data.b64_json}`;
        setImageUrl(imageData);
      } else {
        throw new Error("Image data not found in response");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error generating image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setImageUrl("");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        toast({
          title: "Prompt copied",
          description: "The prompt has been copied to your clipboard.",
        });
      })
      .catch((error) => {
        toast({
          title: "Error copying prompt",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  const handleSharePrompt = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "AI Image Prompt",
          text: `Check out this AI image prompt: ${prompt}`,
          url: document.location.href,
        })
        .then(() => {
          toast({
            title: "Prompt shared",
            description: "The prompt has been shared successfully.",
          });
        })
        .catch((error) => {
          toast({
            title: "Error sharing prompt",
            description: error.message,
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Sharing not supported",
        description: "Web Share API is not supported in your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden morphing-background">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="absolute rounded-full bg-purple-500 opacity-20 animate-blob"
          style={{ width: "350px", height: "350px", left: "-100px", top: "100px" }}
        ></div>
        <div
          className="absolute rounded-full bg-blue-500 opacity-20 animate-blob animation-delay-2000"
          style={{ width: "250px", height: "250px", right: "-150px", bottom: "200px" }}
        ></div>
        <div
          className="absolute rounded-full bg-pink-500 opacity-20 animate-blob animation-delay-4000"
          style={{ width: "200px", height: "200px", left: "50px", bottom: "-50px" }}
        ></div>
      </div>

      <div className="container mx-auto pt-12 px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 animate-fade-in">
            Unleash Your Imagination with AI
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 animate-fade-in animation-delay-500">
            Generate stunning images from text prompts using our AI-powered tool.
          </p>
        </div>

        {/* Advertisement Banner */}
        <div className="my-6 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 shadow-md">
          <div id="container-7ec2a540577d91506873402442fdb671" ref={adContainerRef}></div>
        </div>

        <div className="space-y-8 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <label htmlFor="prompt" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter your prompt
              </label>
            </div>
            <div className="relative">
              <Input
                id="prompt"
                className="rounded-xl pr-12"
                placeholder="A majestic dragon soaring through a stormy sky..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl"
                  onClick={handlePromptSubmit}
                  disabled={isLoading || !prompt}
                >
                  {isLoading ? (
                    <>
                      Generating...
                      <svg className="animate-spin ml-2 h-4 w-4 text-gray-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {isLoading && (
            <Progress value={progress} className="h-2 rounded-xl" />
          )}

          {imageUrl && (
            <div className="space-y-4">
              <Card className="overflow-hidden rounded-xl">
                <div className="relative">
                  <img src={imageUrl} alt="Generated Image" className="w-full aspect-video object-cover" />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="secondary">
                        <Image className="h-4 w-4" />
                      </Button>
                    </a>
                    <a href={imageUrl} download="generated_image.jpg">
                      <Button size="icon" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={handleCopyPrompt}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSharePrompt}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Prompt
                  </Button>
                </div>
                <Badge variant="secondary">AI Generated</Badge>
              </div>
            </div>
          )}
        </div>

        {/* App Icons Section */}
        <AppIconsSection />

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">Inspiration Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspirationGallery.map((item, index) => (
              <Card key={index} className="hover-card">
                <img src={item.url} alt={`Inspiration ${index + 1}`} className="w-full aspect-video object-cover rounded-md" />
                <div className="p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.prompt}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
