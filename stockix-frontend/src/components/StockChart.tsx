"use client";
import { useEffect, useRef, useState } from "react";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("stockix_token");
}

function calcSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) =>
    i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

function calcEMA(data: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = Array(data.length).fill(null);
  let ema = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result[i] = null; continue; }
    if (i === period - 1) ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    else ema = data[i] * k + ema * (1 - k);
    result[i] = parseFloat(ema.toFixed(2));
  }
  return result;
}

export default function StockChart({ symbol }: { symbol: string }) {
  const candleRef = useRef<HTMLCanvasElement>(null);
  const volumeRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const chartRefs = useRef<any[]>([]);

  useEffect(() => {
    if (!symbol) return;
    loadChart();
    return () => {
      chartRefs.current.forEach(c => c?.destroy());
      chartRefs.current = [];
    };
  }, [symbol]);

  const loadChart = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res   = await fetch("http://localhost:5000/api/stocks/candles/" + symbol, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
      });

      const data = await res.json();

      if (!data || data.s === "no_data" || !data.c || data.c.length === 0) {
        setError("No chart data available");
        setLoading(false);
        return;
      }

      const raw = data.t.map((t: number, i: number) => ({
        date:   new Date(t * 1000),
        open:   data.o[i],
        high:   data.h[i],
        low:    data.l[i],
        close:  data.c[i],
        volume: data.v[i],
      }));

      const candles = raw.slice(-60);
      const labels  = candles.map((c: any) =>
        c.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
      const closes  = candles.map((c: any) => c.close);
      const volumes = candles.map((c: any) => c.volume);
      const sma14   = calcSMA(closes, 14);
      const ema26   = calcEMA(closes, 26);

      chartRefs.current.forEach(c => c?.destroy());
      chartRefs.current = [];

      const Chart = (await import("chart.js/auto")).default;

      if (candleRef.current) {
        const chart = new Chart(candleRef.current.getContext("2d")!, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Price",
                data: closes,
                backgroundColor: candles.map((c: any) =>
                  c.close >= c.open ? "rgba(74,222,128,0.8)" : "rgba(248,113,113,0.8)"
                ),
                borderColor: candles.map((c: any) =>
                  c.close >= c.open ? "#4ade80" : "#f87171"
                ),
                borderWidth: 1,
                borderRadius: 2,
              },
              {
                label: "SMA 14",
                data: sma14,
                type: "line" as any,
                borderColor: "#f5c542",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.3,
                fill: false,
              },
              {
                label: "EMA 26",
                data: ema26,
                type: "line" as any,
                borderColor: "#60a5fa",
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                labels: { color: "rgba(255,255,255,0.6)", boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                backgroundColor: "#1a1a1a",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                titleColor: "#fff",
                bodyColor: "rgba(255,255,255,0.7)",
              },
            },
            scales: {
              x: {
                ticks: { color: "rgba(255,255,255,0.4)", maxTicksLimit: 10, font: { size: 10 } },
                grid:  { color: "rgba(255,255,255,0.05)" },
              },
              y: {
                ticks: { color: "rgba(255,255,255,0.4)", font: { size: 10 } },
                grid:  { color: "rgba(255,255,255,0.05)" },
              },
            },
          },
        });
        chartRefs.current.push(chart);
      }

      if (volumeRef.current) {
        const chart = new Chart(volumeRef.current.getContext("2d")!, {
          type: "bar",
          data: {
            labels,
            datasets: [{
              label: "Volume",
              data: volumes,
              backgroundColor: candles.map((c: any) =>
                c.close >= c.open ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"
              ),
              borderRadius: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: "rgba(255,255,255,0.6)", boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                backgroundColor: "#1a1a1a",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                titleColor: "#fff",
                bodyColor: "rgba(255,255,255,0.7)",
                callbacks: {
                  label: (ctx) => "Volume: " + Number(ctx.raw).toLocaleString(),
                },
              },
            },
            scales: {
              x: {
                ticks: { color: "rgba(255,255,255,0.4)", maxTicksLimit: 10, font: { size: 10 } },
                grid:  { color: "rgba(255,255,255,0.05)" },
              },
              y: {
                ticks: {
                  color: "rgba(255,255,255,0.4)", font: { size: 10 },
                  callback: (v: any) =>
                    v >= 1e6 ? (v / 1e6).toFixed(1) + "M" :
                    v >= 1e3 ? (v / 1e3).toFixed(0) + "K" : v,
                },
                grid: { color: "rgba(255,255,255,0.05)" },
              },
            },
          },
        });
        chartRefs.current.push(chart);
      }

    } catch (err) {
      console.error("Chart error:", err);
      setError("Failed to load chart data");
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
      Loading chart…
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#f87171", fontSize: 14 }}>
      {error}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#111", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
          Price — SMA 14 <span style={{ color: "#f5c542" }}>●</span> EMA 26 <span style={{ color: "#60a5fa" }}>●</span>
        </div>
        <div style={{ height: 320 }}>
          <canvas ref={candleRef} />
        </div>
      </div>

      <div style={{ background: "#111", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Volume</div>
        <div style={{ height: 140 }}>
          <canvas ref={volumeRef} />
        </div>
      </div>
    </div>
  );
}