import { Users, BookOpen, Award, Globe } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '100+',
    label: 'Active Learners',
  },
  {
    icon: BookOpen,
    value: '100+',
    label: 'Quality Courses',
  },
  {
    icon: Award,
    value: '95%',
    label: 'Success Rate',
  },
  {
    icon: Globe,
    value: '10+',
    label: 'Countries',
  },
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-foreground/10 mb-4">
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-3xl md:text-4xl font-heading font-bold mb-2">
                {stat.value}
              </div>
              <p className="text-primary-foreground/80 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
