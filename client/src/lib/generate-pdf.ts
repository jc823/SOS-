/**
 * PDF Generation — Client-side using jsPDF
 * Generates a professional 4-page assessment report PDF.
 */
import jsPDF from "jspdf";
import type { SOSResult, SubcategoryInput, ScalingProbability } from "./sos-engine";
import { PILLARS } from "./sos-engine";

interface ReportMeta {
  shopName: string;
  assessorName: string;
  assessmentDate: string;
  notes: string;
  city?: string;
  state?: string;
}

const GOLD = "#C8962E";
const DARK = "#0d0d0f";
const LIGHT_GRAY = "#9CA3AF";

function addPageHeader(doc: jsPDF, title: string, page: number, total: number) {
  doc.setFillColor(DARK);
  doc.rect(0, 0, 210, 20, "F");
  doc.setFontSize(8);
  doc.setTextColor(GOLD);
  doc.text("SCALE TOOLKIT — SOS ASSESSMENT REPORT", 15, 13);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`${title}  |  Page ${page}/${total}`, 210 - 15, 13, { align: "right" });
}

function addSectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFontSize(11);
  doc.setTextColor(GOLD);
  doc.text(text.toUpperCase(), 15, y);
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.3);
  doc.line(15, y + 2, 195, y + 2);
}

