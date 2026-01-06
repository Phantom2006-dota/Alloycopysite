import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface MediaItem {
  id: number;
  title: string;
  src: string;
  type: "book" | "film" | "tv";
  mediaType: "image" | "video";
}

const VideoSlide = ({ src, title, isActive }: { src: string; title: string; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative h-full w-full group">
      <video
        ref={videoRef}
        src={src}
        title={title}
        className="h-full w-full object-contain"
        draggable="false"
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
        >
          {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
        </button>
      </div>
    </div>
  );
};

// --- RECONSTRUCTED STATIC_ITEMS ARRAY ---
const STATIC_ITEMS: MediaItem[] = [
  // User's 4 New Images (must be first for easy identification)
  { id: 1, title: "User Film 1", src: "/image (1).jpg", type: "film", mediaType: "image" },
  { id: 2, title: "User TV 1", src: "/image (2).jpg", type: "tv", mediaType: "image" },
  { id: 3, title: "User Film 2", src: "/image (3).jpg", type: "film", mediaType: "image" },
  { id: 4, title: "User TV 2", src: "/image (4).jpg", type: "tv", mediaType: "image" },

  // Restored Original Images (from file system, assigned arbitrary types for variety)
  { id: 6, title: "Original TV 1", src: "/MV5BOWY5YTc1NDQtZTBhZS00YmI4LWI0ZmMtOGJiNjdkMjQ1NjA0XkEyXkFqcGc@._V1_.jpg", type: "tv", mediaType: "image" },
  { id: 7, title: "Original Book 1", src: "/IMAG1750_1766638018686.jpg", type: "book", mediaType: "image" },
  { id: 8, title: "Original Book 2", src: "/WhatsApp_Image_2025-12-23_at_10.20.17_AM_(1)_1766638018689.jpeg", type: "book", mediaType: "image" },
  { id: 9, title: "Original Film 2", src: "/IMAG1550_1766638018683.jpg", type: "film", mediaType: "image" },
  { id: 10, title: "Original TV 2", src: "/IMAG1552_1766638018684.jpg", type: "tv", mediaType: "image" },
  { id: 11, title: "Original Book 3", src: "/IMG_20191018_003712_1766638018687.jpg", type: "book", mediaType: "image" },
  { id: 12, title: "Original Film 3", src: "/IMG_20191018_004624_1766638018688.jpg", type: "film", mediaType: "image" },
];
// --- END RECONSTRUCTED STATIC_ITEMS ARRAY ---


const MediaCarousel = ({ type: filterType, forceStatic }: { type?: "book" | "film" | "tv", forceStatic?: boolean }) => {
  // Identify the 4 user images by their unique file name pattern
  const newFilmTvItems = STATIC_ITEMS.filter(item => item.src.includes("image ("));
  
  // FINAL FILTERING LOGIC:
  const items = forceStatic && (filterType === "film" || filterType === "tv")
    ? newFilmTvItems // If forceStatic is true AND it's Film/TV, use ONLY the 4 new images
    : filterType 
      ? STATIC_ITEMS.filter(item => item.type === filterType) // If filterType is set (e.g., 'book'), filter by type
      : STATIC_ITEMS; // If no filterType (Home page), use ALL items

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getVisibleItems = useCallback(() => {
    const total = items.length;
    if (total === 0) return [];
    
    const indices = [];
    for (let i = -2; i <= 2; i++) {
      let index = (currentIndex + i + total) % total;
      indices.push(index);
    }
    return indices;
  }, [currentIndex, items.length]);

  const goToNext = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setDirection("right");
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsTransitioning(false);
    }, 400);
  }, [items.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setDirection("left");
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      setIsTransitioning(false);
    }, 400);
  }, [items.length, isTransitioning]);

  const scrollTo = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex || items.length === 0) return;
    
    setDirection(index > currentIndex ? "right" : "left");
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 400);
  }, [currentIndex, items.length, isTransitioning]);

  const toggleAutoScroll = () => {
    setIsPaused(!isPaused);
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (isPaused || items.length === 0) return;
    
    const interval = setInterval(() => {
      if (direction === "right") {
        goToNext();
      } else {
        goToPrev();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [goToNext, goToPrev, isPaused, direction, items.length]);

  // Touch/swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - go to next
        goToNext();
      } else {
        // Swipe right - go to previous
        goToPrev();
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const visibleIndices = getVisibleItems();

  const getSlideStyle = (position: number) => {
    const isCenter = position === 2;
    
    return {
      opacity: isCenter 
        ? (isTransitioning ? 0 : 1) 
        : (isCenter ? 1 : 0.6),
      transform: isCenter ? "scale(1.1)" : "scale(0.9)",
      transition: isCenter 
        ? "opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)"
        : "none",
    };
  };

  if (items.length === 0) return null;

  return (
    <div 
      className="relative py-8"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={goToPrev}
          className="pointer-events-auto bg-background/80 hover:bg-background p-3 rounded-full shadow-lg transition-all hover:scale-110 ml-2 md:ml-4"
          aria-label="Previous slide"
          disabled={isTransitioning}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        
        <button
          onClick={goToNext}
          className="pointer-events-auto bg-background/80 hover:bg-background p-3 rounded-full shadow-lg transition-all hover:scale-110 mr-2 md:mr-4"
          aria-label="Next slide"
          disabled={isTransitioning}
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>

      {/* Carousel Content */}
      <div className="overflow-hidden px-4 md:px-8">
        <div className="flex justify-center items-center gap-4 md:gap-8">
          {visibleIndices.map((itemIndex, position) => {
            const item = items[itemIndex];
            const isCenter = position === 2;
            
            return (
              <div
                key={`${position}-${itemIndex}`}
                className={`relative flex-shrink-0 cursor-pointer transition-all duration-500 ${
                  position === 0 || position === 4 
                    ? "hidden xl:block w-[12%]" 
                    : position === 1 || position === 3
                    ? "hidden lg:block w-[18%]"
                    : "w-[85%] md:w-[60%] lg:w-[45%] xl:w-[35%]"
                }`}
                style={getSlideStyle(position)}
                onClick={() => {
                  if (!isCenter) {
                    const diff = position - 2;
                    scrollTo((currentIndex + diff + items.length) % items.length);
                  }
                }}
              >
                <div 
                  className={`relative overflow-hidden bg-secondary transition-all duration-300 ${
                    isCenter 
                      ? "shadow-2xl ring-4 ring-primary/10" 
                      : "hover:scale-105 hover:shadow-lg hover:opacity-80"
                  }`}
                >
                  {item.mediaType === "image" ? (
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-auto object-contain max-h-[70vh]"
                      draggable="false"
                    />
                  ) : (
                    <div className="aspect-video">
                      <VideoSlide 
                        src={item.src} 
                        title={item.title} 
                        isActive={isCenter && !isTransitioning} 
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 mt-12">
        {/* Dots Navigation */}
        <div className="flex justify-center gap-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-primary scale-125"
                  : "bg-foreground/30 hover:bg-foreground/50"
              }`}
              data-testid={`carousel-dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>

        {/* Current position indicator */}
        <div className="text-base font-medium text-foreground/60">
          {currentIndex + 1} / {items.length}
        </div>
      </div>
    </div>
  );
};

export default MediaCarousel;
