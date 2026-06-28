import Layout from "@/components/Layout";
import { Link } from "react-router-dom";

export default function NigerianBooksToRead() {
  return (
    <Layout>
      <div className="min-h-screen">

        {/* HERO */}
        <div className="bg-muted border-b">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-medium tracking-widest uppercase text-amber-600 mb-4">
              Books · Updated May 2026
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              Nigerian Books to Read
            </h1>
            <div className="space-y-4 text-muted-foreground font-light text-base leading-relaxed">
              <p>Nigerian literature is in its strongest moment in decades. A $100,000 prize was awarded in Lagos in October 2025. Chimamanda returned after ten years. A new generation of writers is publishing work that London and New York are following closely.</p>
              <p>We are Bauhaus Production. Our office is in Ilupeju, Lagos. Our publishing house is in Northampton, UK. This is the list we give people when they ask us what to read.</p>
            </div>
            <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t text-xs text-muted-foreground">
              {["10 books across all tastes", "Includes 2025 Nigeria Prize winner", "Includes a Bauhaus Production original title", "For diaspora readers worldwide"].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-14 space-y-14">

          {/* INTRO */}
          <div className="space-y-4 text-muted-foreground font-light text-base leading-relaxed">
            <p>Every year, the same ten titles appear on every Nigerian books list. This one starts from a different place.</p>
            <p>We have organised our picks by what kind of reader you are and where you want to go. New releases sit alongside the books that built the tradition. Diaspora-specific titles sit alongside novels set entirely inside Nigeria.</p>
            <p>One thing we notice from our Lagos office: Nigerian literature is not one thing. Yoruba, Igbo, Lagos urban, pre-colonial, diaspora, genre fiction. The best reading list gives you range.</p>
          </div>

          {/* FEATURED — WHEN THE LAGOON DECIDES */}
          <div className="bg-foreground rounded p-8 space-y-4">
            <p className="text-[10px] font-medium tracking-widest uppercase text-amber-500">From Bauhaus Production</p>
            <h2 className="font-serif text-2xl font-bold text-background leading-tight">When the Lagoon Decides</h2>
            <p className="font-serif text-base italic text-amber-500">Eko Chronicles</p>
            <p className="text-xs text-gray-500">By Seni Alaka · Bauhaus Production / Spiving · 2026</p>
            <div className="space-y-3 text-sm font-light text-gray-400 leading-relaxed">
              <p>18th-century Lagos. Oba Akinsemoyin sits on the throne by right. His lords obey him at their pleasure.</p>
              <p>Inside the palace lies a more dangerous problem: he has no true heir. Only a boy whose origin is a secret that could unmake his bloodline. To protect both crown and bloodline, Akinsemoyin calls in foreign power. Men and cannons cross the waters of Eko.</p>
              <p>Within the palace, Erelu Kuti moves with precision, shaping outcomes in a world ruled by men. Beyond the walls, Lufaderin has waited seven years for a child. When he finally comes, something is wrong.</p>
              <p>And the future returns only in fragments: fire in the streets, a crown trampled underfoot. As war closes in and the king's own lords begin to conspire against him, the fates of ruler and seer begin to converge. In Eko, nothing remains hidden forever. And when the lagoon decides, it decides for everyone.</p>
            </div>
            <Link to="/shop" className="inline-block px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-500 transition-colors">
              Get the book
            </Link>
          </div>

          {/* SHOP CTA */}
          <Link to="/shop" className="flex items-center gap-4 border border-l-4 border-l-amber-600 rounded p-5 hover:bg-muted transition-colors no-underline group">
            <div className="text-2xl">📖</div>
            <div>
              <div className="font-medium text-sm text-foreground">Browse the Bauhaus Production books catalogue</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-light">Nigerian literature, cultural titles, and original Bauhaus publications. Ships worldwide from Lagos and the UK.</div>
            </div>
            <div className="ml-auto text-amber-600 text-lg">→</div>
          </Link>

          {/* NEW RELEASES */}
          <div>
            <SectionLabel>New Releases 2025 and 2026</SectionLabel>
            <BookList books={newReleases} />
          </div>

          {/* EMAIL SIGNUP */}
          <div className="bg-muted border border-t-4 border-t-amber-600 rounded p-8 text-center space-y-4">
            <h3 className="font-serif text-xl font-semibold text-foreground">Be first to know about our next Bauhaus book</h3>
            <p className="text-sm font-light text-muted-foreground max-w-md mx-auto leading-relaxed">We are working on the next title in the Eko Chronicles series. Join the reader list for early access and first notification when it is available. No spam. Just the book.</p>
            <div className="flex gap-2 max-w-sm mx-auto flex-wrap justify-center">
              <input type="email" placeholder="Your email address" className="flex-1 min-w-[180px] px-3 py-2.5 border rounded text-sm bg-background outline-none focus:border-amber-600" />
              <button className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-500 transition-colors">Notify Me First</button>
            </div>
            <p className="text-[11px] text-muted-foreground">From Bauhaus Production, Lagos and Northampton UK · Unsubscribe any time</p>
          </div>

          {/* DIASPORA */}
          <div>
            <SectionLabel>Books Built for the Diaspora</SectionLabel>
            <BookList books={diasporaBooks} />
          </div>

          {/* CALLOUT */}
          <div className="bg-foreground rounded p-7 space-y-3">
            <p className="text-[10px] font-medium tracking-widest uppercase text-amber-500">From Our Lagos Office</p>
            <p className="text-sm font-light text-gray-400 leading-relaxed">We read Nigerian literature from Ilupeju, Lagos, where many of these stories are set. When Braithwaite writes Lagos nurses navigating impossible siblings, or when Adebayo writes about what polygamous households feel from the inside, these are not exotic settings for us.</p>
            <p className="text-sm font-light text-gray-400 leading-relaxed">That is the perspective we bring to curating Nigerian books for the diaspora. Not a Western gaze explaining Nigeria outward, but a Nigerian publisher connecting the diaspora back in.</p>
          </div>

          {/* FOUNDATION */}
          <div>
            <SectionLabel>The Foundation</SectionLabel>
            <BookList books={foundationBooks} />
          </div>

          {/* WHERE TO START */}
          <div>
            <SectionLabel>Where to Start</SectionLabel>
            <div className="grid md:grid-cols-2 gap-4">
              {readingPaths.map((p) => (
                <div key={p.title} className="border rounded p-5">
                  <h4 className="font-serif text-sm font-semibold text-foreground mb-3">{p.title}</h4>
                  <ul className="space-y-2">
                    {p.books.map((b) => (
                      <li key={b} className="flex gap-2 text-sm font-light text-muted-foreground leading-snug">
                        <span className="text-amber-600 font-medium flex-shrink-0">›</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* SHOP CTA */}
          <Link to="/shop" className="flex items-center gap-4 border border-l-4 border-l-amber-600 rounded p-5 hover:bg-muted transition-colors no-underline group">
            <div className="text-2xl">🛍️</div>
            <div>
              <div className="font-medium text-sm text-foreground">Shop Nigerian books and cultural titles at Bauhaus Production</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-light">Original Bauhaus publications, curated Nigerian literature, and cultural merchandise. Ships worldwide.</div>
            </div>
            <div className="ml-auto text-amber-600 text-lg">→</div>
          </Link>

          {/* FAQ */}
          <div>
            <SectionLabel>Frequently Asked Questions</SectionLabel>
            <div className="divide-y">
              {faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3">{f.q}</h3>
                  {f.a.map((p, i) => (
                    <p key={i} className="text-sm font-light text-muted-foreground leading-relaxed mb-2">{p}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <span className="text-[10px] font-medium tracking-widest uppercase text-amber-600 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function BookList({ books }: { books: typeof newReleases }) {
  return (
    <div className="divide-y">
      {books.map((b, i) => (
        <div key={b.title} className="grid grid-cols-[40px_1fr] gap-5 py-7">
          <div className="font-serif text-3xl font-normal text-border leading-none pt-1">
            {String(b.num).padStart(2, "0")}
          </div>
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <h3 className="font-serif text-xl font-semibold text-foreground leading-snug">{b.title}</h3>
              <span className="text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap mt-1">
                {b.badge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">By <span className="text-amber-600 font-medium">{b.author}</span> · {b.meta}</p>
            {b.body.map((p, j) => (
              <p key={j} className="text-sm font-light text-muted-foreground leading-relaxed mb-3">{p}</p>
            ))}
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-amber-600 font-medium">Why this book: </span>{b.why}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const newReleases = [
  {
    num: 1, title: "Dream Count", badge: "2025 · Women's Prize Longlist",
    author: "Chimamanda Ngozi Adichie", meta: "Knopf / 4th Estate · March 2025 · 416 pages",
    body: [
      "Four Nigerian women. A pandemic. What love costs and what it returns.",
      "Chiamaka is a travel writer stranded in America during Covid, cataloguing past loves and present regrets. Zikora is a successful lawyer betrayed and suddenly alone. Omelogor is a financial powerhouse in Lagos who begins to question what she actually knows about herself.",
      "Adichie's first novel in ten years. Longlisted for the Women's Prize for Fiction 2025.",
    ],
    why: "The most anticipated Nigerian novel of the decade. Read it to understand where Adichie has been for ten years.",
  },
  {
    num: 2, title: "Sanya", badge: "2025 Nigeria Prize Winner · $100,000",
    author: "Oyin Olugbile", meta: "Masobe Books · 2025",
    body: [
      "The winner of Africa's most valuable literary prize, announced at Eko Hotels and Suites in Lagos on 10 October 2025.",
      "Sanya beat 252 entries including novels by Chigozie Obioma and Chika Unigwe. It represents a generation of writers trained inside Nigeria who are now setting the international agenda.",
    ],
    why: "The book Nigeria's most authoritative literary judges chose above all others in 2025.",
  },
  {
    num: 3, title: "Jollof Rice and Other Revolutions", badge: "Diaspora · Nigeria to the World",
    author: "Omolola Ijeoma Ogunyemi", meta: "Masobe Books · January 2026",
    body: [
      "Four Nigerian women bond at a boarding school during a student uprising. The novel follows them across decades as their lives move from Nigeria to America, Poland, and beyond.",
      "The Nigerian edition from Masobe Books was released in January 2026, bringing the book home. For diaspora readers who want the widest possible geographic and emotional range.",
    ],
    why: "The diaspora novel with the longest reach. Four women, three continents, one friendship that holds.",
  },
  {
    num: 4, title: "This Motherless Land", badge: "Lagos and UK · 2025 Shortlist",
    author: "Nikki May", meta: "Mariner Books · 2025",
    body: [
      "Shortlisted for the 2025 Nigeria Prize for Literature. The novel follows Funke Oyenega through grief and self-discovery after her mother's death, spanning Lagos and the UK.",
      "It is the geography that Bauhaus Production occupies directly. When May writes about cultural tension and belonging in two places at once, that is the lived experience of diaspora Nigerians in Britain.",
    ],
    why: "The 2025 book most precisely written for the British-Nigerian diaspora experience.",
  },
];

const diasporaBooks = [
  {
    num: 5, title: "Americanah", badge: "The Starting Point",
    author: "Chimamanda Ngozi Adichie", meta: "2013 · 182,000 Goodreads ratings",
    body: [
      "A Nigerian woman leaves for America. Her boyfriend takes a different route to London. Years pass. Lives change. The question of whether they can find each other again shapes everything.",
      "Adichie's account of race as something her protagonist encounters for the first time in America remains the most accurate written description of that specific cultural shift.",
    ],
    why: "The single most important entry point into Nigerian diaspora literature.",
  },
  {
    num: 6, title: "My Sister the Serial Killer", badge: "Crime · Darkly Comic",
    author: "Oyinkan Braithwaite", meta: "2018 · 350,000 Goodreads ratings",
    body: [
      "A Lagos nurse discovers her beautiful younger sister has a habit of killing her boyfriends. What follows is 240 pages of dark comedy that only Lagos can produce.",
      "The best book to give someone who says they do not read Nigerian literature.",
    ],
    why: "Fast, funny, and completely unexpected. The quickest route into Nigerian fiction for new readers.",
  },
  {
    num: 7, title: "Stay With Me", badge: "Family · Womanhood",
    author: "Ayobami Adebayo", meta: "2017 · 65,000 Goodreads ratings",
    body: [
      "Four wives. One household. Secrets that run deep enough to unmake a family. Adebayo writes about the interior lives of Nigerian women with a clarity that is rare in any literature.",
      "One of the most discussed Nigerian novels of the past decade, for good reason.",
    ],
    why: "For readers who want to understand Nigerian womanhood and family life beyond stereotypes.",
  },
];

const foundationBooks = [
  {
    num: 8, title: "Things Fall Apart", badge: "The Foundation",
    author: "Chinua Achebe", meta: "1958 · Most translated African novel in history",
    body: [
      "Okonkwo, an Igbo warrior and community leader, watches colonial forces dismantle everything his identity was built on.",
      "Achebe wrote this book to correct a century of outsider narratives about Africa. He did it so completely that the novel is now taught across 50 countries. If you read it in school and did not connect with it, read it again as an adult.",
    ],
    why: "Non-negotiable. The book that made Nigerian literature possible on the world stage.",
  },
  {
    num: 9, title: "Half of a Yellow Sun", badge: "Biafran War · Orange Prize",
    author: "Chimamanda Ngozi Adichie", meta: "2006 · Orange Prize winner",
    body: [
      "Three lives intersect inside the Biafran War of 1967 to 1970. A Yoruba houseboy, an Igbo academic, and a British journalist give Adichie three lenses on a conflict that killed up to three million people.",
      "Most diaspora Nigerians were not taught this history in school. This novel fills that gap by making you feel the war from inside the people living it.",
    ],
    why: "The book that explains Nigerian history through human lives. Read alongside Things Fall Apart.",
  },
  {
    num: 10, title: "The Fishermen", badge: "Booker Prize Longlist",
    author: "Chigozie Obioma", meta: "2015 · 22,000 Goodreads ratings",
    body: [
      "Four brothers in a small Nigerian town encounter a local madman whose prophecy destroys their family from the inside. Obioma writes in a style rooted in Igbo oral tradition.",
      "The New York Times called him the heir to Chinua Achebe. The comparison holds.",
    ],
    why: "The bridge between Achebe and contemporary Nigerian writing. For readers ready to go deeper.",
  },
];

const readingPaths = [
  {
    title: "New to Nigerian books",
    books: ["My Sister the Serial Killer (fast, Lagos, funny)", "Americanah (love story plus identity)", "Things Fall Apart (the foundation)"],
  },
  {
    title: "Second-generation diaspora",
    books: ["This Motherless Land (Lagos and UK)", "Stay With Me (family and womanhood)", "Half of a Yellow Sun (history you were not taught)"],
  },
  {
    title: "Want Nigerian history",
    books: ["When the Lagoon Decides (18th-century Lagos)", "Half of a Yellow Sun (Biafran War)", "Things Fall Apart (colonial encounter)"],
  },
  {
    title: "Following the awards",
    books: ["Sanya (2025 Nigeria Prize winner)", "Dream Count (Women's Prize longlist 2025)", "Jollof Rice and Other Revolutions (2026)"],
  },
];

const faqs = [
  {
    q: "What are the best Nigerian books to read right now?",
    a: ["Start with Dream Count by Chimamanda Ngozi Adichie and Sanya by Oyin Olugbile, winner of the 2025 Nigeria Prize for Literature. For historical fiction set in Lagos itself, read When the Lagoon Decides by Seni Alaka, published by Bauhaus Production."],
  },
  {
    q: "What Nigerian book should I read first?",
    a: ["Start with Americanah by Chimamanda Ngozi Adichie. The most accessible entry point for new readers. After that, My Sister the Serial Killer by Oyinkan Braithwaite is shorter, faster, and entirely set in Lagos."],
  },
  {
    q: "What is the best Nigerian book of 2025?",
    a: ["The 2025 Nigeria Prize for Literature, worth $100,000, was awarded to Oyin Olugbile for her novel Sanya, announced at Eko Hotels and Suites in Lagos on 10 October 2025. Chimamanda Ngozi Adichie's Dream Count, her first novel in ten years, was also a major publishing event of 2025."],
  },
  {
    q: "Are there Nigerian books set in Lagos history?",
    a: ["When the Lagoon Decides by Seni Alaka, published by Bauhaus Production, is set in 18th-century Lagos during the reign of Oba Akinsemoyin. Available in our shop."],
  },
  {
    q: "Where can diaspora readers buy Nigerian books?",
    a: ["Through Amazon worldwide, publishers like Masobe Books and Cassava Republic Press who ship internationally, and through Bauhaus Production's shop, which publishes original Nigerian titles and ships worldwide from Lagos and the UK."],
  },
];
