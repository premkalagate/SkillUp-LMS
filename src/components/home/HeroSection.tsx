import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight mb-6 opacity-0 animate-fade-up">
            Empower your future with the courses designed to{' '}
            <span className="underline-sketch text-primary">fit your choice.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up delay-100">
            We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
          </p>

          {/* Search bar */}
          <form 
            onSubmit={handleSearch}
            className="relative max-w-xl mx-auto mb-12 opacity-0 animate-fade-up delay-200"
          >
            <div className="relative flex items-center bg-background rounded-full border-2 border-border shadow-lg focus-within:border-primary focus-within:shadow-glow transition-all duration-300">
              <Search className="absolute left-5 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for courses..."
                className="w-full h-14 pl-14 pr-32 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base rounded-full"
              />
              <Button 
                type="submit"
                variant="hero" 
                size="lg"
                className="absolute right-2 rounded-full"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="flex flex-wrap items-center justify-center gap-3 opacity-0 animate-fade-up delay-300">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {['JavaScript', 'Python', 'React', 'Data Science', 'Machine Learning'].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/courses?search=${encodeURIComponent(tag)}`)}
                className="px-4 py-2 text-sm bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
