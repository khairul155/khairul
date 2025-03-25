
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { CreditsProvider } from "./hooks/use-credits";
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
import Pricing from "./pages/Pricing";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CreditsProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/image-generator" element={<ImageGenerator />} />
                <Route path="/metadata-generator" element={<MetadataGenerator />} />
                <Route path="/image-to-prompt" element={<ImageToPrompt />} />
                <Route path="/image-upscaler" element={<ImageUpscaler />} />
                <Route path="/graphic-designer-bot" element={<GraphicDesignerBot />} />
                <Route path="/bulk-image-size-increaser" element={<BulkImageSizeIncreaser />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/generator" element={<Navigate to="/" replace />} />
                {/* Redirect any unknown routes to the 404 component */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CreditsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
