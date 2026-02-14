import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CourseCard from './CourseCard';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedCoursesSection = () => {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      return await courseApi.getFeaturedCourses();
    }
  });

  // Extract courses array from response object
  // Handle both object response { courses: [...] } and direct array response
  const courses = Array.isArray(response) 
    ? response 
    : (response?.courses || []);

  if (isLoading) {
    return (
      <section className="py-20 md:py-28">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Learn from the best
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our top-rated courses across various categories.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Handle errors gracefully
  if (error) {
    console.error('Error loading featured courses:', error);
    return null; // Don't show error to user, just don't render the section
  }

  // Ensure courses is an array before using .map()
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-28">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Learn from the best
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="hero-outline" size="lg" asChild>
            <Link to="/courses" className="group">
              Show all courses
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoursesSection;
