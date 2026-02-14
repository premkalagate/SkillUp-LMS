import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { certificateApi, courseApi, enrollmentApi } from '@/services/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Download, ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { toast } from '@/hooks/use-toast';

interface CertificateData {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
}

interface CourseData {
  id: string;
  title: string;
  instructor_name?: string;
}

const CertificatePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    if (!user || !courseId) {
      setError('User not authenticated or course ID not provided');
      setLoading(false);
      return;
    }

    try {
      // First, check if user has a certificate for this course
      const certificates = await certificateApi.getUserCertificates(user.id);
      const cert = certificates.find((c: any) => {
        // Handle both string and object formats for course_id
        if (typeof c.course_id === 'string') {
          return c.course_id === courseId;
        } else {
          return c.course_id?.id === courseId;
        }
      });
      
      if (!cert) {
        setError('Certificate not found for this course');
        setLoading(false);
        return;
      }

      setCertificate(cert);

      // Fetch course details
      const courseData = await courseApi.getCourse(courseId);
      setCourse(courseData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError('Failed to load certificate');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import('html2canvas');
      
      // Get the certificate container element
      const certificateContainer = document.querySelector('.bg-card.border.border-border.rounded-2xl.shadow-xl.overflow-hidden');
      
      if (!certificateContainer) {
        throw new Error('Certificate element not found');
      }

      // Create a container div to hold the certificate content for better formatting
      const certificateDiv = document.createElement('div');
      certificateDiv.innerHTML = `
        <div style="width: 800px; height: 566px; background: linear-gradient(135deg, #FEF5E7 0%, #FFFFFF 50%, #FEF5E7 100%); border: 16px double #D4AF37; border-radius: 0; padding: 40px; text-align: center; font-family: 'Times New Roman', serif;">
          <div style="position: relative; margin-bottom: 30px;">
            <div style="position: absolute; top: 8px; left: 8px; width: 40px; height: 40px; border-top: 4px solid rgba(212, 175, 55, 0.6); border-left: 4px solid rgba(212, 175, 55, 0.6); border-radius: 8px;"></div>
            <div style="position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border-top: 4px solid rgba(212, 175, 55, 0.6); border-right: 4px solid rgba(212, 175, 55, 0.6); border-radius: 8px;"></div>
            <div style="position: absolute; bottom: 8px; left: 8px; width: 40px; height: 40px; border-bottom: 4px solid rgba(212, 175, 55, 0.6); border-left: 4px solid rgba(212, 175, 55, 0.6); border-radius: 8px;"></div>
            <div style="position: absolute; bottom: 8px; right: 8px; width: 40px; height: 40px; border-bottom: 4px solid rgba(212, 175, 55, 0.6); border-right: 4px solid rgba(212, 175, 55, 0.6); border-radius: 8px;"></div>
            
            <div style="margin-bottom: 30px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                  <path d="M14.5 2.5c1.1.1 2.2.3 3.2.6 1 .3 1.9.8 2.7 1.4.8.6 1.4 1.3 1.9 2.2.5.9.8 1.9.9 2.9.1 1 .1 2 0 3-.1 1-.4 2-.9 2.9-.5.9-1.1 1.6-1.9 2.2-.8.6-1.7 1.1-2.7 1.4-1 .3-2.1.5-3.2.6-1 .1-2 .1-3 0-1-.1-2-.3-3-.6-1-.3-1.9-.8-2.7-1.4-.8-.6-1.4-1.3-1.9-2.2-.5-.9-.8-1.9-.9-2.9-.1-1-.1-2 0-3 .1-1 .4-2 .9-2.9.5-.9 1.1-1.6 1.9-2.2.8-.6 1.7-1.1 2.7-1.4 1-.3 2.1-.5 3.2-.6z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span style="color: #D4AF37; font-size: 18px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">SKILLUP ACADEMY</span>
              </div>
              <h1 style="font-size: 28px; font-weight: bold; color: #2D3748; margin: 10px 0;">CERTIFICATE OF COMPLETION</h1>
            </div>
            
            <div style="margin: 30px 0;">
              <p style="font-size: 16px; color: #4A5568; margin-bottom: 15px;">This is to certify that</p>
              
              <h2 style="font-size: 32px; font-weight: bold; color: #2B6CB0; border-bottom: 2px solid rgba(212, 175, 55, 0.3); padding-bottom: 10px; margin: 20px auto; max-width: 400px;">${user?.full_name || user?.email || 'Student Name'}</h2>
              
              <p style="font-size: 16px; color: #4A5568; margin-bottom: 15px;">has successfully completed the course</p>
              
              <h3 style="font-size: 22px; font-weight: bold; color: #2D3748; margin: 15px 0;">"${course?.title || 'Course Title'}"</h3>
              
              <p style="font-size: 16px; color: #4A5568;">on ${new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(212, 175, 55, 0.2); display: flex; justify-content: space-between; max-width: 600px; margin: 40px auto 0;">
              <div style="text-align: center;">
                <p style="font-size: 12px; color: #718096;">Instructor Name</p>
                <p style="font-size: 14px; color: #2D3748; margin-top: 4px;">${course?.instructor_name || 'N/A'}</p>
              </div>
              
              <div style="text-align: center;">
                <p style="font-size: 12px; color: #718096; margin-bottom: 5px;">Certificate ID</p>
                <p style="font-size: 14px; color: #2D3748; font-family: monospace;">${certificate?.certificate_number || 'CERT-UNKNOWN'}</p>
              </div>
              
              <div style="text-align: center;">
                <p style="font-size: 12px; color: #718096;">SkillUp Academy</p>
              </div>
            </div>
          </div>
        </div>
      `;

      certificateDiv.style.position = 'absolute';
      certificateDiv.style.left = '-9999px';
      document.body.appendChild(certificateDiv);
      
      // Use html2canvas to convert the div to an image
      const canvas = await html2canvas(certificateDiv, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      });
      
      // Remove the temporary div
      document.body.removeChild(certificateDiv);
      
      // Create download link
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `certificate-${certificate?.certificate_number || 'skillup-course'}.png`;
      link.href = imgData;
      link.click();
      
      toast({
        title: 'Certificate downloaded!',
        description: 'Your certificate has been saved to your downloads folder.'
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Download failed',
        description: 'There was an error generating your certificate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading certificate...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !certificate || !course) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-destructive">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">Certificate Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'No certificate found for this course'}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const formattedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PageTransition>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-20">
        <div className="container-custom max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download Certificate
            </Button>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-8 md:p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                    <path d="M14.5 2.5c1.1.1 2.2.3 3.2.6 1 .3 1.9.8 2.7 1.4.8.6 1.4 1.3 1.9 2.2.5.9.8 1.9.9 2.9.1 1 .1 2 0 3-.1 1-.4 2-.9 2.9-.5.9-1.1 1.6-1.9 2.2-.8.6-1.7 1.1-2.7 1.4-1 .3-2.1.5-3.2.6-1 .1-2 .1-3 0-1-.1-2-.3-3-.6-1-.3-1.9-.8-2.7-1.4-.8-.6-1.4-1.3-1.9-2.2-.5-.9-.8-1.9-.9-2.9-.1-1-.1-2 0-3 .1-1 .4-2 .9-2.9.5-.9 1.1-1.6 1.9-2.2.8-.6 1.7-1.1 2.7-1.4 1-.3 2.1-.5 3.2-.6z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Certificate of Completion
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8">
                  This certifies that
                </p>
                
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">
                    {user?.full_name || user?.email || 'Student Name'}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    has successfully completed the course
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 mb-8 inline-block">
                  <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                    {course.title}
                  </h3>
                  {course.instructor_name && (
                    <p className="text-muted-foreground mt-2">
                      Taught by {course.instructor_name}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="bg-secondary/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Date of Completion</p>
                    <p className="text-lg font-medium">{formattedDate}</p>
                  </div>
                  
                  <div className="bg-secondary/50 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Certificate ID</p>
                    <p className="text-lg font-mono">{certificate.certificate_number}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-border text-center">
              <p className="text-muted-foreground italic">
                This certificate confirms the successful completion of all required coursework and assessments.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="border-t border-border pt-6">
                  <p className="font-medium text-foreground">SkillUp Academy</p>
                  <p className="text-sm text-muted-foreground">Online Learning Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
};

export default CertificatePage;