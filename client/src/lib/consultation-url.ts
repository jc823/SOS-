/**
 * Consultation URL encoding/decoding
 * Encodes consultation session data into a URL-safe string for sharing.
 * Same compact format as report-url.ts.
 */
import { ALL_SUBCATEGORY_IDS } from "./sos-engine";
import type { SubcategoryInput, RevenueTier } from "./sos-engine";
import type { BusinessProfile } from "@shared/business-profile";

interface ConsultationPayload {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  revenueTier: RevenueTier;
  customTarget?: number;
  currentRevenue?: number;
  goalRevenue?: number;
  logoUrl?: string;
  businessProfile?: BusinessProfile;
  scores: number[];
  noteEntries: [number, string][];
}

export interface DecodedConsultation {
  inputs: Record<string, SubcategoryInput>;
  meta: {
    shopName: string;
    assessorName: string;
    assessmentDate: string;
    notes: string;
  };
  revenueTier: RevenueTier;
  customTarget?: number;
  currentRevenue?: number;
  goalRevenue?: number;
  logoUrl?: string;
  businessProfile?: BusinessProfile;
}

export function encodeConsultationURL(
  meta: { shopName: string; assessorName: string; assessmentDate: string },
  inputs: Record<string, SubcategoryInput>,
  revenueTier: RevenueTier,
  customTarget?: number,
  logoUrl?: string | null,
  currentRevenue?: number | null,
  goalRevenue?: number | null,
  businessProfile?: BusinessProfile | null,
): string {
  const scores = ALL_SUBCATEGORY_IDS.map((id) => inputs[id]?.score || 0);
  const noteEntries: [number, string][] = [];
  ALL_SUBCATEGORY_IDS.forEach((id, i) => {
    const note = inputs[id]?.note;
    if (note?.trim()) noteEntries.push([i, note]);
  });

  const payload: ConsultationPayload = {
    shopName: meta.shopName,
    assessorName: meta.assessorName,
    assessmentDate: meta.assessmentDate,
    revenueTier,
    scores,
    noteEntries,
  };

  if (customTarget) payload.customTarget = customTarget;
  if (logoUrl) payload.logoUrl = logoUrl;
  if (currentRevenue) payload.currentRevenue = currentRevenue;
  if (goalRevenue) payload.goalRevenue = goalRevenue;
  if (businessProfile) payload.businessProfile = businessProfile;

  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeConsultationURL(encoded: string): DecodedConsultation | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload: ConsultationPayload = JSON.parse(json);

    const inputs: Record<string, SubcategoryInput> = {};
    ALL_SUBCATEGORY_IDS.forEach((id, i) => {
      inputs[id] = { score: payload.scores[i] || 0, note: "" };
    });
    for (const [idx, note] of payload.noteEntries || []) {
      const id = ALL_SUBCATEGORY_IDS[idx];
      if (id && inputs[id]) {
        inputs[id]!.note = note;
      }
    }

    return {
      inputs,
      meta: {
        shopName: payload.shopName || "",
        assessorName: payload.assessorName || "",
        assessmentDate: payload.assessmentDate || "",
        notes: "",
      },
      revenueTier: payload.revenueTier || "20-30",
      customTarget: payload.customTarget,
      currentRevenue: payload.currentRevenue,
      goalRevenue: payload.goalRevenue,
      logoUrl: payload.logoUrl,
      businessProfile: payload.businessProfile,
    };
  } catch {
    return null;
  }
}
