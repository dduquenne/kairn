"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { z } from "zod";

import { SEMINAR_TYPES } from "../../../api/seminars/types";
import type { SeminarFormValues } from "../types";

const speakerFormSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
});

export const seminarFormSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est requis"),
    description: z.string().trim().min(1, "La description est requise"),
    speakers: z.array(speakerFormSchema).length(2, "Deux intervenants sont requis"),
    startAt: z.string().min(1, "La date de début est requise"),
    endAt: z.string().min(1, "La date de fin est requise"),
    capacity: z.coerce
      .number({ invalid_type_error: "Capacité invalide" })
      .int("La capacité doit être un entier")
      .min(1, "Au moins 1 place"),
    price: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce
        .number({ invalid_type_error: "Prix invalide" })
        .positive("Le prix doit être positif")
        .optional(),
    ),
    deposit: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce
        .number({ invalid_type_error: "Acompte invalide" })
        .positive("L'acompte doit être positif")
        .optional(),
    ),
    order: z.string().trim().optional(),
    tags: z
      .array(z.string().trim().min(1, "Chaque mot-clé doit contenir au moins un caractère"))
      .min(1, "Au moins un mot-clé"),
    thumbnail: z.string().trim().optional(),
    seminarType: z.string().trim().optional(),
  })
  .refine(
    (data) => new Date(data.startAt).getTime() <= new Date(data.endAt).getTime(),
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endAt"],
    },
  )
  .refine(
    (data) => new Set(data.tags.map((tag) => tag.toLowerCase())).size === data.tags.length,
    {
      message: "Chaque mot-clé doit être unique",
      path: ["tags"],
    },
  );

type FormErrors = Record<string, string | undefined>;

type SeminarFormState = {
  title: string;
  description: string;
  speakers: { firstName: string; lastName: string }[];
  startAt: string;
  endAt: string;
  capacity: string;
  price: string;
  deposit: string;
  order: string;
  tags: string;
  thumbnail: string;
  seminarType: string;
};

type ValidationResult =
  | { data: SeminarFormValues; errors: FormErrors }
  | { data: null; errors: FormErrors };

const mapToFormState = (values: SeminarFormValues): SeminarFormState => ({
  title: values.title ?? "",
  description: values.description ?? "",
  speakers: ensureSpeakers(values.speakers),
  startAt: values.startAt ? formatDateTimeForInput(values.startAt) : "",
  endAt: values.endAt ? formatDateTimeForInput(values.endAt) : "",
  capacity: values.capacity?.toString() ?? "",
  price: values.price?.toString() ?? "",
  deposit: values.deposit?.toString() ?? "",
  order: values.order ?? "",
  tags: values.tags?.join(", ") ?? "",
  thumbnail: values.thumbnail ?? "",
  seminarType: values.seminarType ?? "",
});

type SeminarFormProps = {
  defaultValues: SeminarFormValues;
  heading: string;
  submitLabel: string;
  onSubmit: (values: SeminarFormValues) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  seminarId?: string;
};

