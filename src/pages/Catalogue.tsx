import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import logoLight from "@/assets/light.png";
import logoDark from "@/assets/dark.png";
import { Plus, Minus, ArrowRight, Globe, Bookmark, CreditCard, Sun, Moon } from "lucide-react";
import CheckoutModal from "@/components/CheckoutModal";

const WHATSAPP_NUMBER = "2347038892961";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const CONTACT = {
  nigeria: {
    label: "Nigeria Office",
    address: "41 Coker Road, Ilupeju, Lagos",
    phone: "+234 703 889 2961",
    email: "akinalaka@bauhaus-education.co.uk",
  },
  uk: {
    label: "UK Office",
    address: "4 Notre Dame Mews, Northampton, NN1 2BG",
    phone: "+44 1604 434082",
    email: "info@bauhausproduction.com",
  },
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  featuredImage: string | null;
  images: string | null;
  isInStock: boolean;
  isFeatured: boolean;
  sku: string | null;
  category?: ProductCategory | null;
  metaTitle: string | null;
  metaDescription: string | null;
  provenance: string | null;
  technique: string | null;
  historicalContext: string | null;
  novelExcerpt: string | null;
  makerStory: string | null;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

function AccordionRow({ label, content }: { label: string; content: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-200 dark:border-[#2a2a2a]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 px-4 text-xs tracking-[0.15em] uppercase text-gray-400 dark:text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <span>{label}</span>
        {open ? <Minus size={12} /> : <Plus size={12} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-gray-500 dark:text-[#666] leading-relaxed whitespace-pre-line">
          {content?.trim() || (
            <span className="italic text-gray-300 dark:text-[#444]">No information available for this item.</span>
          )}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const images: string[] = (() => {
    if (!product.images) return [];
    try { return JSON.parse(product.images); } catch { return []; }
  })();
  const allImages = product.featuredImage
    ? [product.featuredImage, ...images.filter((i) => i !== product.featuredImage)]
    : images;
  const displayImages = allImages.slice(0, 2);
  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="border-t border-gray-100 dark:border-[#1e1e1e] py-10">
      <div className="flex flex-col lg:flex-row gap-0">
        {/* Images */}
        <div className="w-full lg:w-[42%] flex-shrink-0">
          <div className="grid grid-cols-2 gap-0.5">
            {displayImages.length >= 2 ? (
              <>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-[#111]">
                  <img src={displayImages[0]} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-[#111]">
                  <img src={displayImages[1]} alt={product.title} className="w-full h-full object-cover" />
                </div>
              </>
            ) : displayImages.length === 1 ? (
              <>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-[#111]">
                  <img src={displayImages[0]} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] bg-gray-50 dark:bg-[#111] flex items-center justify-center">
                  <span className="text-gray-300 dark:text-[#333] text-xs tracking-widest uppercase">No image</span>
                </div>
              </>
            ) : (
              <>
                <div className="aspect-[3/4] bg-gray-100 dark:bg-[#111] flex items-center justify-center">
                  <span className="text-gray-300 dark:text-[#333] text-xs tracking-widest uppercase">No image</span>
                </div>
                <div className="aspect-[3/4] bg-gray-50 dark:bg-[#0d0d0d]" />
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="w-full lg:w-[58%] flex flex-col lg:pl-10 pt-6 lg:pt-0">
          <div className="flex items-start justify-between mb-4">
            <span className="text-gray-300 dark:text-[#555] text-xs tracking-widest">{num}</span>
            <span className="text-gray-400 dark:text-[#555] text-[10px] tracking-[0.2em] uppercase">
              {product.category?.name || "Uncategorised"}
            </span>
          </div>

          <h2 className="font-serif text-xl md:text-2xl text-gray-900 dark:text-white uppercase leading-tight tracking-wide mb-3">
            {product.title}
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-900 dark:text-white text-lg font-light">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-gray-400 dark:text-[#555] text-sm line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            {!product.isInStock ? (
              <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 dark:text-[#888] border border-gray-200 dark:border-[#333] px-2 py-0.5">
                Out of Stock
              </span>
            ) : (
              <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 dark:text-[#888]">
                Made to Order
              </span>
            )}
          </div>

          {(product.shortDescription || product.description) && (
            <p className="text-gray-500 dark:text-[#888] text-xs leading-relaxed mb-6 max-w-md">
              {product.shortDescription || product.description}
            </p>
          )}

          <div className="mb-6 space-y-2">
            {product.sku && (
              <div className="flex gap-4 text-xs">
                <span className="text-gray-400 dark:text-[#555] uppercase tracking-widest w-20 flex-shrink-0">SKU</span>
                <span className="text-gray-600 dark:text-[#aaa]">{product.sku}</span>
              </div>
            )}
            {product.category && (
              <div className="flex gap-4 text-xs">
                <span className="text-gray-400 dark:text-[#555] uppercase tracking-widest w-20 flex-shrink-0">Category</span>
                <span className="text-gray-600 dark:text-[#aaa]">{product.category.name}</span>
              </div>
            )}
            {product.metaTitle && (
              <div className="flex gap-4 text-xs">
                <span className="text-gray-400 dark:text-[#555] uppercase tracking-widest w-20 flex-shrink-0">Origin</span>
                <span className="text-gray-600 dark:text-[#aaa]">{product.metaTitle}</span>
              </div>
            )}
          </div>

          <div className="border-b border-gray-100 dark:border-[#2a2a2a] mb-6">
            <AccordionRow label="Provenance" content={product.provenance} />
            <AccordionRow label="Technique" content={product.technique} />
            <AccordionRow label="Historical Context" content={product.historicalContext} />
            <AccordionRow label="Novel Excerpt" content={product.novelExcerpt} />
            <AccordionRow label="Maker Story" content={product.makerStory} />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {product.isInStock ? (
              <button
                onClick={() => setCheckoutOpen(true)}
                className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black text-xs tracking-[0.15em] uppercase px-5 py-3 hover:bg-gray-700 dark:hover:bg-[#e0e0e0] transition-colors flex-1"
              >
                <CreditCard size={14} />
                Buy Now — {formatPrice(product.price)}
              </button>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-400 dark:text-[#555] text-xs tracking-[0.15em] uppercase px-5 py-3 cursor-not-allowed flex-1"
              >
                Out of Stock
              </button>
            )}

            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hi, I'm interested in: ${product.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#888] text-xs tracking-[0.12em] uppercase px-4 py-3 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Enquire
            </a>

            <button className="flex items-center justify-center gap-1.5 border border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#555] text-xs tracking-[0.12em] uppercase px-4 py-3 hover:border-gray-400 dark:hover:border-[#444] hover:text-gray-600 dark:hover:text-[#888] transition-colors">
              <Bookmark size={12} />
              Save
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        product={{ id: product.id, title: product.title, price: product.price }}
      />
    </div>
  );
}

export default function Catalogue() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const logo = theme === "dark" ? logoDark : logoLight;
  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const { data: categoriesData } = useQuery<ProductCategory[]>({
    queryKey: ["catalogueCategories"],
    queryFn: () => api.productCategories.list(),
  });

  const { data: productsData, isLoading } = useQuery<{ products: Product[]; pagination: any }>({
    queryKey: ["catalogueProducts", activeCategory],
    queryFn: () => api.products.list({ limit: 50, category: activeCategory || undefined }),
  });

  const categories = categoriesData || [];
  const products = productsData?.products || [];

  const sidebarCategories = categories.map((cat, i) => ({
    num: String(i + 1).padStart(2, "0"),
    label: cat.name.toUpperCase(),
    slug: cat.slug,
  }));

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "dark" : ""} bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white`}>
      {/* ── SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-[200px] xl:w-[220px] flex-shrink-0 bg-gray-50 dark:bg-[#0d0d0d] border-r border-gray-200 dark:border-[#1a1a1a] sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <img src={logo} alt="Bauhaus Production" className="w-16 mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 dark:text-[#555]">Catalogue</p>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#555] hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`block w-full text-left mb-5 transition-opacity ${!activeCategory ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
          >
            <span className={`text-[10px] tracking-[0.2em] uppercase block mb-0.5 ${!activeCategory ? "text-gray-900 dark:text-white font-semibold" : "text-gray-400 dark:text-[#555]"}`}>
              00
            </span>
            <span className={`text-xs tracking-wide ${!activeCategory ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-[#888]"}`}>
              All Objects
            </span>
          </button>

          {sidebarCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug === activeCategory ? null : cat.slug)}
              className={`block w-full text-left mb-5 transition-opacity ${activeCategory === cat.slug ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              <span className={`text-[10px] tracking-[0.2em] uppercase block mb-0.5 ${activeCategory === cat.slug ? "text-gray-900 dark:text-white font-semibold" : "text-gray-400 dark:text-[#555]"}`}>
                {cat.num}
              </span>
              <span className={`text-xs tracking-wide leading-tight ${activeCategory === cat.slug ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-[#888]"}`}>
                {cat.label}
              </span>
            </button>
          ))}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#1a1a1a] space-y-4">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#888] transition-colors cursor-default">
              About The Lagoon
            </p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#888] transition-colors cursor-default">
              Provenance
            </p>
            <a
              href={`mailto:${CONTACT.nigeria.email}`}
              className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#444] hover:text-gray-700 dark:hover:text-[#888] transition-colors"
            >
              Contact
            </a>
          </div>
        </nav>

        <div className="px-4 py-6 border-t border-gray-200 dark:border-[#1a1a1a]">
          <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#444] mb-1">Lagos, Nigeria</p>
          <div className="flex items-center gap-1.5 mb-1">
            <Globe size={10} className="text-gray-400 dark:text-[#444]" />
            <p className="text-[10px] tracking-[0.1em] uppercase text-gray-400 dark:text-[#444]">Global Delivery</p>
          </div>
          <p className="text-[10px] text-gray-300 dark:text-[#333] tracking-widest">DHL / UPS</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0d0d0d]">
          <img src={logo} alt="Bauhaus Production" className="w-12" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 dark:text-[#555]">Catalogue</p>
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 dark:text-[#555] hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Hero */}
        <section className="px-6 lg:px-12 pt-12 pb-10 border-b border-gray-200 dark:border-[#1a1a1a]">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 dark:text-[#666] mb-4">Bauhaus Production</p>
          <h1 className="font-serif text-4xl md:text-5xl xl:text-6xl uppercase leading-none tracking-tight text-gray-900 dark:text-white mb-2">
            Curated<br />Heritage<br />Objects
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-gray-400 dark:text-[#555] mb-8">From the World of Eko</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-8">
            {["All", ...categories.map((c) => c.name)].map((cat, i) => {
              const slug = i === 0 ? null : categories[i - 1]?.slug;
              const isActive = i === 0 ? !activeCategory : activeCategory === slug;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(slug)}
                  className={`text-[10px] tracking-[0.2em] uppercase transition-colors ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-300 dark:text-[#444] hover:text-gray-600 dark:hover:text-[#888]"
                  }`}
                >
                  {cat}
                  {i < categories.length && (
                    <span className="ml-3 text-gray-200 dark:text-[#2a2a2a]">•</span>
                  )}
                </button>
              );
            })}
          </div>

          <button className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-gray-400 dark:text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors group">
            Explore the Catalogue
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Products */}
        <section className="flex-1 px-6 lg:px-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-5 h-5 border border-gray-200 dark:border-[#333] border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-gray-400 dark:text-[#444] text-xs tracking-[0.2em] uppercase">No objects available</p>
              <p className="text-gray-300 dark:text-[#333] text-xs mt-2">Check back soon or browse another category</p>
            </div>
          ) : (
            products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))
          )}
        </section>

        {/* Trust bar */}
        <section className="px-6 lg:px-12 py-8 border-t border-gray-200 dark:border-[#1a1a1a] grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Curated Goods", desc: "Every object is carefully selected and authenticated." },
            { title: "Guaranteed Authenticity", desc: "Each item comes with a provenance card." },
            { title: "Artisan Made", desc: "Sourced from master artisans across Nigeria." },
            { title: "Global Delivery", desc: "Tracked & insured shipping worldwide." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-[10px] tracking-[0.2em] uppercase text-gray-900 dark:text-white mb-1">{item.title}</p>
              <p className="text-[10px] text-gray-400 dark:text-[#555] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Contact section */}
        <section className="px-6 lg:px-12 py-10 border-t border-gray-200 dark:border-[#1a1a1a] grid md:grid-cols-2 gap-8">
          {[CONTACT.nigeria, CONTACT.uk].map((office) => (
            <div key={office.label}>
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 dark:text-[#555] mb-3">{office.label}</p>
              <p className="text-xs text-gray-500 dark:text-[#888] mb-1">{office.address}</p>
              <a
                href={`tel:${office.phone.replace(/\s/g, "")}`}
                className="block text-xs text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors mb-1"
              >
                {office.phone}
              </a>
              <a
                href={`mailto:${office.email}`}
                className="block text-xs text-gray-400 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#aaa] transition-colors"
              >
                {office.email}
              </a>
            </div>
          ))}
        </section>

        {/* Footer bar */}
        <footer className="px-6 lg:px-12 py-5 border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0d0d0d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 dark:text-[#888] mb-0.5">The Lagoon Cabinet</p>
            <p className="text-[9px] text-gray-400 dark:text-[#444] tracking-wide">Objects from the World of Eko</p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-[9px] text-gray-400 dark:text-[#444] tracking-wide">
            <span>Ships from Lagos, Nigeria</span>
            <span className="hidden md:inline text-gray-200 dark:text-[#2a2a2a]">|</span>
            <span>Processing time: 2–6 weeks</span>
            <span className="hidden md:inline text-gray-200 dark:text-[#2a2a2a]">|</span>
            <span>Returns: 14 days on stocked items</span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] tracking-[0.15em] uppercase px-4 py-2.5 hover:bg-gray-700 dark:hover:bg-[#e0e0e0] transition-colors"
          >
            <WhatsAppIcon className="w-3 h-3" />
            Contact us via WhatsApp
          </a>
        </footer>
      </div>
    </div>
  );
}
