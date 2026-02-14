import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Trophy, Play, ChevronRight, GraduationCap, Award, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Certificate from '@/components/certificate/Certificate';
import PaymentHistory from '@/components/dashboard/PaymentHistory';
import { courseApi, enrollmentApi, certificateApi, lessonProgressApi } from '@/services/api';
import PageTransition from '@/components/PageTransition';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  level: string | null;
  duration_hours: number;
  enrolled_at: string;
  totalLessons: number;
  completedLessons: number;
  isCompleted: boolean;
}

interface CertificateData {
  id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
  courseName: string;
  instructorName?: string;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    hoursLearned: 0,
    lessonsCompleted: 0
  });

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
      fetchCertificates();
    }
  }, [user]);
  
  // Also fetch on component mount
  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
      fetchCertificates();
    }
  }, []);

  const fetchCertificates = async () => {
    if (!user) return;
      
    try {
      const certs = await certificateApi.getUserCertificates(user.id);
        
      // Fetch course titles separately since the API may not return joined data
      const certsWithTitles = await Promise.all(certs.map(async (cert: any) => {
        try {
          // Handle both string and object formats for course_id
          const courseIdValue = typeof cert.course_id === 'string' 
            ? cert.course_id 
            : cert.course_id?.id || cert.course_id;
          
          if (!courseIdValue) {
            return {
              id: cert.id,
              course_id: cert.course_id,
              certificate_number: cert.certificate_number,
              issued_at: cert.issued_at,
              courseName: 'Course',
              instructorName: undefined
            };
          }
          
          const course = await courseApi.getCourse(courseIdValue);
          return {
            id: cert.id,
            course_id: cert.course_id,
            certificate_number: cert.certificate_number,
            issued_at: cert.issued_at,
            courseName: course?.title || 'Course',
            instructorName: course?.instructor_name
          };
        } catch (error) {
          console.error('Error fetching course for certificate:', error);
          return {
            id: cert.id,
            course_id: cert.course_id,
            certificate_number: cert.certificate_number,
            issued_at: cert.issued_at,
            courseName: 'Course',
            instructorName: undefined
          };
        }
      }));
        
      setCertificates(certsWithTitles);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const claimCertificate = async (courseId: string, courseTitle: string) => {
    if (!user) return;

    try {
      // In a real implementation, you would call your backend API to mark enrollment as completed
      // await enrollmentApi.completeEnrollment(enrollmentId);
      
      // Create the certificate
      const certData = await certificateApi.createCertificate({
        user_id: user.id,
        course_id: courseId,
        courseName: courseTitle
      });

      toast({
        title: 'Certificate claimed!',
        description: 'Your certificate is ready to download.'
      });

      // Refresh certificates
      fetchCertificates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to claim certificate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return;

    try {
      // Fetch user's enrolled courses
      const enrollments = await enrollmentApi.getUserEnrollments(user.id);
      console.log('Raw enrollments from API:', enrollments);
      
      // Fetch course details for each enrolled course
      const enrolledCourseDetails = await Promise.all(
        enrollments.map(async (enrollment: any, index: number) => {
          try {
            console.log(`Processing enrollment ${index}:`, enrollment);
            
            // Handle multiple possible formats of course_id
            let courseIdValue: string | null = null;
            
            // First, try original_course_id if available (new field from API)
            if (enrollment.original_course_id && typeof enrollment.original_course_id === 'string') {
              courseIdValue = enrollment.original_course_id;
              console.log(`Enrollment ${index}: Using original_course_id:`, courseIdValue);
            } else if (typeof enrollment.course_id === 'string') {
              courseIdValue = enrollment.course_id;
              console.log(`Enrollment ${index}: course_id is string:`, courseIdValue);
            } else if (enrollment.course_id && typeof enrollment.course_id === 'object') {
              // Try different possible property names
              courseIdValue = enrollment.course_id.id || enrollment.course_id._id || enrollment.course_id.course_id || null;
              console.log(`Enrollment ${index}: course_id is object:`, enrollment.course_id, 'Extracted:', courseIdValue);
            } else {
              console.warn(`Enrollment ${index}: course_id is null/undefined:`, enrollment.course_id);
            }
            
            // Skip if course_id is still undefined or null
            if (!courseIdValue) {
              console.warn(`Enrollment ${index} has invalid course_id:`, enrollment);
              return null; // Return null to filter out later
            }
            
            console.log(`Enrollment ${index}: Fetching course with ID:`, courseIdValue);
            const course = await courseApi.getCourse(courseIdValue);
            
            // If course not found, return null
            if (!course) {
              console.warn(`Enrollment ${index}: Course not found for ID:`, courseIdValue);
              return null;
            }
            
            console.log(`Enrollment ${index}: Successfully fetched course:`, course);
            
            return {
              ...enrollment,
              course_id: courseIdValue, // Normalize to string
              course_details: course
            };
          } catch (error) {
            console.error(`Enrollment ${index}: Error fetching course details:`, error);
            // Return null to filter out failed courses
            return null;
          }
        })
      );

      // Filter out null values (failed course fetches)
      const validEnrolledCourses = enrolledCourseDetails.filter(item => item !== null);

      // Process enrolled courses with progress
      // Note: In a real implementation, you would fetch lesson progress separately
      const processedCoursesPromises = validEnrolledCourses
        .filter((item: any) => item && item.course_details !== null)
        .map(async (item: any) => {
          const course = item.course_details;
          // Fetch actual lesson progress
          const totalLessons = course.lessons_count || 0;
          
          // Check if enrollment is marked as completed first
          const isEnrollmentCompleted = item.completed_at !== null && item.completed_at !== undefined;
                      
          if (isEnrollmentCompleted) {
            // If enrollment is marked as completed, treat all lessons as completed
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnail_url: course.thumbnail_url,
              category: course.category,
              level: course.level,
              duration_hours: course.duration_hours || 0,
              enrolled_at: item.enrolled_at,
              totalLessons,
              completedLessons: totalLessons, // All lessons completed
              isCompleted: true
            };
          }
          
          // Otherwise, fetch actual lesson progress
          try {
            const progress = await lessonProgressApi.getLessonProgress(user.id, course.id);
            const completedLessons = progress.filter(p => p.completed).length;
            
            // Check if course is completed (all lessons completed)
            const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;
            
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnail_url: course.thumbnail_url,
              category: course.category,
              level: course.level,
              duration_hours: course.duration_hours || 0, // Default to 0 if undefined
              enrolled_at: item.enrolled_at,
              totalLessons,
              completedLessons,
              isCompleted // Add completion status
            };
          } catch (error) {
            console.error(`Error fetching progress for course ${course.id}:`, error);
            // Check enrollment completion status as fallback
            const isEnrollmentCompleted = item.completed_at !== null && item.completed_at !== undefined;
            
            if (isEnrollmentCompleted) {
              console.log(`Course ${course.id} fallback: enrollment marked as completed`);
              return {
                id: course.id,
                title: course.title,
                description: course.description,
                thumbnail_url: course.thumbnail_url,
                category: course.category,
                level: course.level,
                duration_hours: course.duration_hours || 0,
                enrolled_at: item.enrolled_at,
                totalLessons,
                completedLessons: totalLessons, // All lessons completed
                isCompleted: true
              };
            }
            
            // Return with zero completed lessons as fallback
            return {
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnail_url: course.thumbnail_url,
              category: course.category,
              level: course.level,
              duration_hours: course.duration_hours || 0, // Default to 0 if undefined
              enrolled_at: item.enrolled_at,
              totalLessons,
              completedLessons: 0,
              isCompleted: false
            };
          }
        });
        
      // Await all promises to resolve
      const processedCourses: EnrolledCourse[] = await Promise.all(processedCoursesPromises);

      
      console.log('Total enrollments:', enrollments.length);
      console.log('Valid enrolled courses:', validEnrolledCourses.length);
      console.log('Processed enrolled courses:', processedCourses);
      
      if (processedCourses.length === 0 && enrollments.length > 0) {
        console.warn('No courses processed despite having enrollments. Check course_id extraction and course API calls.');
      }

      setEnrolledCourses(processedCourses);

      // Calculate stats
      const totalCompleted = processedCourses.reduce((sum, course) => sum + course.completedLessons, 0);
      const completedCourses = processedCourses.filter(course => course.isCompleted).length;
      const hoursLearned = processedCourses.reduce((acc, c) => {
        const progressPercent = c.totalLessons > 0 ? c.completedLessons / c.totalLessons : 0;
        const courseHours = c.duration_hours || 0; // Handle undefined or NaN
        return acc + (courseHours * progressPercent);
      }, 0);

      setStats({
        totalCourses: processedCourses.length,
        completedCourses,
        hoursLearned: Math.round(hoursLearned),
        lessonsCompleted: totalCompleted
      });

    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <PageTransition>
      <Helmet>
        <title>My Learning | SkillUp</title>
        <meta name="description" content="Track your learning progress, access enrolled courses, and continue your educational journey." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-16">
          <div className="container-custom">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                My Learning
              </h1>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  fetchEnrolledCourses();
                  fetchCertificates();
                }}
                className="ml-auto"
              >
                Refresh Data
              </Button>
            </div>
            <p className="text-muted-foreground text-lg">
              Track your progress and continue learning
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="py-8 border-b border-border" key={`stats-${enrolledCourses.length}-${stats.completedCourses}`}> 
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-success" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.completedCourses}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.hoursLearned}</p>
                <p className="text-sm text-muted-foreground">Hours Learned</p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.lessonsCompleted}</p>
                <p className="text-sm text-muted-foreground">Lessons Done</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enrolled Courses */}
        <section className="py-12">
          <div className="container-custom">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
              My Courses
            </h2>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                    <div className="h-40 bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No courses yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by enrolling in a course
                </p>
                <Button variant="hero" asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" key={`courses-${enrolledCourses.length}`}> 
                {enrolledCourses.map((course) => {
                  const progress = getProgressPercent(course.completedLessons, course.totalLessons);
                  const isCompleted = course.isCompleted;
                  const hasCertificate = certificates.some(c => c.course_id === course.id);

                  return (
                    <div
                      key={course.id}
                      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <Link to={`/course/${course.id}`} className="block relative h-40 bg-muted overflow-hidden">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                            <BookOpen className="w-12 h-12 text-primary/50" />
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute top-3 right-3 bg-success text-success-foreground px-3 py-1 rounded-full text-xs font-medium">
                            Completed
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {course.category || 'General'}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {course.level}
                          </span>
                        </div>

                        <Link to={`/course/${course.id}`}>
                          <h3 className="font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                        </Link>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {course.completedLessons} / {course.totalLessons} lessons
                            </span>
                            <span className="font-medium text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-between">
                          {isCompleted && !hasCertificate ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1"
                              onClick={() => claimCertificate(course.id, course.title)}
                            >
                              <Award className="w-4 h-4" />
                              Claim Certificate
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {course.duration_hours}h total
                            </span>
                          )}
                          <Link 
                            to={`/course/${course.id}`}
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                          >
                            {isCompleted ? 'Review' : 'Continue'}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <section className="py-12 border-t border-border">
            <div className="container-custom">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                My Certificates
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/20 dark:via-card dark:to-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground line-clamp-1">{cert.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 font-mono">
                      {cert.certificate_number}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setSelectedCertificate(cert)}
                    >
                      <Download className="w-4 h-4" />
                      View & Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Payment History Section */}
        <section className="py-12 border-t border-border">
          <div className="container-custom">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              Payment History
            </h2>
            <PaymentHistory />
          </div>
        </section>

        {/* Browse More CTA */}
        {enrolledCourses.length > 0 && (
          <section className="py-12 bg-gradient-to-r from-primary/5 via-background to-accent/5">
            <div className="container-custom text-center">
              <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
                Ready to learn more?
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore our catalog of courses and expand your skills
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/courses">Browse All Courses</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Certificate Modal */}
      {selectedCertificate && (
        <Certificate
          studentName={user?.full_name || user?.email || 'Student'}
          courseName={selectedCertificate.courseName}
          completionDate={selectedCertificate.issued_at}
          certificateNumber={selectedCertificate.certificate_number}
          instructorName={selectedCertificate.instructorName}
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </PageTransition>
  );
};

export default StudentDashboard;