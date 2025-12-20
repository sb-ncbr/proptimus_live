"use client";

export default function FooterLinks(): React.JSX.Element {
  const handleResetTutorial = () => {
    // Reset tutorial logic here
    if (typeof window !== "undefined") {
      localStorage.removeItem("tutorial-completed");
      // You can add additional tutorial reset logic here
    }
  };

  return (
    <div className="flex items-center justify-center md:justify-end space-x-4 text-xs">
      <a
        href="/about"
        className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        About
      </a>
      <span className="text-gray-600">•</span>
      <a
        href="/manual"
        className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        Manual
      </a>
      <span className="text-gray-600">•</span>
      <a
        href="/cookies"
        className="text-gray-400 hover:text-gray-300 transition-colors duration-200"
      >
        Cookies
      </a>
      <span className="text-gray-600">•</span>
      <button
        type="button"
        onClick={handleResetTutorial}
        className="text-gray-400 hover:text-gray-300 transition-colors duration-200 underline-offset-2 hover:underline"
      >
        Reset Tutorial
      </button>
    </div>
  );
}
