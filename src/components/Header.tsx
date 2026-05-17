import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeToggle from "./ThemeToggle";
import logoLight from "@/assets/dark.png";
import logoDark from "@/assets/light.png";

// --- New Navigation Data Structure ---
const navItems = [
  { name: "Home", path: "/" },
  {
    name: "About",
    path: "/about",
    dropdown: [
      { name: "About Us", path: "/about" },
      { name: "Contact", path: "/contact" },
      { name: "Blog", path: "/blog" },
      { name: "Events", path: "/events" },
      { name: "Team", path: "/team" },
    ],
  },
  {
    name: "Services",
    path: "/services",
    dropdown: [
      { name: "Films", path: "/film" },
      { name: "TV", path: "/tv" },
      { name: "Books", path: "/books" },
      { name: "Publishing", path: "/publishing" },
      { name: "Foundation", path: "/foundation" },
      { name: "Training", path: "/training" },
    ],
  },
  { name: "Shop", path: "/shop" },
];

// --- Dropdown Component for Desktop Navigation ---
const DropdownNavItem = ({ item, isActive }: { item: typeof navItems[number], isActive: (path: string) => boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li
      className="relative group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        to={item.path}
        className={`nav-link flex items-center gap-1 py-2 text-sm font-medium tracking-wide ${
          isActive(item.path) ? "text-foreground font-semibold" : "hover:text-foreground"
        }`}
      >
        {item.name}
        <ChevronDown className="w-5 h-5 transition-transform duration-200 group-hover:rotate-180" />
      </Link>
      {item.dropdown && (
        <div
          className={`absolute left-0 mt-0 w-56 bg-background border border-border rounded-lg shadow-xl transition-all duration-300 ease-in-out ${
            isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
          }`}
        >
          <ul className="py-3">
            {item.dropdown.map((subItem) => (
              <li key={subItem.path}>
                <Link
                  to={subItem.path}
                  className={`block px-5 py-3 text-base ${
                    isActive(subItem.path) ? "text-primary font-semibold bg-primary/10" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {subItem.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

// --- Main Header Component ---
const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdowns, setOpenMobileDropdowns] = useState<string[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMobileDropdowns([]);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileDropdown = (itemName: string) => {
    setOpenMobileDropdowns(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Determine which logo to use based on theme
  const currentLogo = resolvedTheme === "dark" ? logoLight : logoDark;
  const logoAlt = "Bauhaus Production";

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <nav className="mx-auto max-w-7xl px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={currentLogo} alt={logoAlt} className="h-15  w-auto" />
              {/* md:h-11 */}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <ul className="flex items-center gap-6 lg:gap-8">
                {navItems.map((item) => {
                  if (item.dropdown) {
                    return (
                      <DropdownNavItem
                        key={item.name}
                        item={item}
                        isActive={isActive}
                      />
                    );
                  }
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`nav-link text-sm font-medium tracking-wide ${
                          isActive(item.path) ? "text-foreground font-semibold" : "hover:text-foreground"
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button and Theme Toggle */}
            <div className="md:hidden flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-foreground relative z-[60]"
                data-testid="button-mobile-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[55] bg-background transition-all duration-500 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "opacity-100 visible translate-x-0"
            : "opacity-0 invisible translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-start h-full pt-24 overflow-y-auto pb-8">
          <nav className="flex flex-col items-center w-full max-w-md px-6">
            {navItems.map((item, index) => {
              const isDropdownOpen = openMobileDropdowns.includes(item.name);
              
              return (
                <div key={item.name} className="w-full mb-4">
                  {item.dropdown ? (
                    <>
                      {/* Dropdown Header */}
                      <button
                        onClick={() => toggleMobileDropdown(item.name)}
                        className={`flex items-center justify-between w-full py-4 text-2xl tracking-wide transition-all duration-300 ${
                          isActive(item.path) || isDropdownOpen
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{
                          transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms",
                          transform: mobileMenuOpen
                            ? "translateY(0)"
                            : "translateY(20px)",
                          opacity: mobileMenuOpen ? 1 : 0,
                        }}
                        data-testid={`button-mobile-${item.name.toLowerCase()}`}
                      >
                        <span>{item.name}</span>
                        <ChevronRight 
                          className={`w-6 h-6 transition-transform duration-300 ${
                            isDropdownOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                      
                      {/* Dropdown Content */}
                      <div
                        className={`overflow-hidden transition-all duration-400 ease-in-out ${
                          isDropdownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="pl-4 border-l-2 border-muted ml-2 mt-2 mb-4">
                          {item.dropdown.map((subItem, subIndex) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`block py-3 text-xl transition-all duration-300 ${
                                isActive(subItem.path)
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              style={{
                                transitionDelay: mobileMenuOpen ? `${(index * 50) + ((subIndex + 1) * 30)}ms` : "0ms",
                                transform: mobileMenuOpen && isDropdownOpen
                                  ? "translateX(0)"
                                  : "translateX(-20px)",
                                opacity: mobileMenuOpen && isDropdownOpen ? 1 : 0,
                              }}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setOpenMobileDropdowns([]);
                              }}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Regular Link */
                    <Link
                      to={item.path}
                      className={`block w-full py-4 text-2xl tracking-wide text-center transition-all duration-300 ${
                        isActive(item.path)
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{
                        transitionDelay: mobileMenuOpen ? `${index * 50}ms` : "0ms",
                        transform: mobileMenuOpen
                          ? "translateY(0)"
                          : "translateY(20px)",
                        opacity: mobileMenuOpen ? 1 : 0,
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`link-mobile-${item.name.toLowerCase()}`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
