"use client";

import type { FAQItem } from "@/lib/blog";

import { FAQEditor } from "./FAQEditor";

interface FAQSectionProps {
  faqs: FAQItem[];
  onFAQChange: (faqs: FAQItem[]) => void;
}

/**
 * FAQSection Component
 *
 * Displays the "FAQ" accordion section with the FAQ editor component.
 */
export function FAQSection({ faqs, onFAQChange }: FAQSectionProps) {
  return <FAQEditor faqs={faqs} onChange={onFAQChange} />;
}