export function SeminarForm({
  defaultValues,
  heading,
  submitLabel,
  onSubmit,
  onCancel,
  loading = false,
  seminarId,
}: SeminarFormProps) {
  const [formValues, setFormValues] = useState<SeminarFormState>(mapToFormState(defaultValues));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormValues(mapToFormState(defaultValues));
    setErrors({});
    setThumbnailPreview(defaultValues.thumbnail ?? null);
  }, [defaultValues]);

  const validateValues = useCallback(
    (values: SeminarFormState): ValidationResult => {
      const parsed = seminarFormSchema.safeParse({
        title: values.title,
        description: values.description,
        speakers: ensureSpeakers(values.speakers),
        startAt: values.startAt,
        endAt: values.endAt,
        capacity: values.capacity,
        price: values.price ? Number(values.price) : undefined,
        deposit: values.deposit ? Number(values.deposit) : undefined,
        order: values.order,
        tags: splitTags(values.tags),
        thumbnail: values.thumbnail || undefined,
        seminarType: values.seminarType || undefined,
      });

      if (parsed.success) {
        const normalizedValues: SeminarFormValues = {
          title: parsed.data.title,
          description: parsed.data.description,
          speakers: parsed.data.speakers,
          startAt: parsed.data.startAt,
          endAt: parsed.data.endAt,
          capacity: parsed.data.capacity,
          price: parsed.data.price,
          deposit: parsed.data.deposit,
          order: parsed.data.order,
          tags: normalizeTags(parsed.data.tags),
          thumbnail: parsed.data.thumbnail,
          seminarType: parsed.data.seminarType,
        };

        return { data: normalizedValues, errors: {} };
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
    (field: keyof SeminarFormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSpeakerChange = useCallback(
    (index: number, field: "firstName" | "lastName") =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        setFormValues((previous) => {
          const speakers = previous.speakers.map((speaker, idx) =>
            idx === index ? { ...speaker, [field]: value } : speaker,
          );
          const nextValues = { ...previous, speakers };
          const validation = validateValues(nextValues);
          setErrors(validation.errors);
          return nextValues;
        });
      },
    [validateValues],
  );

  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!seminarId) {
        setErrors((prev) => ({
          ...prev,
          thumbnail: "Veuillez d'abord enregistrer le séminaire avant d'ajouter une vignette.",
        }));
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          thumbnail: "Format non supporté. Utilisez JPG, PNG ou WebP.",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          thumbnail: "L'image ne doit pas dépasser 5 Mo.",
        }));
        return;
      }

      setIsUploadingImage(true);
      setErrors((prev) => ({ ...prev, thumbnail: undefined }));

      const reader = new FileReader();

      reader.onerror = () => {
        setErrors((prev) => ({
          ...prev,
          thumbnail: "Erreur lors de la lecture du fichier.",
        }));
        setIsUploadingImage(false);
      };

      reader.onload = async () => {
        try {
          const fileData = reader.result as string;

          const response = await fetch("/api/seminars/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              seminarId,
              fileData,
              fileName: file.name,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setErrors((prev) => ({
              ...prev,
              thumbnail: data.message || "Erreur lors du téléchargement.",
            }));
            setIsUploadingImage(false);
            return;
          }

          const cacheBustedPath = `${data.finalPath}?t=${Date.now()}`;
          setThumbnailPreview(cacheBustedPath);
          setFormValues((prev) => ({
            ...prev,
            thumbnail: data.finalPath,
          }));
          setIsUploadingImage(false);
        } catch (error) {
          console.error("Upload error:", error);
          setErrors((prev) => ({
            ...prev,
            thumbnail: "Erreur lors du téléchargement de l'image.",
          }));
          setIsUploadingImage(false);
        }
      };

      reader.readAsDataURL(file);
    },
    [seminarId],
  );

  const handleRemoveThumbnail = useCallback(() => {
    setThumbnailPreview(null);
    setFormValues((prev) => ({
      ...prev,
      thumbnail: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

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
          Renseignez les informations principales du séminaire.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-ivory" htmlFor="title">
            Titre
          </label>
          <input
            id="title"
            value={formValues.title}
            onChange={handleChange("title")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="Intitulé du séminaire"
          />
          {errors.title ? <p className="text-xs text-rose-300">{errors.title}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-ivory" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={formValues.description}
            onChange={handleChange("description")}
            className="min-h-[120px] w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="Décrivez le contenu du séminaire"
          />
          {errors.description ? (
            <p className="text-xs text-rose-300">{errors.description}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="seminarType">
            Type de séminaire
          </label>
          <select
            id="seminarType"
            value={formValues.seminarType}
            onChange={handleChange("seminarType")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Sélectionnez un type</option>
            {SEMINAR_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-ivory/50">Optionnel</p>
          {errors.seminarType ? (
            <p className="text-xs text-rose-300">{errors.seminarType}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory">
            Vignette
          </label>
          {thumbnailPreview ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-night/40 bg-night/30">
              <Image
                src={thumbnailPreview}
                alt="Vignette du séminaire"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveThumbnail}
                className="absolute right-2 top-2 rounded-full bg-night/80 p-1.5 text-ivory/70 transition hover:bg-night hover:text-ivory"
                title="Supprimer la vignette"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition ${
                seminarId
                  ? "border-night/40 bg-night/20 hover:border-gold/50 hover:bg-night/30"
                  : "border-night/20 bg-night/10 cursor-not-allowed"
              }`}
              onClick={() => seminarId && fileInputRef.current?.click()}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2 text-ivory/60">
                  <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-xs">Téléchargement...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-ivory/60">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">
                    {seminarId
                      ? "Cliquez pour ajouter une vignette"
                      : "Enregistrez d'abord le séminaire"}
                  </span>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            disabled={!seminarId || isUploadingImage}
          />
          <p className="text-xs text-ivory/50">
            {seminarId ? "JPG, PNG ou WebP (max 5 Mo)" : "Disponible après enregistrement"}
          </p>
          {thumbnailPreview && formValues.thumbnail && (
            <p className="text-xs text-gold">
              N'oubliez pas de cliquer sur « {submitLabel} » pour enregistrer la vignette.
            </p>
          )}
          {errors.thumbnail ? (
            <p className="text-xs text-rose-300">{errors.thumbnail}</p>
          ) : null}
        </div>

        <div className="space-y-3 md:col-span-2">
          <p className="text-sm font-medium text-ivory">Intervenants</p>
          <div className="grid gap-4 md:grid-cols-2">
            {formValues.speakers.map((speaker, index) => {
              const firstNameError = errors[`speakers.${index}.firstName`];
              const lastNameError = errors[`speakers.${index}.lastName`];
              return (
                <div
                  key={`speaker-${index}`}
                  className="space-y-3 rounded-lg border border-night/40 bg-night/30 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-ivory/60">
                    Intervenant·e {index + 1}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        className="text-xs font-medium text-ivory/80"
                        htmlFor={`speaker-${index}-firstName`}
                      >
                        Prénom
                      </label>
                      <input
                        id={`speaker-${index}-firstName`}
                        value={speaker.firstName}
                        onChange={handleSpeakerChange(index, "firstName")}
                        className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                        placeholder="Prénom"
                      />
                      {firstNameError ? (
                        <p className="text-xs text-rose-300">{firstNameError}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <label
                        className="text-xs font-medium text-ivory/80"
                        htmlFor={`speaker-${index}-lastName`}
                      >
                        Nom
                      </label>
                      <input
                        id={`speaker-${index}-lastName`}
                        value={speaker.lastName}
                        onChange={handleSpeakerChange(index, "lastName")}
                        className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                        placeholder="Nom"
                      />
                      {lastNameError ? (
                        <p className="text-xs text-rose-300">{lastNameError}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors["speakers"] ? <p className="text-xs text-rose-300">{errors["speakers"]}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="startAt">
            Début
          </label>
          <input
            id="startAt"
            type="datetime-local"
            value={formValues.startAt}
            onChange={handleChange("startAt")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          />
          {errors.startAt ? <p className="text-xs text-rose-300">{errors.startAt}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="endAt">
            Fin
          </label>
          <input
            id="endAt"
            type="datetime-local"
            value={formValues.endAt}
            onChange={handleChange("endAt")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          />
          {errors.endAt ? <p className="text-xs text-rose-300">{errors.endAt}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="capacity">
            Capacité totale
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            value={formValues.capacity}
            onChange={handleChange("capacity")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          />
          {errors.capacity ? <p className="text-xs text-rose-300">{errors.capacity}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="price">
            Prix (€)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={formValues.price}
            onChange={handleChange("price")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="250"
          />
          <p className="text-xs text-ivory/50">Optionnel</p>
          {errors.price ? <p className="text-xs text-rose-300">{errors.price}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="deposit">
            Acompte (€)
          </label>
          <input
            id="deposit"
            type="number"
            min={0}
            step="0.01"
            value={formValues.deposit}
            onChange={handleChange("deposit")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="120"
          />
          <p className="text-xs text-ivory/50">Optionnel</p>
          {errors.deposit ? <p className="text-xs text-rose-300">{errors.deposit}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ivory" htmlFor="order">
            Commanditaire
          </label>
          <input
            id="order"
            type="text"
            value={formValues.order}
            onChange={handleChange("order")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="Psypnos"
          />
          <p className="text-xs text-ivory/50">Optionnel</p>
          {errors.order ? <p className="text-xs text-rose-300">{errors.order}</p> : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-ivory" htmlFor="tags">
            Mots-clés
          </label>
          <input
            id="tags"
            value={formValues.tags}
            onChange={handleChange("tags")}
            className="w-full rounded-md border border-night/40 bg-night/40 px-3 py-2 text-sm text-ivory outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="respiration, vitalité, lieu:Moulin d'en bas"
          />
          <p className="text-xs text-ivory/50">Séparez les mots-clés par des virgules.</p>
          {errors.tags ? <p className="text-xs text-rose-300">{errors.tags}</p> : null}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-night/40 pt-4">
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
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-night transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function splitTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function normalizeTags(tags: string[]): string[] {
  const unique = new Map<string, string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, tag);
    }
  }
  return Array.from(unique.values());
}

function formatDateTimeForInput(value: string): string {
  try {
    const date = new Date(value);
    // Format as local datetime-local input (YYYY-MM-DDTHH:mm)
    // This preserves the actual date/time without UTC conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return value;
  }
}

function ensureSpeakers(
  speakers: SeminarFormValues["speakers"] | SeminarFormState["speakers"] | undefined,
): { firstName: string; lastName: string }[] {
  const fallback = [
    { firstName: "", lastName: "" },
    { firstName: "", lastName: "" },
  ];

  if (!speakers || speakers.length !== 2) {
    return fallback;
  }

  return speakers.map((speaker) => ({
    firstName: speaker.firstName ?? "",
    lastName: speaker.lastName ?? "",
  }));
}
