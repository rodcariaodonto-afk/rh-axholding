import { useMemo, useState, useCallback, useRef, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Customized,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────

interface TimeEntry {
  clock_in: string;
  clock_out: string | null;
  date: string;
  employee_id: string;
  employees?: { full_name: string | null; email: string } | null;
}

interface DailyVisualControlChartProps {
  entries: TimeEntry[];
  startDate: string;
  endDate: string;
}

interface DayData {
  name: string;
  dayName: string;
  fullDate: string;
  base: number;
  _segments?: { type: string; from: number; to: number }[];
  _segTypes?: string[]; // "work" | "break" | "extra" per seg key
  [key: string]: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function decimalToTime(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function toDecimalHour(isoTimestamp: string): number {
  const date = new Date(isoTimestamp);
  return date.getHours() + date.getMinutes() / 60;
}

function snapToQuarter(v: number): number {
  return Math.round(v * 4) / 4;
}

function decimalToTimeInput(decimal: number): string {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function timeInputToDecimal(time: string): number | null {
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as DayData;
  if (!data) return null;
  const segments: { type: string; from: number; to: number }[] = data._segments || [];

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium capitalize">{data.dayName}</p>
      <p className="text-muted-foreground">{data.fullDate}</p>
      <div className="mt-1 space-y-0.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-sm"
              style={{
                background:
                  seg.type === "extra_late"
                    ? "hsl(var(--destructive) / 0.6)"
                    : seg.type === "extra_early"
                    ? "hsl(142 71% 45% / 0.7)"
                    : seg.type === "work"
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
              }}
            />
            <span>
              {seg.type === "extra_late" ? "Extra (após saída)" : seg.type === "extra_early" ? "Extra (antes entrada)" : seg.type === "work" ? "Trabalho" : "Intervalo"}:{" "}
              {decimalToTime(seg.from)} – {decimalToTime(seg.to)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Draggable Reference Lines (rendered via Customized) ────────────────────

interface DraggableLinesProps {
  yAxisMap?: any;
  offset?: any;
  entryTime: number;
  exitTime: number;
  draggingRef: React.MutableRefObject<"entry" | "exit" | null>;
  scaleRef: React.MutableRefObject<((v: number) => number) | null>;
  invertRef: React.MutableRefObject<((px: number) => number) | null>;
}

function DraggableLines(props: DraggableLinesProps) {
  const { yAxisMap, offset, entryTime, exitTime, draggingRef, scaleRef, invertRef } = props;
  if (!yAxisMap || !offset) return null;

  const yAxis = Object.values(yAxisMap)[0] as any;
  if (!yAxis?.scale) return null;

  const scale = yAxis.scale;
  // Store scale/invert in refs so window handlers can use them
  scaleRef.current = scale;
  invertRef.current = (px: number) => {
    // linear inversion: reversed axis, domain [0,24]
    const range = scale.range(); // [top, bottom] for reversed
    const domain = scale.domain(); // [0, 24]
    const ratio = (px - range[0]) / (range[1] - range[0]);
    return domain[0] + ratio * (domain[1] - domain[0]);
  };

  const entryY = scale(entryTime);
  const exitY = scale(exitTime);
  const left = offset.left;
  const width = offset.width;

  const handleDown = (which: "entry" | "exit") => (e: React.MouseEvent) => {
    e.stopPropagation();
    draggingRef.current = which;
  };

  return (
    <g>
      {/* Entry line */}
      <line
        x1={left}
        x2={left + width}
        y1={entryY}
        y2={entryY}
        stroke="hsl(var(--primary))"
        strokeDasharray="8 4"
        strokeWidth={2}
      />
      <text
        x={left + width + 4}
        y={entryY + 3}
        fontSize={10}
        fill="hsl(var(--primary))"
      >
        Entrada {decimalToTime(entryTime)}
      </text>
      {/* Invisible drag handle */}
      <rect
        x={left}
        y={entryY - 8}
        width={width}
        height={16}
        fill="transparent"
        cursor="ns-resize"
        onMouseDown={handleDown("entry")}
      />

      {/* Exit line */}
      <line
        x1={left}
        x2={left + width}
        y1={exitY}
        y2={exitY}
        stroke="hsl(var(--destructive))"
        strokeDasharray="8 4"
        strokeWidth={2}
      />
      <text
        x={left + width + 4}
        y={exitY + 3}
        fontSize={10}
        fill="hsl(var(--destructive))"
      >
        Saída {decimalToTime(exitTime)}
      </text>
      {/* Invisible drag handle */}
      <rect
        x={left}
        y={exitY - 8}
        width={width}
        height={16}
        fill="transparent"
        cursor="ns-resize"
        onMouseDown={handleDown("exit")}
      />
    </g>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DailyVisualControlChart({
  entries,
  startDate,
  endDate,
}: DailyVisualControlChartProps) {
  const [entryTime, setEntryTime] = useState(9);
  const [exitTime, setExitTime] = useState(18);

  const draggingRef = useRef<"entry" | "exit" | null>(null);
  const scaleRef = useRef<((v: number) => number) | null>(null);
  const invertRef = useRef<((px: number) => number) | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // ── Window-level drag handlers ───────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !invertRef.current || !chartContainerRef.current) return;

      const svg = chartContainerRef.current.querySelector("svg");
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const py = e.clientY - rect.top;
      const hour = snapToQuarter(invertRef.current(py));
      const clamped = Math.max(0, Math.min(24, hour));

      if (draggingRef.current === "entry") {
        setEntryTime(clamped);
      } else {
        setExitTime(clamped);
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ── Chart data ───────────────────────────────────────────────────────────
  const { chartData, segmentKeys, globalSegTypes } = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    let maxSegs = 0;
    // Track segment types globally (per index across all days)
    const segTypeMap = new Map<number, string>();

    const result: DayData[] = days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const allDayEntries = entries.filter((e) => e.date === dateStr && e.clock_out);

      const byEmployee = new Map<string, typeof allDayEntries>();
      for (const e of allDayEntries) {
        const list = byEmployee.get(e.employee_id) || [];
        list.push(e);
        byEmployee.set(e.employee_id, list);
      }
      let bestEntries = allDayEntries;
      if (byEmployee.size > 1) {
        let maxCount = 0;
        for (const [, list] of byEmployee) {
          if (list.length > maxCount) {
            maxCount = list.length;
            bestEntries = list;
          }
        }
      }

      const dayEntries = bestEntries
        .map((e) => ({
          inH: toDecimalHour(e.clock_in),
          outH: toDecimalHour(e.clock_out!),
        }))
        .sort((a, b) => a.inH - b.inH);

      const row: DayData = {
        name: format(day, "dd/MM"),
        dayName: format(day, "EEEE", { locale: ptBR }),
        fullDate: format(day, "dd 'de' MMMM", { locale: ptBR }),
        base: 0,
        _segments: [],
        _segTypes: [],
      };

      if (dayEntries.length === 0) return row;

      row.base = dayEntries[0].inH;

      const segments: { type: string; from: number; to: number }[] = [];
      const segTypes: string[] = [];
      let segIdx = 0;

      const addSeg = (type: string, from: number, to: number) => {
        const dur = +(to - from).toFixed(3);
        if (dur <= 0) return;
        segments.push({ type, from, to });
        row[`seg${segIdx}`] = dur;
        segTypes.push(type);
        segTypeMap.set(segIdx, type);
        segIdx++;
      };

      for (let i = 0; i < dayEntries.length; i++) {
        const inH = dayEntries[i].inH;
        const outH = dayEntries[i].outH;

        // Split work segment at entry/exit reference lines
        if (inH < entryTime) {
          addSeg("extra_early", inH, Math.min(entryTime, outH));
          if (outH > entryTime) {
            if (outH <= exitTime) {
              addSeg("work", entryTime, outH);
            } else {
              addSeg("work", entryTime, exitTime);
              addSeg("extra_late", exitTime, outH);
            }
          }
        } else if (outH > exitTime) {
          if (inH < exitTime) {
            addSeg("work", inH, exitTime);
          }
          addSeg("extra_late", Math.max(inH, exitTime), outH);
        } else {
          addSeg("work", inH, outH);
        }

        // Break between this entry and next
        if (i < dayEntries.length - 1) {
          const breakDuration = dayEntries[i + 1].inH - outH;
          if (breakDuration > 0) {
            addSeg("break", outH, dayEntries[i + 1].inH);
          }
        }
      }

      row._segments = segments;
      row._segTypes = segTypes;
      if (segIdx > maxSegs) maxSegs = segIdx;

      return row;
    });

    const keys: string[] = [];
    const types: string[] = [];
    for (let i = 0; i < Math.max(maxSegs, 1); i++) {
      keys.push(`seg${i}`);
      types.push(segTypeMap.get(i) || "work");
    }
    for (const row of result) {
      for (const k of keys) {
        if (row[k] === undefined) row[k] = 0;
      }
    }

    return { chartData: result, segmentKeys: keys, globalSegTypes: types };
  }, [entries, startDate, endDate, entryTime, exitTime]);

  // Auto-compute Y domain from data + reference lines with minimal padding
  const { domainStart, domainEnd } = useMemo(() => {
    let minH = 24;
    let maxH = 0;
    for (const d of chartData) {
      const segs = d._segments || [];
      for (const s of segs) {
        if (s.from < minH) minH = s.from;
        if (s.to > maxH) maxH = s.to;
      }
    }
    // Include reference lines in range
    minH = Math.min(minH, entryTime);
    maxH = Math.max(maxH, exitTime);
    // If no data, fallback
    if (minH >= maxH) { minH = entryTime; maxH = exitTime; }
    return {
      domainStart: Math.max(0, Math.floor(minH)),
      domainEnd: Math.min(24, Math.ceil(maxH) + 1),
    };
  }, [chartData, entryTime, exitTime]);

  const domainRange = domainEnd - domainStart;
  const chartHeight = Math.max(300, domainRange * 38);

  const isEmpty = chartData.every((d) => !d._segments?.length);

  if (isEmpty) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Controle Visual Diário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum registro disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Controle Visual Diário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time inputs + Zoom controls */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entrada</Label>
              <Input
                type="time"
                className="h-8 w-28 text-xs"
                value={decimalToTimeInput(entryTime)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const v = timeInputToDecimal(e.target.value);
                  if (v !== null) setEntryTime(v);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Saída</Label>
              <Input
                type="time"
                className="h-8 w-28 text-xs"
                value={decimalToTimeInput(exitTime)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const v = timeInputToDecimal(e.target.value);
                  if (v !== null) setExitTime(v);
                }}
              />
            </div>
          </div>
        </div>



        {/* Chart */}
        <div
          ref={chartContainerRef}
          className="rounded-md border border-border/30"
          style={{ cursor: draggingRef.current ? "ns-resize" : undefined }}
        >
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 60, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  horizontal
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  orientation="top"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={{ className: "stroke-border" }}
                />
                <YAxis
                  type="number"
                  reversed
                  domain={[domainStart, domainEnd]}
                  allowDataOverflow
                  ticks={Array.from({ length: domainEnd - domainStart + 1 }, (_, i) => domainStart + i)}
                  tickFormatter={(val) => `${val}h`}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickLine={false}
                  axisLine={{ className: "stroke-border" }}
                  width={35}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "hsl(var(--muted) / 0.15)" }}
                />

                {/* Invisible base for stacking offset */}
                <Bar dataKey="base" stackId="day" fill="transparent" maxBarSize={28} />

                {segmentKeys.map((key, idx) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="day"
                    maxBarSize={28}
                    radius={
                      idx === segmentKeys.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]
                    }
                    fill="hsl(var(--primary))"
                    shape={(props: any) => {
                      const { x, y, width: w, height: h, payload } = props;
                      const absH = Math.abs(h || 0);
                      const absW = Math.abs(w || 0);
                      if (absH < 0.5 || absW < 0.5) return <g />;
                      const realY = h < 0 ? y + h : y;
                      const segType = payload?._segTypes?.[idx] || globalSegTypes[idx] || "work";
                      let barFill = "hsl(var(--primary))";
                      if (segType === "break") barFill = "hsl(var(--muted))";
                      else if (segType === "extra_late") barFill = "hsl(var(--destructive) / 0.6)";
                      else if (segType === "extra_early") barFill = "hsl(142 71% 45% / 0.7)";
                      return <rect x={x} y={realY} width={absW} height={absH} fill={barFill} rx={idx === segmentKeys.length - 1 ? 2 : 0} />;
                    }}
                  />
                ))}

                {/* Draggable reference lines */}
                <Customized
                  component={(chartProps: any) => (
                    <DraggableLines
                      {...chartProps}
                      entryTime={entryTime}
                      exitTime={exitTime}
                      draggingRef={draggingRef}
                      scaleRef={scaleRef}
                      invertRef={invertRef}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>Trabalho</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span>Intervalo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(142 71% 45% / 0.7)" }} />
            <span>Extra (antes entrada)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--destructive) / 0.6)" }} />
            <span>Extra (após saída)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 border-t-2 border-dashed border-primary" />
            <span>Ref. entrada ({decimalToTime(entryTime)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 border-t-2 border-dashed border-destructive" />
            <span>Ref. saída ({decimalToTime(exitTime)})</span>
          </div>
          <span className="text-[10px] italic">Arraste as linhas para ajustar</span>
        </div>
      </CardContent>
    </Card>
  );
}
