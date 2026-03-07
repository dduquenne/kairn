'use client';

import { cn } from '@kairn/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { z } from 'zod';

import type { SeminarSpeaker } from './SeminarsTable';

/**
 * Type option for seminar type select
 */
export interface SeminarTypeOption {
  value: string;
  label: string;
}

/**
 * Seminar form data submitted by the form
 */
export interface SeminarFormData {
  title: string;
  description: string;
  speakers: SeminarSpeaker[];
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  deposit?: number;
  order?: string;
  tags: string[];
  thumbnail?: string;
  seminarType?: string;
  /** Simple mode fields */
  date?: string;
  location?: string;
  maxParticipants?: number;
  isPublished?: boolean;
}

/**
 * Props for the SeminarForm component
 */
export interface SeminarFormProps {
  /** Initial form data */
  initialData?: Partial<SeminarFormData>;
  /** Form heading */
  heading?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Callback when form is submitted */
  onSubmit: (data: SeminarFormData) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether form is loading */
  isLoading?: boolean;
  /** Custom class names */
  className?: string;
  /** Number of speakers required (default: 2) */
  speakersCount?: number;
  /** Available seminar types for the select field */
  seminarTypes?: SeminarTypeOption[];
  /** Seminar ID (required for thumbnail upload) */
  seminarId?: string;
  /** Custom thumbnail upload handler */
  onThumbnailUpload?: (file: File, seminarId: string) => Promise<string>;
  /** Whether to show deposit field */
  showDeposit?: boolean;
  /** Whether to show order/commanditaire field */
  showOrder?: boolean;
  /** Custom thumbnail renderer (for Next.js Image) */
  renderThumbnail?: (src: string, onRemove: () => void) => ReactNode;
}

