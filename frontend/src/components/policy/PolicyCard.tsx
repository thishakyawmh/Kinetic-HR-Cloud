import React from 'react'
import { PolicyDocument } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, ArrowRight, Edit2, Download } from 'lucide-react'

interface PolicyCardProps {
  policy: PolicyDocument
  onSelect?: (policy: PolicyDocument) => void
  onEdit?: (policy: PolicyDocument) => void
}

export const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onSelect, onEdit }) => {
  return (
    <Card
      onClick={() => onSelect?.(policy)}
      className="group cursor-pointer transition-all duration-200 bg-card border-border/60 hover:border-primary/50 hover:shadow-lg flex flex-col justify-between rounded-2xl overflow-hidden"
    >
      <CardContent className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 transition-colors group-hover:bg-primary/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-mono bg-muted/40 border-border/60 text-muted-foreground">
              v{policy.version}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {policy.category}
            </Badge>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(policy)
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-[#23ace3] hover:bg-[#23ace3]/10 transition-colors cursor-pointer"
                title="Edit Policy Document"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
            {policy.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {policy.summary}
          </p>
        </div>

        {/* Uploaded Document File Pill */}
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-2 group-hover:border-[#23ace3]/40 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-foreground truncate font-mono">
                {policy.fileName || `${policy.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${policy.version}.pdf`}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                <span>{policy.fileSize || '340 KB'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const blob = new Blob([policy.contentExcerpt || policy.summary], { type: 'application/pdf' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = policy.fileName || `${policy.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_v${policy.version}.pdf`
              a.click()
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-[#23ace3] hover:bg-[#23ace3]/10 transition-colors cursor-pointer shrink-0"
            title="Download Document"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Key Terms */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {policy.keyTerms.slice(0, 3).map((term, i) => (
            <span
              key={i}
              className="text-[10px] px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40 font-medium"
            >
              {term}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3 text-muted-foreground/70" />
            {policy.fileSize}
          </span>
          <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Read Policy <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
