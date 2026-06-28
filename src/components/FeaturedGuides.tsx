import { Link } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const GUIDES = [
  {
    href: "/things-to-do-in-lagos-nigeria",
    category: "Travel Guide",
    title: "Things to Do in Lagos Nigeria: The Cultural Tourism Guide 2026",
    description:
      "A cultural tourism guide for diaspora visitors — Kalakuta, Ojude Oba, Detty December, Badagry and what they mean.",
    date: "2026",
  },
  {
    href: "/nigerian-books-to-read",
    category: "Books",
    title: "Nigerian Books to Read: The Essential List for 2026",
    description:
      "From the 2025 Nigeria Prize winner to Chimamanda's long-awaited return. Curated by Bauhaus Production, Lagos and UK.",
    date: "2026",
  },
];

export default function FeaturedGuides() {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Guides & Features
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {GUIDES.map((guide) => (
          <Link key={guide.href} to={guide.href} className="group block">
            <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] rounded-t-lg overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 flex items-center justify-center">
                <Globe className="h-16 w-16 text-amber-300 dark:text-amber-700 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardContent className="p-4">
                <span className="text-xs font-medium uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 block">
                  {guide.category}
                </span>
                <h3 className="font-serif font-medium text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {guide.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{guide.date}</span>
                  <span className="flex items-center gap-1 ml-auto text-accent font-medium">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="h-px bg-border mb-8" />
    </div>
  );
}
