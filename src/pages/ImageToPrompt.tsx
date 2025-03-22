
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Copy, Download, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IMAGE_EXAMPLES = [
  {
    id: 1,
    original: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg",
    generated: "A clean, modern interface showcasing a minimal design system with a dark theme. The UI components are arranged in a grid layout with subtle shadows and rounded corners, emphasizing a contemporary tech aesthetic with a professional developer-oriented approach.",
  },
  {
    id: 2,
    original: "/lovable-uploads/a29b537f-ce29-48f5-b1af-d8aae34f92ee.png",
    generated: "Highly detailed comparison of original and AI-generated images. Left side shows a mechanical blue shark with glowing accents in a stormy sea battle scene. Right side displays a mid-century modern house with pink clouds, palm trees, and a swimming pool with a classic red car, creating a dreamy nostalgic aesthetic. The images demonstrate AI prompt accuracy in a dark UI interface.",
  }
];

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

  const loadExample = (examplePrompt: string) => {
    setGeneratedPrompt(examplePrompt);
  };

  return (
    <div className="min-h-screen bg-[#1D1616] text-[#FFF5E4] w-full">
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#FFF5E4] hover:bg-[#2A2020] hover:text-[#FFF5E4]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-center space-y-6 py-8 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-[#FFF5E4]">
            Image to Prompt Generator
          </h1>
          <p className="text-lg text-[#FFF5E4]/90 max-w-2xl mx-auto leading-relaxed">
            Upload any image and our AI will generate a detailed description prompt that captures its essence.
          </p>
        </div>

        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8 bg-[#2A2020]">
            <TabsTrigger value="generator" className="text-[#FFF5E4]">Image to Prompt Tool</TabsTrigger>
            <TabsTrigger value="examples" className="text-[#FFF5E4]">Examples & References</TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Side - Steps */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-[#2A2020] border-[#FFF5E4]/10 text-[#FFF5E4]">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6">How It Works</h2>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#403030] flex items-center justify-center text-[#FFF5E4] font-bold">
                          1
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#FFF5E4]">Upload Image</h3>
                          <p className="text-[#FFF5E4]/80 mt-1">Select an image you want to analyze.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#403030] flex items-center justify-center text-[#FFF5E4] font-bold">
                          2
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#FFF5E4]">Add API Key</h3>
                          <p className="text-[#FFF5E4]/80 mt-1">Enter your Gemini API key. You can get a free key from Google.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#403030] flex items-center justify-center text-[#FFF5E4] font-bold">
                          3
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#FFF5E4]">Generate</h3>
                          <p className="text-[#FFF5E4]/80 mt-1">Click the generate button and wait for your detailed prompt.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#403030] flex items-center justify-center text-[#FFF5E4] font-bold">
                          4
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#FFF5E4]">Use Prompt</h3>
                          <p className="text-[#FFF5E4]/80 mt-1">Copy or download the generated prompt to use with any AI image generator.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#2A2020] border-[#FFF5E4]/10 text-[#FFF5E4]">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-4">FAQs</h2>
                    <Accordion type="single" collapsible className="space-y-2">
                      <AccordionItem value="item-1" className="border-[#FFF5E4]/10">
                        <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90">
                          Why use this tool?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#FFF5E4]/80">
                          This tool helps you create detailed prompts from images, making it easier to generate similar images with AI image generators or to understand what elements make an image visually compelling.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2" className="border-[#FFF5E4]/10">
                        <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90">
                          What image formats work best?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#FFF5E4]/80">
                          JPG, PNG, WEBP, and AVIF are all supported. For best results, use clear, high-quality images without heavy compression artifacts.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3" className="border-[#FFF5E4]/10">
                        <AccordionTrigger className="text-[#FFF5E4] hover:text-[#FFF5E4]/90">
                          Is my data private?
                        </AccordionTrigger>
                        <AccordionContent className="text-[#FFF5E4]/80">
                          Your images are processed through Google's Gemini API and are subject to their privacy policies. We don't store your images on our servers. Your API key is stored locally in your browser.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Tool */}
              <div className="lg:col-span-8">
                <Card className="bg-[#2A2020] border-[#FFF5E4]/10 text-[#FFF5E4]">
                  <CardContent className="p-6">
                    {error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Step 1: Upload Image</h3>
                        <div 
                          className="p-4 border border-dashed border-[#FFF5E4]/30 rounded-lg bg-[#403030]/50 text-center cursor-pointer hover:bg-[#403030] transition-all"
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
                                className="max-h-60 max-w-full mx-auto rounded-lg shadow-md"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                <p className="text-[#FFF5E4] font-medium">Click to change image</p>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 flex flex-col items-center">
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
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Step 2: Enter API Key</h3>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Enter your Gemini API key"
                            value={apiKey}
                            onChange={(e) => saveApiKey(e.target.value)}
                            type="password"
                            className="flex-1 bg-[#403030] border-[#FFF5E4]/20 text-[#FFF5E4]"
                          />
                          <Button
                            className="whitespace-nowrap bg-[#403030] hover:bg-[#504040] text-[#FFF5E4] border border-[#FFF5E4]/20"
                            onClick={() => window.open("https://makersuite.google.com/app/apikey", "_blank")}
                          >
                            Get Free API Key
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Step 3: Generate Prompt</h3>
                        <Button 
                          onClick={generatePrompt} 
                          disabled={isLoading || !selectedFile}
                          className="w-full bg-[#403030] hover:bg-[#504040] text-[#FFF5E4] font-medium rounded-lg transition-all duration-300 border border-[#FFF5E4]/20"
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
                          <div className="mt-4 space-y-3">
                            <Progress 
                              value={progress} 
                              className="h-2 bg-[#1D1616]"
                            />
                            <p className="text-sm text-center text-[#FFF5E4]/80 animate-pulse">
                              Analyzing image and generating prompt... {progress}%
                            </p>
                          </div>
                        )}
                      </div>

                      {generatedPrompt && !isLoading && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Step 4: Your Generated Prompt</h3>
                          <Card className="border border-[#FFF5E4]/10 bg-[#403030] text-[#FFF5E4]">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold text-[#FFF5E4]">Generated Prompt:</h3>
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={copyToClipboard}
                                      className="border-[#FFF5E4]/20 text-[#FFF5E4] hover:bg-[#504040]"
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copy
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={downloadPrompt}
                                      className="border-[#FFF5E4]/20 text-[#FFF5E4] hover:bg-[#504040]"
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="bg-[#1D1616] p-4 rounded-lg border border-[#FFF5E4]/10 max-h-80 overflow-y-auto whitespace-pre-wrap">
                                  {generatedPrompt}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid grid-cols-1 gap-8">
              <h2 className="text-2xl font-bold text-[#FFF5E4]">Examples & References</h2>
              <p className="text-[#FFF5E4]/80">See how our Image to Prompt tool works with these examples. Click an example to see the generated prompt.</p>
              
              {IMAGE_EXAMPLES.map((example) => (
                <Card key={example.id} className="bg-[#2A2020] border-[#FFF5E4]/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="p-4 border-r border-[#FFF5E4]/10">
                        <h3 className="text-lg font-semibold mb-3">Original Image</h3>
                        <div className="aspect-video bg-[#1D1616] rounded-lg overflow-hidden flex items-center justify-center">
                          <img 
                            src={example.original} 
                            alt={`Example ${example.id}`} 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Generated Prompt</h3>
                        <div className="bg-[#1D1616] p-4 rounded-lg border border-[#FFF5E4]/10 h-[250px] overflow-y-auto">
                          <p className="text-[#FFF5E4]/90 whitespace-pre-wrap">{example.generated}</p>
                        </div>
                        <div className="mt-4">
                          <Button 
                            onClick={() => loadExample(example.generated)}
                            className="w-full bg-[#403030] hover:bg-[#504040] text-[#FFF5E4]"
                          >
                            Load This Prompt
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
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
