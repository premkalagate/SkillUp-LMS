import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit2, Trash2, Copy, Check, Percent, IndianRupee, Calendar, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { couponApi, courseApi } from '@/services/api';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number | null;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
  course_id: string | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
    course_id: 'all'
  });

  useEffect(() => {
    fetchCoupons();
    fetchCourses();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await couponApi.getCoupons({ sort: '-created_at' });
      setCoupons(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching coupons',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await courseApi.getCourses({});
      setCourses(data?.courses || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_uses: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
      course_id: 'all'
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active ?? true,
      course_id: coupon.course_id || 'all'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.discount_value) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Code and discount value are required'
      });
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_active: formData.is_active,
        course_id: formData.course_id === 'all' ? null : formData.course_id
      };

      if (editingCoupon) {
        await couponApi.updateCoupon(editingCoupon.id, couponData);
        toast({ title: 'Coupon updated successfully' });
      } else {
        await couponApi.createCoupon(couponData);
        toast({ title: 'Coupon created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving coupon',
        description: error.message
      });
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;

    try {
      await couponApi.deleteCoupon(couponToDelete);
      toast({ title: 'Coupon deleted successfully' });
      fetchCoupons();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting coupon',
        description: error.message
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const updatedCoupon = { ...coupon, is_active: !coupon.is_active };
      await couponApi.updateCoupon(coupon.id, updatedCoupon);
      toast({ title: `Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}` });
      fetchCoupons();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating coupon',
        description: error.message
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCourseTitle = (courseId: string | null) => {
    if (!courseId) return 'All Courses';
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown';
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Manage Coupons - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout title="Coupons" description="Manage global discount codes">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Button 
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        {/* Coupons Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-400">Code</TableHead>
                    <TableHead className="text-slate-400">Discount</TableHead>
                    <TableHead className="text-slate-400 hidden md:table-cell">Course</TableHead>
                    <TableHead className="text-slate-400 hidden md:table-cell">Usage</TableHead>
                    <TableHead className="text-slate-400 hidden lg:table-cell">Valid Until</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-700 px-2 py-1 rounded font-mono text-sm text-white">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-white"
                            onClick={() => copyCode(coupon.code)}
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-white">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <span className="font-medium">{coupon.discount_value}%</span>
                              <Percent className="w-3.5 h-3.5 text-slate-400" />
                            </>
                          ) : (
                            <>
                              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{coupon.discount_value}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-400">
                        {getCourseTitle(coupon.course_id)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-400">
                        {coupon.current_uses || 0}
                        {coupon.max_uses && ` / ${coupon.max_uses}`}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {coupon.valid_until ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active ?? false}
                          onCheckedChange={() => toggleCouponStatus(coupon)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => {
                              setCouponToDelete(coupon.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCoupons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        No coupons found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingCoupon 
                ? 'Update the coupon details below.'
                : 'Create a new global discount code.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code" className="text-slate-300">Coupon Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="uppercase bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-300">
                    Discount Value
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="20"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-300">Apply to Course</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Min. Purchase (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-300">Max Uses</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-300">Valid From</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-300">Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button type="submit">
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCoupons;
