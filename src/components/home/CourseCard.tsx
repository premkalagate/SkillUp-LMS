import { Star, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '@/services/api';

interface DatabaseCourse {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  price?: number | null;
  category?: string | null;
  level?: string | null;
  duration_hours?: number | null;
  is_published?: boolean | null;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

interface CourseWithRating extends DatabaseCourse {
  averageRating?: number;
  totalReviews?: number;
}

interface CourseCardProps {
  course: CourseWithRating;
  index?: number;
}

const CourseCard = ({ course, index = 0 }: CourseCardProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-accent/50 text-accent" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-muted-foreground/30" />
        );
      }
    }
    return stars;
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop';
  
  // Use rating from course if available, otherwise fetch it
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ['course-rating', course.id],
    queryFn: () => reviewApi.getAverageRating(course.id),
    enabled: course.averageRating === undefined, // Only fetch if not already provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const actualRating = course.averageRating ?? ratingData?.averageRating ?? 0;
  const totalReviews = course.totalReviews ?? ratingData?.totalReviews ?? 0;

  return (
    <Link 
      to={`/course/${course.id}`}
      className="card-course group block opacity-0 animate-fade-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video">
        <img
          src={course.thumbnail_url || defaultThumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {course.category && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {course.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-lg font-heading font-semibold text-foreground mt-3 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Level */}
        {course.level && (
          <p className="text-sm text-muted-foreground mb-3 capitalize">
            {course.level}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          {course.duration_hours && course.duration_hours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {course.duration_hours}h
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Course
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-foreground">
            {ratingLoading ? '0.0' : actualRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5">
            {renderStars(actualRating)}
          </div>
          {totalReviews > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              ({totalReviews})
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <span className="text-xl font-heading font-bold text-foreground">
            {course.price && course.price > 0 
              ? `₹${course.price.toLocaleString('en-IN')}` 
              : 'Free'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
