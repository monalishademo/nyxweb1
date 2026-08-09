import * as yaml from 'js-yaml'
import Papa from 'papaparse'
import TurndownService from 'turndown'
import MarkdownIt from 'markdown-it'
import { escapeHtml } from '../utils'

// ---------------------------------------------------------------------------
// JSON <-> XML
// ---------------------------------------------------------------------------
export function jsonToXml(jsonText: string): string {
  const data = JSON.parse(jsonText)
  const esc = (s: string) => escapeHtml(s)
  const build = (key: string, val: unknown): string => {
    if (Array.isArray(val)) return val.map((v) => build(key, v)).join('\n')
    if (val !== null && typeof val === 'object') {
      const obj = val as Record<string, unknown>
      const attrs = Object.entries(obj)
        .filter(([k]) => k.startsWith('@'))
        .map(([k, v]) => ` ${k.slice(1)}="${esc(String(v))}"`)
        .join('')
      const inner = Object.entries(obj)
        .filter(([k]) => !k.startsWith('@'))
        .map(([k, v]) => build(k, v))
        .join('')
      return `<${key}${attrs}>${inner}</${key}>`
    }
    if (val === null || val === undefined) return `<${key}/>`
    const text = String(val)
    if (text === '') return `<${key}/>`
    return `<${key}>${esc(text)}</${key}>`
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data)
    if (keys.length === 1 && keys[0] !== '#text') {
      const rootKey = keys[0]
      return `<?xml version="1.0" encoding="UTF-8"?>\n${build(rootKey, data[rootKey])}`
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${build('root', data)}`
}

function nodeToObject(node: Element): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const attr of Array.from(node.attributes)) {
    obj[`@${attr.name}`] = attr.value
  }
  const children = Array.from(node.children)
  if (children.length) {
    const groups = new Map<string, Element[]>()
    for (const c of children) {
      if (!groups.has(c.tagName)) groups.set(c.tagName, [])
      groups.get(c.tagName)!.push(c)
    }
    for (const [tag, els] of groups) {
      const vals = els.map((e) => nodeToObject(e))
      obj[tag] = vals.length === 1 ? vals[0] : vals
    }
  } else {
    const text = (node.textContent || '').trim()
    if (text) obj['#text'] = text
  }
  return obj
}

export function xmlToJson(xmlText: string): string {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML')
  return JSON.stringify(nodeToObject(doc.documentElement), null, 2)
}

// ---------------------------------------------------------------------------
// JSON <-> YAML
// ---------------------------------------------------------------------------
export function jsonToYaml(jsonText: string): string {
  return yaml.dump(JSON.parse(jsonText), { lineWidth: 120 })
}

export function yamlToJson(yamlText: string): string {
  const parsed = yaml.load(yamlText)
  return JSON.stringify(parsed, null, 2)
}

// ---------------------------------------------------------------------------
// CSV <-> JSON
// ---------------------------------------------------------------------------
export function csvToJson(csv: string): string {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' })
  return JSON.stringify(parsed.data, null, 2)
}

export function jsonToCsv(jsonText: string): string {
  const data = JSON.parse(jsonText)
  const rows = Array.isArray(data) ? data : [data]
  return Papa.unparse(rows)
}

export function csvToXml(csv: string): string {
  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: 'greedy' })
  const rows = parsed.data
  if (!rows.length) return '<root></root>'
  const headers = rows[0].map(String)
  const body = rows.slice(1).map((r) => {
    const cells = headers.map((h, i) => {
      const tag = h.replace(/[^A-Za-z0-9_-]/g, '_') || 'col'
      return `    <${tag}>${escapeHtml(String(r[i] ?? ''))}</${tag}>`
    })
    return `  <row>\n${cells.join('\n')}\n  </row>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${body.join('\n')}\n</root>`
}

export function xmlToCsv(xmlText: string): string {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML')
  const rows = Array.from(doc.documentElement.children)
  if (!rows.length) return ''
  const collect = (el: Element): Record<string, string> => {
    const obj: Record<string, string> = {}
    const walk = (e: Element, prefix = '') => {
      for (const child of Array.from(e.children)) {
        if (child.children.length === 0) {
          obj[`${prefix}${child.tagName}`] = (child.textContent || '').trim()
        } else {
          walk(child, `${prefix}${child.tagName}.`)
        }
      }
    }
    walk(el)
    return obj
  }
  const objs = rows.map(collect)
  const headers = Array.from(new Set(objs.flatMap((o) => Object.keys(o))))
  const csv = [headers, ...objs.map((o) => headers.map((h) => o[h] ?? ''))]
  return Papa.unparse(csv)
}

// ---------------------------------------------------------------------------
// HTML <-> Markdown
// ---------------------------------------------------------------------------
export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  turndown.remove(['script', 'style', 'title'])
  return turndown.turndown(html)
}

export function markdownToHtml(md: string): string {
  const mdIt = new MarkdownIt({ html: true, linkify: true, breaks: true })
  return mdIt.render(md)
}