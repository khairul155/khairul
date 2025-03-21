
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-5xl font-bold mb-6 text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Path: {location.pathname}
        </p>
        <Link to="/">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
