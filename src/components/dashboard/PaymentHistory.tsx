import { useEffect, useState } from 'react';
import { Receipt, Download, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import TransactionReceipt from './TransactionReceipt';

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

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const paymentsData = await paymentApi.getUserPayments(user.id);
      
      setPayments(paymentsData.map((payment: any) => ({
        id: payment.id,
        course_id: payment.course_id,
        amount: payment.amount,
        currency: payment.currency,
        razorpay_payment_id: payment.razorpay_payment_id,
        status: payment.status,
        created_at: payment.created_at,
        courseName: payment.course.title || 'Course'
      })));
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-48" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
              <div className="h-8 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border">
        <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
        <p className="text-muted-foreground">Your payment history will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground line-clamp-1">{payment.courseName}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{new Date(payment.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}</span>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(payment.status)}
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-foreground">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </span>
                {payment.status === 'completed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <Download className="w-4 h-4" />
                    Receipt
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPayment && (
        <TransactionReceipt
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </>
  );
};

export default PaymentHistory;
