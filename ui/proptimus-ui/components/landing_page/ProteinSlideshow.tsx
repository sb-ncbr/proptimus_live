"use client";

import { useState, useEffect } from "react";
import ProteinLink from "./ProteinLink";

interface ProteinSlide {
  id: number;
  name: string;
  uniprotId: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

export default function ProteinSlideshow(): React.JSX.Element {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: ProteinSlide[] = [
    {
      id: 1,
      name: "AlphaFold Prediction",
      uniprotId: "Q813H7",
      description:
        "May protect the malaria parasite against attack by the immune system. High-confidence AlphaFold prediction with mean pLDDT 85.57.",
      imageUrl: "/assets/img/protein-1.jpg",
      imageAlt: "3D structure of Q813H7 protein prediction",
    },
    {
      id: 2,
      name: "Hemoglobin Alpha Chain",
      uniprotId: "P69905",
      description:
        "Essential oxygen-carrying protein found in red blood cells. Critical for oxygen transport throughout the human body.",
      imageUrl: "/assets/img/protein-2.jpg",
      imageAlt: "3D structure of Hemoglobin Alpha Chain",
    },
    {
      id: 3,
      name: "Human Insulin",
      uniprotId: "P01308",
      description:
        "Vital hormone that regulates blood glucose levels. Produced by pancreatic beta cells for glucose metabolism control.",
      imageUrl: "/assets/img/protein-3.jpg",
      imageAlt: "3D structure of Human Insulin",
    },
    {
      id: 4,
      name: "Lysozyme",
      uniprotId: "P61626",
      description:
        "Antimicrobial enzyme that breaks down bacterial cell walls. Naturally found in tears, saliva, and mucus for immune protection.",
      imageUrl: "/assets/img/protein-4.jpg",
      imageAlt: "3D structure of Lysozyme",
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number): void => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = (): void => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = (): void => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentSlideData = slides[currentSlide] || slides[0];

  if (!currentSlideData) {
    return <div />;
  }

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-gray-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Placeholder for protein image - replace with actual images */}
            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white/20">
                <div className="text-6xl font-bold mb-4">3D Protein</div>
                <div className="text-2xl">{slide.uniprotId}</div>
              </div>
            </div>
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 group cursor-pointer"
        aria-label="Previous slide"
      >
        <svg
          className="w-8 h-8 transform group-hover:scale-110 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>Previous slide</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 p-4 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 group cursor-pointer"
        aria-label="Next slide"
      >
        <svg
          className="w-8 h-8 transform group-hover:scale-110 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>Next slide</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center text-white max-w-4xl mx-auto px-6">
          <div className="space-y-6 transform transition-all duration-1000 ease-out">
            {/* UniProt ID Badge */}
            <div className="inline-block">
              <span className="bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-lg font-mono">
                UniProt: {currentSlideData.uniprotId}
              </span>
            </div>

            {/* Protein Name */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 drop-shadow-2xl">
              <ProteinLink
                href={`/protein/${currentSlideData.uniprotId}`}
                className="hover:text-primary-300 transition-colors duration-300"
              >
                {currentSlideData.name}
              </ProteinLink>
            </h1>

            {/* Description */}
            <p className="text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              {currentSlideData.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <ProteinLink
                href={`/protein/${currentSlideData.uniprotId}`}
                className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Explore Structure
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>External link</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </ProteinLink>
              <a
                href={`https://www.uniprot.org/uniprot/${currentSlideData.uniprotId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold text-lg backdrop-blur-sm"
              >
                UniProt Entry
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>External link</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id || `slide-${index}`}
              type="button"
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Autoplay Indicator */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 cursor-pointer ${
            isAutoPlaying
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Pause</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Play</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
