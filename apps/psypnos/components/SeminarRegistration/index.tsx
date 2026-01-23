// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Form - Main Component
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import seminarsData from "../../data/seminars.json";
import { trackConversionEvent } from "../../hooks/useAnalytics";
import { useCSRF } from "../../hooks/useCSRF";

import type { Seminar, SeminarRegistrationData } from "./types";
import { useFormState } from "./hooks/useFormState";
import { IdentitySection } from "./components/IdentitySection";
import { SeminarSection } from "./components/SeminarSection";
import { FormField } from "./components/FormField";
import { FORM_VARIANTS, FIELD_MOTION, ALL_FIELDS_TOUCHED, COUNTRY_LIST, REASSURANCE_MESSAGES } from "./constants";
import { getBirthYearBounds } from "./schema";
import { joinClassNames } from "./utils";

const CARD_SECTION_CLASS =
  "rounded-3xl border border-ivory/10 bg-night/80 p-5 shadow-inner shadow-night/60";
const HELPER_TEXT_CLASS = "text-xs text-ivory/60";
const ERROR_TEXT_CLASS = "text-sm text-feedback-error";
const REASSURANCE_CLASS = "text-sm text-feedback-success";

export default function SeminarRegistrationForm() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isMutationPending, setIsMutationPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Get birth year bounds at runtime to avoid hydration mismatch
  const { minBirthYear, maxBirthYear } = useMemo(() => getBirthYearBounds(), []);

  // Track mounting to avoid hydration mismatch with date-based filtering
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    formValues,
    errors,
    touchedFields,
    isValid,
    handleChange,
    setBooleanField,
    setAllFieldsTouched,
    resetForm,
    validate,
  } = useFormState();

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { csrfToken, isLoading: csrfLoading, error: csrfError, refreshToken } = useCSRF();

  // Séminaires depuis le JSON - defer date filtering to client-side only
  const seminars: Seminar[] = useMemo(() => {
    const list = Array.isArray((seminarsData as any)?.seminars)
      ? ((seminarsData as any).seminars as Seminar[])
      : [];

    // On server/initial render, return all seminars sorted by date
    // On client after mount, filter by current date
    if (!hasMounted) {
      return list.sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    }

    const now = new Date();
    const upcomingSeminars = list.filter(
      (seminar) => new Date(seminar.startAt).getTime() >= now.getTime()
    );
    return upcomingSeminars.sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [hasMounted]);

  const selectedSeminar = useMemo(
    () => seminars.find((s) => s.id === formValues.seminarId),
    [seminars, formValues.seminarId]
  );

  const submitRegistration = useCallback(
    async ({ formData, token }: { formData: SeminarRegistrationData; token: string }) => {
      if (!csrfToken) {
        throw new Error("Token CSRF manquant");
      }

      setIsMutationPending(true);
      try {
        const response = await fetch("/api/registrations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ReCaptcha-Token": token,
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            ...formData,
            csrf_token: csrfToken,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message =
            errorBody?.message ??
            "Une erreur est survenue, réessayons dans un instant.";
          throw new Error(message);
        }

        await response.json().catch(() => null);
        await trackConversionEvent("seminar_registration", "form_submission_success", true);

        setShowSuccess(true);
        setGeneralError(null);
        resetForm();
        await refreshToken();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Un imprévu est survenu, réessayons plus tard.";
        setGeneralError(message);
        throw error;
      } finally {
        setIsMutationPending(false);
      }
    },
    [resetForm, csrfToken, refreshToken]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setGeneralError(null);
      setAllFieldsTouched(ALL_FIELDS_TOUCHED);

      if (!csrfToken) {
        setGeneralError("Erreur de sécurité. Veuillez rafraîchir la page et réessayer.");
        return;
      }

      const validation = validate();
      if (!validation.data) return;

      if (!executeRecaptcha) {
        setGeneralError(
          "Le service de sécurité est temporairement indisponible, merci de réessayer bientôt."
        );
        return;
      }

      const token = await executeRecaptcha("seminar_registration");
      if (!token) {
        setGeneralError("Nous n'avons pas pu vérifier votre inscription. Merci de réessayer.");
        return;
      }

      setIsSubmitting(true);
      try {
        await submitRegistration({ formData: validation.data, token });
      } catch (error) {
        console.error("registration-error", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha, validate, submitRegistration, csrfToken, setAllFieldsTouched]
  );

  const isProcessing = isSubmitting || isMutationPending;

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-ivory/15 bg-night/95 px-6 py-10 shadow-aurora backdrop-blur-lg">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/25 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-night/40 blur-[160px]" />
      </div>

      <motion.h2
        className="font-display text-3xl text-center text-ivory sm:text-4xl"
        variants={FORM_VARIANTS}
      >
        Inscription à un séminaire
      </motion.h2>

      <motion.p
        className="mx-auto mt-4 max-w-2xl text-center text-sm text-ivory/80 sm:text-base"
        variants={FORM_VARIANTS}
      >
        Pour vivre l'une de nos immersions en Respiration Holotropique, complétez ce dossier sécurisé.
        Chaque information reste confidentielle et nous permet de préparer un accueil sur mesure.
      </motion.p>

      <form className="relative mt-10 space-y-8 text-ivory" onSubmit={handleSubmit}>
        <IdentitySection
          formValues={formValues}
          errors={errors}
          touchedFields={touchedFields}
          isProcessing={isProcessing}
          handleChange={handleChange}
        />

        <SeminarSection
          formValues={formValues}
          errors={errors}
          touchedFields={touchedFields}
          isProcessing={isProcessing}
          handleChange={handleChange}
          setBooleanField={setBooleanField}
          seminars={seminars}
          selectedSeminar={selectedSeminar}
        />

        {/* Additional Info Section */}
        <section
          className={joinClassNames(CARD_SECTION_CLASS, "space-y-6")}
          aria-label="Informations complémentaires"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
            Informations complémentaires
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              id="birthYear"
              label="Année de naissance"
              type="number"
              placeholder="YYYY"
              min={minBirthYear}
              max={maxBirthYear}
              inputMode="numeric"
              value={formValues.birthYear}
              onChange={handleChange("birthYear")}
              disabled={isProcessing}
              touched={touchedFields.birthYear}
              error={errors.birthYear}
            />
            <FormField
              id="sex"
              label="Sexe"
              type="select"
              value={formValues.sex}
              onChange={handleChange("sex")}
              disabled={isProcessing}
              touched={touchedFields.sex}
              error={errors.sex}
            >
              <option value="">Sélectionnez…</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </FormField>
            <FormField
              id="sexOther"
              label="Précision (si autre)"
              type="text"
              value={formValues.sexOther || ""}
              onChange={handleChange("sexOther")}
              disabled={isProcessing || formValues.sex !== "autre"}
              touched={touchedFields.sexOther}
              error={errors.sexOther}
            />
          </div>

          <FormField
            id="addressStreet"
            label="Adresse postale"
            type="text"
            autoComplete="street-address"
            value={formValues.addressStreet}
            onChange={handleChange("addressStreet")}
            disabled={isProcessing}
            touched={touchedFields.addressStreet}
            error={errors.addressStreet}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              id="addressZip"
              label="Code postal"
              type="text"
              autoComplete="postal-code"
              value={formValues.addressZip}
              onChange={handleChange("addressZip")}
              disabled={isProcessing}
              touched={touchedFields.addressZip}
              error={errors.addressZip}
            />
            <FormField
              id="addressCity"
              label="Ville"
              type="text"
              autoComplete="address-level2"
              value={formValues.addressCity}
              onChange={handleChange("addressCity")}
              disabled={isProcessing}
              touched={touchedFields.addressCity}
              error={errors.addressCity}
            />
            <FormField
              id="addressCountry"
              label="Pays"
              type="select"
              value={formValues.addressCountry}
              onChange={handleChange("addressCountry")}
              disabled={isProcessing}
              touched={touchedFields.addressCountry}
              error={errors.addressCountry}
            >
              {COUNTRY_LIST.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </FormField>
          </div>
        </section>

        {/* Security Section */}
        <section
          className={joinClassNames(CARD_SECTION_CLASS, "space-y-6")}
          aria-label="Sécurité et suivi"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
            Sécurité & suivi
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              id="emergencyLastName"
              label="Nom de la personne de confiance"
              type="text"
              value={formValues.emergencyLastName}
              onChange={handleChange("emergencyLastName")}
              disabled={isProcessing}
              touched={touchedFields.emergencyLastName}
              error={errors.emergencyLastName}
            />
            <FormField
              id="emergencyFirstName"
              label="Prénom"
              type="text"
              value={formValues.emergencyFirstName}
              onChange={handleChange("emergencyFirstName")}
              disabled={isProcessing}
              touched={touchedFields.emergencyFirstName}
              error={errors.emergencyFirstName}
            />
            <FormField
              id="emergencyPhone"
              label="Téléphone"
              type="tel"
              value={formValues.emergencyPhone}
              onChange={handleChange("emergencyPhone")}
              disabled={isProcessing}
              touched={touchedFields.emergencyPhone}
              error={errors.emergencyPhone}
            />
          </div>

          {/* Prior Work Checkbox */}
          <motion.label
            {...FIELD_MOTION}
            htmlFor="hasPriorWork"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ivory/15 bg-night/70 px-5 py-4 text-ivory shadow-inner"
          >
            <input
              id="hasPriorWork"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-ivory/30 bg-night/80 text-gold focus:ring-gold/40"
              disabled={isProcessing}
              checked={!!formValues.hasPriorWork}
              onChange={handleChange("hasPriorWork")}
            />
            <div>
              <p className="text-sm font-semibold">
                Avez-vous déjà participé à un atelier ou un stage de respiration ou d'états modifiés de conscience ?
              </p>
              <AnimatePresence mode="wait">
                {touchedFields.hasPriorWork && (
                  <motion.span
                    key="hasPriorWork-hint"
                    className={HELPER_TEXT_CLASS}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {REASSURANCE_MESSAGES.hasPriorWork}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.label>

          <FormField
            id="priorWorkDetails"
            label="Détails des stages suivis"
            type="textarea"
            placeholder="Ex. Respiration holotropique – Association XYZ – Animé par A. Dupont et B. Martin…"
            rows={4}
            value={formValues.priorWorkDetails || ""}
            onChange={handleChange("priorWorkDetails")}
            disabled={isProcessing || !formValues.hasPriorWork}
            touched={touchedFields.priorWorkDetails}
            error={errors.priorWorkDetails}
          />

          <FormField
            id="precisions"
            label="Précisions particulières"
            type="textarea"
            rows={4}
            value={formValues.precisions || ""}
            onChange={handleChange("precisions")}
            disabled={isProcessing}
            touched={touchedFields.precisions}
            error={errors.precisions}
          />

          {/* Newsletter Opt-in */}
          <motion.label
            {...FIELD_MOTION}
            htmlFor="newsletterOptIn"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ivory/15 bg-night/70 px-5 py-4 text-ivory shadow-inner"
          >
            <input
              id="newsletterOptIn"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-ivory/30 bg-night/80 text-gold focus:ring-gold/40"
              disabled={isProcessing}
              checked={formValues.newsletterOptIn}
              onChange={handleChange("newsletterOptIn")}
            />
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                Je souhaite recevoir la newsletter afin d'être informé·e des prochains stages.
              </p>
              <p className={HELPER_TEXT_CLASS}>
                Nous vous écrirons ponctuellement pour annoncer les nouveaux séminaires et actualités majeures.
              </p>
              <AnimatePresence mode="wait">
                {touchedFields.newsletterOptIn && (
                  <motion.span
                    key="newsletterOptIn-hint"
                    className={REASSURANCE_CLASS}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {REASSURANCE_MESSAGES.newsletterOptIn}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.label>

          {/* RGPD Consent */}
          <motion.label
            {...FIELD_MOTION}
            htmlFor="consent_RGPD"
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ivory/15 bg-night/70 px-5 py-4 text-ivory shadow-inner"
          >
            <input
              id="consent_RGPD"
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-ivory/30 bg-night/80 text-gold focus:ring-gold/40"
              disabled={isProcessing}
              checked={formValues.consent_RGPD}
              onChange={handleChange("consent_RGPD")}
            />
            <div>
              <p className="text-sm font-semibold">
                J'accepte la{" "}
                <Link
                  href="/politique-de-confidentialite"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-gold underline underline-offset-4"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
              <p className={HELPER_TEXT_CLASS}>
                Vos informations restent strictement confidentielles et utilisées uniquement pour ce séminaire.
              </p>
              <AnimatePresence mode="wait">
                {touchedFields.consent_RGPD && errors.consent_RGPD ? (
                  <motion.span
                    key="consent_RGPD-error"
                    className={ERROR_TEXT_CLASS}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {errors.consent_RGPD}
                  </motion.span>
                ) : touchedFields.consent_RGPD ? (
                  <motion.span
                    key="consent_RGPD-hint"
                    className={REASSURANCE_CLASS}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {REASSURANCE_MESSAGES.consent_RGPD}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.label>
        </section>

        {/* Error Messages */}
        {csrfError && !showSuccess && (
          <motion.div
            className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            Erreur de sécurité : {csrfError}. Veuillez rafraîchir la page.
          </motion.div>
        )}

        {generalError && !showSuccess && (
          <motion.div
            className="rounded-2xl border border-feedback-error/40 bg-feedback-error/10 p-4 text-feedback-error-foreground"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {generalError}
          </motion.div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            className="rounded-2xl border border-feedback-success/40 bg-feedback-success/10 p-4"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <h3 className="mb-2 font-semibold text-feedback-success-foreground">
              Merci pour votre inscription !
            </h3>
            <p className="mb-4 text-sm text-feedback-success-foreground">
              Nous avons bien reçu vos informations et reviendrons très vite vers vous avec les détails pratiques du séminaire.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-gold/60 bg-transparent px-6 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Retour à l'accueil
            </Link>
          </motion.div>
        )}

        {/* Submit Button */}
        {!showSuccess && (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/"
              className="flex items-center justify-center rounded-full border-2 border-ivory/40 px-8 py-4 text-base font-semibold uppercase tracking-[0.3em] text-ivory transition hover:border-ivory/60 hover:bg-ivory/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retour à l'accueil
            </Link>
            <motion.button
              type="submit"
              className="group relative flex-1 overflow-hidden rounded-full bg-gold px-8 py-4 text-base font-semibold uppercase tracking-[0.3em] text-night shadow-lg shadow-gold/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isValid || isProcessing || csrfLoading || !csrfToken || !!csrfError}
              whileHover={!isProcessing && !csrfLoading ? { scale: 1.01 } : undefined}
              whileTap={!isProcessing && !csrfLoading ? { scale: 0.99 } : undefined}
            >
              <span className="relative z-10">
                {isProcessing
                  ? "Envoi en cours..."
                  : csrfLoading
                    ? "Chargement..."
                    : "Je confirme mon inscription"}
              </span>
              <span className="absolute inset-0 scale-150 bg-gradient-to-r from-night/10 via-transparent to-night/10 opacity-0 transition group-hover:opacity-100" />
            </motion.button>
          </div>
        )}
      </form>
    </div>
  );
}
