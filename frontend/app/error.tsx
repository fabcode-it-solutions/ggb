"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-6 border-4 border-black">
            <AlertTriangle className="w-20 h-20 text-black" />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-[80px] font-bold text-black leading-none tracking-tight">
            500
          </h1>
          <div className="h-[2px] w-32 bg-black mx-auto mt-4"></div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-semibold text-black mb-4">
          Something Went Wrong
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          An unexpected error occurred while processing your request. Our team
          has been notified and is working to fix the issue.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-8 p-4 border-2 border-[#f2f2f2] bg-gray-50 text-left max-w-2xl mx-auto">
            <p className="text-xs font-mono text-gray-700 break-all">
              <strong>Error:</strong> {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-700 mt-2">
                <strong>Digest:</strong> {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t-2 border-[#f2f2f2]">
          <p className="text-sm text-gray-500 mb-4">
            If this problem persists, please contact support
          </p>
          <div className="text-sm text-gray-400">
            Error ID: {error.digest || "Unknown"}
          </div>
        </div>

        {/* Error Code Footer */}
        <div className="mt-8 text-xs text-gray-400">
          Error Code: 500 - INTERNAL_SERVER_ERROR
        </div>
      </div>
    </div>
  );
}
