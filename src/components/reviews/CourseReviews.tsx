import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { reviewApi, enrollmentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';

interface Review {
  id: string;
  user_id: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

interface CourseReviewsProps {
  courseId: string;
}

const CourseReviews = ({ courseId }: CourseReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkEnrollment();
    }
  }, [courseId, user]);

  const fetchReviews = async () => {
    try {
      const reviewsData = await reviewApi.getCourseReviews(courseId);
      setReviews(reviewsData);
      if (user) {
        const existing = reviewsData.find(r => {
          if (typeof r.user_id === 'string') {
            return r.user_id === user.id;
          } else {
            return r.user_id.id === user.id;
          }
        });
        setUserReview(existing || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoading(false);
  };

  const checkEnrollment = async () => {
    if (!user) return;
    try {
      // Check if user is enrolled in the course
      const enrollments = await enrollmentApi.getUserEnrollments(user.id);
      // Handle both cases: course_id as string or as populated object
      const enrollment = enrollments.find(e => {
        // First, try original_course_id if available (new field from API)
        let courseIdValue: string | null = null;
        if (e.original_course_id && typeof e.original_course_id === 'string') {
          courseIdValue = e.original_course_id;
        } else if (typeof e.course_id === 'string') {
          courseIdValue = e.course_id;
        } else if (e.course_id && typeof e.course_id === 'object') {
          courseIdValue = e.course_id.id || e.course_id._id || e.course_id.course_id || null;
        }
        return courseIdValue === courseId;
      });
      setIsEnrolled(!!enrollment);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    setShowForm(false);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  return (
    <section className="py-12 border-t border-border">
      <div className="container-custom">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Student Reviews
          </h2>

          {/* Rating Summary */}
          <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-secondary/30 rounded-xl">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{averageRating}</div>
              <div className="flex justify-center my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
            </div>
            
            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-12">{star} stars</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Form */}
          {user && isEnrolled && !userReview && (
            <div className="mb-8">
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full p-4 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Write a review for this course
                </button>
              ) : (
                <ReviewForm 
                  courseId={courseId} 
                  onSubmit={handleReviewSubmitted}
                  onCancel={() => setShowForm(false)}
                />
              )}
            </div>
          )}

          {/* User's existing review */}
          {userReview && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Your Review</h3>
              <ReviewCard 
                review={userReview} 
                isOwn={true}
                onUpdate={handleReviewSubmitted}
              />
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
          ) : reviews.filter(r => r.user_id !== user?.id).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {reviews.length === 0 ? 'No reviews yet. Be the first to review!' : 'No other reviews yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews
                .filter(r => {
                  if (typeof r.user_id === 'string') {
                    return r.user_id !== user?.id;
                  } else {
                    return r.user_id.id !== user?.id;
                  }
                })
                .map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseReviews;
