import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, GraduationCap, BookOpen, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from '@/components/ThemeToggle';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isInstructor } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <GraduationCap className="w-8 h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Skill<span className="text-primary">Up</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/courses" 
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              All Courses
            </Link>
            {user && !isInstructor() && (
              <Link 
                to="/my-learning" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                <GraduationCap className="w-4 h-4" />
                My Learning
              </Link>
            )}
            {isInstructor() && (
              <Link 
                to="/instructor" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Instructor Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                        {user.full_name || 'User'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {!isInstructor() && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/my-learning" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        My Learning
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isInstructor() && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/instructor" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Instructor Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Create Account</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 animate-fade-in">
            <div className="flex flex-col gap-4 pt-4 border-t border-border">
              <Link 
                to="/courses" 
                className="text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                All Courses
              </Link>
              {user && !isInstructor() && (
                <Link 
                  to="/my-learning" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <GraduationCap className="w-4 h-4" />
                  My Learning
                </Link>
              )}
              {isInstructor() && (
                <Link 
                  to="/instructor" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen className="w-4 h-4" />
                  Instructor Dashboard
                </Link>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex flex-col gap-2 pt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 py-2 px-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-destructive"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                    </Button>
                    <Button variant="hero" asChild className="w-full">
                      <Link to="/signup" onClick={() => setIsMenuOpen(false)}>Create Account</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
