
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ProtectedRoute from "./components/ProtectedRoute";

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
              
              {/* Protected Routes */}
              <Route path="/image-generator" element={
                <ProtectedRoute>
                  <ImageGenerator />
                </ProtectedRoute>
              } />
              <Route path="/metadata-generator" element={
                <ProtectedRoute>
                  <MetadataGenerator />
                </ProtectedRoute>
              } />
              <Route path="/image-to-prompt" element={
                <ProtectedRoute>
                  <ImageToPrompt />
                </ProtectedRoute>
              } />
              <Route path="/image-upscaler" element={
                <ProtectedRoute>
                  <ImageUpscaler />
                </ProtectedRoute>
              } />
              <Route path="/graphic-designer-bot" element={
                <ProtectedRoute>
                  <GraphicDesignerBot />
                </ProtectedRoute>
              } />
              <Route path="/bulk-image-size-increaser" element={
                <ProtectedRoute>
                  <BulkImageSizeIncreaser />
                </ProtectedRoute>
              } />
              
              {/* Redirect generator path to index */}
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
