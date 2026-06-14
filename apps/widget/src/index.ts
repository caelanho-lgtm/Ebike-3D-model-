import { FitWerxWidget } from './widget';
import type { WidgetConfig } from './types';

/**
 * Embeddable entry point. Usage:
 *
 *   <div id="fitwerx-widget"></div>
 *   <script src="https://app.example.com/widget/fitwerx-widget.js"
 *           data-tenant="my-shop"
 *           data-api-key="fwk_..."
 *           data-api-base="https://api.example.com"></script>
 *
 * The script auto-mounts into #fitwerx-widget, or into an element it creates
 * immediately after itself. It can also be driven manually via
 * `window.FitWerx.render(el, config)`.
 */

function configFromScript(script: HTMLScriptElement | null): WidgetConfig | null {
  if (!script) return null;
  const tenant = script.getAttribute('data-tenant');
  const apiKey = script.getAttribute('data-api-key');
  if (!tenant || !apiKey) return null;
  const apiBase =
    script.getAttribute('data-api-base') ?? new URL(script.src, location.href).origin;
  return {
    tenant,
    apiKey,
    apiBase: apiBase.replace(/\/$/, ''),
    discipline: script.getAttribute('data-discipline') ?? undefined,
  };
}

function mount(host: HTMLElement, cfg: WidgetConfig) {
  const widget = new FitWerxWidget(host, cfg);
  void widget.start();
  return widget;
}

function autoInit() {
  const current =
    (document.currentScript as HTMLScriptElement | null) ??
    (document.querySelector('script[data-tenant][data-api-key]') as HTMLScriptElement | null);
  const cfg = configFromScript(current);
  if (!cfg) return;

  let host = document.getElementById('fitwerx-widget');
  if (!host && current && current.parentNode) {
    host = document.createElement('div');
    host.id = 'fitwerx-widget';
    current.parentNode.insertBefore(host, current.nextSibling);
  }
  if (host) mount(host, cfg);
}

const api = {
  render(target: string | HTMLElement, cfg: WidgetConfig) {
    const host = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!host) throw new Error('FitWerx: mount target not found');
    return mount(host, cfg);
  },
};

declare global {
  interface Window {
    FitWerx: typeof api;
  }
}

window.FitWerx = api;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

export default api;
