import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Instagram, Linkedin, Facebook } from "lucide-react";
import logoLight from "@/assets/dark.png";
import logoDark from "@/assets/light.png";

const XIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { resolvedTheme } = useTheme();

  return (
    <footer className="mt-auto border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex justify-center mb-8">
          <img
            // Inverted to match the Header: dark theme uses light logo, light theme uses dark logo
            src={resolvedTheme === "dark" ? logoLight : logoDark}
            alt="Bauhaus Production"
            className="h-12 w-auto opacity-80"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8 text-center md:text-left">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-3 text-foreground">
              UK Office
            </h4>
            <p className="text-sm text-muted-foreground">
              4 Notre Dame Mews, Northampton, NN1 2BG
            </p>
            <p className="text-sm text-muted-foreground">+44 1604 434082</p>
            <a
              href="mailto:info@bauhausproduction.com"
              className="text-sm link-accent"
            >
              info@bauhausproduction.com
            </a>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-3 text-foreground">
              Nigeria Office
            </h4>
            <p className="text-sm text-muted-foreground">
              41 Coker Road, Ilupeju, Lagos
            </p>
            <p className="text-sm text-muted-foreground">+234 703 889 2961</p>
            <a
              href="mailto:akinalaka@bauhaus-education.co.uk"
              className="text-sm link-accent"
            >
              akinalaka@bauhaus-education.co.uk
            </a>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <XIcon className="w-5 h-5" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Facebook className="w-5 h-5" />
          </a>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-xs text-muted-foreground">
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="hidden md:inline text-border">|</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms and Conditions
          </Link>
          <span className="hidden md:inline text-border">|</span>
          <span>© BAUHAUS {currentYear}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
