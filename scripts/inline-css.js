import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '../dist')

const css = readFileSync(resolve(dist, 'vue-effort-slider.css'), 'utf-8').trim()

const targets = ['vue-effort-slider.js', 'vue-effort-slider.cjs']

for (const file of targets) {
  const path = resolve(dist, file)
  let code = readFileSync(path, 'utf-8')

  // 在文件开头注入 CSS
  const injection = `(function(){if(typeof document!=='undefined'){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);}})();\n`

  code = injection + code
  writeFileSync(path, code)
  console.log(`✓ ${file} — CSS injected (${(css.length / 1024).toFixed(1)} KB)`)
}
