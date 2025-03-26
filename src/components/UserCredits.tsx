
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";

const UserCredits = () => {
  const { credits, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-full">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Your Tokens</h3>
          <p className="text-2xl font-bold text-white">{isLoading ? "..." : credits}</p>
          <p className="text-xs text-gray-400 mt-1">Free tokens reset daily at 00:00 (UTC+6 BST)</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>4 tokens = 1 image generation</p>
      </div>
    </Card>
  );
};

export default UserCredits;
