import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const collectJsonFiles = (target, files) => {
  const path = resolve(target)
  const stat = statSync(path, { throwIfNoEntry: false })

  if (!stat) {
    throw new Error(`Path not found: ${target}`)
  }

  if (stat.isDirectory()) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        collectJsonFiles(join(path, entry.name), files)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(join(path, entry.name))
      }
    }
  } else if (path.endsWith('.json')) {
    files.push(path)
  }
}

const sortKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, child]) => [key, sortKeys(child)]),
    )
  }

  return value
}

try {
  const files = []
  const targets = process.argv.slice(2)

  if (targets.length === 0) {
    collectJsonFiles('themes', files)
  } else {
    for (const target of targets) {
      collectJsonFiles(target, files)
    }
  }

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const sorted = `${JSON.stringify(sortKeys(JSON.parse(source)), null, 2)}\n`

    if (sorted !== source) {
      writeFileSync(file, sorted)
      console.log(`Sorted ${file}`)
    }
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
