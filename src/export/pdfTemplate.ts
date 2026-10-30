import { es } from '../copy/es';
import type { Direction } from '../domain/types';
import { formatDayNumeric, formatDayShort, formatTime12 } from '../ui/format';

/*
 * Plantilla HTML del PDF para la psicóloga (A4 horizontal).
 * Réplica del formato "Auto registro – análisis funcional de conducta".
 */

export interface PdfRecordRow {
  date: string;
  time: string;
  context: string;
  body: string | null;
  thought: string | null;
  action: string | null;
  longTerm: string | null;
  intensityBefore: number | null;
  intensityAfter: number | null;
  rule: string | null;
}

export interface PdfTimelineRow {
  date: string;
  time: string;
  activity: string;
  thought: string | null;
  direction: Direction | null;
  area: string | null;
}

export interface PdfRuleRow {
  thought: string;
  appearances: number;
  oppositePct: number | null;
}

export interface PdfHabitTable {
  /** Lunes de cada semana del rango. */
  weeks: string[];
  rows: { name: string; area: string; cells: ({ fulfilled: number; expected: number } | null)[] }[];
}

export interface PdfData {
  from: string;
  to: string;
  records: PdfRecordRow[];
  timeline: PdfTimelineRow[] | null;
  rules: PdfRuleRow[] | null;
  habits: PdfHabitTable | null;
}

export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DIRECTION_MARK: Record<Direction, string> = {
  toward: `▲ ${es.direction.toward}`,
  away: `▼ ${es.direction.away}`,
  neutral: `• ${es.direction.neutral}`,
};

const STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 9pt; color: #1e2420; margin: 0; }
  h1 { font-size: 15pt; margin: 0 0 2pt; }
  h2 { font-size: 11.5pt; margin: 14pt 0 5pt; color: #2e7a57; }
  .range { color: #646c67; margin-bottom: 8pt; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 0.6pt solid #b9bdb7; padding: 3pt 4pt; vertical-align: top; text-align: left; white-space: pre-wrap; word-wrap: break-word; }
  th { background: #e4efe7; font-weight: 700; font-size: 8.5pt; }
  tr { page-break-inside: avoid; }
  .num { text-align: center; white-space: nowrap; }
  .empty { color: #646c67; font-style: italic; }
  .toward { color: #2e7a57; } .away { color: #9a6420; } .neutral { color: #646c67; }
  footer { margin-top: 14pt; color: #8a918d; font-size: 7.5pt; }
`;

function recordsTable(rows: PdfRecordRow[]): string {
  const c = es.pdf.cols;
  if (rows.length === 0) return `<p class="empty">${escapeHtml(es.pdf.noRecords)}</p>`;
  const widths = [7, 6.5, 14, 12.5, 12, 12.5, 13.5, 8, 14];
  const head = [c.date, c.time, c.context, c.body, c.thought, c.action, c.longTerm, c.intensity, c.rule];
  const body = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(formatDayNumeric(r.date))}</td>
        <td class="num">${escapeHtml(formatTime12(r.time))}</td>
        <td>${escapeHtml(r.context)}</td>
        <td>${escapeHtml(r.body)}</td>
        <td>${escapeHtml(r.thought)}</td>
        <td>${escapeHtml(r.action)}</td>
        <td>${escapeHtml(r.longTerm)}</td>
        <td class="num">${escapeHtml(es.records.intensityArrow(r.intensityBefore, r.intensityAfter))}</td>
        <td>${escapeHtml(r.rule)}</td>
      </tr>`,
    )
    .join('');
  return `<table><colgroup>${widths.map((w) => `<col style="width:${w}%">`).join('')}</colgroup>
    <thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
}

function timelineTable(rows: PdfTimelineRow[]): string {
  if (rows.length === 0) return `<p class="empty">${escapeHtml(es.pdf.timelineEmpty)}</p>`;
  const body = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(formatDayNumeric(r.date))}</td>
        <td class="num">${escapeHtml(formatTime12(r.time))}</td>
        <td>${escapeHtml(r.activity)}</td>
        <td>${escapeHtml(r.thought)}</td>
        <td class="${r.direction ?? ''}">${r.direction ? escapeHtml(DIRECTION_MARK[r.direction]) : ''}</td>
        <td>${escapeHtml(r.area)}</td>
      </tr>`,
    )
    .join('');
  return `<table><colgroup><col style="width:8%"><col style="width:7.5%"><col style="width:32.5%"><col style="width:28%"><col style="width:12%"><col style="width:12%"></colgroup>
    <thead><tr><th>${escapeHtml(es.pdf.cols.date)}</th><th>${escapeHtml(es.pdf.cols.time)}</th><th>${escapeHtml(es.timelineForm.activity)}</th><th>${escapeHtml(es.timelineForm.thought)}</th><th>${escapeHtml(`${es.direction.toward} / ${es.direction.away}`)}</th><th>${escapeHtml(es.common.area)}</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

function rulesTable(rows: PdfRuleRow[]): string {
  if (rows.length === 0) return `<p class="empty">${escapeHtml(es.pdf.rulesEmpty)}</p>`;
  const c = es.pdf.rulesCols;
  const body = rows
    .map(
      (r) => `<tr><td>${escapeHtml(r.thought)}</td><td class="num">${r.appearances}</td><td class="num">${
        r.oppositePct === null ? '–' : `${r.oppositePct} %`
      }</td></tr>`,
    )
    .join('');
  return `<table style="width:70%"><colgroup><col style="width:60%"><col style="width:20%"><col style="width:20%"></colgroup>
    <thead><tr><th>${escapeHtml(c.rule)}</th><th>${escapeHtml(c.appearances)}</th><th>${escapeHtml(c.opposite)}</th></tr></thead><tbody>${body}</tbody></table>`;
}

function habitsTable(table: PdfHabitTable): string {
  if (table.rows.length === 0) return `<p class="empty">${escapeHtml(es.pdf.habitsEmpty)}</p>`;
  const c = es.pdf.habitsCols;
  const head = table.weeks.map((w) => `<th class="num">${escapeHtml(`${c.week} ${formatDayShort(w)}`)}</th>`).join('');
  const body = table.rows
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.area)}</td>${r.cells
          .map((cell) => `<td class="num">${cell ? `${cell.fulfilled}/${cell.expected}` : '–'}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr><th>${escapeHtml(c.habit)}</th><th>${escapeHtml(c.area)}</th>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildPdfHtml(data: PdfData): string {
  const sections = [
    `<h1>${escapeHtml(es.pdf.title)}</h1>`,
    `<div class="range">${escapeHtml(es.pdf.rangeLabel(formatDayNumeric(data.from), formatDayNumeric(data.to)))}</div>`,
    recordsTable(data.records),
  ];
  if (data.timeline) sections.push(`<h2>${escapeHtml(es.pdf.timelineTitle)}</h2>`, timelineTable(data.timeline));
  if (data.rules) sections.push(`<h2>${escapeHtml(es.pdf.rulesTitle)}</h2>`, rulesTable(data.rules));
  if (data.habits) sections.push(`<h2>${escapeHtml(es.pdf.habitsTitle)}</h2>`, habitsTable(data.habits));
  sections.push(`<footer>${escapeHtml(es.pdf.footer)}</footer>`);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(es.pdf.title)}</title><style>${STYLE}</style></head><body>${sections.join('\n')}</body></html>`;
}
