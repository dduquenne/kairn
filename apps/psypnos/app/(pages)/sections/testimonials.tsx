"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionTitle } from "../../../components/SectionTitle";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
}

function TestimonialCard({ quote, author, role, index }: { quote: string; author: string; role?: string; index: number }) {
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
        {role && <p className="text-sm text-ivory/60">{role}</p>}
      </div>
    </motion.article>
  );
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const response = await fetch("/api/testimonials?limit=3");
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des témoignages:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  if (loading) {
    return null;
  }

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
