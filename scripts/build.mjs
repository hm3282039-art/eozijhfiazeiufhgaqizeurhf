// Keep editable modules and stylesheet separate, while producing a standalone HTML page.
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
const [template, css, result] = await Promise.all([
  readFile('index.template.html', 'utf8'),
  readFile('style.css', 'utf8'),
  build({ entryPoints: ['js/main.js'], bundle: true, format: 'iife', platform: 'browser', target: ['es2020'], write: false, charset: 'utf8' })
]);
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
if (!template.includes('/*__INLINE_CSS__*/') || !template.includes('/*__INLINE_GAME__*/')) throw new Error('Marqueurs de compilation absents.');
await writeFile('index.html', template.replace('/*__INLINE_CSS__*/', () => css).replace('/*__INLINE_GAME__*/', () => js));
console.log('index.html construit : CSS et jeu intégrés.');
