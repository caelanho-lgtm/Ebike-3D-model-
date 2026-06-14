import { fetchPublicConfig, runRecommend, type RecommendInput } from './api';
import { buildFitSvg } from './svg';
import { widgetStyles } from './styles';
import type { PublicConfig, RecommendResponse, WidgetConfig } from './types';

const DISCIPLINE_LABELS: Record<string, string> = {
  road_race: 'Road — Race',
  road_endurance: 'Road — Endurance',
  gravel: 'Gravel',
  mtb_xc: 'MTB — Cross-Country',
  mtb_trail: 'MTB — Trail',
  tt_triathlon: 'Time Trial / Tri',
  commute_city: 'Commute / City',
};

const confidenceClass: Record<string, string> = {
  excellent: 'fw-b-excellent', good: 'fw-b-good', fair: 'fw-b-fair', poor: 'fw-b-poor',
};

function scoreColor(s: number): string {
  if (s >= 88) return '#22c55e';
  if (s >= 74) return '#38bdf8';
  if (s >= 58) return '#f59e0b';
  return '#ef4444';
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export class FitWerxWidget {
  private root: ShadowRoot;
  private container: HTMLDivElement;
  private config!: PublicConfig;
  private input: RecommendInput = {
    units: 'metric',
    discipline: 'road_endurance',
    flexibility: 'medium',
    experience: 'intermediate',
    height: 178,
  };

  constructor(host: HTMLElement, private cfg: WidgetConfig) {
    this.root = host.attachShadow({ mode: 'open' });
    this.container = document.createElement('div');
    this.root.appendChild(this.container);
  }

  async start() {
    this.renderLoading();
    try {
      this.config = await fetchPublicConfig(this.cfg);
      if (this.cfg.discipline) this.input.discipline = this.cfg.discipline;
      else if (this.config.disciplines.length) this.input.discipline = this.config.disciplines[0];
      this.injectStyles(this.config.tenant.primaryColor);
      this.renderForm();
    } catch (err) {
      this.renderError(err instanceof Error ? err.message : 'Failed to load widget');
    }
  }

  private injectStyles(primary: string) {
    const existing = this.root.querySelector('style');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.textContent = widgetStyles(primary);
    this.root.insertBefore(style, this.container);
  }

  private renderLoading() {
    this.container.innerHTML = `<div class="fw"><div class="fw-muted">Loading fit assistant…</div></div>`;
  }

  private renderError(message: string) {
    this.container.innerHTML = `<div class="fw"><div class="fw-err">${esc(message)}</div></div>`;
  }

  private header(): string {
    const t = this.config.tenant;
    const logo = t.logoUrl ? `<img class="fw-logo" src="${esc(t.logoUrl)}" alt="${esc(t.name)}"/>` : '';
    return `<div class="fw-head">${logo}<div><div class="fw-title">${esc(t.name)} · Find your fit</div><div class="fw-sub">AI-powered bike sizing in 30 seconds</div></div></div>`;
  }

  private renderForm() {
    const disciplines = this.config.disciplines.length
      ? this.config.disciplines
      : Object.keys(DISCIPLINE_LABELS);
    const opts = disciplines
      .map((d) => `<option value="${d}" ${d === this.input.discipline ? 'selected' : ''}>${DISCIPLINE_LABELS[d] ?? d}</option>`)
      .join('');

    this.container.innerHTML = `<div class="fw">
      ${this.header()}
      <div class="fw-progress"><div style="width:50%"></div></div>
      <div class="fw-row">
        <div class="fw-field"><label>Height (${this.input.units === 'metric' ? 'cm' : 'in'})</label><input id="fw-height" type="number" value="${this.input.height}"/></div>
        <div class="fw-field"><label>Inseam (optional)</label><input id="fw-inseam" type="number" placeholder="—"/></div>
      </div>
      <div class="fw-row">
        <div class="fw-field"><label>Discipline</label><select id="fw-disc">${opts}</select></div>
        <div class="fw-field"><label>Units</label><select id="fw-units"><option value="metric">Metric</option><option value="imperial">Imperial</option></select></div>
      </div>
      <div class="fw-row">
        <div class="fw-field"><label>Flexibility</label><select id="fw-flex"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>
        <div class="fw-field"><label>Experience</label><select id="fw-exp"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option><option value="pro">Pro</option></select></div>
      </div>
      <div id="fw-err"></div>
      <button class="fw-btn" id="fw-go">Get my fit →</button>
      <div class="fw-foot">Powered by FitWerx</div>
    </div>`;

    const $ = (id: string) => this.root.getElementById(id) as HTMLElement | null;
    ($('fw-go') as HTMLButtonElement).onclick = () => this.submit();
    ($('fw-units') as HTMLSelectElement).onchange = (e) => {
      this.input.units = (e.target as HTMLSelectElement).value as 'metric' | 'imperial';
      this.renderForm();
    };
  }

  private async submit() {
    const get = (id: string) => (this.root.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
    this.input.height = Number(get('fw-height'));
    const inseam = get('fw-inseam');
    this.input.inseam = inseam ? Number(inseam) : undefined;
    this.input.discipline = get('fw-disc');
    this.input.flexibility = get('fw-flex') as RecommendInput['flexibility'];
    this.input.experience = get('fw-exp') as RecommendInput['experience'];

    const errEl = this.root.getElementById('fw-err');
    if (!this.input.height || this.input.height < 100) {
      if (errEl) errEl.innerHTML = `<div class="fw-err">Please enter a valid height.</div>`;
      return;
    }

    const btn = this.root.getElementById('fw-go') as HTMLButtonElement | null;
    if (btn) { btn.disabled = true; btn.textContent = 'Calculating…'; }
    try {
      const result = await runRecommend(this.cfg, this.input);
      this.renderResult(result);
    } catch (err) {
      if (errEl) errEl.innerHTML = `<div class="fw-err">${esc(err instanceof Error ? err.message : 'Something went wrong')}</div>`;
      if (btn) { btn.disabled = false; btn.textContent = 'Get my fit →'; }
    }
  }

  private renderResult(result: RecommendResponse) {
    const primary = this.config.tenant.primaryColor;
    const fit = result.fit;
    const recs = result.recommendations.slice(0, 4);

    const recHtml = recs.length
      ? recs
          .map((r, i) => {
            const cls = confidenceClass[r.confidence] ?? 'fw-b-fair';
            return `<div class="fw-rec ${i === 0 ? 'top' : ''}">
              <div class="fw-score" style="border-color:${scoreColor(r.bestSize.score)};color:${scoreColor(r.bestSize.score)}">${r.bestSize.score}</div>
              <div style="flex:1">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <b>${esc(r.brand)} ${esc(r.name)}</b>
                  <span class="fw-badge ${cls}">${r.confidence}</span>
                </div>
                <div class="fw-muted">Size ${esc(r.bestSize.sizeLabel)} · ${r.bestSize.recommendedStemLength}mm stem · ${r.bestSize.recommendedSpacerStack}mm spacers</div>
              </div>
            </div>`;
          })
          .join('')
      : `<div class="fw-muted">No matching models found for this discipline.</div>`;

    this.container.innerHTML = `<div class="fw">
      ${this.header()}
      <div class="fw-progress"><div style="width:100%"></div></div>
      <div class="fw-diagram">${buildFitSvg(fit, primary)}</div>
      <div class="fw-grid3">
        <div class="fw-stat"><b>${fit.saddleHeight}mm</b><span>Saddle height</span></div>
        <div class="fw-stat"><b>${fit.crankLength}mm</b><span>Crank length</span></div>
        <div class="fw-stat"><b>${fit.handlebarWidth}mm</b><span>Bar width</span></div>
      </div>
      <div style="font-weight:700;margin:6px 0 10px">Recommended bikes</div>
      ${recHtml}
      <button class="fw-link" id="fw-back">↺ Start over</button>
      <div class="fw-foot">Powered by FitWerx</div>
    </div>`;

    const back = this.root.getElementById('fw-back');
    if (back) (back as HTMLButtonElement).onclick = () => this.renderForm();
  }
}
