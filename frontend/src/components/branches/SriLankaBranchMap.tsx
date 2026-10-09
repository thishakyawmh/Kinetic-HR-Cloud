import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Branch } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  MapPin,
  Users,
  Crown,
  CalendarDays,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

interface SriLankaBranchMapProps {
  branches: Branch[]
  className?: string
}

// Geographic mapping coordinates for Sri Lankan cities inside SVG viewBox (0 0 420 580)
const SRI_LANKA_CITY_COORDINATES: Record<string, { x: number; y: number; province: string }> = {
  colombo: { x: 135, y: 395, province: 'Western Province' },
  kandy: { x: 215, y: 350, province: 'Central Province' },
  galle: { x: 165, y: 495, province: 'Southern Province' },
  jaffna: { x: 145, y: 85, province: 'Northern Province' },
  kurunegala: { x: 175, y: 315, province: 'North Western' },
  batticaloa: { x: 310, y: 335, province: 'Eastern Province' },
  trincomalee: { x: 275, y: 220, province: 'Eastern Province' },
  anuradhapura: { x: 185, y: 220, province: 'North Central' },
  matara: { x: 195, y: 510, province: 'Southern Province' },
  negombo: { x: 130, y: 360, province: 'Western Province' },
  badulla: { x: 255, y: 385, province: 'Uva Province' },
  ratnapura: { x: 190, y: 425, province: 'Sabaragamuwa' },
}

