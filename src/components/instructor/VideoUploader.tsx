import { useState, useRef } from 'react';
import { Upload, Film, X, CheckCircle, Loader2, Link as LinkIcon, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface VideoFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  duration?: string;
}

interface VideoLink {
  id: string;
  url: string;
  title: string;
  type: 'youtube' | 'other';
}

const VideoUploader = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const addVideoLink = () => {
    if (!videoUrl.trim()) {
      toast({
        title: 'Please enter a video URL',
        variant: 'destructive'
      });
      return;
    }

    const isYoutube = isYouTubeUrl(videoUrl);
    const videoId = isYoutube ? getYouTubeVideoId(videoUrl) : null;
    
    const newLink: VideoLink = {
      id: Math.random().toString(36).substr(2, 9),
      url: videoUrl,
      title: isYoutube && videoId ? `YouTube Video (${videoId})` : 'External Video',
      type: isYoutube ? 'youtube' : 'other'
    };

    setVideoLinks(prev => [...prev, newLink]);
    setVideoUrl('');
    
    toast({
      title: 'Video link added',
      description: isYoutube ? 'YouTube video linked successfully' : 'Video URL added successfully'
    });
  };

  const removeVideoLink = (id: string) => {
    setVideoLinks(prev => prev.filter(v => v.id !== id));
  };

  const simulateUpload = (file: File) => {
    const videoId = Math.random().toString(36).substr(2, 9);
    const newVideo: VideoFile = {
      id: videoId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading'
    };

    setVideos(prev => [...prev, newVideo]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setVideos(prev => 
          prev.map(v => 
            v.id === videoId 
              ? { ...v, progress: 100, status: 'complete', duration: '12:45' } 
              : v
          )
        );
      } else {
        setVideos(prev => 
          prev.map(v => 
            v.id === videoId 
              ? { ...v, progress } 
              : v
          )
        );
      }
    }, 200);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        simulateUpload(file);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Video
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Video URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-300
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className={`
                p-4 rounded-full transition-colors duration-300
                ${isDragging ? 'bg-primary/10' : 'bg-muted'}
              `}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">
                  {isDragging ? 'Drop your videos here' : 'Upload course videos'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports MP4, MOV, AVI, WebM (Max 2GB per file)
                </p>
              </div>
              <Button variant="outline" type="button" className="mt-2">
                Browse Files
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="link" className="mt-4">
          {/* Video URL Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
              <Youtube className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Add YouTube or external video</p>
                <p className="text-xs text-muted-foreground">Paste a YouTube, Vimeo, or any video URL</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addVideoLink()}
              />
              <Button onClick={addVideoLink} variant="outline">
                Add Link
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Uploaded Videos List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Uploaded Videos</h4>
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Film className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {video.name}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {video.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                    {video.status === 'complete' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(video.size)}
                    </span>
                    {video.duration && (
                      <span className="text-xs text-muted-foreground">
                        {video.duration}
                      </span>
                    )}
                  </div>
                </div>
                
                {video.status === 'uploading' && (
                  <Progress value={video.progress} className="h-1.5" />
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVideo(video.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Linked Videos List */}
      {videoLinks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Linked Videos</h4>
          {videoLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border"
            >
              <div className={`p-2 rounded-lg ${link.type === 'youtube' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                {link.type === 'youtube' ? (
                  <Youtube className="w-5 h-5 text-red-500" />
                ) : (
                  <LinkIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {link.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {link.url}
                </p>
              </div>

              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVideoLink(link.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
