
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Copy, Download, ArrowLeft, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <div className="min-h-screen bg-[#18230F] text-[#FFF5E4] w-full">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#FFF5E4] hover:bg-[#2A3622] hover:text-[#FFF5E4]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <h1 className="text-5xl md:text-6xl font-bold text-[#FFF5E4]">
            Image to Prompt
          </h1>
          <p className="text-xl text-[#FFF5E4]/90 max-w-2xl mx-auto leading-relaxed">
            Upload any image and our AI will generate a detailed description prompt that captures its essence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <div className="space-y-8 bg-[#243018]/80 p-8 rounded-2xl shadow-xl border border-[#FFF5E4]/10">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="p-4 border border-dashed border-[#FFF5E4]/30 rounded-lg bg-[#18230F]/80 text-center cursor-pointer hover:bg-[#243018] transition-all"
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
                      <p className="text-[#FFF5E4] font-medium">Click to change image</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center">
                    <Upload className="w-12 h-12 text-[#FFF5E4]/60 mb-3" />
                    <p className="text-[#FFF5E4]/80">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-xs text-[#FFF5E4]/60 mt-1">
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
                    className="flex-1 h-12 bg-[#243018] border-[#FFF5E4]/20 text-[#FFF5E4]"
                  />
                  <Button
                    className="h-12 whitespace-nowrap bg-[#2A3622] hover:bg-[#38482C] text-[#FFF5E4] border border-[#FFF5E4]/20"
                    onClick={() => window.open("https://makersuite.google.com/app/apikey", "_blank")}
                  >
                    Get Free API Key
                  </Button>
                </div>

                <Button 
                  onClick={generatePrompt} 
                  disabled={isLoading || !selectedFile}
                  className="w-full h-12 bg-[#3A4A2E] hover:bg-[#4C5E3C] text-[#FFF5E4] font-medium rounded-lg transition-all duration-300 border border-[#FFF5E4]/20"
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
                      className="h-2 bg-[#18230F]"
                    />
                    <p className="text-sm text-center text-[#FFF5E4]/80 animate-pulse">
                      Analyzing image and generating prompt... {progress}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {generatedPrompt && !isLoading && (
              <Card className="mt-6 border border-[#FFF5E4]/10 bg-[#18230F] text-[#FFF5E4]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#FFF5E4]">Generated Prompt:</h3>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={copyToClipboard}
                          className="border-[#FFF5E4]/20 text-[#FFF5E4] hover:bg-[#243018]"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={downloadPrompt}
                          className="border-[#FFF5E4]/20 text-[#FFF5E4] hover:bg-[#243018]"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-[#243018] p-4 rounded-lg border border-[#FFF5E4]/10 max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {generatedPrompt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-12">
            {/* How it Works Section */}
            <div className="bg-[#243018]/80 p-8 rounded-2xl shadow-xl border border-[#FFF5E4]/10">
              <h2 className="text-3xl font-bold mb-6 text-[#FFF5E4]">How to Use Image to Prompt Generator</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#3A4A2E] flex items-center justify-center text-[#FFF5E4] font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#FFF5E4]">Upload or select an image</h3>
                    <p className="text-[#FFF5E4]/80 mt-1">Choose any image you want to transform into a text prompt.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#3A4A2E] flex items-center justify-center text-[#FFF5E4] font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#FFF5E4]">Click the "Generate Prompt" button</h3>
                    <p className="text-[#FFF5E4]/80 mt-1">Our AI will analyze your image and create a detailed text description.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#3A4A2E] flex items-center justify-center text-[#FFF5E4] font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#FFF5E4]">Wait for the prompt to be generated</h3>
                    <p className="text-[#FFF5E4]/80 mt-1">This usually takes a few seconds depending on the complexity of the image.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#3A4A2E] flex items-center justify-center text-[#FFF5E4] font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#FFF5E4]">Copy the generated prompt</h3>
                    <p className="text-[#FFF5E4]/80 mt-1">Use the copy button to save the prompt to your clipboard or download it as a text file.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ Section */}
            <div className="bg-[#243018]/80 p-8 rounded-2xl shadow-xl border border-[#FFF5E4]/10">
              <h2 className="text-3xl font-bold mb-6 text-[#FFF5E4]">Frequently Asked Questions</h2>
              <p className="text-[#FFF5E4]/80 mb-6">Do you have any questions? We have got you covered.</p>
              
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    What is Image to Prompt tool?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    The Image to Prompt tool uses advanced AI to analyze any image and generate a detailed text description that captures its key visual elements, style, and mood. This text can then be used with AI image generators to create similar or derivative images.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    Do I need to pay for using this tool?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    The tool itself is free to use. However, it requires a Gemini API key from Google, which you can obtain for free with limited usage. After the free tier, Google may charge for additional API usage depending on their current pricing.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    What image formats are supported?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    The tool supports common image formats including JPG, PNG, WEBP, and AVIF. For best results, use clear, high-quality images with good lighting and resolution.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    How accurate are the generated prompts?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    The AI does a good job capturing visual elements, style, and composition, but it's not perfect. You may want to edit the generated prompt to better match your vision or to emphasize certain aspects of the image.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    Where can I use the generated prompt?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    You can use the generated prompt with various AI image generation tools like DALL-E, Midjourney, Stable Diffusion, or any other text-to-image AI model. Simply copy the prompt and paste it into your preferred AI image generator.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6" className="border-[#FFF5E4]/10">
                  <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90 text-lg font-medium">
                    Is my data private when using this tool?
                  </AccordionTrigger>
                  <AccordionContent className="text-[#FFF5E4]/80">
                    Your images are processed directly through the Gemini API and are subject to Google's data privacy policies. We do not store your images or the generated prompts on our servers. Your API key is stored locally in your browser for convenience.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-[#FFF5E4]/60">
            Powered by Google Gemini API • Image to Prompt Converter
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageToPrompt;
