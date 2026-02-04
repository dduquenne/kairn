/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { promises as fs } from "fs";
import { dirname, join } from "path";

import { ZodSchema } from "zod";

/**
 * Service générique pour la gestion de fichiers JSON avec validation
 */
export class JsonDatabase<T> {
  private filePath: string;
  private schema: ZodSchema;

  constructor(collection: string, schema: ZodSchema) {
    // Valider le nom de la collection pour éviter les traversées de répertoire
    if (!/^[a-zA-Z0-9_-]+$/.test(collection)) {
      throw new Error("Invalid collection name");
    }

    this.filePath = join(process.cwd(), "data", `${collection}.json`);
    this.schema = schema;
  }

  /**
   * Assure que le fichier existe
   */
  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify({ items: [] }, null, 2), "utf8");
    }
  }

  /**
   * Parse JSON en toute sécurité
   */
  private safeParseJson(raw: string): unknown | null {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  /**
   * Charge tous les items
   */
  async load(): Promise<T[]> {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, "utf8");

    if (!raw.trim()) {
      return [];
    }

    const parsed = this.safeParseJson(raw);
    if (!parsed || typeof parsed !== "object" || !("items" in parsed)) {
      await this.save([]);
      return [];
    }

    const items = (parsed as { items: unknown[] }).items;
    if (!Array.isArray(items)) {
      await this.save([]);
      return [];
    }

    const validatedItems: T[] = [];
    for (const item of items) {
      const result = this.schema.safeParse(item);
      if (result.success) {
        validatedItems.push(result.data);
      }
    }

    // Si la validation a rejeté des items, on réécrit le fichier avec les items valides
    if (validatedItems.length !== items.length) {
      await this.save(validatedItems);
    }

    return validatedItems;
  }

  /**
   * Enregistre tous les items
   */
  async save(items: T[]): Promise<void> {
    await this.ensureFile();
    const content = JSON.stringify({ items }, null, 2);
    await fs.writeFile(this.filePath, `${content}\n`, "utf8");
  }

  /**
   * Ajoute un item
   */
  async add(item: T): Promise<T> {
    const items = await this.load();
    items.push(item);
    await this.save(items);
    return item;
  }

  /**
   * Trouve un item selon un prédicat
   */
  async findOne(predicate: (item: T) => boolean): Promise<T | undefined> {
    const items = await this.load();
    return items.find(predicate);
  }

  /**
   * Trouve tous les items selon un prédicat
   */
  async findAll(predicate?: (item: T) => boolean): Promise<T[]> {
    const items = await this.load();
    return predicate ? items.filter(predicate) : items;
  }

  /**
   * Met à jour un item selon un prédicat
   */
  async updateOne(predicate: (item: T) => boolean, updates: Partial<T>): Promise<T | undefined> {
    const items = await this.load();
    const index = items.findIndex(predicate);

    if (index === -1) {
      return undefined;
    }

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    await this.save(items);

    return updated;
  }

  /**
   * Supprime un item selon un prédicat
   */
  async deleteOne(predicate: (item: T) => boolean): Promise<boolean> {
    const items = await this.load();
    const index = items.findIndex(predicate);

    if (index === -1) {
      return false;
    }

    items.splice(index, 1);
    await this.save(items);

    return true;
  }

  /**
   * Supprime tous les items selon un prédicat
   */
  async deleteAll(predicate: (item: T) => boolean): Promise<number> {
    const items = await this.load();
    const original = items.length;
    const filtered = items.filter((item) => !predicate(item));
    const deleted = original - filtered.length;

    if (deleted > 0) {
      await this.save(filtered);
    }

    return deleted;
  }

  /**
   * Vérifie si un item existe
   */
  async exists(predicate: (item: T) => boolean): Promise<boolean> {
    const items = await this.load();
    return items.some(predicate);
  }

  /**
   * Compte les items correspondant à un prédicat
   */
  async count(predicate?: (item: T) => boolean): Promise<number> {
    const items = await this.load();
    return predicate ? items.filter(predicate).length : items.length;
  }
}
