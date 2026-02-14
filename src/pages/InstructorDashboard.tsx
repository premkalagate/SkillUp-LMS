import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Plus, 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Settings,
  BarChart3,
  Users,
  Bell,
  Ticket
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardStats from '@/components/instructor/DashboardStats';
import CoursesList from '@/components/instructor/CoursesList';
import CreateCourseDialog from '@/components/instructor/CreateCourseDialog';
import CouponManagement from '@/components/instructor/CouponManagement';
import PageTransition from '@/components/PageTransition';

const InstructorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCourseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Instructor Dashboard - SkillUp</title>
        <meta name="description" content="Manage your courses, track earnings, and engage with students on SkillUp instructor dashboard." />
      </Helmet>

      <Header />

      <main className="pt-20 min-h-screen bg-background">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
          <div className="container-custom py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  Instructor Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back! Here's an overview of your courses.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button variant="hero" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container-custom py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap justify-start">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-2 data-[state=active]:bg-background">
                <BookOpen className="w-4 h-4" />
                My Courses
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-background">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-background">
                <Users className="w-4 h-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-background">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="coupons" className="gap-2 data-[state=active]:bg-background">
                <Ticket className="w-4 h-4" />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <DashboardStats />
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">All Courses</h2>
                <Button variant="hero" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Course
                </Button>
              </div>
              <CoursesList refreshTrigger={refreshTrigger} />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Detailed analytics including revenue trends, student engagement, and course performance will be displayed here.
                </p>
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Student Management
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  View and manage your enrolled students, track their progress, and send announcements.
                </p>
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Messages & Q&A
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Communicate with your students, answer questions, and provide support.
                </p>
              </div>
            </TabsContent>

            {/* Coupons Tab */}
            <TabsContent value="coupons" className="space-y-6">
              <CouponManagement />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Account Settings
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Manage your instructor profile, payment settings, and notification preferences.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Create Course Dialog */}
        <CreateCourseDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          onCourseCreated={handleCourseCreated}
        />
      </main>

      <Footer />
    </PageTransition>
  );
};

export default InstructorDashboard;