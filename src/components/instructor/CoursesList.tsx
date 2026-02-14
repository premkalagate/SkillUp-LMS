import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Edit, Trash2, Eye, Users, IndianRupee, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { courseApi, enrollmentApi, lessonApi } from '@/services/api';
import EditCourseDialog from './EditCourseDialog';

interface InstructorCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  price: number;
  category: string | null;
  level: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusBadge = (isPublished: boolean) => {
  if (isPublished) {
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Published</Badge>;
  }
  return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Review</Badge>;
};

interface CoursesListProps {
  refreshTrigger?: number;
}

const CoursesList = ({ refreshTrigger }: CoursesListProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [editCourse, setEditCourse] = useState<InstructorCourse | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmCourse, setDeleteConfirmCourse] = useState<InstructorCourse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user, refreshTrigger]);

  const fetchCourses = async () => {
    if (!user) return;
    
    console.log('Fetching courses for instructor:', user.id);
    setIsLoading(true);
    try {
      // Fetch courses for the instructor
      const params = { instructor_id: user.id };
      console.log('API params:', params);
      const data = await courseApi.getCourses(params);
      console.log('API response:', data);
      const courses = data?.courses || [];
      console.log('Courses found:', courses);
      setCourses(courses);

      // Fetch enrollment counts for each course
      if (courses && courses.length > 0) {
        const counts: Record<string, number> = {};
        for (const course of courses) {
          try {
            const count = await enrollmentApi.getCourseEnrollmentCount(course.id);
            counts[course.id] = count || 0;
          } catch (err) {
            counts[course.id] = 0; // Set to 0 if there's an error fetching count
          }
        }
        setEnrollmentCounts(counts);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourse = (course: InstructorCourse) => {
    setEditCourse(course);
    setIsEditDialogOpen(true);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleDeleteCourse = async () => {
    if (!deleteConfirmCourse) return;
    
    setIsDeleting(true);
    try {
      // First delete related lessons
      await lessonApi.deleteLessonsByCourse(deleteConfirmCourse.id);

      // Then delete the course
      await courseApi.deleteCourse(deleteConfirmCourse.id);

      setCourses(courses.filter(c => c.id !== deleteConfirmCourse.id));
      toast({
        title: 'Course deleted',
        description: 'The course has been deleted successfully.'
      });
      setDeleteConfirmCourse(null);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
        <p className="text-muted-foreground">You haven't created any courses yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Click "Create Course" to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Thumbnail */}
                <div className="md:w-64 h-40 md:h-auto flex-shrink-0 bg-muted">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No thumbnail
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(course.is_published)}
                        <span className="text-sm text-muted-foreground">
                          Updated {formatDate(course.updated_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{enrollmentCounts[course.id] || 0} students</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4" />
                          <span>₹{(course.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {course.category && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">{course.category}</span>
                        )}
                        {course.level && (
                          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{course.level}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleViewCourse(course.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Course
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => setDeleteConfirmCourse(course)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      <EditCourseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        course={editCourse}
        onCourseUpdated={fetchCourses}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmCourse} onOpenChange={(open) => !open && setDeleteConfirmCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmCourse?.title}"? This action cannot be undone and will remove all lessons and enrollments associated with this course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoursesList;