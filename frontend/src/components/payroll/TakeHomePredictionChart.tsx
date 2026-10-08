import React, { useState } from 'react'
import { TrendingUp, Sparkles, Calendar, DollarSign, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DataPoint {
  period: string
  month: string
  amount: number
  isPredicted: boolean
  gross?: number
  deductions?: number
  notes?: string
}

export const TakeHomePredictionChart: React.FC = () => {
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null)

  const dataPoints: DataPoint[] = [
    { period: 'Jul 2026', month: 'Jul', amount: 2065.50, isPredicted: false, gross: 3000, deductions: 934.50, notes: 'Standard bi-weekly cycle' },
    { period: 'Aug 2026', month: 'Aug', amount: 2065.50, isPredicted: false, gross: 3000, deductions: 934.50, notes: 'Standard bi-weekly cycle' },
    { period: 'Sep 2026', month: 'Sep', amount: 2333.69, isPredicted: false, gross: 3337.50, deductions: 1003.81, notes: '6 hrs overtime included' },
    { period: 'Oct 2026', month: 'Oct', amount: 2065.50, isPredicted: false, gross: 3000, deductions: 934.50, notes: 'Current pay period' },
    { period: 'Nov 2026', month: 'Nov', amount: 2065.50, isPredicted: true, gross: 3000, deductions: 934.50, notes: 'Predicted based on W-4 status' },
    { period: 'Dec 2026', month: 'Dec', amount: 2415.50, isPredicted: true, gross: 3500, deductions: 1084.50, notes: 'Projected Q4 performance bonus' },
    { period: 'Jan 2027', month: 'Jan', amount: 2110.00, isPredicted: true, gross: 3080, deductions: 970.00, notes: 'Projected 2027 annual inflation adjustment' },
  ]

  // Graph dimensions
  const svgWidth = 680
  const svgHeight = 200
  const paddingX = 40
  const paddingY = 30

  const minVal = 1800
  const maxVal = 2600

  const pointsX = dataPoints.map((_, i) => paddingX + i * ((svgWidth - 2 * paddingX) / (dataPoints.length - 1)))
  const pointsY = dataPoints.map(d => svgHeight - paddingY - ((d.amount - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY))

  // Separate actual vs predicted path segments
  const actualIndices = dataPoints.map((d, i) => (!d.isPredicted || i === 3 ? i : -1)).filter(i => i !== -1)
  const actualPath = actualIndices.map((idx, i) => `${i === 0 ? 'M' : 'L'} ${pointsX[idx]} ${pointsY[idx]}`).join(' ')

  const predictedIndices = dataPoints.map((d, i) => (d.isPredicted || i === 3 ? i : -1)).filter(i => i !== -1)
  const predictedPath = predictedIndices.map((idx, i) => `${i === 0 ? 'M' : 'L'} ${pointsX[idx]} ${pointsY[idx]}`).join(' ')

  // Area fill under actual path
  const areaPath = `${actualPath} L ${pointsX[3]} ${svgHeight - paddingY} L ${pointsX[0]} ${svgHeight - paddingY} Z`

  const activeItem = activeHoverIndex !== null ? dataPoints[activeHoverIndex] : dataPoints[3]

  return (
    <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-xs space-y-5">
      {/* Header & Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Take-Home Pay Prediction</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Projection Engine
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical net disbursements combined with machine-learning tax & bonus forecasting.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#23ace3] rounded-full" />
            <span className="text-muted-foreground">Historical Disbursed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-t-2 border-dashed border-emerald-400" />
            <span className="text-muted-foreground">Predicted Take-Home</span>
          </div>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="relative w-full overflow-x-auto py-2">
        <div className="min-w-[650px] relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="takehomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#23ace3" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#23ace3" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[2000, 2200, 2400].map(val => {
              const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (svgHeight - 2 * paddingY)
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-border/40"
                    strokeDasharray="4 4"
                  />
                  <text x={10} y={y + 3} className="text-[10px] fill-muted-foreground font-mono">
                    ${val}
                  </text>
                </g>
              )
            })}

            {/* Shaded Area under Actuals */}
            <path d={areaPath} fill="url(#takehomeGradient)" />

            {/* Actual Solid Line */}
            <path d={actualPath} fill="none" stroke="#23ace3" strokeWidth="3.5" strokeLinecap="round" />

            {/* Predicted Dashed Line */}
            <path
              d={predictedPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {dataPoints.map((d, i) => (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setActiveHoverIndex(i)}
                onMouseLeave={() => setActiveHoverIndex(null)}
              >
                {/* Vertical marker line on hover */}
                {activeHoverIndex === i && (
                  <line
                    x1={pointsX[i]}
                    y1={paddingY}
                    x2={pointsX[i]}
                    y2={svgHeight - paddingY}
                    stroke={d.isPredicted ? '#10b981' : '#23ace3'}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Outer halo circle */}
                <circle
                  cx={pointsX[i]}
                  cy={pointsY[i]}
                  r={activeHoverIndex === i ? '9' : '6'}
                  fill={d.isPredicted ? '#10b981' : '#23ace3'}
                  fillOpacity={activeHoverIndex === i ? '0.4' : '0.2'}
                  className="transition-all"
                />

                {/* Inner dot */}
                <circle
                  cx={pointsX[i]}
                  cy={pointsY[i]}
                  r="4.5"
                  fill={d.isPredicted ? '#10b981' : '#23ace3'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Month label along X axis */}
                <text
                  x={pointsX[i]}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className={`text-[11px] font-medium font-mono ${
                    activeHoverIndex === i ? 'fill-[#23ace3] font-bold' : 'fill-muted-foreground'
                  }`}
                >
                  {d.month}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Selected Month Interactive Detail Card */}
      <div className="bg-muted/20 p-4 rounded-xl border border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              activeItem.isPredicted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#23ace3]/10 text-[#23ace3] border border-[#23ace3]/20'
            }`}
          >
            {activeItem.isPredicted ? <Sparkles className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{activeItem.period}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeItem.isPredicted
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#23ace3]/15 text-[#23ace3] border border-[#23ace3]/30'
                }`}
              >
                {activeItem.isPredicted ? 'AI Projected' : 'Verified Disbursed'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{activeItem.notes}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Estimated Gross</span>
            <span className="text-xs font-semibold text-foreground font-mono">{formatCurrency(activeItem.gross)}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Deductions & Tax</span>
            <span className="text-xs font-semibold text-rose-400 font-mono">-{formatCurrency(activeItem.deductions)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#23ace3] uppercase tracking-wider block font-bold">Predicted Take-Home</span>
            <span className="text-base font-extrabold text-[#23ace3] font-mono">{formatCurrency(activeItem.amount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
