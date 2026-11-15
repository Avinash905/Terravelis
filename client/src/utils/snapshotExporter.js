import { describeWeatherCode, formatCoords } from "./formatters";

export const exportTelemetryCardPng = async ({ canvasDataUrl, intel }) => {
  const W = 1280;
  const H = 720;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");
  if (!ctx) return false;

  ctx.fillStyle = "#060608";
  ctx.fillRect(0, 0, W, H);

  if (canvasDataUrl) {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(W / img.width, H / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = canvasDataUrl;
    });
  }

  // Bottom editorial gradient for crisp legibility
  const grad = ctx.createLinearGradient(0, H * 0.48, 0, H);
  grad.addColorStop(0, "rgba(6, 6, 8, 0)");
  grad.addColorStop(0.55, "rgba(6, 6, 8, 0.78)");
  grad.addColorStop(1, "rgba(6, 6, 8, 0.96)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.48, W, H * 0.52);

  // Subtle top vignette
  const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
  topGrad.addColorStop(0, "rgba(6, 6, 8, 0.75)");
  topGrad.addColorStop(1, "rgba(6, 6, 8, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 120);

  // Top-left brand mark
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(54, 48, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fafafa";
  ctx.font = "600 18px Inter, -apple-system, sans-serif";
  ctx.fillText("ChatterBox / Earth Telemetry", 68, 54);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 13px 'JetBrains Mono', monospace";
  const utcStamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  ctx.textAlign = "right";
  ctx.fillText(utcStamp, W - 48, 52);
  ctx.textAlign = "left";

  if (intel) {
    const placeName = intel.location?.name || "Earth Coordinates";
    const countryLine = [intel.location?.subdivision, intel.location?.countryName]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(", ");
    const coordStr = formatCoords(intel.coordinates?.lat, intel.coordinates?.lng);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "500 15px Inter, -apple-system, sans-serif";
    ctx.fillText(countryLine.toUpperCase(), 48, H - 132);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 42px Inter, -apple-system, sans-serif";
    ctx.fillText(placeName, 48, H - 84);

    ctx.fillStyle = "#d4d4d8";
    ctx.font = "500 14px 'JetBrains Mono', monospace";
    const stats = [coordStr];
    if (intel.weather) {
      const cond = describeWeatherCode(intel.weather.weatherCode, intel.weather.isDay).label;
      stats.push(`${intel.weather.tempC}°C · ${cond}`);
      stats.push(`WIND ${intel.weather.windKmh} KM/H`);
      if (intel.weather.usAqi !== null && intel.weather.usAqi !== undefined) {
        stats.push(`AQI ${intel.weather.usAqi}`);
      }
    }
    if (intel.aircraft?.length) {
      stats.push(`${intel.aircraft.length} AIRCRAFT NEARBY`);
    }
    ctx.fillText(stats.join("   |   "), 48, H - 44);
  }

  // Subtle 1px outer frame border
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  const link = document.createElement("a");
  const slug = (intel?.location?.name || "earth-telemetry")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  link.download = `chatterbox-${slug}.png`;
  link.href = out.toDataURL("image/png");
  link.click();
  return true;
};
