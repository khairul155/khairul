
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const BulkImageSizeIncreaser = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<{ name: string; url: string }[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Only accept image files
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length !== filesArray.length) {
        toast({
          title: "Warning",
          description: "Some files were skipped because they are not images.",
          variant: "destructive",
        });
      }
      
      setUploadedImages(imageFiles);
    }
  };

  const handleUpload = () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please select images to upload first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Success",
        description: `${uploadedImages.length} images uploaded successfully`,
      });
    }, 1500);
  };

  const processImages = () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload images first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const processed = uploadedImages.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file) // In a real app, this would be the URL of the processed image
      }));
      
      setProcessedImages(processed);
      setIsProcessing(false);
      
      toast({
        title: "Success",
        description: `${processed.length} images processed successfully`,
      });
    }, 2000);
  };

  const downloadAll = () => {
    if (processedImages.length === 0) {
      toast({
        title: "Error",
        description: "No processed images to download",
        variant: "destructive",
      });
      return;
    }

    // In a real application, you would create a zip file or allow individual downloads
    toast({
      title: "Download started",
      description: "Your images are being prepared for download",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center pt-4">
          <a href="/" className="text-foreground hover:text-foreground/80">
            ← Back to Home
          </a>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Bulk Image Size Increaser</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Resize multiple images at once with our AI-powered bulk image processor.
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-lg p-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center">
              <div className="flex flex-col items-center space-y-4">
                <UploadCloud className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-medium">Drag & drop your images here</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Or click to browse. Supported formats: JPEG, PNG, WebP (max 5MB each)
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full max-w-xs"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selected Images ({uploadedImages.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs truncate p-1">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || uploadedImages.length === 0}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              
              <Button 
                onClick={processImages} 
                disabled={isProcessing || uploadedImages.length === 0}
                className="min-w-[120px]"
                variant="secondary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Images
                  </>
                )}
              </Button>
              
              <Button 
                onClick={downloadAll} 
                disabled={processedImages.length === 0}
                className="min-w-[120px]"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            </div>
          </div>

          {processedImages.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Processed Images ({processedImages.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {processedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs truncate p-1">
                      {image.name}
                    </div>
                    <a 
                      href={image.url} 
                      download={image.name}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImageSizeIncreaser;
