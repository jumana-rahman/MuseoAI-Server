import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (_ai) return _ai;
  _ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY });
  return _ai;
}

export function sanitizeInput(input: string, maxLength: number = 2000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "");
}
