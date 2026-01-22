// @ts-nocheck
// TODO: Migration - Prisma models may not be available in Kairn schema
/**
 * PostgreSQL Store Utilities
 *
 * This module provides utility functions for converting Prisma types to application types.
 * Prisma uses `null` for absent optional values, while our application types use `undefined`.
 *
 * IMPORTANT: Prisma JSON Types Explained
 * =======================================
 * Prisma distinguishes between INPUT and OUTPUT JSON types:
 *
 * - InputJsonValue: For WRITING data to the database
 *   Does NOT accept `null` at the root level (use null for that)
 *   Accepts: string | number | boolean | InputJsonObject | InputJsonArray
 *
 * - JsonValue: For READING data from the database
 *   Can include `null` at any level
 *
 * This distinction is why we have separate types for input (writing) and output (reading).
 */

/**
 * InputJsonValue - Type compatible avec Prisma pour l'ÉCRITURE de JSON.
 *
 * Ce type est identique à unknown et n'accepte PAS `null`
 * au niveau racine. C'est la différence clé avec JsonValue (lecture).
 *
 * Pour écrire explicitement `null` dans la DB, utilisez null.
 */
export type InputJsonObject = { readonly [Key in string]?: InputJsonValue | null };
export type InputJsonArray = ReadonlyArray<InputJsonValue | null>;
export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray;

/**
 * Converts null values to undefined in an object.
 * This is necessary because Prisma uses null for absent optional fields,
 * but our application types use undefined (optional properties).
 *
 * @example
 * // Prisma returns: { name: "test", description: null }
 * // After normalization: { name: "test", description: undefined }
 *
 * const prismaResult = await prisma.entity.findFirst();
 * return normalizeNulls(prismaResult);
 */
export function normalizeNulls<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: T[K] extends null ? undefined : T[K] } {
  const result = {} as { [K in keyof T]: T[K] extends null ? undefined : T[K] };

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Convert null to undefined, keep other values as-is
      (result as Record<string, unknown>)[key] = value === null ? undefined : value;
    }
  }

  return result;
}

/**
 * Type helper: converts null to undefined in a union type
 */
export type NullToUndefined<T> = T extends null ? undefined : T;

/**
 * Type helper: converts all null values in an object type to undefined
 */
export type NormalizedRecord<T> = {
  [K in keyof T]: NullToUndefined<T[K]>;
};

/**
 * Type compatible avec Prisma JSON pour la LECTURE (sortie de la DB).
 * Ce type peut contenir `null` à n'importe quel niveau car c'est ce que Prisma retourne.
 *
 * @deprecated Préférer utiliser unknown directement depuis @prisma/client
 */
export type PrismaJsonValue =
  | string
  | number
  | boolean
  | null
  | PrismaJsonValue[]
  | { [key: string]: PrismaJsonValue };

/**
 * Convertit un objet `Record<string, unknown>` en type compatible avec Prisma JSON INPUT.
 * Utilise JSON.parse(JSON.stringify()) pour garantir que seules les valeurs
 * sérialisables sont conservées et pour obtenir un type JSON valide.
 *
 * IMPORTANT: Cette fonction retourne `InputJsonValue | undefined` car c'est
 * le type exact attendu par Prisma pour les champs Json optionnels.
 * - undefined → le champ n'est pas défini (Prisma l'ignore)
 * - InputJsonValue → un objet JSON valide sera stocké
 *
 * POURQUOI CE TYPE EST DIFFÉRENT DE PrismaJsonValue:
 * - InputJsonValue n'accepte PAS `null` au niveau racine
 * - PrismaJsonValue (pour la lecture) accepte `null` partout
 * - C'est cette différence qui causait les erreurs de build récurrentes
 *
 * @param metadata - L'objet metadata à convertir
 * @returns L'objet converti compatible avec Prisma, ou undefined si metadata est undefined
 *
 * @example
 * // Usage dans une création Prisma
 * await prisma.conversionEvent.create({
 *   data: {
 *     ...otherFields,
 *     metadata: toPrismaJson(event.metadata),
 *   },
 * });
 */
export function toPrismaJson(
  metadata: Record<string, unknown> | undefined
): InputJsonValue | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  // JSON.parse(JSON.stringify()) garantit que l'objet est sérialisable
  // et retourne un type compatible avec Prisma InputJsonValue.
  // Note: Les valeurs `null` dans l'objet sont préservées (valides en JSON),
  // mais la fonction ne retourne jamais `null` au niveau racine.
  return JSON.parse(JSON.stringify(metadata)) as InputJsonValue;
}
