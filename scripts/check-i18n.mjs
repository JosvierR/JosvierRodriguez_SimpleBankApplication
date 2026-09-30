import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend/src/shared/i18n/locales')
const languages = ['en', 'es', 'fr']
const namespaces = ['common', 'auth', 'landing', 'banking', 'admin', 'errors']

function flatten(value, prefix = '') {
  const entries = {}
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      Object.assign(entries, flatten(child, prefix ? `${prefix}.${key}` : key))
    }
    return entries
  }
  entries[prefix] = value
  return entries
}

let failed = false
const english = {}
for (const namespace of namespaces) {
  const file = path.join(root, 'en', `${namespace}.json`)
  if (!fs.existsSync(file)) {
    console.error(`missing namespace en/${namespace}.json`)
    failed = true
    continue
  }
  english[namespace] = flatten(JSON.parse(fs.readFileSync(file, 'utf8')))
}

for (const language of languages.filter((item) => item !== 'en')) {
  for (const namespace of namespaces) {
    const file = path.join(root, language, `${namespace}.json`)
    if (!fs.existsSync(file)) {
      console.error(`missing namespace ${language}/${namespace}.json`)
      failed = true
      continue
    }
    const translated = flatten(JSON.parse(fs.readFileSync(file, 'utf8')))
    const expected = english[namespace]
    for (const key of Object.keys(expected)) {
      if (!(key in translated)) {
        console.error(`${language}/${namespace} missing ${key}`)
        failed = true
      } else if (String(translated[key]).trim() === '') {
        console.error(`${language}/${namespace} empty ${key}`)
        failed = true
      }
    }
    for (const key of Object.keys(translated)) {
      if (!(key in expected)) {
        console.error(`${language}/${namespace} unexpected ${key}`)
        failed = true
      }
    }
  }
}

if (failed) process.exit(1)
console.log('i18n keys match across en, es, and fr')
