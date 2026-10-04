import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  if (pathnames.length === 0 || location.pathname.startsWith('/login')) {
    return null
  }

  const formatSegment = (str: string) => {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <nav className="flex items-center text-xs text-muted-foreground mb-4">
      <Link to="/" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        return (
          <React.Fragment key={name}>
            <ChevronRight className="h-3.5 w-3.5 mx-1 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{formatSegment(name)}</span>
            ) : (
              <Link to={routeTo} className="hover:text-slate-800 transition-colors capitalize">
                {formatSegment(name)}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
