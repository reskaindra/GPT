// Download the OFL fonts (latin + latin-ext subsets) into fonts/ and write fonts.css
import fs from 'fs';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams = ['Alfa+Slab+One', 'Bagel+Fat+One', 'Caveat+Brush', 'JetBrains+Mono:wght@800', 'Archivo+Black', 'Archivo:wght@600;800'];
let out = '', n = 0;
for (const f of fams) {
  let css = await (await fetch(`https://fonts.googleapis.com/css2?family=${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  // keep only latin and latin-ext blocks
  css = css.split('/*').filter(b => /^ (latin|latin-ext) \*\//.test(b)).map(b => '/*' + b).join('');
  const urls = [...new Set(css.match(/https:\/\/[^)]+\.woff2/g) || [])];
  for (const u of urls) { const name = `f${n++}.woff2`; fs.writeFileSync('fonts/' + name, Buffer.from(await (await fetch(u)).arrayBuffer())); css = css.split(u).join('fonts/' + name); }
  out += css; console.log(f, urls.length);
}
fs.writeFileSync('fonts.css', out);
