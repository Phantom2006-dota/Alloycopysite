import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import About from "./pages/About";
import Team from "./pages/Team";
import Contact from "./pages/Contact";
import Books from "./pages/Books";
import TV from "./pages/TV";
import Film from "./pages/Film";
import Publishing from "./pages/Publishing";
import Foundation from "./pages/Foundation";
import Training from "./pages/Training";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import ShopCategory from "./pages/ShopCategory";
import ShopProduct from "./pages/ShopProduct";
import Catalogue from "./pages/Catalogue";

import BlogList from "./pages/blog/BlogList";
import BlogArticle from "./pages/blog/BlogArticle";

import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFailed from "./pages/payment/PaymentFailed";
import PaymentCancelled from "./pages/payment/PaymentCancelled";

import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminArticles from "./pages/admin/Articles";
import ArticleEditor from "./pages/admin/ArticleEditor";
import AdminCategories from "./pages/admin/Categories";
import AdminMedia from "./pages/admin/Media";
import AdminTeam from "./pages/admin/Team";
import AdminEvents from "./pages/admin/Events";
import AdminSettings from "./pages/admin/Settings";
import AdminUploads from "./pages/admin/Uploads";
import AdminProducts from "./pages/admin/Products";
import AdminProductCategories from "./pages/admin/ProductCategories";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/books" element={<Books />} />
              <Route path="/tv" element={<TV />} />
              <Route path="/film" element={<Film />} />
              <Route path="/publishing" element={<Publishing />} />
              <Route path="/foundation" element={<Foundation />} />
              <Route path="/training" element={<Training />} />
              <Route path="/events" element={<Events />} />
              
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:category" element={<ShopCategory />} />
              <Route path="/shop/product/:slug" element={<ShopProduct />} />
              <Route path="/catalogue" element={<Catalogue />} />
              
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />
              <Route path="/payment/cancelled" element={<PaymentCancelled />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/articles"
                element={
                  <ProtectedRoute>
                    <AdminArticles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/articles/:id"
                element={
                  <ProtectedRoute>
                    <ArticleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute>
                    <AdminCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/product-categories"
                element={
                  <ProtectedRoute>
                    <AdminProductCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/media/:type"
                element={
                  <ProtectedRoute>
                    <AdminMedia />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/uploads"
                element={
                  <ProtectedRoute>
                    <AdminUploads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/team"
                element={
                  <ProtectedRoute>
                    <AdminTeam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute>
                    <AdminEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


