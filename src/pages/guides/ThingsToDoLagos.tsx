import Layout from "@/components/Layout";
import { Link } from "react-router-dom";

export default function ThingsToDoLagos() {
  return (
    <Layout>
      <div className="min-h-screen">

        {/* HERO */}
        <div className="bg-muted border-b">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p className="text-xs font-medium tracking-widest uppercase text-amber-600 mb-4">
              Cultural Tourism · Lagos · Updated May 2026
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
              Things to Do in Lagos Nigeria
            </h1>
            <div className="space-y-4 text-muted-foreground font-light text-base leading-relaxed">
              <p>In December 2025, 3.6 million people came to Lagos. The United States overtook the United Kingdom as the largest diaspora source market for the first time. Lagos is no longer just where Nigerians are from. It is where the world is arriving.</p>
              <p>This month, Ojude Oba in Ijebu-Ode drew over 100,000 people for one of the most spectacular cultural festivals in West Africa. It happened on May 29, 2026. If you missed it, you need to plan for next year.</p>
              <p>We are Bauhaus Production. Our office is in Ilupeju, Lagos. This is the guide we give people when they ask us what to do here.</p>
            </div>
            <div className="flex flex-wrap gap-8 mt-8 pt-6 border-t">
              {[
                { n: "3.6M", l: "visitors Dec 2025" },
                { n: "55%", l: "spending from diaspora" },
                { n: "N396B", l: "total economic activity" },
                { n: "100K+", l: "Ojude Oba 2026" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-2xl font-bold text-amber-600 leading-none">{s.n}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-light">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-14 space-y-14">

          {/* INTRO */}
          <div className="space-y-4 text-muted-foreground font-light text-base leading-relaxed">
            <p>Lagos is the most misrepresented major city on the internet. Search it and you find either breathless hype or outdated warnings. Neither is useful.</p>
            <p>What follows is our list of cultural experiences worth your time. We have prioritised meaning over novelty. Every entry explains not just what a place is, but what it represents in the life of Lagos and in Nigerian history.</p>
            <p>That context is the difference between visiting a city and understanding one.</p>
          </div>

          {/* SHOP CTA */}
          <Link to="/shop" className="flex items-center gap-4 border border-l-4 border-l-amber-600 rounded p-5 hover:bg-muted transition-colors no-underline group">
            <div className="text-2xl">🗺️</div>
            <div>
              <div className="font-medium text-sm text-foreground">Lagos cultural guides and travel merchandise at Bauhaus Production</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-light">Curated from our Lagos and UK offices. Ships worldwide to the diaspora.</div>
            </div>
            <div className="ml-auto text-amber-600 text-lg">→</div>
          </Link>

          {/* EXPERIENCES */}
          <div>
            <SectionLabel>Cultural Experiences</SectionLabel>
            <div className="divide-y">
              {experiences.map((e, i) => (
                <div key={e.title} className="grid grid-cols-[40px_1fr] gap-5 py-7 first:pt-0">
                  <div className="font-serif text-3xl font-normal text-border leading-none pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                      <h3 className="font-serif text-xl font-semibold text-foreground leading-snug">{e.title}</h3>
                      <span className="text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap mt-1">
                        {e.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{e.meta}</p>
                    {e.body.map((p, j) => (
                      <p key={j} className="text-sm font-light text-muted-foreground leading-relaxed mb-3">{p}</p>
                    ))}
                    <div className="bg-muted border-l-4 border-l-amber-600 px-4 py-3 rounded-r text-sm font-light text-muted-foreground leading-relaxed">
                      <span className="font-medium text-amber-700">What it means: </span>{e.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OJUDE OBA */}
          <div className="bg-muted border border-t-4 border-t-amber-600 rounded p-8 space-y-5">
            <p className="text-[10px] font-medium tracking-widest uppercase text-amber-600">Day Trip from Lagos · Ogun State</p>
            <h2 className="font-serif text-2xl font-bold text-foreground">Ojude Oba 2026: The King's Forecourt</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "100K+", l: "attendees annually" },
                { n: "90+", l: "regberegbe processions" },
                { n: "65 yrs", l: "reign of late Awujale Adetona" },
              ].map((s) => (
                <div key={s.l} className="text-center border rounded p-3 bg-background">
                  <div className="font-serif text-xl font-bold text-amber-600 leading-none mb-1">{s.n}</div>
                  <div className="text-[11px] text-muted-foreground font-light leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-sm font-light text-muted-foreground leading-relaxed">Ojude Oba means the King's Forecourt in Yoruba. The festival is held annually in Ijebu-Ode, Ogun State, on the third day after Eid el-Kabir. The 2026 edition was held on Friday May 29 at the Awujale Pavilion and Palace grounds.</p>
            <p className="text-sm font-light text-muted-foreground leading-relaxed">The festival began as an Islamic thanksgiving gathering where early Muslim converts paid homage to the Awujale of Ijebuland. <strong className="font-medium text-foreground">Over 90 regberegbe age-grade groups</strong> process in Aso-Oke, gele headwraps, and agbada. The 2026 edition carried particular weight — the first since the death of the late Awujale Oba Sikiru Kayode Adetona in July 2025, after a 65-year reign.</p>
            <p className="text-sm font-light text-muted-foreground leading-relaxed">Ijebu-Ode is approximately 80 kilometres from Lagos Island, around 1.5 to 2 hours by road. Most visitors hire a driver for the day.</p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-700">
              <strong>Plan ahead for 2027:</strong> The festival date shifts annually. Confirm the exact date about two months ahead and book accommodation immediately. The town fills completely.
            </div>
          </div>

          {/* DETTY DECEMBER */}
          <div className="bg-foreground rounded p-8 space-y-5">
            <p className="text-[10px] font-medium tracking-widest uppercase text-amber-500">Detty December 2025</p>
            <h2 className="font-serif text-2xl font-bold text-background">The Diaspora's Grand Homecoming</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { n: "3.6M", l: "participants over 55 days" },
                { n: "N396B", l: "total consumer spending" },
                { n: "55%", l: "spending from diaspora" },
                { n: "27%", l: "arrivals from US, now #1" },
              ].map((s) => (
                <div key={s.l} className="text-center p-3 rounded bg-white/5 border border-white/10">
                  <div className="font-serif text-lg font-bold text-amber-500 leading-none mb-1">{s.n}</div>
                  <div className="text-[10px] text-gray-500 font-light leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="text-sm font-light text-gray-400 leading-relaxed">Detty December runs from mid-November to early January. The Nigerian diaspora returns from the UK, the US, Canada, Australia, and Europe for concerts, beach parties, owambes, and cultural events that fill every venue in the city.</p>
            <p className="text-sm font-light text-gray-400 leading-relaxed">The 2025 season was the largest on record. <strong className="font-medium text-gray-300">The United States overtook the United Kingdom as the top source market for the first time</strong>, with American arrivals at 27 percent of all international visitors.</p>
            <p className="text-sm font-light text-gray-400 leading-relaxed">One honest note from our Ilupeju office: pricing during Detty December can be extreme. Book accommodation by September. Agree prices before committing.</p>
            <div className="bg-amber-600/10 border border-amber-600/25 rounded p-3 text-sm text-amber-500">
              <strong>The city is worth it. The exploitation is a separate problem.</strong> Come prepared and you will have a better time than any social media post suggests.
            </div>
          </div>

          {/* WHEN TO VISIT */}
          <div>
            <SectionLabel>When to Visit</SectionLabel>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { cls: "border-t-amber-600", h: "November to January: Detty December", p: "Peak energy, peak prices. Concerts, beach parties, diaspora homecoming. Book accommodation by September. N396 billion in spending in 2025." },
                { cls: "border-t-green-700", h: "May to June: Ojude Oba Season", p: "Falls on the third day after Eid el-Kabir. Plan a day trip to Ijebu-Ode from Lagos. Confirm the date annually and book accommodation weeks ahead." },
                { cls: "border-t-green-700", h: "February to April: The Sweet Spot", p: "Good weather, manageable crowds, reasonable prices. Best time for cultural visits: galleries, museums, and tours without December intensity." },
                { cls: "border-t-border", h: "July to September: Rainy Season", p: "Heavy rainfall peaks in July and August. The city functions fully but outdoor activities are affected. Accommodation deals available." },
              ].map((m) => (
                <div key={m.h} className={`bg-background border border-t-4 ${m.cls} rounded p-5`}>
                  <h4 className="font-serif text-sm font-semibold text-foreground mb-2">{m.h}</h4>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">{m.p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PRACTICAL */}
          <div>
            <SectionLabel>Practical Advice</SectionLabel>
            <ul className="divide-y">
              {practical.map((t) => (
                <li key={t.icon} className="flex gap-4 py-4 text-sm font-light text-muted-foreground leading-relaxed">
                  <span className="text-base flex-shrink-0 mt-0.5">{t.icon}</span>
                  <span dangerouslySetInnerHTML={{ __html: t.text }} />
                </li>
              ))}
            </ul>
          </div>

          {/* SHOP CTA */}
          <Link to="/shop" className="flex items-center gap-4 border border-l-4 border-l-amber-600 rounded p-5 hover:bg-muted transition-colors no-underline group">
            <div className="text-2xl">🛍️</div>
            <div>
              <div className="font-medium text-sm text-foreground">Lagos and Nigeria cultural merchandise at Bauhaus Production</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-light">Travel guides, cultural collections, and Nigeria-inspired merchandise. Ships worldwide.</div>
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

const experiences = [
  {
    title: "Kalakuta Museum, Ikeja",
    badge: "Cultural Resistance",
    meta: "1 Gbemisola Street, Ikeja · Tue to Sun, 10am to 6pm",
    body: [
      "The former home of Fela Anikulapo-Kuti. Musician. Activist. The man who made Afrobeats a political act.",
      "In 1977, the Nigerian military raided this compound with over a thousand soldiers. They burned it to the ground. They threw Fela's mother, Funmilayo Ransome-Kuti, from an upstairs window. She died from her injuries months later.",
      "The museum preserves his bedroom, his recording equipment, and the photographs from that night.",
    ],
    meaning: "Every Afrobeats artist performing in arenas today is working in a tradition Fela built at a cost most people do not know. Come here before you go to any concert in Lagos.",
  },
  {
    title: "J. Randle Centre for Yoruba Culture, Lagos Island",
    badge: "Yoruba Civilisation",
    meta: "Onikan, Lagos Island · Daily, 9am to 5pm",
    body: [
      "An architectural landmark built to immerse visitors in Yoruba philosophy, history, and heritage through high-technology exhibitions. The historic swimming pool on the grounds dates to 1928.",
      "Yoruba civilisation is one of the world's most complex and historically significant cultures. Its theology, political structure, and oral tradition shaped not only Nigeria but the African diaspora across the Americas.",
      "For second-generation Nigerians who grew up outside Yorubaland, this is the place to begin.",
    ],
    meaning: "Understanding Yoruba civilisation from inside its own philosophy is what this centre makes possible. No other institution in Lagos does this as completely.",
  },
  {
    title: "Freedom Park, Lagos Island",
    badge: "Colonial History",
    meta: "Old Prison Grounds, Lagos Island · Daily, 12pm to 10pm",
    body: [
      "A colonial prison built in 1872 to hold Nigerians who resisted British rule, transformed into Lagos's most atmospheric cultural space.",
      "The original cell walls stand intact alongside open-air stages where jazz, spoken word, and theatre happen most evenings. Come in the late afternoon. Stay for whatever is playing on the main stage.",
    ],
    meaning: "This site makes the physical structure of colonial control visible, then asks you to enjoy a concert inside it. It is one of the most honest cultural spaces Lagos has built.",
  },
  {
    title: "New Afrika Shrine, Ikeja",
    badge: "Live Music",
    meta: "1 Fela Shrine Road, Ikeja · Thursday to Sunday from 9pm",
    body: [
      "Run by Femi Kuti. The New Afrika Shrine carries the original spirit of the Afrika Shrine into the present.",
      "Thursday through Sunday nights, live bands play Afrobeats until the early hours. Nothing starts before 10pm. Come late, dressed practically, and stay long enough to understand what made this music move the world.",
      "It is not a tourist attraction. It is a working cultural institution that happens to welcome visitors.",
    ],
    meaning: "The Shrine is where Afrobeats still belongs to Lagos before it belongs to anywhere else. An hour here tells you more about the music's roots than any documentary.",
  },
  {
    title: "Nike Art Gallery, Lekki",
    badge: "Contemporary Art",
    meta: "Elegushi Road, Lekki Phase 1 · Daily, 10am to 7pm",
    body: [
      "Chief Nike Davies-Okundaye's gallery across four floors is one of the largest private art galleries in Africa. Over 8,000 works from Nigerian artists across generations, plus textiles, sculptures, and live demonstrations of traditional craft.",
      "The gallery does not feel like a museum. It feels like a living archive. Plan at least two hours.",
    ],
    meaning: "Nigerian visual art runs from ancient Nok terracotta and Benin bronzes to the painters working in Lagos today. This gallery holds more of that continuum in one building than anywhere else in the city.",
  },
  {
    title: "Lekki Conservation Centre",
    badge: "Nature · 401m Canopy Walk",
    meta: "Lekki Peninsula · Daily, 8am to 5pm",
    body: [
      "A 78-hectare urban nature reserve in the heart of Lekki. Home to Africa's longest canopy walkway at 401 metres, suspended above wetlands where monkeys, rare birds, and crocodiles live below.",
      "Most visitors to Lagos do not know this exists. Quiet, green, and genuinely spectacular from height.",
    ],
    meaning: "Lagos before the city. The wetlands that surrounded the original Eko settlement still exist here. Standing on the canopy walkway, you see what the lagoon landscape looked like before the concrete arrived.",
  },
  {
    title: "Badagry Slave Route",
    badge: "Heritage · Roots",
    meta: "Badagry, approximately 1.5 hours from Lagos Island · Full day trip",
    body: [
      "Badagry is where enslaved Nigerians were walked to the coast and loaded onto ships bound for the Americas and the Caribbean. The Point of No Return, the slave barracoons, and the Heritage Museum mark each stage of that route.",
      "For diaspora visitors from the US and Caribbean whose ancestry runs through this exact route, walking it is an act of return. Go with a knowledgeable guide. Do not rush it.",
    ],
    meaning: "The transatlantic slave trade is not an abstraction here. It has a road, a shoreline, and a door. For everyone, it is a necessary confrontation with history.",
  },
  {
    title: "Lagos Food Culture",
    badge: "Food and Hospitality",
    meta: "Victoria Island, Ikoyi, Lagos Island",
    body: [
      "From suya spots on Admiralty Way open from late evening, to fine dining at Nok by Alara on Victoria Island. Lagos's restaurant scene has expanded dramatically.",
      "For diaspora visitors reconnecting with Nigerian food: buka restaurants on the mainland serve the most authentic home-style cooking. Ask hotel staff for the best local spot near them. Do not leave Lagos without eating at a proper buka at least once.",
    ],
    meaning: "Nigerian food cooked in Lagos with Lagos ingredients is different from its diaspora versions. The original, made by Lagosians for Lagosians, is a different thing entirely.",
  },
];

const practical = [
  { icon: "🚗", text: "<strong class='font-medium text-foreground'>Transport:</strong> Use Uber or Bolt exclusively. Both work reliably across Lagos Island and the mainland. Budget serious time for traffic. A 10-kilometre journey can take 90 minutes at peak hours. Water taxis between Marina and Takwa Bay are faster for island movement." },
  { icon: "🏨", text: "<strong class='font-medium text-foreground'>Where to stay:</strong> Victoria Island and Ikoyi for first-time visitors. Closest to cultural sites, reliable power, better security. Lekki for easy access to the Conservation Centre." },
  { icon: "💰", text: "<strong class='font-medium text-foreground'>Money:</strong> Naira cash is essential for local experiences. Markets, bukas, suya spots, and many smaller venues do not take cards. Inform your bank before travelling. Convert through official channels only." },
  { icon: "📱", text: "<strong class='font-medium text-foreground'>SIM card:</strong> Buy an MTN or Airtel SIM at the airport on arrival. Data is fast and cheap, significantly better than many European cities." },
  { icon: "🤝", text: "<strong class='font-medium text-foreground'>The city:</strong> Lagosians are direct, warm, and commercially sharp. The city rewards visitors who engage with curiosity rather than anxiety. The city is not as dangerous as people who have never been here tend to describe it." },
];

const faqs = [
  {
    q: "What are the best cultural things to do in Lagos Nigeria?",
    a: [
      "The most significant cultural experiences are the Kalakuta Museum in Ikeja, the J. Randle Centre for Yoruba Culture on Lagos Island, Freedom Park, the New Afrika Shrine for live music, and Nike Art Gallery in Lekki.",
      "A day trip to Ojude Oba in Ijebu-Ode is one of the most spectacular cultural festival experiences in West Africa. For heritage, the Badagry slave route is essential for diaspora visitors with ancestral connections to the transatlantic trade.",
    ],
  },
  {
    q: "What is Ojude Oba and when does it take place?",
    a: [
      "Ojude Oba means the King's Forecourt in Yoruba. It is held annually in Ijebu-Ode, Ogun State, on the third day after Eid el-Kabir. The 2026 edition was held on Friday May 29, themed to honour the late Awujale Oba Sikiru Kayode Adetona who died in July 2025 after a 65-year reign.",
      "The festival features over 90 regberegbe age-grade processions and draws over 100,000 attendees annually. Ijebu-Ode is approximately 80 kilometres from Lagos Island.",
    ],
  },
  {
    q: "What is Detty December and when should I visit Lagos for it?",
    a: [
      "Detty December runs from mid-November to early January. The 2025 season attracted 3.6 million participants over 55 days, with diaspora visitors contributing 55 percent of total spending at N396 billion. The United States became the top source market for the first time.",
      "Book accommodation by September. Some hotels triple their prices during peak weeks.",
    ],
  },
  {
    q: "Is Lagos safe to visit for diaspora visitors?",
    a: [
      "Lagos is safe for visitors who navigate it thoughtfully. Victoria Island, Ikoyi, Lekki, and Ikeja are well-established areas. Use Uber or Bolt for transport.",
      "Our Bauhaus Production office is in Ilupeju, Lagos. We work here every day. The city is far more manageable than its external media reputation suggests.",
    ],
  },
  {
    q: "How do I get from Lagos to Ojude Oba in Ijebu-Ode?",
    a: [
      "Ijebu-Ode is approximately 80 kilometres from Lagos Island, around 1.5 to 2 hours by road via the Sagamu-Ore Expressway. Most visitors hire a driver for the day.",
      "Book accommodation in Ijebu-Ode well in advance if staying overnight. Many visitors make it a day trip from Lagos by leaving early morning.",
    ],
  },
  {
    q: "What cultural experiences in Lagos are most important for diaspora visitors?",
    a: [
      "Badagry is the most specific to diaspora heritage. The Point of No Return marks where enslaved Nigerians were walked to the coast. The J. Randle Centre for Yoruba Culture is essential for second-generation Nigerians who grew up outside Yorubaland. Kalakuta Museum is essential for anyone who wants to understand the creative resistance tradition that produced Afrobeats.",
    ],
  },
];
