
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownToLine, Image, Upload, RefreshCw, Zap, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ImageUpscaler = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [newDimensions, setNewDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResultUrl(null);
      setError(null);
      setNewDimensions(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        
        // Get original image dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({
            width: img.width,
            height: img.height,
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResultUrl(null);
      setError(null);
      setNewDimensions(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        
        // Get original image dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({
            width: img.width,
            height: img.height,
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
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

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      setProgress(30);
      
      // Create FormData
      const form = new FormData();
      form.append("file", selectedFile);

      setProgress(50);
      
      // Call our Supabase Edge Function instead of directly calling Picsart API
      const { data, error } = await supabase.functions.invoke("image-upscaler", {
        body: form,
        headers: {
          // Don't include Content-Type when sending FormData
          // The browser will set it automatically with the boundary
        },
      });

      setProgress(80);

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to upscale image");
      }

      setResultUrl(data.url);
      
      if (data.width && data.height) {
        setNewDimensions({
          width: data.width,
          height: data.height,
        });
      }
      
      setProgress(100);
      toast({
        title: "Success!",
        description: "Image has been successfully upscaled.",
      });
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col items-center mb-12 text-center">
        <Zap className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4">AI Image Upscaler</h1>
        <p className="text-muted-foreground max-w-2xl">
          Transform your images into high-resolution masterpieces with our AI-powered upscaling technology. 
          Upload any image and watch as our AI enhances its resolution while preserving details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Select or drag & drop an image to upscale
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG or GIF (Max 10MB)
                      </p>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        <p className="text-sm text-green-500">
                          {selectedFile.name}
                        </p>
                      </div>
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
                      <Zap className="mr-2 h-4 w-4" />
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
                    <X className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {originalDimensions && (
            <Card>
              <CardHeader>
                <CardTitle>Image Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Original</p>
                    <p className="text-lg font-semibold">
                      {originalDimensions.width} x {originalDimensions.height}
                    </p>
                  </div>
                  
                  {newDimensions && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Enhanced</p>
                      <p className="text-lg font-semibold text-green-500">
                        {newDimensions.width} x {newDimensions.height}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>
                {resultUrl ? "Enhanced Image" : "Image Preview"}
              </CardTitle>
              <CardDescription>
                {resultUrl ? "The AI-enhanced high-resolution result" : "Your original image will appear here"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {previewUrl ? (
                  <img
                    src={resultUrl || previewUrl}
                    alt={resultUrl ? "Enhanced Image" : "Original Image"}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-6">
                    <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Upload an image to see preview</p>
                  </div>
                )}
              </div>
            </CardContent>
            {resultUrl && (
              <CardFooter className="pt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a href={resultUrl} download="upscaled-image.jpg">
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Download Enhanced Image
                  </a>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Upload any image you want to enhance. We support JPG, PNG, and GIF formats.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>2. Process</CardTitle>
            </CardHeader>
            <CardContent>
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Our AI analyzes your image and enhances it to 2x resolution while preserving details.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>3. Download</CardTitle>
            </CardHeader>
            <CardContent>
              <ArrowDownToLine className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Download your enhanced image and enjoy the improved quality and resolution.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageUpscaler;
