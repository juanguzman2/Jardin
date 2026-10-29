import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { es } from '../copy/es';
import { listAreas } from '../db/areas';
import { listChecks, listHabits } from '../db/habits';
import { listRecordsInRange } from '../db/records';
import { listRules } from '../db/rules';
import { listTimelineRange } from '../db/timeline';
import { addDays, isoToBogota, minDay, mondayOf, today } from '../domain/dates';
import { weeklyCompliance } from '../domain/habits';
import { buildPdfHtml, type PdfData, type PdfRuleRow } from './pdfTemplate';

export interface PdfOptions {
  from: string;
  to: string;
  includeTimeline: boolean;
  includeRules: boolean;
  includeHabits: boolean;
}

/** Semana anterior, de lunes a domingo (rango por defecto). */
export function previousWeek(day: string): { from: string; to: string } {
  const from = addDays(mondayOf(day), -7);
  return { from, to: addDays(from, 6) };
}

export function collectPdfData(o: PdfOptions): PdfData {
  const areaName = new Map(listAreas().map((a) => [a.id, a.name]));
  const rules = listRules({ includeArchived: true });
  const ruleName = new Map(rules.map((r) => [r.id, r.thought]));
  const records = listRecordsInRange(o.from, o.to);

  let rulesSummary: PdfRuleRow[] | null = null;
  if (o.includeRules) {
    const byRule = new Map<string, { appearances: number; followed: number; opposite: number }>();
    for (const r of records) {
      if (!r.ruleId) continue;
      const s = byRule.get(r.ruleId) ?? { appearances: 0, followed: 0, opposite: 0 };
      s.appearances += 1;
      if (r.followedRule === 'followed') s.followed += 1;
      if (r.followedRule === 'opposite') s.opposite += 1;
      byRule.set(r.ruleId, s);
    }
    rulesSummary = [...byRule.entries()]
      .map(([id, s]) => ({
        thought: ruleName.get(id) ?? '—',
        appearances: s.appearances,
        oppositePct: s.followed + s.opposite > 0 ? Math.round((s.opposite / (s.followed + s.opposite)) * 100) : null,
      }))
      .sort((a, b) => b.appearances - a.appearances);
  }

  let habits: PdfData['habits'] = null;
  if (o.includeHabits) {
    const checks = listChecks();
    const cutoff = minDay(o.to, today());
    const weeks: string[] = [];
    for (let m = mondayOf(o.from); m <= mondayOf(o.to); m = addDays(m, 7)) weeks.push(m);
    habits = {
      weeks,
      rows: listHabits({ includeArchived: true })
        .filter((h) => h.startDate <= o.to && (!h.archived || checks.some((c) => c.habitId === h.id && c.date >= o.from && c.date <= o.to)))
        .map((h) => ({
          name: h.name,
          area: areaName.get(h.areaId) ?? '',
          cells: weeks.map((w) => weeklyCompliance(h, checks, w, cutoff)),
        })),
    };
  }

  return {
    from: o.from,
    to: o.to,
    records: records.map((r) => {
      const when = isoToBogota(r.occurredAt);
      return {
        date: when.date,
        time: when.time,
        context: r.context,
        body: r.body,
        thought: r.thought,
        action: r.action,
        longTerm: r.longTerm,
        intensityBefore: r.intensityBefore,
        intensityAfter: r.intensityAfter,
        rule: r.ruleId ? (ruleName.get(r.ruleId) ?? null) : null,
      };
    }),
    timeline: o.includeTimeline
      ? listTimelineRange(o.from, o.to).map((t) => ({
          date: t.date,
          time: t.time,
          activity: t.activity,
          thought: t.thought,
          direction: t.direction,
          area: t.areaId ? (areaName.get(t.areaId) ?? null) : null,
        }))
      : null,
    rules: rulesSummary,
    habits,
  };
}

/** Genera el PDF (A4 horizontal) y abre el menú del sistema para compartirlo. */
export async function generateAndSharePdf(o: PdfOptions): Promise<void> {
  const html = buildPdfHtml(collectPdfData(o));
  if (Platform.OS === 'web') {
    // Solo para pruebas en el navegador: vista previa del HTML.
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
    return;
  }
  // A4 horizontal en puntos (72 PPI).
  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  const named = new File(Paths.cache, `autoregistro-${o.from}-a-${o.to}.pdf`);
  if (named.exists) named.delete();
  new File(uri).moveSync(named);
  await Sharing.shareAsync(named.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: es.pdf.screenTitle });
}
