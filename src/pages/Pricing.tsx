
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Simple, transparent pricing
            </span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Free Plan */}
          <div className="flex flex-col rounded-2xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Free</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">$0</span>
                <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="mt-5 text-gray-500 dark:text-gray-400">
                Perfect for trying out our services
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 dark:bg-gray-800/50 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">5 images per day</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Flux 1 model access</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Standard resolution</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email support</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Get started
              </Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col rounded-2xl backdrop-blur-lg bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 shadow-xl overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">$15</span>
                <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="mt-5 text-gray-500 dark:text-gray-400">
                For professionals and small teams
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-purple-50 dark:bg-purple-900/20 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">100 images per day</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Access to Flux Pro model</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">High resolution outputs</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Priority email support</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Custom aspect ratios</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Subscribe now
              </Button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col rounded-2xl backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enterprise</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">$49</span>
                <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <p className="mt-5 text-gray-500 dark:text-gray-400">
                For organizations with advanced needs
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 dark:bg-gray-800/50 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Unlimited images</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">All models access</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Maximum resolution</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">24/7 phone & email support</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">API access</p>
                </div>
                <div className="flex items-start">
                  <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">On-premise deployment option</p>
                </div>
              </div>
              <Button variant="outline">
                Contact sales
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
