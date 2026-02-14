import { useRef } from 'react';
import { X, Download, Printer, IndianRupee, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import html2canvas from 'html2canvas';

interface Payment {
  id: string;
  course_id: string;
  amount: number;
  currency: string;
  razorpay_payment_id: string | null;
  status: string;
  created_at: string;
  courseName: string;
}

interface TransactionReceiptProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionReceipt = ({ payment, isOpen, onClose }: TransactionReceiptProps) => {
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `receipt-${payment.razorpay_payment_id || payment.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Transaction Receipt</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={printReceipt} title="Print">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={downloadReceipt} title="Download">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6 bg-white">
          {/* Logo/Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">SkillUp</h1>
            <p className="text-sm text-gray-500">Payment Receipt</p>
          </div>

          {/* Success Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment Successful</span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
            <div className="flex items-center justify-center gap-1">
              <IndianRupee className="w-8 h-8 text-gray-900" />
              <span className="text-4xl font-bold text-gray-900">
                {payment.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Course</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%]">{payment.courseName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Date</span>
              <span className="font-medium text-gray-900">
                {new Date(payment.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment ID</span>
              <span className="font-mono text-sm text-gray-900">{payment.razorpay_payment_id || payment.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Customer</span>
              <span className="font-medium text-gray-900">{user?.email || 'Customer'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Completed</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-500">
              Thank you for your purchase!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This is a computer-generated receipt and does not require a signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt;
