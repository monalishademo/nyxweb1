import { useRef, useState } from 'react'
import { UploadCloud, FileCheck } from 'lucide-react'

interface FileDropZoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title?: string
  hint?: string
  selectedNames?: string[]
}

export default function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  title,
  hint,
  selectedNames = [],
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list: FileList | null) => {
    if (!list || !list.length) return
    const files = Array.from(list)
    if (accept) {
      const patterns = accept
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean)
      const accepted = files.filter((f) => {
        const ext = `.${f.name.split('.').pop()?.toLowerCase()}`
        const type = f.type.toLowerCase()
        return patterns.some((a) => {
          if (a.startsWith('.')) return ext === a
          if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1))
          return type === a
        })
      })
      if (accepted.length) onFiles(multiple ? accepted : [accepted[0]])
      return
    }
    onFiles(multiple ? files : [files[0]])
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        dragging
          ? 'border-violet-500 bg-violet-500/10'
          : 'border-violet-400/60 dark:border-violet-500/40 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {selectedNames.length ? (
        <div className="space-y-2 flex flex-col items-center">
          <FileCheck className="w-10 h-10 text-emerald-500 animate-bounce" />
          {selectedNames.map((n) => (
            <p
              key={n}
              className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-full px-4"
            >
              {n}
            </p>
          ))}
          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 underline mt-1">
            Click or drop to replace file
          </p>
        </div>
      ) : (
        <div className="space-y-2 flex flex-col items-center">
          <UploadCloud className="w-10 h-10 text-violet-500" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {title || 'Drop a file here'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hint || 'or click to browse'}
          </p>
        </div>
      )}
    </div>
  )
}