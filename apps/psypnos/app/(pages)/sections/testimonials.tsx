"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "../../../components/SectionTitle";

// Témoignages statiques (à remplacer par API plus tard)
const testimonials = [
  {
    id: "1",
    quote: "David m'a accompagné avec une bienveillance rare dans une période très difficile de ma vie. Grâce à son écoute et à l'hypnose, j'ai pu traverser mon deuil et retrouver un équilibre intérieur.",
    author: "Marie L.",
    role: "Accompagnement deuil",
  },
  {
    id: "2",
    quote: "Les séances d'hypnose avec David ont été transformatrices. J'ai enfin pu me libérer de mon anxiété chronique et retrouver confiance en moi. Une approche douce et profondément humaine.",
    author: "Thomas B.",
    role: "Gestion de l'anxiété",
  },
  {
    id: "3",
    quote: "Le séminaire de respiration holotropique au Moulin d'en Bas a été une expérience unique. Un cadre magnifique, un accompagnement sécurisant et une transformation profonde.",
    author: "Sophie M.",
    role: "Séminaire respiration holotropique",
  },
];

function TestimonialCard({ quote, author, role, index }: { quote: string; author: string; role: string; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
      className="flex h-full flex-col justify-between rounded-3xl border border-ivory/10 bg-night/40 p-8 shadow-xl shadow-night/40"
    >
      <div>
        <svg className="h-8 w-8 text-gold/40 mb-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="text-ivory/80 leading-relaxed italic">{quote}</p>
      </div>
      <div className="mt-6 border-t border-ivory/10 pt-4">
        <p className="font-semibold text-gold">{author}</p>
        <p className="text-sm text-ivory/60">{role}</p>
      </div>
    </motion.article>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-night/60 px-6 py-20 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionTitle
          eyebrow="Témoignages"
          title="Ils et elles témoignent de leur métamorphose"
        />
        {testimonials.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-ivory/10 bg-night/40 p-8 text-center text-sm text-ivory/60">
            Aucun témoignage pour le moment.
          </div>
        )}
      </div>
    </section>
  );
}
