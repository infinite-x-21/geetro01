import { Github, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-primary/20 bg-background/95 backdrop-blur-md py-6 px-4 text-foreground/80 glass-card">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
        {/* Brand Name */}
        <div className="text-lg font-semibold tracking-wide text-primary drop-shadow">GeetroX</div>

        {/* Navigation Links */}
        <div className="flex space-x-6 text-sm">
          <Link to="/" className="hover:text-primary transition-colors duration-200">Home</Link>
          <Link to="/stories" className="hover:text-primary transition-colors duration-200">Stories</Link>
          <Link to="/profile" className="hover:text-primary transition-colors duration-200">Profile</Link>
        </div>

        {/* Social Icons */}
        <div className="flex space-x-4">
          <a
            href="https://github.com/VivekBhalkar/pro-X"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors duration-200"
          >
            <Github size={20} />
          </a>
          <a
            href="https://www.instagram.com/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors duration-200"
          >
            <Instagram size={20} />
          </a>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} GeetroX. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
