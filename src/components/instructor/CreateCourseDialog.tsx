import { useState } from 'react';
import { X, Upload, Image, Loader2 } from 'lucide-react';
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

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated?: () => void;
}

const CreateCourseDialog = ({ open, onOpenChange, onCourseCreated }: CreateCourseDialogProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [curriculumSections, setCurriculumSections] = useState<Section[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: '',
    language: 'English',
    price: ''
  });

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Thumbnail image must be less than 5MB. Please compress the image and try again.',
          variant: 'destructive'
        });
        e.target.value = ''; // Reset input
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPG, PNG, etc.)',
          variant: 'destructive'
        });
        e.target.value = ''; // Reset input
        return;
      }

      // Compress and resize image before converting to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.onload = () => {
          // Create canvas to resize/compress image
          const canvas = document.createElement('canvas');
          const maxWidth = 1280;
          const maxHeight = 720;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to base64 with compression (0.85 quality for good balance)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setThumbnail(compressedDataUrl);
          } else {
            // Fallback to original if canvas not available
            setThumbnail(reader.result as string);
          }
        };
        img.onerror = () => {
          toast({
            title: 'Error processing image',
            description: 'Failed to process the image. Please try a different image.',
            variant: 'destructive'
          });
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        toast({
          title: 'Error reading file',
          description: 'Failed to read the image file. Please try again.',
          variant: 'destructive'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      category: '',
      level: '',
      language: 'English',
      price: ''
    });
    setThumbnail(null);
    setCurriculumSections([]);
    setActiveTab('basic');
  };

  const saveLessonsForCourse = async (courseId: string) => {
    // Flatten all lessons from all sections with proper order
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

    if (lessonsToInsert.length > 0) {
      for (const lesson of lessonsToInsert) {
        await lessonApi.createLesson(lesson);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please login to create a course.',
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
      const courseData = await courseApi.createCourse({
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        level: formData.level || 'beginner',
        price: formData.price ? parseFloat(formData.price) : 0,
        thumbnail_url: thumbnail,
        instructor_id: user.id,
        is_published: false
      });

      // Save lessons if any exist
      if (courseData && curriculumSections.length > 0) {
        await saveLessonsForCourse(courseData.id);
      }

      toast({
        title: 'Draft saved',
        description: 'Your course has been saved as a draft.'
      });
      resetForm();
      onOpenChange(false);
      onCourseCreated?.();
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please login to create a course.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.price) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in title, category, and price before submitting.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Creating course with user ID:', user.id);
    setIsSubmitting(true);
    try {
      // Parse price, default to 0 if invalid
      const price = formData.price ? parseFloat(formData.price) : 0;
      const finalPrice = isNaN(price) ? 0 : price;
      
      const courseData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        level: formData.level || 'beginner',
        price: finalPrice,
        thumbnail_url: thumbnail || null,
        instructor_id: user.id,
        is_published: false
      };
      
      console.log('Course data being sent:', courseData);
      
      const response = await courseApi.createCourse(courseData);
      console.log('Course creation response:', response);

      // Save lessons if any exist
      if (response && curriculumSections.length > 0) {
        await saveLessonsForCourse(response.id);
      }

      toast({
        title: 'Course submitted for review',
        description: 'Your course will be reviewed and published by an admin.'
      });
      resetForm();
      onOpenChange(false);
      onCourseCreated?.();
    } catch (error: any) {
      console.error('Error submitting course:', error);
      
      // Extract error message
      let errorMessage = 'Failed to submit course.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Log full error for debugging
      console.error('Full error object:', error);
      
      toast({
        title: 'Error submitting course',
        description: errorMessage,
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
            <DialogTitle className="text-2xl font-bold">Create New Course</DialogTitle>
          </div>
        </DialogHeader>

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

              {/* Subtitle */}
              <div className="space-y-2">
                <Label htmlFor="subtitle">Course Subtitle</Label>
                <Input
                  id="subtitle"
                  placeholder="e.g., Master React, Redux, Hooks, and more"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
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

              {/* Language */}
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                  </SelectContent>
                </Select>
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

              {/* Promotional Video */}
              <div className="space-y-2">
                <Label>Promotional Video (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a promotional video for your course landing page
                  </p>
                  <Button variant="outline">Upload Video</Button>
                </div>
              </div>

              {/* Welcome & Congratulations Message */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    placeholder="Message shown to students when they enroll..."
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Congratulations Message</Label>
                  <Textarea
                    placeholder="Message shown when students complete the course..."
                    className="resize-none"
                  />
                </div>
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
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save as Draft
            </Button>
            <Button variant="hero" onClick={handleSubmitForReview} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit for Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCourseDialog;