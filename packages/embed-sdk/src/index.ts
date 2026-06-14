export interface MountWidgetOptions {
  container: HTMLElement;
  widgetUrl: string;
  bikeModelId: string;
  theme?: "light" | "dark";
  heightPx?: number;
}

export function mountBikeFitWidget(options: MountWidgetOptions): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  const search = new URLSearchParams({
    bikeModelId: options.bikeModelId,
    theme: options.theme ?? "light"
  });

  iframe.src = `${options.widgetUrl}?${search.toString()}`;
  iframe.width = "100%";
  iframe.height = String(options.heightPx ?? 680);
  iframe.style.border = "0";
  iframe.loading = "lazy";
  iframe.allow = "fullscreen";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.title = "Bike fitting and sizing widget";

  options.container.appendChild(iframe);
  return iframe;
}
