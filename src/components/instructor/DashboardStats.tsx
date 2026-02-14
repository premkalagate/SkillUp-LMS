import { useState, useEffect } from 'react';
import { IndianRupee, Users, BookOpen, TrendingUp, Eye, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, courseApi, enrollmentApi, paymentApi } from '@/services/api';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, isLoading }: StatCardProps) => (
  <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{value}</p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardStatsData {
  totalRevenue: number;
  totalStudents: number;
  activeCourses: number;
  publishedCourses: number;
}

const DashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsData>({
    totalRevenue: 0,
    totalStudents: 0,
    activeCourses: 0,
    publishedCourses: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch instructor's courses
      const params = { instructor_id: user.id };
      const response = await courseApi.getCourses(params);
      const courses = response?.courses || [];

      const courseIds = courses?.map((c: any) => c.id) || [];
      const activeCourses = courses?.length || 0;
      const publishedCourses = courses?.filter((c: any) => c.is_published).length || 0;

      // Fetch enrollments for instructor's courses
      let totalStudents = 0;
      if (courseIds.length > 0) {
        // We'll need to aggregate enrollment counts
        for (const courseId of courseIds) {
          const count = await enrollmentApi.getCourseEnrollmentCount(courseId);
          totalStudents += count || 0;
        }
      }

      // Fetch payments for instructor's courses
      let totalRevenue = 0;
      if (courseIds.length > 0) {
        const paymentsResponse = await paymentApi.getPayments({ status: 'captured' });
        // Handle both array and object response formats
        const payments = Array.isArray(paymentsResponse) 
          ? paymentsResponse 
          : paymentsResponse?.payments || [];
        const coursePayments = payments.filter((p: any) => courseIds.includes(p.course_id));
        totalRevenue = coursePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
      }

      setStats({
        totalRevenue,
        totalStudents,
        activeCourses,
        publishedCourses
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards: StatCardProps[] = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="w-6 h-6 text-primary" />
    },
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      title: 'Total Courses',
      value: stats.activeCourses.toString(),
      icon: <BookOpen className="w-6 h-6 text-primary" />
    },
    {
      title: 'Published Courses',
      value: stats.publishedCourses.toString(),
      icon: <TrendingUp className="w-6 h-6 text-primary" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default DashboardStats;