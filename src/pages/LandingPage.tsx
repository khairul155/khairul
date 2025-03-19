
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { 
  Wand2, 
  ArrowRight, 
  Sparkles, 
  Image, 
  Zap, 
  Shield, 
  Globe, 
  Trophy, 
  Check, 
  ChevronRight,
  Star,
  DownloadCloud
} from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const featuresRef = useRef<HTMLDivElement>(null);
  
  const handleScrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="container relative mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 text-center lg:text-left mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-6 leading-tight">
              Transform Your Ideas Into Stunning Visual Art
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-lg mx-auto lg:mx-0">
              Harness the power of AI to create beautiful, unique images from simple text descriptions. Perfect for designers, marketers, and creative thinkers.
            </p>
            
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                asChild
              >
                <Link to="/image-generator">
                  Start Creating <Wand2 className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
                onClick={handleScrollToFeatures}
              >
                Explore Features <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 -left-4 -top-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl transform rotate-3 blur-sm opacity-20"></div>
              <div className="absolute inset-0 -right-4 -bottom-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl transform -rotate-3 blur-sm opacity-20"></div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">AI Image Generator</h3>
                  </div>
                  
                  <Input
                    placeholder="Describe your image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                      <Image className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    asChild
                  >
                    <Link to="/image-generator">
                      Generate Image <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Why Choose AIMagine?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our state-of-the-art AI image generator brings your creative vision to life with unparalleled quality and flexibility.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />}
              title="High-Quality Results"
              description="Generate stunning, high-resolution images with amazing detail and clarity. Perfect for professional use."
            />
            <FeatureCard 
              icon={<Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />}
              title="Lightning Fast"
              description="Get your images in seconds, not minutes. Our optimized AI model delivers quick results without sacrificing quality."
            />
            <FeatureCard 
              icon={<Shield className="h-7 w-7 text-green-600 dark:text-green-400" />}
              title="Free to Use"
              description="Start creating beautiful images without any commitment. Upgrade anytime for additional features."
            />
            <FeatureCard 
              icon={<DownloadCloud className="h-7 w-7 text-blue-600 dark:text-blue-400" />}
              title="Easy Downloads"
              description="Download your creations with one click. Use them for personal projects, social media, or commercial work."
            />
            <FeatureCard 
              icon={<Globe className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />}
              title="Wide Range of Styles"
              description="From photorealistic to artistic, abstract to detailed illustrations - create images in any style imaginable."
            />
            <FeatureCard 
              icon={<Trophy className="h-7 w-7 text-pink-600 dark:text-pink-400" />}
              title="Top-Tier AI Models"
              description="Powered by cutting-edge AI technology to ensure your results are always on the leading edge of what's possible."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Creating stunning AI-generated images is as easy as 1-2-3
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Describe Your Vision"
              description="Enter a detailed description of the image you want to create."
            />
            <StepCard 
              number="2"
              title="Customize Settings"
              description="Adjust style, resolution, and other parameters to perfect your result."
            />
            <StepCard 
              number="3"
              title="Generate & Download"
              description="Watch as AI brings your idea to life and download the finished image."
            />
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link to="/image-generator">
                Try It Now <Wand2 className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">What Our Users Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of satisfied creators using our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="This tool has completely transformed my creative process. I can now visualize my ideas in seconds!"
              author="Sarah J."
              role="Graphic Designer"
              rating={5}
            />
            <TestimonialCard 
              quote="I've tried many AI image generators, but this one produces the best quality results by far."
              author="Michael T."
              role="Marketing Director"
              rating={5}
            />
            <TestimonialCard 
              quote="As a content creator, this tool has saved me countless hours searching for the perfect stock images."
              author="Elena K."
              role="Content Creator"
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Ideas Into Images?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Join thousands of creators, designers, and marketers who are already using our platform to bring their visions to life.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
              asChild
            >
              <Link to="/image-generator">
                Start Creating <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            {!user && (
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link to="/auth">
                  Sign Up Free
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Wand2 className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold text-white">AIMagine</span>
              </div>
              <p className="max-w-xs text-gray-400">
                Transform your ideas into stunning visual art with our AI-powered image generator.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Tools</h4>
                <ul className="space-y-2">
                  <li><Link to="/image-generator" className="hover:text-purple-400 transition-colors">Image Generator</Link></li>
                  <li><Link to="/image-to-prompt" className="hover:text-purple-400 transition-colors">Image to Prompt</Link></li>
                  <li><Link to="/image-upscaler" className="hover:text-purple-400 transition-colors">Image Upscaler</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} AIMagine. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="mb-4 p-3 rounded-full w-14 h-14 flex items-center justify-center bg-purple-50 dark:bg-gray-700">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

// Step Card Component
const StepCard = ({ number, title, description }: {
  number: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ quote, author, role, rating }: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="flex text-yellow-400 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" />
        ))}
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6 italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{author}</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">{role}</p>
      </div>
    </div>
  );
};

export default LandingPage;
