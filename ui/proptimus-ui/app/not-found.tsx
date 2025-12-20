import Link from "next/link";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-muted-foreground mb-2">404</h1>
          <div className="text-4xl font-bold text-secondary mb-10">
            Page Not Found
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-primary hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
          >
            Go Home
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center w-64 h-64 bg-gray-100 rounded-full mb-6">
            <svg
              className="w-32 h-32 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Sad face icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6M5.05 6.45A9.969 9.969 0 012 12a9.969 9.969 0 013.05 5.55M18.95 6.45A9.969 9.969 0 0122 12a9.969 9.969 0 01-3.05 5.55"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
      </div>
    </div>
  );
}
