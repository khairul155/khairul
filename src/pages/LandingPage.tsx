
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Sparkles } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "AI Image Generation",
      description: "Generate high-quality images from text prompts using advanced AI.",
      icon: "ImageIcon",
    },
    {
      title: "Metadata Generation",
      description: "Automatically generate metadata for your images to improve SEO.",
      icon: "KeyIcon",
    },
    {
      title: "Graphic Designer Bot",
      description: "Get AI-powered graphic design assistance for your projects.",
      icon: "Wand2",
    },
    {
      title: "Image to Prompt",
      description: "Convert images into detailed text prompts for further AI generation.",
      icon: "ImageIcon",
    },
    {
      title: "Image Upscaler",
      description: "Enhance the resolution and quality of your images with AI upscaling.",
      icon: "ImageIcon",
    },
    {
      title: "Bulk Image Size Increaser",
      description: "Increase the size of multiple images at once with AI.",
      icon: "ImageIcon",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F0F0] to-[#FFFFFF] dark:from-[#121212] dark:to-[#242424] text-black dark:text-white">
      {/* Header */}
      <header className="py-6 px-8">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-[#FFA725]">
            PixcraftAI
          </Link>
          <nav>
            <ul className="flex items-center space-x-6">
              <li>
                <a href="#features" className="hover:text-[#FFA725] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#FFA725] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#FFA725] transition-colors">
                  Contact
                </a>
              </li>
              {user ? (
                <li>
                  <Button asChild className="bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                    <Link to="/home">Dashboard</Link>
                  </Button>
                </li>
              ) : (
                <>
                  <li>
                    <Button asChild variant="ghost" className="hover:text-[#FFA725] transition-colors">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </li>
                  <li>
                    <Button asChild className="bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                      <Link to="/auth">Get Started</Link>
                    </Button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-20 px-6">
        <div className="lg:w-1/2 space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5353] to-[#FFA725]">
              Transform Ideas
            </span>
            <br /> Into Amazing Images
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl">
            PixcraftAI turns your text descriptions into stunning, realistic images in seconds using our advanced AI technology.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              asChild
              size="lg" 
              className="bg-[#FFA725] hover:bg-[#FF9500] text-white rounded-full px-8 py-3 text-lg"
            >
              {user ? (
                <Link to="/home">Go to Dashboard</Link>
              ) : (
                <Link to="/auth">Get Started</Link>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              asChild
              className="rounded-full px-8 py-3 text-lg border-gray-300 dark:border-gray-700"
            >
              <a href="#features">Learn More</a>
            </Button>
            
            {!user && (
              <Button 
                variant="ghost" 
                size="lg" 
                asChild
                className="rounded-full px-8 py-3 text-lg hover:text-[#FFA725]"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1682685797527-99189425bb5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="AI Image"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-black/10 backdrop-blur-md"></div>
            <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-md">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                <Sparkles className="inline-block w-4 h-4 mr-1 text-yellow-500 animate-pulse" />
                AI Generated Image
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <section id="features" className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            <TypeAnimation
              sequence={['Key Features', 1000, 'Explore Our Tools', 1000]}
              wrapper="span"
              repeat={Infinity}
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5353] to-[#FFA725]"
            />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-16 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Pricing</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start creating amazing images today!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Example pricing cards */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4">Basic</h3>
              <p className="text-4xl font-bold mb-4">$9/month</p>
              <p className="text-gray-600 dark:text-gray-300">
                Limited image generations, standard support.
              </p>
              <Button className="mt-6 bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                Get Started
              </Button>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4">Pro</h3>
              <p className="text-4xl font-bold mb-4">$29/month</p>
              <p className="text-gray-600 dark:text-gray-300">
                Unlimited image generations, priority support.
              </p>
              <Button className="mt-6 bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                Get Started
              </Button>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold mb-4">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">Contact Us</p>
              <p className="text-gray-600 dark:text-gray-300">
                Custom solutions for large-scale needs.
              </p>
              <Button className="mt-6 bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Contact Us</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Have questions? Reach out to us and we'll get back to you as soon as possible.
          </p>
          <div className="mt-12">
            {/* Example contact form */}
            <form className="max-w-md mx-auto">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-full border-gray-300 dark:border-gray-700 focus:ring-[#FFA725] focus:border-[#FFA725] text-black dark:text-white"
                />
              </div>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-full border-gray-300 dark:border-gray-700 focus:ring-[#FFA725] focus:border-[#FFA725] text-black dark:text-white"
                />
              </div>
              <div className="mb-4">
                <textarea
                  placeholder="Your Message"
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl border-gray-300 dark:border-gray-700 focus:ring-[#FFA725] focus:border-[#FFA725] text-black dark:text-white"
                  rows={4}
                ></textarea>
              </div>
              <Button className="w-full bg-[#2776FF] hover:bg-[#1665F2] text-white rounded-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-300">
            &copy; {new Date().getFullYear()} PixcraftAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
