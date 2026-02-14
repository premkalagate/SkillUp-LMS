import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Save, Globe, CreditCard, Bell, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformName: 'SkillUp',
    platformEmail: 'support@skillup.com',
    maintenanceMode: false,
    registrationEnabled: true,
    instructorSignupEnabled: true,
    emailNotifications: true,
    paymentGateway: 'razorpay'
  });

  const handleSave = () => {
    // In a real app, this would save to the database
    toast({
      title: 'Settings saved',
      description: 'Platform settings have been updated successfully.'
    });
  };

  return (
    <>
      <Helmet>
        <title>Settings - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout title="Settings" description="Configure platform settings">
        <div className="max-w-3xl space-y-6">
          {/* General Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                General Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Basic platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-slate-300">Platform Name</Label>
                <Input
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-300">Support Email</Label>
                <Input
                  type="email"
                  value={settings.platformEmail}
                  onChange={(e) => setSettings({ ...settings, platformEmail: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Maintenance Mode</Label>
                  <p className="text-sm text-slate-500">Temporarily disable the platform</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* User Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                User Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Control user registration and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">User Registration</Label>
                  <p className="text-sm text-slate-500">Allow new users to sign up</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                />
              </div>
              <Separator className="bg-slate-700" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Instructor Sign-ups</Label>
                  <p className="text-sm text-slate-500">Allow users to register as instructors</p>
                </div>
                <Switch
                  checked={settings.instructorSignupEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, instructorSignupEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                Payment Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure payment gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-slate-300">Payment Gateway</Label>
                <Input
                  value="Razorpay"
                  disabled
                  className="bg-slate-700/50 border-slate-600 text-slate-400"
                />
                <p className="text-sm text-slate-500">
                  Payment gateway is configured via environment variables
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Notifications
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Send email notifications for important events</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminSettings;
