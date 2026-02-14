import { CheckCircle, Circle, Play, Lock, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number | null;
  order_index: number | null;
  completed?: boolean;
}

interface Section {
  title: string;
  lessons: Lesson[];
}

interface LessonSidebarProps {
  sections: Section[];
  currentLessonId: string;
  onLessonSelect: (lessonId: string) => void;
  courseTitle: string;
  overallProgress: number;
}

const LessonSidebar = ({ 
  sections, 
  currentLessonId, 
  onLessonSelect, 
  courseTitle,
  overallProgress 
}: LessonSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const completedLessons = sections.reduce(
    (acc, s) => acc + s.lessons.filter(l => l.completed).length, 
    0
  );

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-heading font-semibold text-foreground line-clamp-2 mb-3">
          {courseTitle}
        </h2>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-medium text-foreground">{overallProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons complete
          </p>
        </div>
      </div>

      {/* Sections & Lessons */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.includes(sectionIndex);
          const sectionCompleted = section.lessons.every(l => l.completed);
          const sectionProgress = section.lessons.length > 0
            ? Math.round((section.lessons.filter(l => l.completed).length / section.lessons.length) * 100)
            : 0;

          return (
            <div key={sectionIndex} className="border-b border-border">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    sectionCompleted 
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {sectionCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      sectionIndex + 1
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">
                      {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {section.lessons.length} lessons • {sectionProgress}% complete
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Lessons */}
              {isExpanded && (
                <div className="pb-2">
                  {section.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const isCompleted = lesson.completed;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          isCurrent 
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "hover:bg-muted/50",
                        )}
                      >
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : isCurrent ? (
                            <Play className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm line-clamp-2",
                            isCurrent ? "text-primary font-medium" : "text-foreground"
                          )}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration_minutes || 0} min</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonSidebar;