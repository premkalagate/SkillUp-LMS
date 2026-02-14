import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/home/CourseCard';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import PageTransition from '@/components/PageTransition';

const levels = ['beginner', 'intermediate', 'advanced'];
const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 - ₹4,000', min: 2000, max: 4000 },
  { label: '₹4,000 - ₹8,000', min: 4000, max: 8000 },
  { label: 'Over ₹8,000', min: 8000, max: Infinity },
];

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const params = {
        is_published: true,
        sort: '-created_at'
      };
      return await courseApi.getCourses(params);
    }
  });

  // Extract courses array from response object
  const courses = response?.courses || [];

  // Get unique categories from courses
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    courses.forEach((course) => {
      if (course.category) {
        uniqueCategories.add(course.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || (course.category?.toLowerCase() === selectedCategory.toLowerCase());
      const matchesLevel = !selectedLevel || course.level === selectedLevel;
      const matchesPrice = (course.price || 0) >= selectedPriceRange.min && (course.price || 0) <= selectedPriceRange.max;
      
      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedPriceRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedPriceRange(priceRanges[0]);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedLevel || selectedPriceRange !== priceRanges[0];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              All Courses
            </h1>
            <p className="text-muted-foreground">
              Explore our complete catalog of courses
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-10">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outline"
              className="lg:hidden flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-12 pl-4 pr-10 bg-card border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="h-12 pl-4 pr-10 bg-card border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Price Filter */}
              <div className="relative">
                <select
                  value={selectedPriceRange.label}
                  onChange={(e) => {
                    const range = priceRanges.find(r => r.label === e.target.value);
                    if (range) setSelectedPriceRange(range);
                  }}
                  className="h-12 pl-4 pr-10 bg-card border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.label}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="lg:hidden mb-8 p-6 bg-card rounded-xl border border-border space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg"
                >
                  <option value="">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Price Range</label>
                <select
                  value={selectedPriceRange.label}
                  onChange={(e) => {
                    const range = priceRanges.find(r => r.label === e.target.value);
                    if (range) setSelectedPriceRange(range);
                  }}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg"
                >
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.label}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" className="w-full" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredCourses.length}</span> courses
            </p>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl font-heading font-semibold text-foreground mb-2">
                No courses found
              </p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Courses;
