import { useState, useEffect } from 'react';
import { X, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CurriculumEditor, { Section, Lesson } from './CurriculumEditor';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { courseApi, lessonApi } from '@/services/api';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  level: string | null;
  price: number | null;
  is_published: boolean | null;
}

interface EditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onCourseUpdated?: () => void;
}

const EditCourseDialog = ({ open, onOpenChange, course, onCourseUpdated }: EditCourseDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [curriculumSections, setCurriculumSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: ''
  });

  // Load course data when dialog opens
  useEffect(() => {
    if (open && course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || '',
        price: course.price?.toString() || ''
      });
      setThumbnail(course.thumbnail_url || null);
      loadLessons(course.id);
    }
  }, [open, course]);

  const loadLessons = async (courseId: string) => {
    setIsLoading(true);
    try {
      const lessons = await lessonApi.getCourseLessons(courseId);

      if (lessons && lessons.length > 0) {
        // Group lessons by section (using description field which stores section name)
        const sectionMap = new Map<string, Lesson[]>();
        
        lessons.forEach(lesson => {
          const sectionTitle = lesson.description?.replace('Section: ', '') || 'General';
          if (!sectionMap.has(sectionTitle)) {
            sectionMap.set(sectionTitle, []);
          }
          sectionMap.get(sectionTitle)!.push({
            id: lesson.id,
            title: lesson.title,
            type: 'video',
            duration: lesson.duration_minutes || undefined,
            videoUrl: lesson.video_url || undefined
          });
        });

        const sections: Section[] = Array.from(sectionMap.entries()).map(([title, sectionLessons]) => ({
          id: Math.random().toString(36).substr(2, 9),
          title,
          lessons: sectionLessons,
          isExpanded: true
        }));

        setCurriculumSections(sections);
      } else {
        setCurriculumSections([]);
      }
    } catch (error: any) {
      console.error('Error loading lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course lessons.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLessonsForCourse = async (courseId: string) => {
    // First delete existing lessons
    await lessonApi.deleteLessonsByCourse(courseId);

    // Then insert new lessons
    let orderIndex = 0;
    const lessonsToInsert = [];

    for (const section of curriculumSections) {
      for (const lesson of section.lessons) {
        lessonsToInsert.push({
          course_id: courseId,
          title: lesson.title,
          description: `Section: ${section.title}`,
          video_url: lesson.videoUrl || null,
          duration_minutes: lesson.duration || null,
          order_index: orderIndex++
        });
      }
    }

    for (const lesson of lessonsToInsert) {
      await lessonApi.createLesson(lesson);
    }
  };

  const handleSave = async () => {
    if (!user || !course) {
      toast({
        title: 'Error',
        description: 'Unable to save course.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title) {
      toast({
        title: 'Title required',
        description: 'Please enter a course title.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await courseApi.updateCourse(course.id, {
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        level: formData.level || 'beginner',
        price: formData.price ? parseFloat(formData.price) : 0,
        thumbnail_url: thumbnail,
        updated_at: new Date().toISOString()
      });

      // Save lessons
      await saveLessonsForCourse(course.id);

      toast({
        title: 'Course updated',
        description: 'Your course has been updated successfully.'
      });
      onOpenChange(false);
      onCourseUpdated?.();
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !course) return;

    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in title, category, and price before publishing.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await courseApi.updateCourse(course.id, {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        level: formData.level || 'beginner',
        price: parseFloat(formData.price),
        thumbnail_url: thumbnail,
        is_published: true,
        updated_at: new Date().toISOString()
      });

      // Save lessons
      await saveLessonsForCourse(course.id);

      toast({
        title: 'Course published',
        description: 'Your course is now live and visible to students.'
      });
      onOpenChange(false);
      onCourseUpdated?.();
    } catch (error: any) {
      console.error('Error publishing course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish course.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Edit Course</DialogTitle>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Settings</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <TabsContent value="basic" className="mt-0 space-y-6">
                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <Label>Course Thumbnail</Label>
                    <div className="flex items-start gap-6">
                      <div className="relative w-64 h-36 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border">
                        {thumbnail ? (
                          <>
                            <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setThumbnail(null)}
                              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/80 transition-colors">
                            <Image className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                            />
                          </label>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Upload a compelling thumbnail for your course</p>
                        <p>Recommended: 1280x720px (16:9 ratio)</p>
                        <p>Max file size: 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete React Developer Course 2024"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in this course..."
                      className="min-h-32 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Category & Level */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Web Development">Web Development</SelectItem>
                          <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                          <SelectItem value="Data Science">Data Science</SelectItem>
                          <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                          <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                          <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                          <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                          <SelectItem value="Blockchain">Blockchain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Level *</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({ ...formData, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="all">All Levels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="curriculum" className="mt-0">
                  <CurriculumEditor 
                    sections={curriculumSections}
                    onChange={setCurriculumSections}
                  />
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 space-y-6">
                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Course Price (₹) *</Label>
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="999"
                        className="pl-7"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set your course price. You can offer discounts later.
                    </p>
                  </div>

                  {/* Course Status */}
                  <div className="space-y-2">
                    <Label>Course Status</Label>
                    <p className={`text-sm font-medium ${course?.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                      {course?.is_published ? 'Published' : 'Draft / Pending Review'}
                    </p>
                    {!course?.is_published && (
                      <p className="text-sm text-muted-foreground">
                        Click "Publish Course" to make it visible to students.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
                {!course?.is_published && (
                  <Button variant="hero" onClick={handlePublish} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Publish Course
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseDialog;
