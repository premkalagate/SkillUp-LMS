import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Menu, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoPlayer from '@/components/player/VideoPlayer';
import LessonSidebar from '@/components/player/LessonSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { courses as staticCourses } from '@/data/courses';
import { courseApi, enrollmentApi, lessonApi, lessonProgressApi, certificateApi } from '@/services/api';
import PageTransition from '@/components/PageTransition';

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

interface Section {
  title: string;
  lessons: Lesson[];
}

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);

  // Get static course data as fallback
  const staticCourse = staticCourses.find(c => c.id === courseId);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseData();
    }
  }, [user, courseId]);

  // Update sections when they change to ensure proper lesson structure
  useEffect(() => {
    console.log('Sections updated:', sections);
  }, [sections]);

  const fetchCourseData = async () => {
    if (!user || !courseId) return;

    try {
      console.log('Fetching course data for course ID:', courseId);
      
      // Check enrollment
      const userEnrollments = await enrollmentApi.getUserEnrollments(user.id);
      console.log('User enrollments:', userEnrollments);
      
      // Handle both cases: course_id as string or as populated object
      const enrollment = userEnrollments.find(e => {
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

      console.log('Found enrollment:', enrollment);

      if (!enrollment) {
        toast({
          title: 'Not enrolled',
          description: 'Please enroll in this course first.',
          variant: 'destructive'
        });
        navigate(`/course/${courseId}`);
        return;
      }

      // Fetch course details
      const course = await courseApi.getCourse(courseId);
      console.log('Course details:', course);
      setCourseTitle(course?.title || staticCourse?.title || 'Course');

      // Fetch lessons
      const lessons = await lessonApi.getCourseLessons(courseId);
      console.log('Fetched lessons:', lessons);

      // Fetch lesson progress for the user
      let userProgress = [];
      if (user) {
        try {
          userProgress = await lessonProgressApi.getLessonProgress(user.id, courseId);
          console.log('User progress:', userProgress);
        } catch (error) {
          console.error('Error fetching lesson progress:', error);
        }
      }
      
      // Process lessons with progress
      const processedLessons: Lesson[] = lessons.map(lesson => {
        // Handle case where lesson_id might be a string or object
        const progress = userProgress.find(p => {
          if (typeof p.lesson_id === 'string') {
            return p.lesson_id === lesson.id;
          } else {
            return p.lesson_id?.id === lesson.id;
          }
        });
        
        console.log(`Lesson ${lesson.id} progress:`, progress);
        
        return {
          ...lesson,
          completed: progress ? progress.completed : false
        };
      });

      console.log('Processed lessons:', processedLessons);

      // Group lessons into sections (for now, single section)
      if (processedLessons.length > 0) {
        const sectionsData: Section[] = [{
          title: 'Course Content',
          lessons: processedLessons
        }];
        setSections(sectionsData);
        setCurrentLesson(processedLessons[0]);
        console.log('Set current lesson to:', processedLessons[0]);
      } else {
        setSections([]);
        setCurrentLesson(null);
        console.log('No lessons found, setting current lesson to null');
      }

      // Check if the enrollment is marked as completed in the database first
      const currentEnrollment = userEnrollments.find(e => {
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
      
      console.log('Current enrollment:', currentEnrollment);
      
      // If enrollment is already marked as completed, set progress to 100%
      if (currentEnrollment && currentEnrollment.completed_at) {
        console.log('Enrollment marked as completed, setting progress to 100%');
        setOverallProgress(100);
      } else {
        // Calculate overall progress based on lesson completion
        const totalLessons = processedLessons.length;
        const completedLessons = processedLessons.filter(l => l.completed).length;
        const calculatedProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        console.log(`Progress calculation - Total: ${totalLessons}, Completed: ${completedLessons}, Calculated: ${calculatedProgress}%`);
        
        setOverallProgress(calculatedProgress);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    const lesson = sections.flatMap(s => s.lessons).find(l => l.id === lessonId);
    if (lesson) {
      setCurrentLesson(lesson);
    }
  };

  const handleProgressUpdate = async (seconds: number) => {
    if (!user || !courseId || !currentLesson || currentLesson.id.startsWith('demo-')) return;

    try {
      // Update progress in the database
      await lessonProgressApi.updateLessonProgress({
        user_id: user.id,
        course_id: courseId,
        lesson_id: currentLesson.id,
        progress_seconds: seconds,
        completed: false // Don't mark as completed here, only when threshold reached
      });
    } catch (error) {
      // Silent fail for progress updates
    }
  };

  const handleLessonComplete = async () => {
    if (!user || !courseId || !currentLesson) return;

    console.log('Handling lesson completion for:', currentLesson.id);
    
    // Update database if not demo
    if (!currentLesson.id.startsWith('demo-')) {
      try {
        // Update progress in the database
        await lessonProgressApi.updateLessonProgress({
          user_id: user.id,
          course_id: courseId,
          lesson_id: currentLesson.id,
          completed: true
        });
        
        // Refresh course data to ensure progress is properly updated
        await fetchCourseData();
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    } else {
      // For demo lessons, just update local state
      setSections(prev => prev.map(section => ({
        ...section,
        lessons: section.lessons.map(lesson => 
          lesson.id === currentLesson.id 
            ? { ...lesson, completed: true }
            : lesson
        )
      })));
    }

    toast({
      title: 'Lesson completed!',
      description: 'Great job! Keep up the good work.'
    });
    
    // Check if course is completely finished
    if (overallProgress === 100) {
      console.log('Course completed - marking enrollment as completed');
      try {
        // Mark enrollment as completed
        const userEnrollments = await enrollmentApi.getUserEnrollments(user.id);
        const enrollment = userEnrollments.find(e => {
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

        if (enrollment) {
          // Mark enrollment as completed
          await enrollmentApi.completeEnrollment(enrollment.id);
          
          // Check if certificate already exists
          const existingCerts = await certificateApi.getUserCertificates(user.id);
          const certExists = existingCerts.some(cert => {
            // Handle both string and object formats for course_id
            if (typeof cert.course_id === 'string') {
              return cert.course_id === courseId;
            } else {
              return cert.course_id?.id === courseId;
            }
          });
          
          if (!certExists) {
            // Create certificate
            await certificateApi.createCertificate({
              user_id: user.id,
              course_id: courseId
            });
            
            toast({
              title: 'Certificate Generated!',
              description: 'Congratulations! Your certificate has been generated and is ready to download.',
            });
          }
        }
      } catch (error) {
        console.error('Error completing course or creating certificate:', error);
      }
    }

    // Auto-advance to next lesson
    const allLessonsFlat = sections.flatMap(s => s.lessons);
    const currentIndex = allLessonsFlat.findIndex(l => l.id === currentLesson.id);
    console.log(`Current index: ${currentIndex}, Total lessons: ${allLessonsFlat.length}`);
    
    if (currentIndex < allLessonsFlat.length - 1) {
      console.log('Moving to next lesson');
      setTimeout(() => {
        setCurrentLesson(allLessonsFlat[currentIndex + 1]);
      }, 1500);
    } else {
      console.log('Reached last lesson');
      // Refetch course data to ensure progress is properly updated
      fetchCourseData();
    }
  };

  if (loading) {
    return (
      <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Helmet>
        <title>{currentLesson?.title || 'Course Player'} | SkillUp</title>
        <meta name="description" content={`Watch ${currentLesson?.title} - ${courseTitle}`} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/my-learning')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-medium text-foreground line-clamp-1">{courseTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/course/${courseId}`}>
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Course Details
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Area */}
          <div className={`flex-1 flex flex-col overflow-y-auto ${sidebarOpen ? 'lg:mr-80' : ''}`}>
            <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
              {sections.length === 0 ? (
                // No lessons empty state
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-heading font-semibold mb-2">No lessons available yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    The instructor hasn't added any lessons to this course yet. Check back later!
                  </p>
                  <Link to={`/course/${courseId}`}>
                    <Button variant="outline">
                      Back to Course Details
                    </Button>
                  </Link>
                </div>
              ) : currentLesson ? (
                // Show current lesson
                <>
                  {/* Video Player */}
                  <VideoPlayer
                    videoUrl={currentLesson?.video_url}
                    title={currentLesson?.title || ''}
                    onProgressUpdate={handleProgressUpdate}
                    onComplete={handleLessonComplete}
                  />

                  {/* Lesson Info */}
                  <div className="mt-6">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                      {currentLesson?.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {currentLesson?.description || 'Learn the key concepts covered in this lesson and apply them to real-world projects.'}
                    </p>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const allLessons = sections.flatMap(s => s.lessons);
                          const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
                          if (currentIndex > 0) {
                            setCurrentLesson(allLessons[currentIndex - 1]);
                          }
                        }}
                        disabled={sections.flatMap(s => s.lessons).findIndex(l => l.id === currentLesson?.id) === 0}
                      >
                        Previous Lesson
                      </Button>
                      
                      <Button
                        variant="hero"
                        onClick={() => {
                          const allLessons = sections.flatMap(s => s.lessons);
                          const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
                          if (currentIndex < allLessons.length - 1) {
                            setCurrentLesson(allLessons[currentIndex + 1]);
                          }
                        }}
                        disabled={sections.flatMap(s => s.lessons).findIndex(l => l.id === currentLesson?.id) === sections.flatMap(s => s.lessons).length - 1}
                      >
                        Next Lesson
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // No current lesson but sections exist - show first lesson
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-heading font-semibold mb-2">Select a lesson to start</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    All lessons have been completed. You can review them using the sidebar.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Set the first lesson as current if available
                      const firstLesson = sections.flatMap(s => s.lessons)[0];
                      if (firstLesson) {
                        setCurrentLesson(firstLesson);
                      }
                    }}
                  >
                    View First Lesson
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - only show when lessons exist */}
          {sections.length > 0 && (
            <aside className={`
              fixed lg:relative top-14 right-0 bottom-0 w-80 
              transform transition-transform duration-300 z-40
              ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:hidden'}
            `}>
              <LessonSidebar
                sections={sections}
                currentLessonId={currentLesson?.id || ''}
                onLessonSelect={handleLessonSelect}
                courseTitle={courseTitle}
                overallProgress={overallProgress}
              />
            </aside>
          )}

          {/* Mobile sidebar overlay */}
          {sidebarOpen && sections.length > 0 && (
            <div 
              className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default CoursePlayer;