import { useState } from 'react';
import { Star, Edit2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ReviewForm from './ReviewForm';
import { reviewApi } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface ReviewCardProps {
  review: Review;
  isOwn?: boolean;
  onUpdate?: () => void;
}

const ReviewCard = ({ review, isOwn = false, onUpdate }: ReviewCardProps) => {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await reviewApi.deleteReview(review.id);
      
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.'
      });
      
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <ReviewForm
        courseId=""
        existingReview={{
          id: review.id,
          rating: review.rating,
          review_text: review.review_text
        }}
        onSubmit={() => {
          setEditing(false);
          onUpdate?.();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`p-4 rounded-xl ${isOwn ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/30'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {typeof review.user_id === 'object' && review.user_id.avatar_url ? (
              <img 
                src={review.user_id.avatar_url}
                alt={typeof review.user_id === 'object' ? review.user_id.full_name : 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">
              {isOwn ? 'You' : (typeof review.user_id === 'object' ? review.user_id.full_name : 'Student')}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          
          {isOwn && (
            <div className="flex gap-1 ml-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Review</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete your review? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
      
      {review.review_text && (
        <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
          {review.review_text}
        </p>
      )}
    </div>
  );
};

export default ReviewCard;
