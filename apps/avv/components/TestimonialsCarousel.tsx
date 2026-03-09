/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { TestimonialCard } from "./TestimonialCard";

type CarouselTestimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;
};

type TestimonialsCarouselProps = {
  testimonials: CarouselTestimonial[];
};

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const totalSlides = testimonials.length;

  // Mark component as mounted to avoid hydration issues
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [totalSlides]);

  useEffect(() => {
    // Only start interval after component has mounted on client
    if (!hasMounted || totalSlides <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % totalSlides);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [totalSlides, hasMounted]);

  if (totalSlides === 0) {
    return null;
  }

  function goToSlide(index: number) {
    if (totalSlides === 0) {
      return;
    }

    const normalizedIndex = (index + totalSlides) % totalSlides;
    setCurrentIndex(normalizedIndex);
  }

  function handlePrevious() {
    goToSlide(currentIndex - 1);
  }

  function handleNext() {
    goToSlide(currentIndex + 1);
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, slideIndex) => (
            <div key={testimonial.id} className="w-full shrink-0 px-1 sm:px-2">
              <motion.div
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex justify-center"
              >
                <TestimonialCard
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
