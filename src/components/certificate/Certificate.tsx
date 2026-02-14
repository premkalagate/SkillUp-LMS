import { useRef, useState } from 'react';
import { Download, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  instructorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const Certificate = ({ 
  studentName, 
  courseName, 
  completionDate, 
  certificateNumber,
  instructorName,
  isOpen,
  onClose 
}: CertificateProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `certificate-${certificateNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Course Certificate
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Certificate Preview */}
          <div 
            ref={certificateRef}
            className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 border-8 border-double border-amber-600/30 rounded-lg p-8 md:p-12 text-center"
            style={{ aspectRatio: '1.414' }}
          >
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-amber-600/40 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-600/40 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-amber-600/40 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-amber-600/40 rounded-br-lg" />

            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-8 h-8 text-amber-600" />
                <span className="text-amber-600 font-semibold text-lg tracking-widest uppercase">
                  SkillUp Academy
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-heading font-bold text-gray-800 tracking-wide">
                Certificate of Completion
              </h2>
            </div>

            {/* Body */}
            <div className="space-y-4 md:space-y-6">
              <p className="text-gray-600 text-sm md:text-base">This is to certify that</p>
              
              <h3 className="text-2xl md:text-4xl font-heading font-bold text-primary border-b-2 border-amber-600/30 pb-2 mx-auto max-w-md">
                {studentName}
              </h3>
              
              <p className="text-gray-600 text-sm md:text-base">has successfully completed the course</p>
              
              <h4 className="text-xl md:text-2xl font-semibold text-gray-800 max-w-lg mx-auto">
                "{courseName}"
              </h4>
              
              <p className="text-gray-600 text-sm md:text-base">
                on {formattedDate}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 md:mt-12 pt-6 border-t border-amber-600/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Instructor Name</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{instructorName || 'N/A'}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-600">{certificateNumber}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">SkillUp Academy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleDownload} 
              disabled={downloading}
              size="lg"
              className="gap-2"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Generating...' : 'Download Certificate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Certificate;
