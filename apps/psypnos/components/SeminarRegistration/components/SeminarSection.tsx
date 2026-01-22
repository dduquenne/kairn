// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Selection Section
 */

"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormField } from "./FormField";
import type { FormField as FormFieldType, FormErrors, SeminarRegistrationFormState, Seminar } from "../types";
import { joinClassNames, formatSeminarOption, getPriceMessage } from "../utils";
import { FIELD_MOTION, REASSURANCE_MESSAGES } from "../constants";

const CARD_SECTION_CLASS =
  "rounded-3xl border border-ivory/10 bg-night/80 p-5 shadow-inner shadow-night/60";
const HELPER_TEXT_CLASS = "text-xs text-ivory/60";
const ERROR_TEXT_CLASS = "text-sm text-feedback-error";
const REASSURANCE_CLASS = "text-sm text-feedback-success";

interface SeminarSectionProps {
  formValues: SeminarRegistrationFormState;
  errors: FormErrors;
  touchedFields: Partial<Record<FormFieldType, boolean>>;
  isProcessing: boolean;
  handleChange: (field: FormFieldType) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setBooleanField: (field: FormFieldType, value: boolean) => void;
  seminars: Seminar[];
  selectedSeminar: Seminar | undefined;
}

export function SeminarSection({
  formValues,
  errors,
  touchedFields,
  isProcessing,
  handleChange,
  setBooleanField,
  seminars,
  selectedSeminar,
}: SeminarSectionProps) {
  const priceMessage = getPriceMessage(selectedSeminar);

  return (
    <section
      className={joinClassNames(CARD_SECTION_CLASS, "space-y-6")}
      aria-label="Choix du séminaire"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
        Votre séminaire
      </p>

      <FormField
        id="seminarId"
        label="Séminaire souhaité"
        type="select"
        value={formValues.seminarId}
        onChange={handleChange("seminarId")}
        disabled={isProcessing}
        touched={touchedFields.seminarId}
        error={errors.seminarId}
      >
        <option value="">Sélectionnez une date…</option>
        {seminars.map((seminar) => (
          <option key={seminar.id} value={seminar.id}>
            {formatSeminarOption(seminar)}
          </option>
        ))}
      </FormField>

      {selectedSeminar && (
        <>
          <motion.div
            {...FIELD_MOTION}
            className="flex flex-col gap-4 rounded-2xl border border-ivory/15 bg-night/70 px-5 py-4 shadow-inner"
          >
            <label htmlFor="firstTime" className="text-xs font-semibold uppercase tracking-[0.2em] text-ivory/60">
              Est-ce votre première participation ?
            </label>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
              <label className="flex items-center gap-3">
                <input
                  id="firstTime"
                  type="radio"
                  name="firstTime"
                  value="false"
                  className="h-4 w-4 cursor-pointer accent-gold"
                  disabled={isProcessing}
                  checked={!formValues.firstTime}
                  onChange={() => setBooleanField("firstTime", false)}
                />
                <span className="text-sm">Non, j'ai déjà participé</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="firstTime"
                  value="true"
                  className="h-4 w-4 cursor-pointer accent-gold"
                  disabled={isProcessing}
                  checked={formValues.firstTime}
                  onChange={() => setBooleanField("firstTime", true)}
                />
                <span className="text-sm">Oui, c'est une première</span>
              </label>
            </div>
            <AnimatePresence mode="wait">
              {touchedFields.firstTime && (
                <motion.span
                  key="firstTime-hint"
                  className={HELPER_TEXT_CLASS}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  {REASSURANCE_MESSAGES.firstTime}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.label
            {...FIELD_MOTION}
            htmlFor="consent"
            className="flex flex-col gap-4 rounded-2xl border border-ivory/15 bg-night/70 px-5 py-4 text-ivory shadow-inner"
          >
            <div className="space-y-4 text-sm leading-relaxed">
              {priceMessage && (
                <p className="font-medium text-gold">{priceMessage}</p>
              )}
              <p>
                Le règlement de l'acompte est à effectuer par chèque (encaissé après le séminaire) à l'ordre de <strong>Psypnos</strong> et à adresser à :
              </p>
              <p className="text-center text-base font-semibold">
                David Duquenne<br />Le Moulin d'en Bas<br />89330 Saint-Julien-du-Sault
              </p>
              {formValues.firstTime && (
                <p className="font-medium">
                  Pour une première inscription, merci d'attendre l'entretien préalable avant d'envoyer votre acompte.
                </p>
              )}
              <p>
                <strong>Annulation anticipée :</strong> entre 15 jours et une semaine avant le séminaire, l'acompte est encaissé.
              </p>
              <p>
                <strong>Annulation tardive :</strong> à moins d'une semaine, la totalité est due (sauf remplacement possible).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <input
                id="consent"
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-ivory/30 bg-night/80 text-gold focus:ring-gold/40"
                disabled={isProcessing}
                checked={formValues.consent}
                onChange={handleChange("consent")}
              />
              <div>
                <p className="text-sm font-semibold">J'accepte les conditions d'inscription.</p>
                <AnimatePresence mode="wait">
                  {touchedFields.consent && errors.consent ? (
                    <motion.span
                      key="consent-error"
                      className={ERROR_TEXT_CLASS}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      {errors.consent}
                    </motion.span>
                  ) : touchedFields.consent ? (
                    <motion.span
                      key="consent-hint"
                      className={REASSURANCE_CLASS}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      {REASSURANCE_MESSAGES.consent}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.label>
        </>
      )}
    </section>
  );
}
