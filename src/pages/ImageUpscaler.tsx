
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { ArrowDownToLine, Image, Upload, RefreshCw } from "lucide-react";

const ImageUpscaler = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem("picsart_api_key") || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResultUrl(null);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem("picsart_api_key", newKey);
  };

  const handleUpscale = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upscale.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please enter a Picsart API Key to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    const form = new FormData();
    form.append("upscale_factor", "2"); // Set upscale factor to 2x
    form.append("format", "JPG"); // Output format
    form.append("file", selectedFile);

    try {
      setProgress(30);
      
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "X-Picsart-API-Key": apiKey,
        },
        body: form,
      };

      setProgress(50);
      const response = await fetch(
        "https://api.picsart.io/tools/1.0/upscale",
        options
      );
      
      setProgress(80);
      const data = await response.json();

      if (data.data && data.data.url) {
        setResultUrl(data.data.url);
        setProgress(100);
        toast({
          title: "Success!",
          description: "Image has been successfully upscaled.",
        });
      } else {
        throw new Error(data.message || "Failed to upscale image");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error upscaling image. Please try again."
      );
      toast({
        title: "Upscaling failed",
        description: "There was an error processing your image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Image Upscaler</h1>
      <p className="text-muted-foreground text-center mb-8">
        Enhance your images with AI-powered upscaling technology
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-key">Picsart API Key</Label>
            <Input
              id="api-key"
              type="text"
              placeholder="Enter your Picsart API Key"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Don't have an API key?{" "}
              <a
                href="https://picsart.io/api-signup"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                Get one for free
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <Input
                type="file"
                id="upload"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                onClick={triggerFileInput}
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG or GIF
                  </p>
                </div>
                {selectedFile && (
                  <p className="text-sm text-green-500">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleUpscale}
              className="w-full"
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Upscale Image
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4 min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            {previewUrl ? (
              <div className="space-y-4 w-full">
                <h3 className="text-lg font-medium text-center">
                  {resultUrl ? "Upscaled Image" : "Original Image"}
                </h3>
                <div className="relative max-h-[400px] overflow-hidden flex justify-center">
                  <img
                    src={resultUrl || previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Image preview will appear here</p>
              </div>
            )}
          </div>

          {resultUrl && (
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a href={resultUrl} download="upscaled-image.jpg">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Download Upscaled Image
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpscaler;
