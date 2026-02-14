import { Link } from "react-router-dom";
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/90">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-2xl font-heading font-bold text-background">
                Skill<span className="text-primary">Up</span>
              </span>
            </Link>
            <p className="text-background/70 mb-6 leading-relaxed">
              Empowering learners worldwide with top-quality courses from industry experts. Start your learning journey
              today.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-background mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-background/70 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-background/70 hover:text-primary transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-background/70 hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-background/70 hover:text-primary transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-background mb-6">Categories</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/courses?category=Development"
                  className="text-background/70 hover:text-primary transition-colors"
                >
                  Development
                </Link>
              </li>
              <li>
                <Link to="/courses?category=Design" className="text-background/70 hover:text-primary transition-colors">
                  Design
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?category=Business"
                  className="text-background/70 hover:text-primary transition-colors"
                >
                  Business
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?category=Marketing"
                  className="text-background/70 hover:text-primary transition-colors"
                >
                  Marketing
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?category=Data Science"
                  className="text-background/70 hover:text-primary transition-colors"
                >
                  Data Science
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-background mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-background/70">123 Learning Street, Mumbai City, EC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a
                  href="mailto:support@skillup.com"
                  className="text-background/70 hover:text-primary transition-colors"
                >
                  support@skillup.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="tel:+1234567890" className="text-background/70 hover:text-primary transition-colors">
                  +91 9876543210
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">© 2025 SkillUp. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/privacy" className="text-background/60 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-background/60 hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-background/60 hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
