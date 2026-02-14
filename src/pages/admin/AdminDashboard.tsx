import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, BookOpen, IndianRupee, TrendingUp, UserCheck, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { adminApi, courseApi, userApi, paymentApi, enrollmentApi } from '@/services/api';

interface DashboardStats {
  totalUsers: number;
  totalInstructors: number;
  totalCourses: number;
  totalRevenue: number;
  totalEnrollments: number;
  publishedCourses: number;
  pendingCourses: number;
}

interface PendingCourse {
  id: string;
  title: string;
  category: string | null;
  price: number;
  created_at: string;
  instructor_id: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
    publishedCourses: 0,
    pendingCourses: 0
  });
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPendingCourses();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch user counts by role
      const userRolesResponse = await userApi.getUsers({});
      const userRoles = userRolesResponse?.users || [];

      const totalUsers = userRoles.filter((r: any) => r.role === 'user').length || 0;
      const totalInstructors = userRoles.filter((r: any) => r.role === 'instructor').length || 0;

      // Fetch courses
      const coursesResponse = await courseApi.getCourses({});
      const courses = coursesResponse?.courses || [];

      const totalCourses = courses.length || 0;
      const publishedCourses = courses.filter((c: any) => c.is_published).length || 0;
      const pendingCourses = courses.filter((c: any) => !c.is_published).length || 0;

      // Fetch payments
      const paymentsResponse = await paymentApi.getPayments({});
      const payments = paymentsResponse?.payments || [];

      const totalRevenue = payments.reduce((sum: number, p: any) => {
        return sum + (p.status === 'completed' ? Number(p.amount) : 0);
      }, 0);

      // Fetch enrollments count from dashboard analytics
      try {
        const dashboardData = await adminApi.getDashboardAnalytics();
        const totalEnrollments = dashboardData?.totalEnrollments || 0;
        
        setStats({
          totalUsers,
          totalInstructors,
          totalCourses,
          totalRevenue,
          totalEnrollments,
          publishedCourses,
          pendingCourses
        });
      } catch (error) {
        // Fallback if dashboard endpoint fails
        setStats({
          totalUsers,
          totalInstructors,
          totalCourses,
          totalRevenue,
          totalEnrollments: 0,
          publishedCourses,
          pendingCourses
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingCourses = async () => {
    try {
      // Fetch courses with is_published=false
      const response = await courseApi.getCourses({ is_published: false });
      const courses = response?.courses || [];
      setPendingCourses(courses);
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      // Update course to set is_published to true
      await courseApi.updateCourse(courseId, { is_published: true });

      toast({
        title: 'Course approved',
        description: 'The course has been published successfully.'
      });

      fetchPendingCourses();
      fetchStats();
    } catch (error: any) {
      console.error('Error approving course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve course.',
        variant: 'destructive'
      });
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    try {
      await courseApi.deleteCourse(courseId);

      toast({
        title: 'Course rejected',
        description: 'The course has been removed.'
      });

      fetchPendingCourses();
      fetchStats();
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject course.',
        variant: 'destructive'
      });
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Instructors',
      value: stats.totalInstructors,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      change: '+5%'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      subtitle: `${stats.publishedCourses} published`
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'from-amber-500 to-amber-600',
      change: '+18%'
    },
    {
      title: 'Enrollments',
      value: stats.totalEnrollments,
      icon: ShoppingCart,
      color: 'from-pink-500 to-pink-600',
      change: '+24%'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingCourses,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      subtitle: 'Awaiting approval'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SkillUp</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout title="Dashboard" description="Platform overview and key metrics">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                      {stat.change && (
                        <p className="text-sm text-green-400 mt-1">{stat.change} from last month</p>
                      )}
                      {stat.subtitle && (
                        <p className="text-sm text-slate-500 mt-1">{stat.subtitle}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pending Course Reviews */}
        <div className="mt-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Pending Course Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCourses.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No courses pending review
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700"
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-white">{course.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          {course.category && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                              {course.category}
                            </Badge>
                          )}
                          <span>₹{course.price?.toLocaleString('en-IN') || 0}</span>
                          <span>Submitted {new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                          onClick={() => handleApproveCourse(course.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleRejectCourse(course.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-center py-8">
                Recent enrollment data will appear here
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-center py-8">
                Recent payment data will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;