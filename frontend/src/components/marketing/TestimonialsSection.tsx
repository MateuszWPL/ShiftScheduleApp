"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Rano robiłam grafik w Excelu, potem wrzucałam zdjęcie do grupy. Ktoś zawsze gubił, pytał 'a ja mam w sobotę?', chaos. Teraz wszystko w jednym — grafik, giełda, powiadomienia. Zmiana życia.",
    author: "Magda",
    role: "Managerka w barze we Wrocławiu",
  },
  {
    quote:
      "Giełda zmian to gamechanger. Wcześniej: 20 wiadomości w grupie, ktoś oddaje, ktoś bierze, nikt nie wie kto na końcu. Teraz: jeden przycisk, widzę kto przejął, zatwierdzam. Zero stresu.",
    author: "Piotr K.",
    role: "Kierownik sklepu spożywczego, Poznań",
  },
  {
    quote:
      "Nie wierzyłem że coś tak prostego może aż tyle zmienić. Setup 5 minut, zaprosiłem ludzi kodem — i tyle. Żadnych integracji, szkoleń. Nawet starsi pracownicy ogarnęli od razu.",
    author: "Łukasz",
    role: "Właściciel pizzerii",
  },
  {
    quote:
      "Excel + WhatsApp to był koszmar. Staffer dał mi w końcu spokój. Grafik widzą wszyscy, dostępności mam od razu, giełda sama się kręci. Polecam każdemu kto ma zespół powyżej 3 osób.",
    author: "Kasia M.",
    role: "Restauracja, Kraków",
  },
  {
    quote:
      "Szukaliśmy czegoś lekkiego — Deputy, Homebase to overkill na nasze 8 osób. Staffer jest w sam raz: grafik, giełda, ogłoszenia. Prosty, tani, działa.",
    author: "Tomek",
    role: "Salon fryzjerski",
  },
  {
    quote:
      "Ogłoszenia z priorytetami to fajna rzecz. Jak coś pilnego — ludzie dostają maila. Reszta w aplikacji. Koniec z 'nie widziałem w grupie'.",
    author: "Ania",
    role: "Kawiarnia, Warszawa",
  },
];

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  return (
    <section className="py-20 sm:py-28 bg-brand-warm-light/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark">
            Co mówią menedżerowie i właściciele
          </h2>
          <p className="mt-3 text-brand-dark-muted">
            Prawdziwe słowa od zespołów, które przeszły z Excela na Staffera.
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth hide-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {TESTIMONIALS.map((t, index) => (
              <motion.article
                key={t.author}
                className="flex-shrink-0 w-[300px] sm:w-[340px] p-6 rounded-2xl bg-white border border-brand-warm shadow-sm hover:shadow-md hover:border-brand/20 transition-all"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Quote className="h-8 w-8 text-brand/30 mb-3" />
                <p className="text-brand-dark-muted text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-4 pt-4 border-t border-brand-warm/50">
                  <span className="font-semibold text-brand-dark text-sm">
                    {t.author}
                  </span>
                  <span className="block text-xs text-brand-dark-soft">
                    {t.role}
                  </span>
                </footer>
              </motion.article>
            ))}
          </div>

          <div className="hidden sm:flex justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-brand-warm bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-warm-light transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5 text-brand-dark" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-brand-warm bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-warm-light transition-colors flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5 text-brand-dark" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
