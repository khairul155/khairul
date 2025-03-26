
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import AiToolsSection from "@/components/AiToolsSection";
import { 
  Wand2, 
  ArrowRight, 
  Sparkles, 
  Image, 
  Zap, 
  Shield, 
  Download, 
  Trophy,
  Check, 
  ChevronRight,
  Star,
  Palette,
  MessageSquareText,
  Layers,
  Clock,
  Play,
  Pause
} from "lucide-react";
import TypingEffect from "@/components/TypingEffect";

const LandingPage = () => {
  const { user } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const handleScrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleScrollToTools = () => {
    toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  // Auto-play video when it comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(() => {
              // Autoplay was prevented, show play button
              setIsVideoPlaying(false);
            });
            setIsVideoPlaying(true);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero Section with Gradient Text */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-950 to-gray-950 opacity-80"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="font-bold mb-6 leading-tight">
              <span className="block text-2xl md:text-3xl text-blue-400 mb-4">Free Online</span>
              <span className="block text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500">
                PHOTO EDITOR
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-200 mb-8">
              AI Image Generator and AI Design tools
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              <TypingEffect text="Ultimate Free Photo and AI Design Platform. From photo edits to AI-generated art, design freely on your browser, smartphone, or desktop with no cost—just your imagination caps the possibilities!" />
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                onClick={handleScrollToTools}
              >
                Explore Tools <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-blue-500 text-blue-400 hover:bg-blue-950"
                asChild
              >
                <Link to="/image-generator">
                  AI Image Generator <Wand2 className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <Link 
                to="/image-generator" 
                className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500 transition-all duration-300 p-8 flex flex-col items-center justify-center text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <Wand2 className="h-12 w-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2 text-white">AI Image Generator</h3>
                <p className="text-sm text-gray-300">Create stunning images from text descriptions</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="rounded-full text-xs border-blue-500 text-blue-400">
                    Try Now <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </Link>
              
              <Link 
                to="/image-to-prompt" 
                className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-pink-500 transition-all duration-300 p-8 flex flex-col items-center justify-center text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 to-purple-900/20 opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <MessageSquareText className="h-12 w-12 text-pink-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2 text-white">Image to Prompt</h3>
                <p className="text-sm text-gray-300">Convert images into detailed text prompts</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="rounded-full text-xs border-pink-500 text-pink-400">
                    Try Now <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">See PixcraftAI in Action</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Watch how easy it is to create stunning AI-generated images in seconds
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.4)]">
            <div className="aspect-w-16 aspect-h-9 relative">
              {/* Replace with actual demo video */}
              <video 
                ref={videoRef}
                className="w-full h-full object-cover rounded-2xl" 
                poster="/lovable-uploads/faf754c5-2d2e-42ce-827a-99290914dfdc.png"
                loop
                muted
                playsInline
              >
                <source src="https://mazwai.com/videvo_files/video/free/2014-12/small_watermarked/alena-vidsStock_B1_preview.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
              
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center cursor-pointer"
                onClick={toggleVideoPlay}
              >
                <div className={`${isVideoPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 bg-white/10 backdrop-blur-sm p-6 rounded-full hover:bg-white/20`}>
                  {isVideoPlaying ? (
                    <Pause className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 w-3 h-3 rounded-full animate-pulse"></div>
                <p className="text-white font-medium">Experience the magic of AI-powered design</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <AiToolsSection />

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">Why Choose Our Platform?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our state-of-the-art design and AI tools bring your creative vision to life
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-7 w-7 text-purple-400" />}
              title="High-Quality Results"
              description="Generate stunning, high-resolution images with amazing detail and clarity."
            />
            <FeatureCard 
              icon={<Zap className="h-7 w-7 text-amber-400" />}
              title="Lightning Fast"
              description="Get your images in seconds, not minutes. Our optimized AI models deliver quick results."
            />
            <FeatureCard 
              icon={<Shield className="h-7 w-7 text-green-400" />}
              title="Free to Use"
              description="Start creating beautiful designs without any commitment. Upgrade anytime for additional features."
            />
            <FeatureCard 
              icon={<Download className="h-7 w-7 text-blue-400" />}
              title="Easy Downloads"
              description="Download your creations with one click. Use them for any project or purpose."
            />
            <FeatureCard 
              icon={<Image className="h-7 w-7 text-cyan-400" />}
              title="Wide Range of Styles"
              description="From photorealistic to artistic, create images in any style imaginable."
            />
            <FeatureCard 
              icon={<Clock className="h-7 w-7 text-pink-400" />}
              title="Save Time"
              description="Accomplish in minutes what would take hours with traditional design tools."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Creative Process?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Join thousands of creators, designers, and marketers who are already using our platform to bring their visions to life.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-white text-purple-900 hover:bg-gray-100"
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
                <Wand2 className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">PixcraftAI</span>
              </div>
              <p className="max-w-xs text-gray-400">
                Transform your ideas into stunning visual art with our AI-powered tools.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Tools</h4>
                <ul className="space-y-2">
                  <li><Link to="/image-generator" className="hover:text-blue-400 transition-colors">Image Generator</Link></li>
                  <li><Link to="/image-to-prompt" className="hover:text-blue-400 transition-colors">Image to Prompt</Link></li>
                  <li><Link to="/image-upscaler" className="hover:text-blue-400 transition-colors">Image Upscaler</Link></li>
                  <li><Link to="/metadata-generator" className="hover:text-blue-400 transition-colors">Metadata Generator</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PixcraftAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Tool Card Component
const ToolCard = ({ 
  icon, 
  title, 
  description, 
  link, 
  color,
  isUpcoming = false,
  number
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  link: string;
  color: string;
  isUpcoming?: boolean;
  number: string;
}) => {
  return (
    <div className="relative group">
      {isUpcoming && (
        <div className="absolute -top-2 -right-2 z-10 bg-amber-500 text-xs font-bold text-white rounded-full px-2 py-1">
          UPCOMING
        </div>
      )}
      
      <div className="absolute -left-1 -top-1 bg-white/10 text-xs font-bold text-white rounded-full w-6 h-6 flex items-center justify-center">
        {number}
      </div>
      
      <Link 
        to={link} 
        className={`block h-full bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-all duration-300 border-t-2 border-transparent hover:border-t-2 hover:border-${color.split(' ')[0].substring(5)} overflow-hidden`}
      >
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
        
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </Link>
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
    <div className="bg-gray-900/80 hover:bg-gray-800 rounded-xl p-6 transition-all duration-300 border border-gray-800 hover:border-gray-700">
      <div className="mb-4 p-3 rounded-full w-14 h-14 flex items-center justify-center bg-gray-800">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default LandingPage;
