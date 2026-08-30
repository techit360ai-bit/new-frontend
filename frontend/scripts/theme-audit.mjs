import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.css', '.scss'])
const files = []

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) await walk(target)
    else if (extensions.has(path.extname(entry.name))) files.push(target)
  }
}

await walk(root)
const source = (await Promise.all(files.map(async file => ({ file, text: await fs.readFile(file, 'utf8') })))).filter(({ file }) => !file.endsWith('theme-audit.mjs'))
const patterns = {
  hex: /#[0-9a-f]{3,8}\b/gi,
  functional: /\b(?:rgb|rgba|hsl|hsla)\(/gi,
  arbitraryTailwind: /(?:bg|text|border|from|via|to)-\[#/g,
  hueUtilities: /(?:bg|text|border|from|via|to)-(?:blue|purple|green|red|gray|slate|zinc|orange|indigo|emerald|amber|yellow|pink)-\d+/g,
}

const canonicalFiles = new Set([
  'src/config/theme.config.ts',
  'src/styles/themes.css',
])
const counts = Object.fromEntries(Object.keys(patterns).map(key => [key, 0]))
const productCounts = Object.fromEntries(Object.keys(patterns).map(key => [key, 0]))
const hotspots = []
const productHotspots = []
for (const { file, text } of source) {
  const row = { file: path.relative(process.cwd(), file), matches: 0 }
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern) || []
    counts[key] += matches.length
    if (!canonicalFiles.has(row.file)) productCounts[key] += matches.length
    row.matches += matches.length
  }
  if (row.matches) hotspots.push(row)
  if (row.matches && !canonicalFiles.has(row.file)) productHotspots.push(row)
}

console.log(JSON.stringify({
  files: source.length,
  counts,
  productCounts,
  canonicalFiles: [...canonicalFiles],
  hotspots: hotspots.sort((a, b) => b.matches - a.matches).slice(0, 25),
  productHotspots: productHotspots.sort((a, b) => b.matches - a.matches).slice(0, 25),
}, null, 2))
