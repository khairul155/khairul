
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
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
import UserProfile from "./pages/UserProfile"; // Add this line

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
              <Route path="/auth" element={<Auth />} />
              <Route path="/image-generator" element={<ImageGenerator />} />
              <Route path="/metadata-generator" element={<MetadataGenerator />} />
              <Route path="/image-to-prompt" element={<ImageToPrompt />} />
              <Route path="/image-upscaler" element={<ImageUpscaler />} />
              <Route path="/graphic-designer-bot" element={<GraphicDesignerBot />} />
              <Route path="/bulk-image-size-increaser" element={<BulkImageSizeIncreaser />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<UserProfile />} /> {/* Add this line */}
              <Route path="/generator" element={<Navigate to="/" replace />} />
              {/* Redirect any unknown routes to the 404 component */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
