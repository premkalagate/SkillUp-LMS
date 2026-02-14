import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, MoreHorizontal, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { courseApi } from '@/services/api';

interface Course {
  id: string;
  title: string;
  category: string | null;
  price: number | null;
  is_published: boolean | null;
  created_at: string;
  instructor_id: string;
  thumbnail_url: string | null;
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseApi.getCourses({ sort: '-created_at' });
      setCourses(data?.courses || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching courses',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublishStatus = async (courseId: string, currentStatus: boolean | null) => {
    try {
      const updatedCourse = { is_published: !currentStatus };
      await courseApi.updateCourse(courseId, updatedCourse);

      toast({ 
        title: currentStatus ? 'Course unpublished' : 'Course published' 
      });
      fetchCourses();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating course',
        description: error.message
      });
    }
  };

  const deleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await courseApi.deleteCourse(courseToDelete);

      toast({ title: 'Course deleted successfully' });
      fetchCourses();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting course',
        description: error.message
      });
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'published' && course.is_published) ||
                          (statusFilter === 'draft' && !course.is_published);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Helmet>
        <title>Manage Courses - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout title="Courses" description="Manage all platform courses">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Course</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-400">Price</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                            {course.thumbnail_url ? (
                              <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                            )}
                          </div>
                          <span className="font-medium text-white line-clamp-1">
                            {course.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {course.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        ₹{course.price?.toLocaleString('en-IN') || 0}
                      </TableCell>
                      <TableCell>
                        {course.is_published ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {format(new Date(course.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem 
                              className="text-slate-300 hover:text-white cursor-pointer"
                              onClick={() => window.open(`/course/${course.id}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Course
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-slate-300 hover:text-white cursor-pointer"
                              onClick={() => togglePublishStatus(course.id, course.is_published)}
                            >
                              {course.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem 
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                              onClick={() => {
                                setCourseToDelete(course.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        No courses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Course</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this course? This action cannot be undone and will also remove all associated lessons, enrollments, and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCourse}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCourses;
