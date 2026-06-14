/** Scoped styles injected into the widget's shadow root. */
export function widgetStyles(primary: string): string {
  return `
:host, * { box-sizing: border-box; }
.fw {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: #0f1729; color: #e8eefc; border: 1px solid #243049; border-radius: 16px;
  padding: 22px; max-width: 720px; margin: 0 auto;
}
.fw-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.fw-logo { height: 34px; width: auto; border-radius: 6px; }
.fw-title { font-weight: 700; font-size: 18px; }
.fw-sub { color: #9fb0d0; font-size: 13px; }
.fw-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fw-field { margin-bottom: 12px; }
.fw label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #9fb0d0; margin-bottom: 5px; font-weight: 600; }
.fw input, .fw select {
  width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid #243049;
  background: #0b1220; color: #e8eefc; font-size: 14px;
}
.fw input:focus, .fw select:focus { outline: none; border-color: ${primary}; }
.fw-btn {
  width: 100%; padding: 12px; border: none; border-radius: 10px; cursor: pointer;
  background: ${primary}; color: #fff; font-weight: 700; font-size: 15px;
}
.fw-btn:disabled { opacity: 0.6; cursor: default; }
.fw-link { background: none; border: none; color: ${primary}; cursor: pointer; font-size: 13px; font-weight: 600; }
.fw-err { background: rgba(239,68,68,0.13); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); padding: 10px 12px; border-radius: 9px; font-size: 13px; margin-bottom: 12px; }
.fw-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
.fw-stat { background: #0b1220; border: 1px solid #243049; border-radius: 10px; padding: 10px 12px; }
.fw-stat b { font-size: 18px; display: block; }
.fw-stat span { font-size: 11px; color: #9fb0d0; }
.fw-rec { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #243049; border-radius: 10px; margin-bottom: 8px; }
.fw-rec.top { border-color: ${primary}; background: rgba(14,165,233,0.06); }
.fw-score { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex-shrink: 0; border: 3px solid #334155; }
.fw-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.fw-b-excellent { background: rgba(34,197,94,0.18); color: #4ade80; }
.fw-b-good { background: rgba(14,165,233,0.18); color: #38bdf8; }
.fw-b-fair { background: rgba(245,158,11,0.18); color: #fbbf24; }
.fw-b-poor { background: rgba(239,68,68,0.18); color: #f87171; }
.fw-muted { color: #9fb0d0; font-size: 13px; }
.fw-foot { text-align: center; font-size: 11px; color: #475569; margin-top: 14px; }
.fw-diagram { margin: 6px 0 14px; }
.fw-progress { height: 4px; background: #243049; border-radius: 4px; margin-bottom: 16px; overflow: hidden; }
.fw-progress > div { height: 100%; background: ${primary}; transition: width 0.3s; }
`;
}
