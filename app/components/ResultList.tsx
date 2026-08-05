import { Download, Loader2, AlertTriangle } from 'lucide-react'
import { downloadBlob, formatBytes } from '../lib/utils'

export interface ResultFile {
  filename: string
  blob?: Blob
  text?: string
  dataUrl?: string
  mime?: string
}

export interface ProgressState {
  message: string
  pct?: number
}

interface ResultListProps {
  items: ResultFile[]
  busy?: boolean
  busyText?: string
  progress?: ProgressState | null
  onClear?: () => void
  warnings?: string[]
}

export default function ResultList({ items, busy, busyText, progress, onClear, warnings = [] }: ResultListProps) {
  if (!items.length && !busy) return null
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold dark-text-main">Output</h3>
        {onClear && (
          <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
        )}
      </div>
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{w}</span>
        </div>
      ))}
      {busy && (
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span>{busyText || 'Converting...'}</span>
        </div>
      )}
      {progress && (
        <div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${Math.max(4, Math.round((progress.pct || 0) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progress.message}</p>
        </div>
      )}
      {items.map((item, i) => {
        const size = item.blob ? formatBytes(item.blob.size) : item.text ? `${Math.round(item.text.length / 1024)} KB` : ''
        const handle = () => {
          if (item.blob) downloadBlob(item.blob, item.filename)
          else if (item.text) downloadBlob(new Blob([item.text], { type: item.mime || 'text/plain;charset=utf-8' }), item.filename)
          else if (item.dataUrl) {
            const a = document.createElement('a')
            a.href = item.dataUrl
            a.download = item.filename
            a.click()
          }
        }
        return (
          <div key={i} className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{item.filename}</p>
              <p className="text-[10px] text-slate-500">{size}</p>
            </div>
            <button onClick={handle} className="btn-primary !px-3 !py-1.5 shrink-0">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        )
      })}
    </div>
  )
}
