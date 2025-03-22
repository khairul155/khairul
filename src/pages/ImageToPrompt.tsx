
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Copy, Download, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const ImageToPrompt = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("geminiApiKey") || "");
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("geminiApiKey", key);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    // Create and set preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset generated prompt when a new file is selected
    setGeneratedPrompt(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const generatePrompt = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image first.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 300);

    try {
      // Convert file to base64
      const imageBase64 = await fileToBase64(selectedFile);
      const base64Data = imageBase64.split(",")[1]; // Remove data URL prefix

      // Use gemini-1.5-flash model
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Generate a detailed, creative, and descriptive image prompt based on this image that could be used to generate a similar image with an AI image generator. 
                Be detailed and descriptive, capturing all important elements, style, mood, lighting, colors, and composition.
                Provide ONLY the prompt text without any explanations, introductions, or additional text.`
              },
              {
                inline_data: {
                  mime_type: selectedFile.type,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      console.log("Sending request to Gemini API...");
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error response:", errorData);
        throw new Error(`Gemini API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Gemini API response:", data);

      // Extract the prompt from the response
      const promptText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!promptText) {
        throw new Error("Could not extract prompt from API response");
      }

      setGeneratedPrompt(promptText.trim());

      toast({
        title: "Success!",
        description: "Prompt generated successfully",
      });

    } catch (error: any) {
      console.error("Error generating prompt:", error);
      setError(error.message || "Failed to generate prompt. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to generate prompt. Please try again.",
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

  const copyToClipboard = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    }
  };

  const downloadPrompt = () => {
    if (generatedPrompt) {
      const element = document.createElement("a");
      const file = new Blob([generatedPrompt], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `image-prompt-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Downloaded!",
        description: "Prompt saved as text file",
      });
    }
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
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-20 animate-pulse"></div>
            <h1 className="text-5xl md:text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                Image to Prompt
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Upload any image and our AI will generate a detailed description prompt that captures its essence.
          </p>
        </div>

        <div className="space-y-8 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              
              {imagePreview ? (
                <div className="relative group">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-96 max-w-full mx-auto rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <p className="text-white font-medium">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload an image or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    JPG, PNG, WEBP, AVIF supported
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  type="password"
                  className="flex-1 h-12 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50"
                />
                <Button
                  className="h-12 whitespace-nowrap"
                  variant="outline"
                  onClick={() => window.open("https://makersuite.google.com/app/apikey", "_blank")}
                >
                  Get Free API Key
                </Button>
              </div>

              <Button 
                onClick={generatePrompt} 
                disabled={isLoading || !selectedFile}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Generate Prompt
                  </>
                )}
              </Button>

              {isLoading && (
                <div className="space-y-3">
                  <Progress 
                    value={progress} 
                    className="h-2 bg-gray-200 dark:bg-gray-700"
                  />
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400 animate-pulse">
                    Analyzing image and generating prompt... {progress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {generatedPrompt && !isLoading && (
            <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generated Prompt:</h3>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={copyToClipboard}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={downloadPrompt}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {generatedPrompt}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center space-y-4 pt-12 pb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Google Gemini API • Image to Prompt Converter
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageToPrompt;
