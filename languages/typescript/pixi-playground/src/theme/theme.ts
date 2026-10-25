import { Assets, type Texture } from "pixi.js";
import type { Faces } from "../shared/skin";

/**
 * Sprites for the boxes, like `labels.json` for names: an optional, git-ignored
 * `themes/<name>/theme.json`, picked with `?theme=<name>` (see `themeUrl`), gives an item type or a
 * SKU textured faces; anything it doesn't mention stays a plain box, and so does everything without
 * `?theme=`.
 */

/** A box's face images, relative to the theme file: `side` defaults to `top`, `end` to `side` */
export type FaceUrls = {
  readonly top: string;
  readonly side?: string;
  readonly end?: string;
};

/** The shape of `theme.json`; every part is optional */
export type ThemeFile = {
  /** by item type id, e.g. { "1": { "top": "truck-top.svg", "side": "truck-side.svg" } } */
  readonly item_types?: Readonly<Record<string, FaceUrls>>;
  /** by SKU id */
  readonly skus?: Readonly<Record<string, FaceUrls>>;
};

/** Loaded faces, by item type id and by SKU id */
export type Skins = {
  readonly itemTypes: ReadonlyMap<number, Faces>;
  readonly skus: ReadonlyMap<number, Faces>;
};

export const NO_SKINS: Skins = { itemTypes: new Map(), skus: new Map() };

/**
 * Where the theme comes from: `?theme=<name>` picks `themes/<name>/theme.json`, no theme (plain
 * boxes) without one
 *
 *   themeUrl("/", "?theme=rts")  # "/themes/rts/theme.json"
 *   themeUrl("/", "")            # null
 */
export const themeUrl = (base: string, search: string): string | null => {
  const name = new URLSearchParams(search).get("theme");
  return name === null || name === ""
    ? null
    : `${base}themes/${encodeURIComponent(name)}/theme.json`;
};

/**
 * Every face's image, defaults filled in and resolved against `base` (the theme file's URL)
 *
 *   faceUrls({ top: "a.svg" }, "http://x/themes/t/theme.json")
 *   # { top: "http://x/themes/t/a.svg", side: "http://x/themes/t/a.svg", end: "http://x/themes/t/a.svg" }
 */
export const faceUrls = (urls: FaceUrls, base: string): Required<FaceUrls> => {
  const side = urls.side ?? urls.top;
  const resolve = (url: string) => new URL(url, base).href;
  return {
    top: resolve(urls.top),
    side: resolve(side),
    end: resolve(urls.end ?? side),
  };
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isFaceUrls = (v: unknown): boolean =>
  isRecord(v) &&
  typeof v.top === "string" &&
  ["side", "end"].every(
    (k) => v[k] === undefined || typeof v[k] === "string",
  ) &&
  Object.keys(v).every((k) => ["top", "side", "end"].includes(k));

/** `theme.json` parsed and checked; throws, saying where, when it's malformed */
export const parseTheme = (json: unknown): ThemeFile => {
  if (!isRecord(json)) throw new TypeError("theme.json: not an object");
  for (const [key, value] of Object.entries(json)) {
    if (key !== "item_types" && key !== "skus")
      throw new TypeError(`theme.json: unknown key "${key}"`);
    if (!isRecord(value) || !Object.values(value).every(isFaceUrls))
      throw new TypeError(`theme.json: "${key}" isn't shaped as expected`);
  }
  return json as ThemeFile;
};

/** `theme.json` from `url` if there's one: it's optional, so a 404 means "no theme" */
export const fetchTheme = async (url: string): Promise<ThemeFile> => {
  const response = await fetch(url);
  if (response.status === 404) return {};
  if (!response.ok)
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return parseTheme(await response.json());
};

/** Load every texture `file` names (a shared image is loaded once); `base` is its URL */
export const loadSkins = async (
  file: ThemeFile,
  base: string,
): Promise<Skins> => {
  const load = async (
    entries: Readonly<Record<string, FaceUrls>> = {},
  ): Promise<Map<number, Faces>> => {
    const urls = Object.entries(entries).map(
      ([id, faces]) => [Number(id), faceUrls(faces, base)] as const,
    );
    const textures: Record<string, Texture> = await Assets.load([
      ...new Set(urls.flatMap(([, f]) => [f.top, f.side, f.end])),
    ]);
    return new Map(
      urls.map(([id, f]) => [
        id,
        { top: textures[f.top], side: textures[f.side], end: textures[f.end] },
      ]),
    );
  };
  return {
    itemTypes: await load(file.item_types),
    skus: await load(file.skus),
  };
};