export const SriLankaBranchMap: React.FC<SriLankaBranchMapProps> = ({ branches, className }) => {
  const navigate = useNavigate()

  // Find headquarters as default selected branch
  const hqBranch = branches.find(b => b.isHeadquarters) || branches[0]
  const [selectedBranchId, setSelectedBranchId] = useState<string>(hqBranch?.id || '')
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null)

  const activeBranch = branches.find(b => b.id === selectedBranchId) || hqBranch || branches[0]
  const totalEmployees = branches.reduce((acc, b) => acc + (b.employeeCount || 0), 0)

  // Helper to resolve coordinates
  const getBranchCoords = (branch: Branch, index: number) => {
    const cityKey = (branch.city || '').toLowerCase().trim()
    const nameKey = (branch.name || '').toLowerCase()

    for (const [key, coords] of Object.entries(SRI_LANKA_CITY_COORDINATES)) {
      if (cityKey.includes(key) || nameKey.includes(key)) {
        return coords
      }
    }

    // Deterministic spread fallback based on index if custom city
    const fallbackPositions = [
      { x: 140, y: 375, province: 'Western Province' },
      { x: 200, y: 340, province: 'Central Province' },
      { x: 180, y: 470, province: 'Southern Province' },
      { x: 230, y: 270, province: 'North Central' },
      { x: 280, y: 310, province: 'Eastern Province' },
    ]
    return fallbackPositions[index % fallbackPositions.length]
  }

  return (
    <Card className={`rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm ${className || ''}`}>
      <CardHeader className="p-5 pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#23ace3]/15 text-[#23ace3] flex items-center justify-center">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Sri Lanka Branch Distribution & Operating Hubs
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Interactive regional distribution across provincial centers and physical sites
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="outline" className="text-xs bg-[#23ace3]/10 border-[#23ace3]/30 text-[#23ace3]">
              {branches.length} Operating Sites
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/branches')}
              className="text-xs rounded-xl h-8 gap-1 border-border/70 hover:bg-muted"
            >
              <span>Manage Branches</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* ========================================================================= */}
          {/* SRI LANKA SVG MAP DISPLAY (7 Cols)                                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-4 rounded-2xl bg-gradient-to-b from-muted/30 via-muted/10 to-transparent border border-border/40 min-h-[460px] overflow-hidden">
            {/* Compass Rose & Geographic Coordinates Watermark */}
            <div className="absolute top-3 left-4 text-[10px] font-mono text-muted-foreground/60 space-y-0.5 pointer-events-none select-none">
              <div className="font-semibold text-foreground/70">SRI LANKA (LKA)</div>
              <div>LAT 5°55′N - 9°50′N</div>
              <div>LON 79°42′E - 81°53′E</div>
            </div>

            <div className="absolute bottom-3 left-4 flex items-center gap-3 text-[11px] text-muted-foreground bg-card/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/50">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
                <span>Headquarters</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#23ace3] ring-2 ring-[#23ace3]/30" />
                <span>Regional Site / Hub</span>
              </span>
            </div>

            {/* SVG MAP */}
            <svg
              viewBox="0 0 420 580"
              className="w-full max-w-[340px] sm:max-w-[370px] h-auto drop-shadow-md select-none transition-transform duration-300"
            >
              <defs>
                {/* Landmass Linear Gradient */}
                <linearGradient id="lkaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#23ace3" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.18" />
                </linearGradient>

                {/* Ocean Grid Pattern */}
                <pattern id="lkaGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.04" strokeWidth="0.8" />
                </pattern>

                {/* HQ Pulse Filter */}
                <filter id="hqGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Geographic Grid */}
              <rect width="420" height="580" fill="url(#lkaGrid)" />

              {/* Latitude / Longitude Guide Lines */}
              <g stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3">
                <line x1="40" y1="120" x2="380" y2="120" />
                <line x1="40" y1="240" x2="380" y2="240" />
                <line x1="40" y1="360" x2="380" y2="360" />
                <line x1="40" y1="480" x2="380" y2="480" />
                <line x1="140" y1="40" x2="140" y2="540" />
                <line x1="260" y1="40" x2="260" y2="540" />
              </g>

              {/* SRI LANKA MAIN ISLAND OUTLINE */}
              {/* Accurately proportioned teardrop silhouette of Sri Lanka */}
              <path
                d="M 148 76 
                   C 152 70, 168 64, 182 66
                   C 192 68, 204 78, 200 90
                   C 196 98, 185 106, 178 116
                   C 174 122, 178 132, 184 140
                   C 198 158, 222 172, 238 188
                   C 252 202, 268 214, 282 230
                   C 292 242, 294 258, 286 270
                   C 278 280, 276 292, 284 304
                   C 296 322, 316 338, 320 358
                   C 324 378, 312 396, 308 414
                   C 304 430, 312 446, 306 462
                   C 300 478, 280 492, 266 502
                   C 250 514, 232 526, 212 530
                   C 194 534, 178 528, 166 514
                   C 154 500, 148 480, 150 460
                   C 152 444, 142 430, 136 414
                   C 130 398, 126 380, 128 362
                   C 130 344, 136 328, 134 310
                   C 132 292, 118 276, 118 256
                   C 118 238, 132 224, 136 206
                   C 140 188, 134 172, 138 154
                   C 142 136, 136 122, 138 106
                   C 140 94, 144 82, 148 76 Z"
                fill="url(#lkaLandGradient)"
                stroke="#23ace3"
                strokeWidth="2.2"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Jaffna Peninsula Spit (Valvettithurai / Point Pedro extension) */}
              <path
                d="M 148 76 C 144 68, 152 56, 162 54 C 172 52, 180 62, 176 72 Z"
                fill="#23ace3"
                fillOpacity="0.25"
                stroke="#23ace3"
                strokeWidth="1.5"
              />

              {/* Mannar Island / Talaimannar Pier */}
              <path
                d="M 112 214 C 104 218, 92 222, 84 226 C 90 230, 102 226, 110 222 Z"
                fill="#23ace3"
                fillOpacity="0.3"
                stroke="#23ace3"
                strokeWidth="1.2"
              />

              {/* Kalpitiya Peninsula */}
              <path
                d="M 124 292 C 122 280, 120 268, 122 258 C 124 268, 126 280, 126 292 Z"
                fill="#23ace3"
                fillOpacity="0.3"
                stroke="#23ace3"
                strokeWidth="1.2"
              />

              {/* Subtle Provincial Region Dividers (Dotted) */}
              <g stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 3">
                {/* Northern boundary */}
                <path d="M 142 142 Q 180 152 216 168" />
                {/* North Central boundary */}
                <path d="M 136 248 Q 200 240 274 250" />
                {/* Central / Western boundary */}
                <path d="M 132 350 Q 180 340 220 345" />
                {/* Southern boundary */}
                <path d="M 148 440 Q 210 445 285 450" />
              </g>

              {/* Central Highlands Subtle Elevation Contour */}
              <path
                d="M 195 330 C 215 320, 240 335, 245 360 C 250 385, 230 410, 205 405 C 185 400, 180 375, 185 350 Z"
                fill="#23ace3"
                fillOpacity="0.08"
                stroke="#23ace3"
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* INTERACTIVE BRANCH MARKERS */}
              {branches.map((branch, index) => {
                const coords = getBranchCoords(branch, index)
                const isSelected = branch.id === activeBranch.id
                const isHovered = branch.id === hoveredBranchId
                const isHq = branch.isHeadquarters

                return (
                  <g
                    key={branch.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedBranchId(branch.id)}
                    onMouseEnter={() => setHoveredBranchId(branch.id)}
                    onMouseLeave={() => setHoveredBranchId(null)}
                  >
                    {/* Animated Pulse Ring on Selected / HQ */}
                    {(isSelected || isHq) && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="18"
                        fill={isHq ? '#f59e0b' : '#23ace3'}
                        fillOpacity="0.25"
                        className="animate-ping"
                        style={{ transformOrigin: `${coords.x}px ${coords.y}px`, animationDuration: '2.5s' }}
                      />
                    )}

                    {/* Outer Glow Circle */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? '12' : isHovered ? '10' : '7'}
                      fill={isHq ? '#f59e0b' : '#23ace3'}
                      fillOpacity={isSelected ? '0.35' : '0.2'}
                      stroke={isHq ? '#f59e0b' : '#23ace3'}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="transition-all duration-200"
                    />

                    {/* Solid Pin Core */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isSelected ? '6.5' : '4.5'}
                      fill={isHq ? '#d97706' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      className="transition-all duration-200"
                    />

                    {/* Pin Marker Label */}
                    <g
                      transform={`translate(${coords.x + 12}, ${coords.y - 10})`}
                      className={`pointer-events-none transition-all duration-200 ${
                        isSelected || isHovered ? 'opacity-100 scale-105' : 'opacity-85'
                      }`}
                    >
                      {/* Label Background Pill */}
                      <rect
                        x="-4"
                        y="-12"
                        width={branch.name.length * 6.5 + 40}
                        height="20"
                        rx="10"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke={isHq ? 'rgba(245, 158, 11, 0.6)' : isSelected ? 'rgba(35, 172, 227, 0.6)' : 'rgba(255, 255, 255, 0.15)'}
                        strokeWidth="1"
                      />

                      {/* HQ Icon or Dot */}
                      {isHq ? (
                        <text x="3" y="1" fill="#f59e0b" fontSize="9" fontWeight="bold">
                          👑
                        </text>
                      ) : (
                        <circle cx="5" cy="-2" r="2.5" fill="#23ace3" />
                      )}

                      {/* Branch Name */}
                      <text
                        x={isHq ? "16" : "12"}
                        y="1"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight={isSelected ? "bold" : "600"}
                        fontFamily="sans-serif"
                      >
                        {branch.city || branch.name.split(' ')[0]}
                      </text>

                      {/* Headcount Badge */}
                      <text
                        x={branch.name.length * 6.5 + 24}
                        y="1"
                        fill="#94a3b8"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {branch.employeeCount || 0}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* ========================================================================= */}
          {/* SELECTED BRANCH DETAIL INSPECTOR (5 Cols)                                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Active Branch Focus Card */}
            <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-foreground">
                      {activeBranch?.name || 'Selected Branch'}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                      {activeBranch?.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 text-[#23ace3] shrink-0" />
                    <span>{activeBranch?.city}, {activeBranch?.country || 'Sri Lanka'}</span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold shrink-0 ${
                    activeBranch?.isHeadquarters
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-[#23ace3]/15 text-[#23ace3] border-[#23ace3]/30'
                  }`}
                >
                  {activeBranch?.isHeadquarters ? 'Primary HQ' : activeBranch?.type}
                </Badge>
              </div>

              {/* Physical Street Address */}
              {activeBranch?.address && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 bg-card/60 p-2 rounded-xl border border-border/30">
                  {activeBranch.address}
                </p>
              )}

              {/* Key Branch Metrics Strip */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Assigned Staff</div>
                  <div className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-[#23ace3]" />
                    <span>{activeBranch?.employeeCount || 0}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border/50">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Branch Holidays</div>
                  <div className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-purple-500" />
                    <span>{activeBranch?.holidays?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Leadership & Contact Footnote */}
              <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground/80">Branch Leadership:</span>
                  <span className="font-medium text-foreground">{activeBranch?.branchManagerName || 'Unassigned'}</span>
                </div>
                {activeBranch?.phone && (
                  <div className="flex items-center justify-between">
                    <span>Contact Channel:</span>
                    <span className="font-mono">{activeBranch.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Operating Timezone:</span>
                  <span className="font-mono">{activeBranch?.timezone || 'Asia/Colombo (UTC+5:30)'}</span>
                </div>
              </div>
            </div>

            {/* Quick Regional Hub Directory List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>All Island Branches ({branches.length})</span>
                <span className="text-[10px] lowercase font-normal">click to locate pin</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {branches.map(b => {
                  const isSelected = b.id === activeBranch.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#23ace3]/15 border-[#23ace3] text-foreground font-semibold shadow-xs'
                          : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {b.isHeadquarters ? (
                          <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-[#23ace3] shrink-0" />
                        )}
                        <span className="truncate">{b.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({b.city})</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-foreground">{b.employeeCount || 0}</span>
                        <span className="text-[10px] text-muted-foreground">staff</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
