"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-200">
        <h1 className="text-4xl font-bold text-primary mb-10">
          Something went wrong
        </h1>
        <p className="text-lg text-gray-600 text-primary mb-10">
          Sorry, an unexpected error has occurred. Please try again or return to
          the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => reset?.()}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-200 cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
