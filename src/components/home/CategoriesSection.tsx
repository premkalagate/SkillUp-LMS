import { ArrowRight, Code, Briefcase, Palette, Megaphone, BarChart3, Camera, Music, Dumbbell, BookOpen, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/services/api';

const categoryIcons: Record<string, { icon: LucideIcon; color: string }> = {
  'development': { icon: Code, color: 'bg-blue-500/10 text-blue-600' },
  'business': { icon: Briefcase, color: 'bg-amber-500/10 text-amber-600' },
  'design': { icon: Palette, color: 'bg-pink-500/10 text-pink-600' },
  'marketing': { icon: Megaphone, color: 'bg-green-500/10 text-green-600' },
  'data science': { icon: BarChart3, color: 'bg-violet-500/10 text-violet-600' },
  'photography': { icon: Camera, color: 'bg-cyan-500/10 text-cyan-600' },
  'music': { icon: Music, color: 'bg-rose-500/10 text-rose-600' },
  'health & fitness': { icon: Dumbbell, color: 'bg-emerald-500/10 text-emerald-600' },
};

const defaultIcon = { icon: BookOpen, color: 'bg-gray-500/10 text-gray-600' };

const CategoriesSection = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['course-categories'],
    queryFn: async () => {
      // Get all published courses
      const response = await courseApi.getCourses({ is_published: true });
      
      // Extract courses array from response object
      const courses = response?.courses || [];

      // Count courses per category
      const categoryCount: Record<string, number> = {};
      courses.forEach((course: any) => {
        if (course.category) {
          const cat = course.category;
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      });

      return Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
      }));
    },
  });

  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-20 md:py-28">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Explore by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through our diverse range of courses organized by popular categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const { icon: Icon, color } = categoryIcons[category.name.toLowerCase()] || defaultIcon;
            return (
              <Link
                key={category.name}
                to={`/courses?category=${category.name.toLowerCase()}`}
                className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-card-hover transition-all duration-300 opacity-0 animate-fade-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {category.count.toLocaleString()} {category.count === 1 ? 'course' : 'courses'}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