export async function generateReportPDF(
  result: SOSResult,
  inputs: Record<string, SubcategoryInput>,
  meta: ReportMeta,
  probability: ScalingProbability,
  _logoUrl?: string | null,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const now = new Date();
  const dateStr = meta.assessmentDate || now.toLocaleDateString();

  // ─── Page 1: Cover ──────────────────────────────────────────────────────────
  addPageHeader(doc, "EXECUTIVE SUMMARY", 1, 4);

  doc.setFillColor("#111113");
  doc.rect(0, 20, 210, 60, "F");
  doc.setFontSize(22);
  doc.setTextColor("#FFFFFF");
  doc.text("SOS ASSESSMENT REPORT", 15, 45);
  doc.setFontSize(14);
  doc.setTextColor(GOLD);
  doc.text(meta.shopName || "Untitled Shop", 15, 56);
  doc.setFontSize(9);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(`Assessed by: ${meta.assessorName || "—"}  |  Date: ${dateStr}`, 15, 65);
  if (meta.city && meta.state) doc.text(`Location: ${meta.city}, ${meta.state}`, 15, 71);

  // Score box
  doc.setFillColor(GOLD);
  doc.roundedRect(130, 28, 65, 40, 3, 3, "F");
  doc.setFontSize(32);
  doc.setTextColor(DARK);
  doc.text(`${result.percentage.toFixed(0)}%`, 162, 52, { align: "center" });
  doc.setFontSize(9);
  doc.text("OVERALL SCORE", 162, 60, { align: "center" });

  // Probability
  let y = 95;
  doc.setFontSize(10);
  doc.setTextColor("#FFFFFF");
  doc.text(`Scaling Probability: ${probability.overall.toFixed(0)}%`, 15, y);
  doc.text(`Revenue Tier: ${probability.tierLabel}`, 15, y + 8);

  y += 25;
  addSectionTitle(doc, "PILLAR SCORES", y);
  y += 10;

  for (const pillar of result.pillars) {
    doc.setFontSize(9);
    doc.setTextColor("#FFFFFF");
    doc.text(`${pillar.label}`, 15, y);
    doc.text(`${pillar.percentage.toFixed(0)}%`, 100, y);
    // Bar
    const barWidth = (pillar.percentage / 100) * 80;
    doc.setFillColor("#333336");
    doc.rect(110, y - 4, 80, 5, "F");
    doc.setFillColor(pillar.band === "green" ? "#27AE60" : pillar.band === "yellow" ? "#F39C12" : "#E74C3C");
    doc.rect(110, y - 4, barWidth, 5, "F");
    y += 10;
  }

  if (meta.notes) {
    y += 5;
    addSectionTitle(doc, "NOTES", y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(LIGHT_GRAY);
    const lines = doc.splitTextToSize(meta.notes, 180);
    doc.text(lines.slice(0, 6), 15, y);
  }

  // ─── Page 2: Pillar Detail ─────────────────────────────────────────────────
  doc.addPage();
  addPageHeader(doc, "PILLAR BREAKDOWN", 2, 4);

  y = 30;
  for (const pillar of result.pillars) {
    if (y > 240) { doc.addPage(); addPageHeader(doc, "PILLAR BREAKDOWN", 2, 4); y = 30; }
    addSectionTitle(doc, `${pillar.label} — ${pillar.percentage.toFixed(0)}%`, y);
    y += 10;

    for (const sub of pillar.subcategories) {
      if (y > 270) { doc.addPage(); addPageHeader(doc, "PILLAR BREAKDOWN", 2, 4); y = 30; }
      doc.setFontSize(8);
      doc.setTextColor("#FFFFFF");
      doc.text(`${sub.label}`, 18, y);
      doc.setTextColor(GOLD);
      doc.text(`${sub.score}/5`, 180, y);
      const note = inputs[sub.id]?.note;
      if (note?.trim()) {
        y += 5;
        doc.setFontSize(7);
        doc.setTextColor(LIGHT_GRAY);
        doc.text(`  → ${note.substring(0, 90)}`, 18, y);
      }
      y += 7;
    }
    y += 5;
  }

  // ─── Page 3: Bottlenecks & Action Priorities ──────────────────────────────
  doc.addPage();
  addPageHeader(doc, "ACTION PRIORITIES", 3, 4);

  y = 30;
  addSectionTitle(doc, "TOP BOTTLENECKS", y);
  y += 10;

  for (const bn of result.bottlenecks.slice(0, 8)) {
    doc.setFontSize(9);
    doc.setTextColor("#FFFFFF");
    doc.text(`${bn.label}`, 15, y);
    doc.setTextColor("#E74C3C");
    doc.text(`Score: ${bn.score}/5  Gap: ${bn.gapPoints.toFixed(1)}pts`, 130, y);
    y += 8;
  }

  y += 10;
  addSectionTitle(doc, "LEVERAGE PRIORITIES", y);
  y += 10;

  for (const lp of result.topLeveragePriorities.slice(0, 8)) {
    doc.setFontSize(9);
    doc.setTextColor("#FFFFFF");
    doc.text(`${lp.label}`, 15, y);
    doc.setTextColor(GOLD);
    doc.text(`Deficit: ${lp.weightedDeficit.toFixed(2)}`, 130, y);
    y += 8;
  }

  // ─── Page 4: Probability & Footer ─────────────────────────────────────────
  doc.addPage();
  addPageHeader(doc, "PROBABILITY ENGINE", 4, 4);

  y = 30;
  addSectionTitle(doc, "SCALING PROBABILITY BREAKDOWN", y);
  y += 12;

  doc.setFontSize(24);
  doc.setTextColor(GOLD);
  doc.text(`${probability.overall.toFixed(0)}%`, 105, y + 10, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(LIGHT_GRAY);
  doc.text("probability of hitting revenue goal", 105, y + 20, { align: "center" });

  y += 35;
  for (const contrib of probability.pillarContributions) {
    doc.setFontSize(9);
    doc.setTextColor("#FFFFFF");
    doc.text(`${contrib.label}`, 15, y);
    doc.text(`${contrib.contribution.toFixed(1)}%`, 180, y);
    y += 8;
  }

  if (probability.topBlockers.length > 0) {
    y += 10;
    addSectionTitle(doc, "TOP BLOCKERS", y);
    y += 10;
    for (const blocker of probability.topBlockers.slice(0, 5)) {
      doc.setFontSize(9);
      doc.setTextColor("#E74C3C");
      doc.text(`${blocker.label} (${blocker.pillarLabel}) — Impact: -${blocker.impact.toFixed(1)}%`, 15, y);
      y += 8;
    }
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(LIGHT_GRAY);
  doc.text(
    `Generated by Scale Toolkit  |  ${now.toLocaleDateString()}  |  Confidential`,
    105,
    285,
    { align: "center" },
  );

  // Save
  const filename = `sos-report-${(meta.shopName || "report").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${dateStr}.pdf`;
  doc.save(filename);
}
