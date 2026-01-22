"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { z } from "zod";

import type { TestimonialFormValues } from "../types";

const testimonialFormSchema = z.object({
  quote: z.string().trim().min(1, "Le témoignage est requis").max(800, "Le témoignage est trop long"),
  author: z.string().trim().min(1, "Le nom est requis").max(120, "Le nom est trop long"),
  role: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(120, "La fonction est trop longue").optional(),
  ),
});

type FormErrors = Record<string, string | undefined>;

type TestimonialFormState = {
  quote: string;
  author: string;
  role: string;
};

type ValidationResult =
  | { data: TestimonialFormValues; errors: FormErrors }
  | { data: null; errors: FormErrors };

const mapToFormState = (values: TestimonialFormValues): TestimonialFormState => ({
  quote: values.quote ?? "",
  author: values.author ?? "",
  role: values.role ?? "",
});

type TestimonialFormProps = {
  defaultValues: TestimonialFormValues;
  heading: string;
  submitLabel: string;
  onSubmit: (values: TestimonialFormValues) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
};

export function TestimonialForm({
  defaultValues,
  heading,
  submitLabel,
  onSubmit,
  onCancel,
  loading = false,
}: TestimonialFormProps) {
  const [formValues, setFormValues] = useState<TestimonialFormState>(mapToFormState(defaultValues));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormValues(mapToFormState(defaultValues));
    setErrors({});
  }, [defaultValues]);

  const validateValues = useCallback(
    (values: TestimonialFormState): ValidationResult => {
      const parsed = testimonialFormSchema.safeParse(values);

      if (parsed.success) {
        return { data: parsed.data, errors: {} };
      }

      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path.join(".");
        if (pathKey) {
          fieldErrors[pathKey] = issue.message;
        }
      }

      return { data: null, errors: fieldErrors };
    },
    [],
  );

  const handleChange = useCallback(
    (field: keyof TestimonialFormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setFormValues((previous) => {
          const nextValues = { ...previous, [field]: value };
          const validation = validateValues(nextValues);
          setErrors(validation.errors);
          return nextValues;
        });
      },
    [validateValues],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateValues(formValues);
    setErrors(validation.errors);

    if (!validation.data) {
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(validation.data));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = useMemo(() => loading || isSubmitting, [loading, isSubmitting]);

  return (
    <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-xl font-semibold text-ivory">{heading}</h2>
        <p className="mt-1 text-sm text-ivory/60">
          Ajoutez ou modifiez les témoignages affichés sur la page d'accueil.
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <label className="flex flex-col gap-2 text-sm text-ivory/80">
          Citation
          <textarea
            name="quote"
            value={formValues.quote}
            onChange={handleChange("quote")}
            rows={5}
            required
            className="min-h-[140px] rounded-xl border border-night/40 bg-night/60 px-4 py-3 text-ivory shadow-inner focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          {errors.quote ? (
            <span className="text-xs text-rose-300">{errors.quote}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm text-ivory/80">
          Auteur·rice
          <input
            type="text"
            name="author"
            value={formValues.author}
            onChange={handleChange("author")}
            required
            className="rounded-full border border-night/40 bg-night/60 px-4 py-3 text-ivory shadow-inner focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          {errors.author ? (
            <span className="text-xs text-rose-300">{errors.author}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-2 text-sm text-ivory/80">
          Fonction (optionnel)
          <input
            type="text"
            name="role"
            value={formValues.role}
            onChange={handleChange("role")}
            className="rounded-full border border-night/40 bg-night/60 px-4 py-3 text-ivory shadow-inner focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          {errors.role ? (
            <span className="text-xs text-rose-300">{errors.role}</span>
          ) : null}
        </label>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-night/40 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-night/40 px-4 py-2 text-sm text-ivory/70 transition hover:border-night/60 hover:text-ivory"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-night shadow transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
