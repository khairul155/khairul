import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Copy, Check, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { deductCredits } = useAuth();
  const [selectedResolution, setSelectedResolution] = useState("512x512");

  const resolutionOptions = [
    { value: "256x256", label: "256x256" },
    { value: "512x512", label: "512x512" },
    { value: "1024x1024", label: "1024x1024" },
  ];

  interface DeductCreditsResult {
    success: boolean;
    message: string;
    remaining?: number;
  }

  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt.",
        variant: "destructive",
      });
      setGenerating(false);
      return;
    }

    try {
      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt, resolution: selectedResolution }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setImageUrl(data.url);
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyImageUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const deductCreditsAndGenerate = async () => {
    try {
      // Attempt to deduct credits first
      const result = await deductCredits() as DeductCreditsResult;
      
      if (result.success) {
        // Credits successfully deducted, proceed with generation
        console.log(`Remaining credits: ${result.remaining}`);
        setGenerating(true);
        await generateImage();
      } else {
        // Not enough credits
        console.log(`Credit deduction failed: ${result.message}`);
        toast({
          title: "Not enough credits",
          description: `You don't have enough tokens. ${result.message}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in deductCreditsAndGenerate:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="container mx-auto p-4 pt-28">
        <h1 className="text-3xl font-bold mb-4">Image Generator</h1>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="grid gap-4">
              <Input
                type="text"
                placeholder="Enter your prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-gray-700 text-white border-gray-600 focus-ring-blue-500"
              />
              <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Select a resolution" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {resolutionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-blue-500 text-white hover:bg-blue-600"
                onClick={deductCreditsAndGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Image"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {imageUrl && (
          <Card className="mt-6 bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="grid gap-4">
                <img
                  src={imageUrl}
                  alt="Generated Image"
                  className="rounded-md"
                />
                <div className="flex justify-between items-center">
                  <Button
                    className="bg-gray-700 text-white hover:bg-gray-600"
                    onClick={copyImageUrl}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Image URL
                      </>
                    )}
                  </Button>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
