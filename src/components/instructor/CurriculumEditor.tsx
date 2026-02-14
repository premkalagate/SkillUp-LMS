import { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Film, 
  FileText,
  Edit2,
  Check,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'article';
  duration?: number;
  videoUrl?: string;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CurriculumEditorProps {
  sections?: Section[];
  onChange?: (sections: Section[]) => void;
}

const CurriculumEditor = ({ sections: initialSections, onChange }: CurriculumEditorProps) => {
  const [sections, setSections] = useState<Section[]>(initialSections || []);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [durationInput, setDurationInput] = useState('');

  useEffect(() => {
    if (initialSections) {
      setSections(initialSections);
    }
  }, [initialSections]);

  const updateSections = (newSections: Section[]) => {
    setSections(newSections);
    onChange?.(newSections);
  };

  const toggleSection = (sectionId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const addSection = () => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Section',
      lessons: [],
      isExpanded: true
    };
    updateSections([...sections, newSection]);
    setEditingSection(newSection.id);
    setEditValue('New Section');
  };

  const addLesson = (sectionId: string) => {
    const newLesson: Lesson = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Lesson',
      type: 'video',
    };
    updateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lessons: [...s.lessons, newLesson], isExpanded: true }
        : s
    ));
    setEditingLesson(newLesson.id);
    setEditValue('New Lesson');
  };

  const deleteSection = (sectionId: string) => {
    updateSections(sections.filter(s => s.id !== sectionId));
  };

  const deleteLesson = (sectionId: string, lessonId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) }
        : s
    ));
    if (selectedLesson === lessonId) {
      setSelectedLesson(null);
    }
  };

  const startEditingSection = (sectionId: string, currentTitle: string) => {
    setEditingSection(sectionId);
    setEditValue(currentTitle);
  };

  const saveSection = (sectionId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId ? { ...s, title: editValue } : s
    ));
    setEditingSection(null);
    setEditValue('');
  };

  const startEditingLesson = (lessonId: string, currentTitle: string) => {
    setEditingLesson(lessonId);
    setEditValue(currentTitle);
  };

  const saveLesson = (sectionId: string, lessonId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lessons: s.lessons.map(l => 
            l.id === lessonId ? { ...l, title: editValue } : l
          )}
        : s
    ));
    setEditingLesson(null);
    setEditValue('');
  };

  const handleSelectLesson = (lessonId: string) => {
    if (selectedLesson === lessonId) {
      setSelectedLesson(null);
      setVideoUrlInput('');
      setDurationInput('');
    } else {
      setSelectedLesson(lessonId);
      // Find the lesson and pre-fill inputs
      const lesson = sections.flatMap(s => s.lessons).find(l => l.id === lessonId);
      if (lesson) {
        setVideoUrlInput(lesson.videoUrl || '');
        setDurationInput(lesson.duration?.toString() || '');
      }
    }
  };

  const saveVideoDetails = (sectionId: string, lessonId: string) => {
    updateSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, lessons: s.lessons.map(l => 
            l.id === lessonId 
              ? { 
                  ...l, 
                  videoUrl: videoUrlInput.trim() || undefined, 
                  duration: durationInput ? parseInt(durationInput) : undefined 
                } 
              : l
          )}
        : s
    ));
    setSelectedLesson(null);
    setVideoUrlInput('');
    setDurationInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Course Curriculum</h3>
          <p className="text-sm text-muted-foreground">Organize your course content into sections and lessons</p>
        </div>
        <Button onClick={addSection} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id} className="border-border/50 overflow-hidden">
            {/* Section Header */}
            <div className="bg-muted/50 border-b border-border">
              <div className="flex items-center gap-3 p-4">
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                <button
                  onClick={() => toggleSection(section.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  {section.isExpanded 
                    ? <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  }
                </button>

                {editingSection === section.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveSection(section.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveSection(section.id)}>
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingSection(null)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-foreground flex-1">{section.title}</span>
                    <span className="text-sm text-muted-foreground mr-4">
                      {section.lessons.length} lessons
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startEditingSection(section.id, section.title)}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Lessons */}
            {section.isExpanded && (
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {section.lessons.map((lesson) => (
                    <div key={lesson.id}>
                      <div 
                        className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                          selectedLesson === lesson.id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => handleSelectLesson(lesson.id)}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <div className={`p-1.5 rounded ${lesson.type === 'video' ? 'bg-primary/10' : 'bg-muted'}`}>
                          {lesson.type === 'video' 
                            ? <Film className="w-4 h-4 text-primary" />
                            : <FileText className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>

                        {editingLesson === lesson.id ? (
                          <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 flex-1"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && saveLesson(section.id, lesson.id)}
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveLesson(section.id, lesson.id)}>
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingLesson(null)}>
                              <X className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-foreground flex-1">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                            )}
                            {lesson.videoUrl ? (
                              <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">
                                Video added
                              </span>
                            ) : lesson.type === 'video' && (
                              <span className="text-xs text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded">
                                No video
                              </span>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingLesson(lesson.id, lesson.title);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLesson(section.id, lesson.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Video URL Input Section */}
                      {selectedLesson === lesson.id && lesson.type === 'video' && (
                        <div className="p-4 bg-muted/30 border-t border-border space-y-4" onClick={e => e.stopPropagation()}>
                          <div className="space-y-2">
                            <Label htmlFor={`video-url-${lesson.id}`} className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4" />
                              Video URL (YouTube or direct link)
                            </Label>
                            <Input
                              id={`video-url-${lesson.id}`}
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={videoUrlInput}
                              onChange={(e) => setVideoUrlInput(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`duration-${lesson.id}`}>Duration (minutes)</Label>
                            <Input
                              id={`duration-${lesson.id}`}
                              type="number"
                              placeholder="10"
                              className="w-32"
                              value={durationInput}
                              onChange={(e) => setDurationInput(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => saveVideoDetails(section.id, lesson.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Save Video
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedLesson(null);
                                setVideoUrlInput('');
                                setDurationInput('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Lesson Button */}
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => addLesson(section.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border">
          <p className="text-muted-foreground mb-4">No sections yet. Start building your curriculum!</p>
          <Button onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Section
          </Button>
        </div>
      )}
    </div>
  );
};

export default CurriculumEditor;