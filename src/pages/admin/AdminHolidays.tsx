import React from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'

export const AdminHolidays: React.FC = () => {
  const holidays = [
    { name: "New Year's Day", date: '2026-01-01', day: 'Thursday', type: 'Federal & Company Holiday' },
    { name: 'Martin Luther King Jr. Day', date: '2026-01-19', day: 'Monday', type: 'Federal Holiday' },
    { name: "Presidents' Day", date: '2026-02-16', day: 'Monday', type: 'Federal Holiday' },
    { name: 'Memorial Day', date: '2026-05-25', day: 'Monday', type: 'Federal Holiday' },
    { name: 'Juneteenth National Independence Day', date: '2026-06-19', day: 'Friday', type: 'Federal Holiday' },
    { name: 'Independence Day (Observed)', date: '2026-07-03', day: 'Friday', type: 'Federal Holiday' },
    { name: 'Labor Day', date: '2026-09-07', day: 'Monday', type: 'Federal Holiday' },
    { name: 'Veterans Day', date: '2026-11-11', day: 'Wednesday', type: 'Federal Holiday' },
    { name: 'Thanksgiving Day', date: '2026-11-26', day: 'Thursday', type: 'Federal Holiday' },
    { name: 'Day After Thanksgiving', date: '2026-11-27', day: 'Friday', type: 'Company Designated Holiday' },
    { name: 'Christmas Eve (Half Day)', date: '2026-12-24', day: 'Thursday', type: 'Company Designated Holiday' },
    { name: 'Christmas Day', date: '2026-12-25', day: 'Friday', type: 'Federal & Company Holiday' },
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
