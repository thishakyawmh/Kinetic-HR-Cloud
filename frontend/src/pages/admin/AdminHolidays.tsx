import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'

export const AdminHolidays: React.FC = () => {
  const holidays = [
    { name: "New Year's Day", date: '2026-01-01', day: 'Thursday', type: 'Federal & Company Holiday', branches: 'All Branches' },
    { name: 'Tamil Thai Pongal Day', date: '2026-01-15', day: 'Thursday', type: 'Public & Bank Holiday', branches: 'All Branches' },
    { name: 'National Day (Independence Day)', date: '2026-02-04', day: 'Wednesday', type: 'National Holiday', branches: 'All Branches' },
    { name: 'Maha Sivarathri Day', date: '2026-02-17', day: 'Tuesday', type: 'Public & Bank Holiday', branches: 'All Branches' },
    { name: 'Sinhala & Tamil New Year Day', date: '2026-04-13', day: 'Monday', type: 'National Holiday', branches: 'All Branches' },
    { name: 'May Day (Worker\'s Day)', date: '2026-05-01', day: 'Friday', type: 'National Holiday', branches: 'All Branches' },
    { name: 'Vesak Full Moon Poya Day', date: '2026-05-31', day: 'Sunday', type: 'Religious & Public Holiday', branches: 'All Branches' },
    { name: 'Esala Perahera Festival Holiday', date: '2026-08-28', day: 'Friday', type: 'Regional Holiday', branches: 'Kandy Regional Branch' },
    { name: 'Southern Province Cultural Day', date: '2026-09-18', day: 'Friday', type: 'Regional Holiday', branches: 'Galle Tech Hub' },
    { name: 'Deepavali Festival Day', date: '2026-11-08', day: 'Sunday', type: 'Public & Bank Holiday', branches: 'All Branches' },
    { name: 'Christmas Day', date: '2026-12-25', day: 'Friday', type: 'Public & Bank Holiday', branches: 'All Branches' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Holiday Schedule (2026)"
        subtitle="Statutory paid holidays observed across all corporate office locations and hybrid teams."
      />

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/50">
              <TableHead>Holiday Observance</TableHead>
              <TableHead>Calendar Date</TableHead>
              <TableHead>Day of Week</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Applicable Branch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.map((h, i) => (
              <TableRow key={i} className="border-border/40 hover:bg-muted/30 transition-colors">
                <TableCell className="font-bold text-xs text-foreground">
                  <div className="flex items-center gap-2">
                     <CalendarDays className="h-4 w-4 text-[#23ace3]" />
                    <span>{h.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono font-medium text-muted-foreground">{h.date}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{h.day}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
                    {h.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      h.branches === 'All Branches'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/10 text-[#23ace3] border-[#23ace3]/30'
                    }`}
                  >
                    {h.branches}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
