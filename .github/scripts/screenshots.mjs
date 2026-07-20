// Serve a raiz do site e gera screenshots (desktop + celular) das páginas PT em shots/
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { extname, join, normalize } from 'path';

const types = {
  '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp',
  '.ico':'image/x-icon', '.xml':'application/xml', '.webmanifest':'application/manifest+json',
};

const srv = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join('.', p)).replace(/^(\.\.[/\\])+/, '');
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(8777);

mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();
const pages = ['/', '/sobre.html', '/servicos.html', '/areas.html', '/recrutamento.html', '/contacto.html'];

for (const [name, viewport, dsf, isMobile] of [
  ['desktop', { width:1440, height:900 }, 1, false],
  ['celular', { width:390, height:844 }, 2, true],
]) {
  for (const route of pages) {
    const page = await browser.newPage({ viewport, deviceScaleFactor:dsf, isMobile, hasTouch:isMobile });
    await page.goto('http://localhost:8777' + route, { waitUntil:'load', timeout:60000 });
    await page.addStyleTag({ content:'*,*::before,*::after{animation-duration:0s!important;transition:none!important;scroll-behavior:auto!important}' });
    await page.evaluate(async () => {
      document.querySelectorAll('.rv').forEach(el => el.classList.add('on'));
      await new Promise(done => { let y=0; const t=setInterval(()=>{ y+=600; scrollTo(0,y); if(y>=document.body.scrollHeight){clearInterval(t);scrollTo(0,0);done();} },30); });
      await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload=i.onerror=r; })));
    });
    await page.waitForTimeout(400);
    const label = route === '/' ? 'home' : route.replace(/[/.]/g, '').replace('html','');
    await page.screenshot({ path:`shots/${name}-${label}.jpg`, fullPage:true, type:'jpeg', quality:82 });
    await page.close();
    console.log('ok:', name, route);
  }
}
await browser.close();
srv.close();
