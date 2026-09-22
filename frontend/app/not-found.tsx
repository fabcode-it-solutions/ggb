"use client";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const route = useRouter();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-[120px] font-bold text-black leading-none tracking-tight">
            404
          </h1>
          <div className="h-0.5 w-32 bg-black mx-auto mt-4"></div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-semibold text-black mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Please check the URL or navigate back to the homepage.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => route.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black border-2 border-black hover:bg-black hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t-2 border-[#f2f2f2]">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="text-black hover:underline inline-flex items-center gap-1"
            >
              Dashboard
            </Link>
            <Link
              href="/inventory/snow"
              className="text-black hover:underline inline-flex items-center gap-1"
            >
              Inventory
            </Link>
            <Link
              href="/profile"
              className="text-black hover:underline inline-flex items-center gap-1"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Error Code Footer */}
        <div className="mt-8 text-xs text-gray-400">
          Error Code: 404 - NOT_FOUND
        </div>
      </div>
    </div>
  );
}
