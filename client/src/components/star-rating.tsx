import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0-5 scale
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ rating, size = "sm" }: StarRatingProps) {
  // Map size to pixel value
  const sizeMap = {
    sm: 4,
    md: 5,
    lg: 6,
  };
  
  const pixelSize = sizeMap[size];
  
  // Convert rating to array of 5 boolean values (true for filled star)
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));
  
  // Determine if there should be a half star
  const hasHalfStar = rating % 1 >= 0.5;
  if (hasHalfStar) {
    stars[Math.floor(rating)] = true;
  }

  return (
    <div className="flex items-center">
      {stars.map((isFilled, index) => (
        <Star
          key={index}
          className={`w-${pixelSize} h-${pixelSize} ${
            isFilled ? "text-yellow-400" : "text-gray-300"
          }`}
          fill={isFilled ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}
