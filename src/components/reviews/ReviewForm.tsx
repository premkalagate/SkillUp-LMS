import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { reviewApi } from '@/services/api';

interface ReviewFormProps {
  courseId: string;
  onSubmit: () => void;
  onCancel: () => void;
  existingReview?: {
    id: string;
    rating: number;
    review_text: string | null;
  };
}

const ReviewForm = ({ courseId, onSubmit, onCancel, existingReview }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a review.',
        variant: 'destructive'
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      if (existingReview) {
        await reviewApi.updateReview(existingReview.id, {
          rating,
          review_text: reviewText.trim() || null
        });
        
        toast({
          title: 'Review updated',
          description: 'Your review has been updated successfully.'
        });
      } else {
        await reviewApi.createReview({
          course_id: courseId,
          user_id: user.id,
          rating,
          review_text: reviewText.trim() || null
        });
        
        toast({
          title: 'Review submitted',
          description: 'Thank you for your feedback!'
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border border-border rounded-xl bg-card">
      <h3 className="font-semibold mb-4">
        {existingReview ? 'Edit your review' : 'Write a review'}
      </h3>
      
      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-accent text-accent'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm text-muted-foreground mb-2">
          Your review (optional)
        </label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this course..."
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {reviewText.length}/1000
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || rating === 0}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
