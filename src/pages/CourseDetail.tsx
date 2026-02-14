import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Clock, BookOpen, Award, Play, Check, Users, Globe, BarChart, Loader2, CheckCircle, CreditCard, User, Download } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { courseApi, enrollmentApi, reviewApi, certificateApi, lessonProgressApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import CourseReviews from '@/components/reviews/CourseReviews';
import { useRazorpay } from '@/hooks/useRazorpay';
import CouponInput from '@/components/checkout/CouponInput';
import { Skeleton } from '@/components/ui/skeleton';
import PageTransition from '@/components/PageTransition';
import CertificateModal from '@/components/certificate/Certificate';

interface DatabaseCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  category: string | null;
  level: string | null;
  duration_hours: number | null;
  instructor_id: string;
  is_published: boolean | null;
  created_at: string;
  averageRating?: number;
  totalReviews?: number;
  instructor_name?: string;
  instructor_avatar_url?: string;
}

interface CourseReview {
  rating: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number | null;
}

interface InstructorProfile {
  full_name: string | null;
  avatar_url: string | null;
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const [course, setCourse] = useState<DatabaseCourse | null>(null);
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  
  // State for certificate modal
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  
  const { initiatePayment, isLoading: paymentLoading } = useRazorpay({
    onSuccess: () => {
      setIsEnrolled(true);
    },
  });

