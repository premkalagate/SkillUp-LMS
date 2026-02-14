import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  onProgressUpdate?: (seconds: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
}

// Helper function to detect and convert YouTube URLs
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

const VideoPlayer = ({ videoUrl, title, onProgressUpdate, onComplete, initialProgress = 0 }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const youtubeVideoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const isYouTube = !!youtubeVideoId;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialProgress > 0) {
        video.currentTime = initialProgress;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgressUpdate?.(video.currentTime);
      
      // Mark as complete when 90% watched
      if (video.duration && video.currentTime / video.duration > 0.9) {
        onComplete?.();
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [initialProgress, onProgressUpdate, onComplete, isYouTube]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changePlaybackSpeed = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // YouTube player state and refs
  const youtubePlayerRef = useRef<any>(null);
  const playerStateRef = useRef({
    isReady: false,
    duration: 0,
    currentTime: 0,
    intervalId: null as NodeJS.Timeout | null
  });
  
  // Load YouTube IFrame API script
  const loadYouTubeAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.YT) {
        resolve();
        return;
      }
      
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
      
      const scriptTag = document.createElement('script');
      scriptTag.src = 'https://www.youtube.com/iframe_api';
      scriptTag.async = true;
      scriptTag.onload = () => {
        // API will call onYouTubeIframeAPIReady when ready
      };
      scriptTag.onerror = () => reject(new Error('Failed to load YouTube API'));
      document.head.appendChild(scriptTag);
    });
  }, []);
  
  // Initialize YouTube player
  const initYouTubePlayer = useCallback(async () => {
    if (!youtubeVideoId || !isYouTube) return;
    
    try {
      await loadYouTubeAPI();
      
      // Wait for YT to be fully loaded
      if (!window.YT) {
        console.error('YouTube API not available after loading');
        return;
      }
      
      // Create player
      youtubePlayerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          'onReady': (event: any) => {
            playerStateRef.current.isReady = true;
            playerStateRef.current.duration = event.target.getDuration();
            
            // Start tracking progress
            if (playerStateRef.current.intervalId) {
              clearInterval(playerStateRef.current.intervalId);
            }
            
            playerStateRef.current.intervalId = setInterval(() => {
              if (playerStateRef.current.isReady) {
                const newCurrentTime = youtubePlayerRef.current.getCurrentTime();
                
                // Only update if time has changed
                if (newCurrentTime !== playerStateRef.current.currentTime) {
                  playerStateRef.current.currentTime = newCurrentTime;
                  onProgressUpdate?.(newCurrentTime);
                  
                  // Mark as complete when 90% watched
                  if (playerStateRef.current.duration && newCurrentTime / playerStateRef.current.duration > 0.9) {
                    onComplete?.();
                  }
                }
              }
            }, 1000); // Update every second
          },
          'onStateChange': (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onComplete?.();
            }
          },
          'onError': (error: any) => {
            console.error('YouTube player error:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  }, [youtubeVideoId, isYouTube, loadYouTubeAPI, onProgressUpdate, onComplete]);
  
  // Clean up YouTube player on unmount
  useEffect(() => {
    return () => {
      if (playerStateRef.current.intervalId) {
        clearInterval(playerStateRef.current.intervalId);
        playerStateRef.current.intervalId = null;
      }
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.destroy === 'function') {
        youtubePlayerRef.current.destroy();
      }
    };
  }, []);
  
  // Initialize YouTube player when component mounts and isYouTube is true
  useEffect(() => {
    if (isYouTube) {
      initYouTubePlayer();
    }
    
    return () => {
      if (playerStateRef.current.intervalId) {
        clearInterval(playerStateRef.current.intervalId);
        playerStateRef.current.intervalId = null;
      }
    };
  }, [isYouTube, initYouTubePlayer]);
  
  // Render YouTube embed if it's a YouTube URL
  if (isYouTube) {
    return (
      <div className="relative bg-foreground rounded-xl overflow-hidden">
        <div id="youtube-player" className="w-full aspect-video" />
      </div>
    );
  }

  return (
    <div 
      className="relative bg-foreground rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <Play className="w-16 h-16 text-primary/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Video for: {title}</p>
          </div>
        </div>
      )}

      {/* Controls Overlay - only for non-YouTube videos */}
      {videoUrl && (
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Center Play Button */}
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            )}
          </button>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-background/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-background hover:text-background hover:bg-background/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                {/* Skip Back */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-10)}
                  className="text-background hover:text-background hover:bg-background/20"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(10)}
                  className="text-background hover:text-background hover:bg-background/20"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-background hover:text-background hover:bg-background/20"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20 hidden sm:block">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-background hover:text-background hover:bg-background/20 text-sm"
                    >
                      {playbackSpeed}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <DropdownMenuItem
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        className={playbackSpeed === speed ? 'bg-primary/10 text-primary' : ''}
                      >
                        {speed}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-background hover:text-background hover:bg-background/20"
                >
                  <Settings className="w-5 h-5" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-background hover:text-background hover:bg-background/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {videoUrl && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-background/20">
          <div 
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;