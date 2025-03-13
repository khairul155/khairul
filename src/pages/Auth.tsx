
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Key, User, Sparkles, Image, Wand2 } from "lucide-react";
import PricingPlans from "@/components/PricingPlans";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-yellow-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 pb-16">
          <div className="relative inline-block animate-float">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-20 animate-pulse"></div>
            <h1 className="text-6xl font-bold relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                AI Image Generator
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into stunning visuals using advanced AI technology. 
            Just describe what you want to see, and watch the magic happen!
          </p>
          <div className="flex justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            <Wand2 className="w-6 h-6 text-purple-500 animate-bounce" />
            <Image className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>

        {/* Auth and Features in Flex Container */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
          {/* Auth Form */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="w-full max-w-md">
              <div className="backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isLogin ? "Welcome back" : "Create an account"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isLogin
                      ? "Sign in to continue to the app"
                      : "Sign up to start generating images"}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isLogin ? (
                      "Sign In"
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="w-full lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "High Quality Images",
                  description: "Generate detailed, stunning images with our cutting-edge AI technology",
                  icon: <Image className="h-6 w-6 text-purple-500" />
                },
                {
                  title: "Instant Generation",
                  description: "Create images in seconds with our fast and responsive AI system",
                  icon: <Wand2 className="h-6 w-6 text-pink-500" />
                },
                {
                  title: "Unlimited Creativity",
                  description: "Turn any text description into beautiful visuals with ease",
                  icon: <Sparkles className="h-6 w-6 text-yellow-500" />
                },
                {
                  title: "Affordable Plans",
                  description: "Choose from our range of plans to suit your needs and budget",
                  icon: <User className="h-6 w-6 text-blue-500" />
                }
              ].map((feature, index) => (
                <div key={index} className="backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <section className="py-16">
          <PricingPlans />
        </section>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8 pb-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by advanced AI technology • Create stunning visuals instantly
          </p>
          <div className="relative inline-block group">
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <h3 className="relative text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-sparkle" />
              Created by Khairul
              <Sparkles className="w-5 h-5 text-yellow-500 animate-sparkle" />
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
