/*
 * Report URL encoding/decoding
 * Compresses assessment data into a URL-safe string for sharing.
 * Format: base64-encoded JSON with scores as a compact array.
 */
import { ALL_SUBCATEGORY_IDS } from './sos-engine';
import type { SubcategoryInput, RevenueTier } from './sos-engine';
import type { BusinessProfile } from '@shared/business-profile';

interface ReportPayload {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  notes: string;
  revenueTier: RevenueTier;
  customTarget?: number;
  currentRevenue?: number;
  goalRevenue?: number;
  logoUrl?: string;
  businessProfile?: BusinessProfile;
  // Compact: ordered array of scores matching ALL_SUBCATEGORY_IDS order
  scores: number[];
  // Compact: only non-empty notes as [index, note] pairs
  noteEntries: [number, string][];
}

export function encodeReportURL(
  meta: { shopName: string; assessorName: string; assessmentDate: string; notes: string },
  inputs: Record<string, SubcategoryInput>,
  revenueTier: RevenueTier,
  customTarget?: number,
  logoUrl?: string | null,
  currentRevenue?: number | null,
  goalRevenue?: number | null,
  businessProfile?: BusinessProfile | null
): string {
  const scores = ALL_SUBCATEGORY_IDS.map(id => inputs[id]?.score || 0);
  const noteEntries: [number, string][] = [];
  ALL_SUBCATEGORY_IDS.forEach((id, i) => {
    const note = inputs[id]?.note;
    if (note && note.trim()) noteEntries.push([i, note]);
  });

  const payload: ReportPayload = {
    shopName: meta.shopName,
    assessorName: meta.assessorName,
    assessmentDate: meta.assessmentDate,
    notes: meta.notes,
    revenueTier,
    scores,
    noteEntries,
  };
  if (revenueTier === 'custom' && customTarget) {
    payload.customTarget = customTarget;
  }
  if (logoUrl) {
    payload.logoUrl = logoUrl;
  }
  if (currentRevenue) {
    payload.currentRevenue = currentRevenue;
  }
  if (goalRevenue) {
    payload.goalRevenue = goalRevenue;
  }
  if (businessProfile) {
    payload.businessProfile = businessProfile;
  }

  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

export function decodeReportURL(encoded: string): {
  meta: { shopName: string; assessorName: string; assessmentDate: string; notes: string };
  inputs: Record<string, SubcategoryInput>;
  revenueTier: RevenueTier;
  customTarget?: number;
  logoUrl?: string | null;
  currentRevenue?: number;
  goalRevenue?: number;
  businessProfile?: BusinessProfile | null;
} | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload: ReportPayload = JSON.parse(json);

    const inputs: Record<string, SubcategoryInput> = {};
    ALL_SUBCATEGORY_IDS.forEach((id, i) => {
      inputs[id] = { score: payload.scores[i] || 0, note: '' };
    });
    // Restore notes
    for (const [idx, note] of payload.noteEntries || []) {
      const id = ALL_SUBCATEGORY_IDS[idx];
      if (id && inputs[id]) {
        inputs[id].note = note;
      }
    }

    return {
      meta: {
        shopName: payload.shopName || '',
        assessorName: payload.assessorName || '',
        assessmentDate: payload.assessmentDate || '',
        notes: payload.notes || '',
      },
      inputs,
      revenueTier: payload.revenueTier || '20-30',
      customTarget: payload.customTarget,
      logoUrl: payload.logoUrl || null,
      currentRevenue: payload.currentRevenue,
      goalRevenue: payload.goalRevenue,
      businessProfile: payload.businessProfile || null,
    };
  } catch {
    return null;
  }
}