type FormState = {
  title: string;
  description: string;
  speakers: SeminarSpeaker[];
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

type FormErrors = Record<string, string | undefined>;

/**
 * Build Zod validation schema based on speakers count
 */
function buildSchema(speakersCount: number) {
  const speakerSchema = z.object({
    firstName: z.string().trim().min(1, 'Le prénom est requis'),
    lastName: z.string().trim().min(1, 'Le nom est requis'),
  });

  return z
    .object({
      title: z.string().trim().min(1, 'Le titre est requis'),
      description: z.string().trim().min(1, 'La description est requise'),
      speakers: z
        .array(speakerSchema)
        .length(speakersCount, `${speakersCount} intervenants requis`),
      startAt: z.string().min(1, 'La date de début est requise'),
      endAt: z.string().min(1, 'La date de fin est requise'),
      capacity: z.coerce
        .number({ invalid_type_error: 'Capacité invalide' })
        .int('La capacité doit être un entier')
        .min(1, 'Au moins 1 place'),
      price: z.preprocess(
        val => (val === '' ? undefined : val),
        z.coerce
          .number({ invalid_type_error: 'Prix invalide' })
          .positive('Le prix doit être positif')
          .optional()
      ),
      deposit: z.preprocess(
        val => (val === '' ? undefined : val),
        z.coerce
          .number({ invalid_type_error: 'Acompte invalide' })
          .positive("L'acompte doit être positif")
          .optional()
      ),
      order: z.string().trim().optional(),
      tags: z
        .array(z.string().trim().min(1, 'Chaque mot-clé doit contenir au moins un caractère'))
        .min(1, 'Au moins un mot-clé'),
      thumbnail: z.string().trim().optional(),
      seminarType: z.string().trim().optional(),
    })
    .refine(data => new Date(data.startAt).getTime() <= new Date(data.endAt).getTime(), {
      message: 'La date de fin doit être postérieure à la date de début',
      path: ['endAt'],
    })
    .refine(data => new Set(data.tags.map(tag => tag.toLowerCase())).size === data.tags.length, {
      message: 'Chaque mot-clé doit être unique',
      path: ['tags'],
    });
}

/**
 * Convert initial data to form state
 */
function mapToFormState(values: Partial<SeminarFormData>, speakersCount: number): FormState {
  const speakers = ensureSpeakers(values.speakers, speakersCount);
  return {
    title: values.title ?? '',
    description: values.description ?? '',
    speakers,
    startAt: values.startAt ? formatDateTimeForInput(values.startAt) : '',
    endAt: values.endAt ? formatDateTimeForInput(values.endAt) : '',
    capacity: values.capacity?.toString() ?? '',
    price: values.price?.toString() ?? '',
    deposit: values.deposit?.toString() ?? '',
    order: values.order ?? '',
    tags: values.tags?.join(', ') ?? '',
    thumbnail: values.thumbnail ?? '',
    seminarType: values.seminarType ?? '',
  };
}

/**
 * SeminarForm - Configurable form for creating/editing seminars
 *
 * Supports speakers, tags, thumbnail upload, deposits, and configurable seminar types.
 */
export function SeminarForm({
  initialData = {},
  heading = 'Séminaire',
  submitLabel = 'Enregistrer',
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  speakersCount = 2,
  seminarTypes = [],
  seminarId,
  onThumbnailUpload,
  showDeposit = false,
  showOrder = false,
  renderThumbnail,
}: SeminarFormProps) {
  const schema = useMemo(() => buildSchema(speakersCount), [speakersCount]);
  const [formValues, setFormValues] = useState<FormState>(
    mapToFormState(initialData, speakersCount)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData.thumbnail ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormValues(mapToFormState(initialData, speakersCount));
    setErrors({});
    setThumbnailPreview(initialData.thumbnail ?? null);
  }, [initialData, speakersCount]);

  /** @internal */
  const validate = useCallback(
    (values: FormState) => {
      const parsed = schema.safeParse({
        title: values.title,
        description: values.description,
        speakers: ensureSpeakers(values.speakers, speakersCount),
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
        return {
          data: {
            ...parsed.data,
            tags: normalizeTags(parsed.data.tags),
          } as SeminarFormData,
          errors: {} as FormErrors,
        };
      }

      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path.join('.');
        if (pathKey) fieldErrors[pathKey] = issue.message;
      }

      return { data: null, errors: fieldErrors };
    },
    [schema, speakersCount]
  );

  /** @internal */
  const handleChange = useCallback(
    (field: keyof FormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setFormValues(prev => {
          const next = { ...prev, [field]: value };
          setErrors(validate(next).errors);
          return next;
        });
      },
    [validate]
  );

  /** @internal */
  const handleSpeakerChange = useCallback(
    (index: number, field: 'firstName' | 'lastName') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormValues(prev => {
        const speakers = prev.speakers.map((speaker, idx) =>
          idx === index ? { ...speaker, [field]: value } : speaker
        );
        const next = { ...prev, speakers };
        setErrors(validate(next).errors);
        return next;
      });
    },
    [validate]
  );

  /** @internal */
  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !seminarId || !onThumbnailUpload) return;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          thumbnail: 'Format non supporté. Utilisez JPG, PNG ou WebP.',
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          thumbnail: "L'image ne doit pas dépasser 5 Mo.",
        }));
        return;
      }

      setIsUploadingImage(true);
      setErrors(prev => ({ ...prev, thumbnail: undefined }));

      try {
        const url = await onThumbnailUpload(file, seminarId);
        setThumbnailPreview(`${url}?t=${Date.now()}`);
        setFormValues(prev => ({ ...prev, thumbnail: url }));
      } catch {
        setErrors(prev => ({
          ...prev,
          thumbnail: "Erreur lors du téléchargement de l'image.",
        }));
      } finally {
        setIsUploadingImage(false);
      }
    },
    [seminarId, onThumbnailUpload]
  );

  /** @internal */
  const handleRemoveThumbnail = useCallback(() => {
    setThumbnailPreview(null);
    setFormValues(prev => ({ ...prev, thumbnail: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /** @internal */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validate(formValues);
    setErrors(result.errors);
    if (!result.data) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(result.data));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = isLoading || isSubmitting;

  return (
    <form className={cn('flex h-full flex-col gap-6', className)} onSubmit={handleSubmit}>
      <div>
        <h2 className="text-ivory text-xl font-semibold">{heading}</h2>
        <p className="text-ivory/60 mt-1 text-sm">
          Renseignez les informations principales du séminaire.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 md:grid-cols-2">
        {/* Title */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-title">
            Titre
          </label>
          <input
            id="sf-title"
            value={formValues.title}
            onChange={handleChange('title')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="Intitulé du séminaire"
          />
          {errors.title && <p className="text-xs text-rose-300">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-description">
            Description
          </label>
          <textarea
            id="sf-description"
            value={formValues.description}
            onChange={handleChange('description')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="Décrivez le contenu du séminaire"
          />
          {errors.description && <p className="text-xs text-rose-300">{errors.description}</p>}
        </div>

        {/* Seminar Type */}
        {seminarTypes.length > 0 && (
          <div className="space-y-2">
            <label className="text-ivory text-sm font-medium" htmlFor="sf-seminarType">
              Type de séminaire
            </label>
            <select
              id="sf-seminarType"
              value={formValues.seminarType}
              onChange={handleChange('seminarType')}
              className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            >
              <option value="">Sélectionnez un type</option>
              {seminarTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-ivory/50 text-xs">Optionnel</p>
            {errors.seminarType && <p className="text-xs text-rose-300">{errors.seminarType}</p>}
          </div>
        )}

        {/* Thumbnail */}
        {onThumbnailUpload && (
          <div className="space-y-2">
            <label className="text-ivory text-sm font-medium">Vignette</label>
            {thumbnailPreview ? (
              renderThumbnail ? (
                renderThumbnail(thumbnailPreview, handleRemoveThumbnail)
              ) : (
                <div className="border-night/40 bg-night/30 relative aspect-video w-full overflow-hidden rounded-lg border">
                  <img
                    src={thumbnailPreview}
                    alt="Vignette du séminaire"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="bg-night/80 text-ivory/70 hover:bg-night hover:text-ivory absolute right-2 top-2 rounded-full p-1.5 transition"
                    title="Supprimer la vignette"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )
            ) : (
              <div
                className={cn(
                  'flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition',
                  seminarId
                    ? 'border-night/40 bg-night/20 hover:border-gold/50 hover:bg-night/30 cursor-pointer'
                    : 'border-night/20 bg-night/10 cursor-not-allowed'
                )}
                onClick={() => seminarId && fileInputRef.current?.click()}
              >
                {isUploadingImage ? (
                  <div className="text-ivory/60 flex flex-col items-center gap-2">
                    <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-xs">Téléchargement...</span>
                  </div>
                ) : (
                  <div className="text-ivory/60 flex flex-col items-center gap-2">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs">
                      {seminarId
                        ? 'Cliquez pour ajouter une vignette'
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
            <p className="text-ivory/50 text-xs">
              {seminarId ? 'JPG, PNG ou WebP (max 5 Mo)' : 'Disponible après enregistrement'}
            </p>
            {thumbnailPreview && formValues.thumbnail && (
              <p className="text-gold text-xs">
                N&apos;oubliez pas de cliquer sur « {submitLabel} » pour enregistrer la vignette.
              </p>
            )}
            {errors.thumbnail && <p className="text-xs text-rose-300">{errors.thumbnail}</p>}
          </div>
        )}

        {/* Speakers */}
        <div className="space-y-3 md:col-span-2">
          <p className="text-ivory text-sm font-medium">Intervenants</p>
          <div className="grid gap-4 md:grid-cols-2">
            {formValues.speakers.map((speaker, index) => {
              const firstNameError = errors[`speakers.${index}.firstName`];
              const lastNameError = errors[`speakers.${index}.lastName`];
              return (
                <div
                  key={`speaker-${index}`}
                  className="border-night/40 bg-night/30 space-y-3 rounded-lg border p-3"
                >
                  <p className="text-ivory/60 text-xs font-semibold uppercase tracking-wide">
                    Intervenant·e {index + 1}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        className="text-ivory/80 text-xs font-medium"
                        htmlFor={`sf-speaker-${index}-firstName`}
                      >
                        Prénom
                      </label>
                      <input
                        id={`sf-speaker-${index}-firstName`}
                        value={speaker.firstName}
                        onChange={handleSpeakerChange(index, 'firstName')}
                        className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
                        placeholder="Prénom"
                      />
                      {firstNameError && <p className="text-xs text-rose-300">{firstNameError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label
                        className="text-ivory/80 text-xs font-medium"
                        htmlFor={`sf-speaker-${index}-lastName`}
                      >
                        Nom
                      </label>
                      <input
                        id={`sf-speaker-${index}-lastName`}
                        value={speaker.lastName}
                        onChange={handleSpeakerChange(index, 'lastName')}
                        className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
                        placeholder="Nom"
                      />
                      {lastNameError && <p className="text-xs text-rose-300">{lastNameError}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.speakers && <p className="text-xs text-rose-300">{errors.speakers}</p>}
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-startAt">
            Début
          </label>
          <input
            id="sf-startAt"
            type="datetime-local"
            value={formValues.startAt}
            onChange={handleChange('startAt')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
          />
          {errors.startAt && <p className="text-xs text-rose-300">{errors.startAt}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-endAt">
            Fin
          </label>
          <input
            id="sf-endAt"
            type="datetime-local"
            value={formValues.endAt}
            onChange={handleChange('endAt')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
          />
          {errors.endAt && <p className="text-xs text-rose-300">{errors.endAt}</p>}
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-capacity">
            Capacité totale
          </label>
          <input
            id="sf-capacity"
            type="number"
            min={1}
            value={formValues.capacity}
            onChange={handleChange('capacity')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
          />
          {errors.capacity && <p className="text-xs text-rose-300">{errors.capacity}</p>}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-price">
            Prix (€)
          </label>
          <input
            id="sf-price"
            type="number"
            min={0}
            step="0.01"
            value={formValues.price}
            onChange={handleChange('price')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="250"
          />
          <p className="text-ivory/50 text-xs">Optionnel</p>
          {errors.price && <p className="text-xs text-rose-300">{errors.price}</p>}
        </div>

        {/* Deposit */}
        {showDeposit && (
          <div className="space-y-2">
            <label className="text-ivory text-sm font-medium" htmlFor="sf-deposit">
              Acompte (€)
            </label>
            <input
              id="sf-deposit"
              type="number"
              min={0}
              step="0.01"
              value={formValues.deposit}
              onChange={handleChange('deposit')}
              className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
              placeholder="120"
            />
            <p className="text-ivory/50 text-xs">Optionnel</p>
            {errors.deposit && <p className="text-xs text-rose-300">{errors.deposit}</p>}
          </div>
        )}

        {/* Order / Commanditaire */}
        {showOrder && (
          <div className="space-y-2">
            <label className="text-ivory text-sm font-medium" htmlFor="sf-order">
              Commanditaire
            </label>
            <input
              id="sf-order"
              type="text"
              value={formValues.order}
              onChange={handleChange('order')}
              className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            />
            <p className="text-ivory/50 text-xs">Optionnel</p>
            {errors.order && <p className="text-xs text-rose-300">{errors.order}</p>}
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-ivory text-sm font-medium" htmlFor="sf-tags">
            Mots-clés
          </label>
          <input
            id="sf-tags"
            value={formValues.tags}
            onChange={handleChange('tags')}
            className="border-night/40 bg-night/40 text-ivory focus:border-gold focus:ring-gold w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1"
            placeholder="respiration, vitalité"
          />
          <p className="text-ivory/50 text-xs">Séparez les mots-clés par des virgules.</p>
          {errors.tags && <p className="text-xs text-rose-300">{errors.tags}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="border-night/40 flex justify-end gap-3 border-t pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border-night/40 text-ivory/70 hover:border-night/60 hover:text-ivory rounded-md border px-4 py-2 text-sm transition disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-gold text-night hover:bg-gold/90 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * Split comma-separated tags string into array
 */
function splitTags(tags: string): string[] {
  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Normalize tags to remove duplicates (case-insensitive)
 */
function normalizeTags(tags: string[]): string[] {
  const unique = new Map<string, string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!unique.has(key)) unique.set(key, tag);
  }
  return Array.from(unique.values());
}

/**
 * Format ISO date string to datetime-local input format
 */
function formatDateTimeForInput(value: string): string {
  try {
    const date = new Date(value);
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

/**
 * Ensure speakers array has the correct number of entries
 */
function ensureSpeakers(speakers: SeminarSpeaker[] | undefined, count: number): SeminarSpeaker[] {
  const fallback = Array.from({ length: count }, () => ({ firstName: '', lastName: '' }));
  if (!speakers || speakers.length !== count) return fallback;
  return speakers.map(s => ({ firstName: s.firstName ?? '', lastName: s.lastName ?? '' }));
}
