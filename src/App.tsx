
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/ThemeProvider";
import MetadataGenerator from "./pages/MetadataGenerator";
import ImageToPrompt from "./pages/ImageToPrompt";
import ImageUpscaler from "./pages/ImageUpscaler";
import GraphicDesignerBot from "./pages/GraphicDesignerBot";
import BulkImageSizeIncreaser from "./pages/BulkImageSizeIncreaser";
import ImageGenerator from "./pages/ImageGenerator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/generator" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/image-generator" element={<ImageGenerator />} />
              <Route path="/metadata-generator" element={<MetadataGenerator />} />
              <Route path="/image-to-prompt" element={<ImageToPrompt />} />
              <Route path="/image-upscaler" element={<ImageUpscaler />} />
              <Route path="/graphic-designer-bot" element={<GraphicDesignerBot />} />
              <Route path="/bulk-image-size-increaser" element={<BulkImageSizeIncreaser />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
