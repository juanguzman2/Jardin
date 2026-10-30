import { buildPdfHtml, escapeHtml, type PdfData } from './pdfTemplate';

const base: PdfData = {
  from: '2026-10-19',
  to: '2026-10-25',
  records: [
    {
      date: '2026-10-20',
      time: '08:15',
      context: 'Reunión <tensa> & larga',
      body: 'Pecho apretado',
      thought: 'Tengo que ser perfecto',
      action: 'Redes 30 min',
      longTerm: null,
      intensityBefore: 8,
      intensityAfter: 4,
      rule: 'Tengo que ser perfecto',
    },
  ],
  timeline: null,
  rules: null,
  habits: null,
};

describe('PDF', () => {
  it('escapa HTML', () => {
    expect(escapeHtml(`<b>"x" & 'y'</b>`)).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
    expect(escapeHtml(null)).toBe('');
  });

  it('tiene el título, el rango y las columnas del formato original', () => {
    const html = buildPdfHtml(base);
    expect(html).toContain('Auto registro – análisis funcional de conducta');
    expect(html).toContain('Del 19/10/2026 al 25/10/2026');
    for (const col of ['Fecha', 'Hora', '¿Qué pasó?', '¿Cómo me siento? (cuerpo)', '¿Qué pienso?', '¿Qué hice? (corto plazo)', '¿Qué pasó después? (largo plazo)', 'Intensidad antes → después', 'Regla vinculada']) {
      expect(html).toContain(escapeHtml(col));
    }
    expect(html).toContain('Reunión &lt;tensa&gt; &amp; larga');
    expect(html).toContain('8 → 4');
    expect(html).toContain('8:15 a. m.');
    expect(html).toContain('size: A4 landscape');
  });

  it('las secciones opcionales solo aparecen si se piden', () => {
    expect(buildPdfHtml(base)).not.toContain('Monitoreo diario por horas');
    const html = buildPdfHtml({
      ...base,
      timeline: [{ date: '2026-10-20', time: '07:00', activity: 'Desayuno', thought: null, direction: 'toward', area: 'Salud y bienestar' }],
      rules: [{ thought: 'Debo ir al gym', appearances: 3, oppositePct: 67 }],
      habits: { weeks: ['2026-10-19'], rows: [{ name: 'Ir al gym', area: 'Salud y bienestar', cells: [{ fulfilled: 3, expected: 4 }] }] },
    });
    expect(html).toContain('Monitoreo diario por horas');
    expect(html).toContain('▲ Me acerca');
    expect(html).toContain('67 %');
    expect(html).toContain('3/4');
  });

  it('sin registros muestra un texto neutro', () => {
    expect(buildPdfHtml({ ...base, records: [] })).toContain('Sin auto-registros en este rango.');
  });
});
