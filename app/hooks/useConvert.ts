import { useState } from 'react'
import type { ResultFile, ProgressState } from '../components/ResultList'

export function useConvert() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<ResultFile[]>([])
  const [busy, setBusy] = useState(false)
  const [busyText, setBusyText] = useState('Converting...')
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const run = async (
    fn: (onProgress: (p: ProgressState) => void) => Promise<ResultFile[]>,
    text = 'Converting...'
  ) => {
    setBusy(true)
    setBusyText(text)
    setWarnings([])
    setResults([])
    try {
      const res = await fn((p) => setProgress(p))
      setResults(res)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setWarnings([message])
      setResults([])
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const clear = () => {
    setResults([])
    setWarnings([])
    setFiles([])
  }

  return {
    files,
    setFiles,
    results,
    setResults,
    busy,
    busyText,
    progress,
    warnings,
    setWarnings,
    run,
    clear,
  }
}