  useEffect(() => {
    fetchCourse();
    fetchLessons();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkEnrollmentStatus();
      checkCourseCompletion();
    }
  }, [user, id, isEnrolled]);

  const fetchLessons = async () => {
    if (!id) {
      setLessonsLoading(false);
      return;
    }

    try {
      const lessonsData = await courseApi.getCourseLessons(id);
      setLessons(lessonsData);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const fetchCourse = async () => {
    if (!id) {
      setCourseLoading(false);
      return;
    }

    try {
      // Fetch course
      const courseData = await courseApi.getCourse(id);
      setCourse(courseData);

      // Set instructor profile from course data
      setInstructor({
        full_name: courseData?.instructor_name || 'Instructor',
        avatar_url: courseData?.instructor_avatar_url || null
      });

      // Set ratings from course data
      setAverageRating(courseData?.averageRating || 0);
      setRatingCount(courseData?.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setCourseLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !id) {
      setCheckingEnrollment(false);
      return;
    }

    try {
      // Check if user is enrolled in the course
      const enrollments = await enrollmentApi.getUserEnrollments(user.id);
      // Handle both cases: course_id as string or as populated object
      const enrollment = enrollments.find(e => {
        const courseIdValue = typeof e.course_id === 'string' 
          ? e.course_id 
          : e.course_id?.id || e.course_id?._id;
        return courseIdValue === id;
      });
      if (enrollment) {
        setIsEnrolled(true);
      } else {
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };
  
  const checkCourseCompletion = async () => {
    if (!user || !id) return;
    
    try {
      // Check if user has a certificate for this course
      const certificates = await certificateApi.getUserCertificates(user.id);
      
      const certExists = certificates.some(cert => {
        // Handle both string and object formats for course_id
        if (typeof cert.course_id === 'string') {
          return cert.course_id === id;
        } else {
          return cert.course_id?.id === id;
        }
      });
      setHasCertificate(certExists);
      
      // Get lesson progress to calculate completion
      if (isEnrolled) {
        const progress = await lessonProgressApi.getLessonProgress(user.id, id);
        const courseLessons = await courseApi.getCourseLessons(id);
        
        setTotalLessons(courseLessons.length);
        
        const completedCount = progress.filter(p => p.completed).length;
        setCompletedLessons(completedCount);
        
        // Check if all lessons are completed
        const isCompleted = completedCount === courseLessons.length && courseLessons.length > 0;
        
        // Also check if enrollment is marked as completed in the database
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
          return courseIdValue === id;
        });
        
        // If enrollment is marked as completed, course is completed regardless of lesson progress
        const isEnrollmentCompleted = enrollment && enrollment.completed_at;
        
        setIsCourseCompleted(isCompleted || isEnrollmentCompleted);
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to enroll in this course.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (!id || !course) return;

    const coursePrice = course.price || 0;
    
    // If course is free, enroll directly
    if (coursePrice === 0) {
      // Check enrollment status first
      if (isEnrolled) {
        toast({
          title: 'Already enrolled',
          description: 'You are already enrolled in this course.'
        });
        return;
      }

      setEnrolling(true);
      try {
        // Double-check enrollment status synchronously before attempting to enroll
        const enrollments = await enrollmentApi.getUserEnrollments(user.id);
        const enrollment = enrollments.find((e: any) => {
          // Handle multiple possible formats of course_id
          let courseIdValue: string | null = null;
          
          // First, try original_course_id if available (new field from API)
          if (e.original_course_id && typeof e.original_course_id === 'string') {
            courseIdValue = e.original_course_id;
          } else if (typeof e.course_id === 'string') {
            courseIdValue = e.course_id;
          } else if (e.course_id && typeof e.course_id === 'object') {
            // Try different possible property names (id, _id, course_id)
            courseIdValue = e.course_id.id || e.course_id._id || e.course_id.course_id || null;
          }
          
          return courseIdValue === id;
        });
        
        // If already enrolled, update state and return
        if (enrollment) {
          setIsEnrolled(true);
          toast({
            title: 'Already enrolled',
            description: 'You are already enrolled in this course.'
          });
          setEnrolling(false);
          return;
        }
        
        // If not enrolled, proceed with enrollment
        const enrollmentData = {
          user_id: user.id,
          course_id: id
        };
        
        const enrollmentResult = await enrollmentApi.createEnrollment(enrollmentData);
        
        if (enrollmentResult) {
          setIsEnrolled(true);
          toast({
            title: 'Enrolled successfully!',
            description: 'You can now access this course from your learning dashboard.'
          });
        }
      } catch (error) {
        console.error('Error enrolling:', error);
        // Check if it's a duplicate enrollment error
        if (error instanceof Error && (error.message.includes('already enrolled') || error.message.includes('User is already enrolled'))) {
          toast({
            title: 'Already enrolled',
            description: 'You are already enrolled in this course.'
          });
          setIsEnrolled(true);
          // Refresh enrollment status
          await checkEnrollmentStatus();
        } else {
          toast({
            title: 'Enrollment failed',
            description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
            variant: 'destructive'
          });
        }
      } finally {
        setEnrolling(false);
      }
    } else {
      // For paid courses, initiate Razorpay payment
      const paymentAmount = appliedCoupon ? appliedCoupon.finalPrice : coursePrice;
      const couponData = appliedCoupon ? {
        couponId: appliedCoupon.couponId,
        discountAmount: appliedCoupon.discountAmount
      } : undefined;

      initiatePayment(
        id,
        course.title,
        paymentAmount,
        user.id,
        user.email,
        user.full_name || '',
        couponData
      );
    }
  };

  const handleCouponApplied = (data: any) => {
    if (data.valid && data.couponId) {
      setAppliedCoupon({
        couponId: data.couponId,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice
      });
    }
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const goToLearning = () => {
    navigate(`/course/${id}/learn`);
  };

  if (courseLoading) {
    return (
      <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div>
                <Skeleton className="h-96 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
      </PageTransition>
    );
  }

  if (!course) {
    return (
      <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-heading font-bold">Course not found</h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </main>
        <Footer />
      </div>
      </PageTransition>
    );
  }

  const coursePrice = course.price || 0;
  const courseDuration = course.duration_hours ? `${course.duration_hours}h` : 'Self-paced';

  const totalLessonDuration = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < Math.floor(rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
        />
      );
    }
    return stars;
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-foreground text-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 py-8">
              <div className="flex items-center gap-3 mb-4">
                {course.category && (
                  <span className="text-sm font-medium text-primary bg-primary/20 px-3 py-1 rounded-full">
                    {course.category}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                {course.title}
              </h1>

              <p className="text-background/70 text-lg mb-6">
                {course.description || 'Master the skills you need to succeed with this comprehensive course covering everything from fundamentals to advanced concepts.'}
              </p>

              {ratingCount > 0 && (
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent">{averageRating}</span>
                    <div className="flex">{renderStars(averageRating)}</div>
                    <span className="text-background/60">({ratingCount.toLocaleString()} ratings)</span>
                  </div>
                </div>
              )}

              {/* Instructor Info */}
              {instructor && (
                <div className="flex items-center gap-3 mb-6">
                  {instructor.avatar_url ? (
                    <img 
                      src={instructor.avatar_url} 
                      alt={instructor.full_name || 'Instructor'} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-background/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-background/60">Created by</p>
                    <p className="font-medium">{instructor.full_name || 'Instructor'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-background/70">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {courseDuration}
                </span>
                <span className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  {course.level || 'All Levels'}
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  English
                </span>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xl sticky top-24">
                <div className="relative aspect-video">
                  <img
                    src={course.thumbnail_url || '/placeholder.svg'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors">
                      <Play className="w-6 h-6 text-foreground ml-1" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Pricing */}
                  <div className="mb-4">
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-heading font-bold">₹{appliedCoupon.finalPrice.toLocaleString('en-IN')}</span>
                          <span className="text-lg text-muted-foreground line-through">₹{course.price.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-sm text-success font-medium">You save ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-heading font-bold">
                          {coursePrice === 0 ? 'Free' : `₹${coursePrice.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coupon Input - Only show for paid courses when not enrolled */}
                  {coursePrice > 0 && !isEnrolled && !checkingEnrollment && user && (
                    <div className="mb-4">
                      <CouponInput
                        courseId={id || ''}
                        coursePrice={coursePrice}
                        userId={user.id}
                        onCouponApplied={handleCouponApplied}
                        onCouponRemoved={handleCouponRemoved}
                      />
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {checkingEnrollment ? (
                      <Button variant="hero" size="lg" className="w-full" disabled>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Checking...
                      </Button>
                    ) : isEnrolled ? (
                      <>
                        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-success/10 text-success rounded-xl mb-3">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">You're enrolled!</span>
                        </div>
                        <div className="space-y-3">
                          {isCourseCompleted ? (
                            // Show View Certificate button when course is completed
                            <Button 
                              variant="hero" 
                              size="lg" 
                              className="w-full gap-2"
                              onClick={async () => {
                                // Fetch the certificate data to show in modal
                                if (user) {
                                  try {
                                    const certificates = await certificateApi.getUserCertificates(user.id);
                                    const cert = certificates.find((c: any) => {
                                      // Handle both string and object formats for course_id
                                      if (typeof c.course_id === 'string') {
                                        return c.course_id === id;
                                      } else {
                                        return c.course_id?.id === id;
                                      }
                                    });
                                    
                                    if (cert) {
                                      // Fetch course data to get instructor name
                                      const courseData = await courseApi.getCourse(id);
                                      
                                      setSelectedCertificate({
                                        id: cert.id,
                                        course_id: cert.course_id,
                                        certificate_number: cert.certificate_number,
                                        issued_at: cert.issued_at,
                                        courseName: courseData?.title || 'Course',
                                        instructorName: courseData?.instructor_name
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Error fetching certificate for modal:', error);
                                  }
                                }
                              }}
                            >
                              <Award className="w-5 h-5" />
                              View Certificate
                            </Button>
                          ) : (
                            // Show Start Learning button when course is not completed
                            <Button variant="hero" size="lg" className="w-full" onClick={goToLearning}>
                              <Play className="w-5 h-5" />
                              Start Learning
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="hero" 
                          size="lg" 
                          className="w-full" 
                          onClick={handleEnroll}
                          disabled={enrolling || paymentLoading}
                        >
                          {enrolling || paymentLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {paymentLoading ? 'Processing...' : 'Enrolling...'}
                            </>
                          ) : (
                            <>
                              {coursePrice === 0 ? (
                                <BookOpen className="w-5 h-5" />
                              ) : (
                                <CreditCard className="w-5 h-5" />
                              )}
                              {coursePrice === 0 
                                ? 'Enroll Now — Free' 
                                : `Buy Now — ₹${(appliedCoupon?.finalPrice ?? coursePrice).toLocaleString('en-IN')}`}
                            </>
                          )}
                        </Button>
                        {!user && (
                          <p className="text-center text-xs text-muted-foreground">
                            Sign in to enroll in this course
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <p className="text-center text-sm text-muted-foreground mb-6">
                    30-Day Money-Back Guarantee
                  </p>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold mb-3">This course includes:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        {courseDuration} on-demand video
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Downloadable resources
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Full lifetime access
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-12 border-b border-border">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-heading font-bold mb-6">What you'll learn</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Build real-world projects from scratch',
                'Understand core concepts and best practices',
                'Master advanced techniques and patterns',
                'Deploy applications to production',
                'Write clean, maintainable code',
                'Debug and troubleshoot effectively',
                'Work with APIs and databases',
                'Implement security best practices',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Course Curriculum */}
      <section className="py-12">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-heading font-bold mb-6">Course curriculum</h2>
            {lessonsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                No lessons added yet. Check back soon!
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="p-4 bg-secondary/30 flex items-center justify-between">
                  <span className="font-semibold">All Lessons</span>
                  <span className="text-sm text-muted-foreground">
                    {lessons.length} lessons • {formatDuration(totalLessonDuration)}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-4 hover:bg-secondary/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" />
                        {lesson.duration_minutes ? formatDuration(lesson.duration_minutes) : 'Video'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {id && <CourseReviews courseId={id} />}

      <Footer />
    </div>
    
    {/* Certificate Modal */}
    {selectedCertificate && (
      <CertificateModal
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

export default CourseDetail;
