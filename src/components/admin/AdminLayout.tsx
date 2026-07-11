import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  Calendar,
  Tags,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Film,
  Book,
  Tv,
  ShoppingBag,
  Package,
  Globe,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FileText, label: "Articles", path: "/admin/articles" },
  { icon: Globe, label: "Blog Pages", path: "/admin/blog" },
  { icon: Tags, label: "Categories", path: "/admin/categories" },
  { icon: ShoppingBag, label: "Products", path: "/admin/products" },
  { icon: Package, label: "Product Categories", path: "/admin/product-categories" },
  { icon: Book, label: "Books", path: "/admin/media/books" },
  { icon: Film, label: "Films", path: "/admin/media/films" },
  { icon: Tv, label: "TV Shows", path: "/admin/media/tv" },
  { icon: FolderOpen, label: "Media Library", path: "/admin/uploads" },
  { icon: Users, label: "Team", path: "/admin/team" },
  { icon: Calendar, label: "Events", path: "/admin/events" },
  { icon: Newspaper, label: "Press", path: "/admin/press" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-background rounded-md border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-transform md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 p-6 border-b">
            <span className="text-xl font-semibold font-serif">BAUHAUS</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
              CMS
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {isAdmin && (
              <>
                <Separator className="my-4" />
                <nav className="space-y-1">
                  <Link
                    to="/admin/settings"
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      location.pathname === "/admin/settings"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </nav>
              </>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="md:pl-64">
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
