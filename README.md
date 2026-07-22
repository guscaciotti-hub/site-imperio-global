# Império Global — Website institucional

Website institucional da **Império Global Telecomunicações Unipessoal, Lda.** — infraestruturas de telecomunicações em Portugal e na Bélgica.

Site **estático, trilingue (PT / EN / FR)**, sem framework de runtime nem build obrigatório para publicar. Portável em qualquer alojamento (Netlify, Hostinger/FTP, GitHub Pages).

---

## Estrutura

```
/                         PT (idioma de referência, validado pelo cliente)
  index · sobre · servicos · areas · recrutamento · contacto · privacidade · 404
/en/                      Inglês (mesmos ficheiros)
/fr/                      Francês (mesmos ficheiros)
css/style.css             Design tokens (cores/tipografia da marca) + todo o estilo
js/main.js                Menu, cookies (RGPD), contadores, validação de formulários, flag WhatsApp
assets/logo/              Logótipos (imperio_primary / imperio_white / imperio_symbol)
assets/img/               og-image, padrão «X», ilustrações
assets/favicon/           favicon.ico + PNG 32 / 180 / 512
build.mjs                 Gerador das páginas a partir de conteúdo centralizado (ver abaixo)
sitemap.xml · robots.txt · site.webmanifest
netlify.toml              Config Netlify
.github/workflows/        Deploy Hostinger (FTP), Preview (Pages), Validação (screenshots)
```

> **As páginas HTML são geradas.** Não edite o HTML à mão — edite o conteúdo em `build.mjs` e regenere. Assim os três idiomas ficam sempre consistentes.

---

## Como editar textos

Todo o conteúdo (nos 3 idiomas) vive no objeto `STRINGS` em **`build.mjs`**. Depois de editar:

```bash
node build.mjs      # regenera as 24 páginas (3 idiomas × 8 páginas)
```

Requer apenas Node.js (sem dependências para gerar). Para acrescentar um serviço, por exemplo, basta adicionar um item ao array `items` da secção `servicos` — em cada idioma.

---

## Configurações a fazer antes de publicar

Todos os pontos estão marcados no código com `TODO`. Os principais:

| O quê | Onde |
|---|---|
| **Formspree** — id real dos formulários | `js/main.js` → `FORMSPREE_ID` |
| **WhatsApp** — ativar e número | `js/main.js` → `ENABLE_WHATSAPP = true` e `WHATSAPP_NUMBER` |
| **Analytics (GTM/GA)** — só após consentimento | `js/main.js` → função `loadAnalytics()` |
| **Logótipos oficiais** (vetor) | substituir os SVG em `assets/logo/` (atuais são recriação fiel do manual) |
| **Números** da secção de estatísticas | `build.mjs` → `index.stats` |
| **Telefone / morada / mapa** | `build.mjs` → `contacto` |
| **Domínio** (canonical, OG, sitemap) | `build.mjs` → `BASE` e `sitemap.xml` (atual: `www.imperioglobal.eu`) |
| **NIPC e morada** na política de privacidade | `build.mjs` → `privacidade` |

### Formulário (Formspree)

1. Criar conta gratuita em [formspree.io](https://formspree.io) e um formulário; copiar o id (ex.: `xrgkabcd`).
2. Em `js/main.js`, substituir `FORMSPREE_ID`.
3. Os formulários de **contacto** e **recrutamento** (com upload de CV) passam a enviar.

> **Alternativa — Netlify Forms:** se o alojamento final for Netlify, pode dispensar o Formspree. Adicione `netlify` e `name="..."` ao `<form>` (e um campo oculto `form-name`) nos templates de formulário em `build.mjs`, regenere, e ative os forms no painel Netlify. Ver nota no `netlify.toml`.

### Ativar o WhatsApp flutuante

Em `js/main.js`: `const ENABLE_WHATSAPP = true;` e definir `WHATSAPP_NUMBER` (formato internacional, sem `+`).

---

## Como publicar

### Netlify (simples)
Ligar o repositório ao Netlify. O `netlify.toml` publica a raiz. A `404.html` é servida automaticamente.

### Hostinger (FTP automático)
O workflow `.github/workflows/deploy-hostinger.yml` envia o site para a `public_html` a cada push em `main`. Configuração única:

1. Hostinger → hPanel → **Arquivos → Contas FTP**: anotar *host* e *utilizador* (redefinir senha se preciso).
2. GitHub → **Settings → Secrets and variables → Actions**: criar `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`.
3. **Actions → Publicar na Hostinger → Run workflow** (primeira vez).

> Se a conta FTP já cair dentro de `public_html`, mude `server-dir` para `./`. Se o FTPS falhar, troque `protocol: ftps` por `ftp`.

### Alojamento genérico (FTP manual)
Enviar todo o conteúdo do repositório (exceto `build.mjs`, `README.md`, `.github/`, `node_modules/`) para a pasta pública. O `index.html` deve ficar na raiz.

### Preview (GitHub Pages)
Ativar em **Settings → Pages → Source: GitHub Actions** e correr o workflow *Preview do site*.

---

## Requisitos cumpridos

- **SEO:** `<title>`/description únicos por página e idioma, `hreflang` PT/EN/FR + `x-default`, Open Graph + Twitter cards, `schema.org` Organization na home, `sitemap.xml`, `robots.txt`.
- **Acessibilidade:** navegação por teclado, `skip link`, labels em todos os campos, `alt` nas imagens, contraste AA, `lang` correto por página, `prefers-reduced-motion`.
- **Performance:** sem bibliotecas externas além das Google Fonts; SVG para logótipos/ícones; `defer` no JS; imagens com `width/height`.
- **Responsivo** mobile-first (480 / 768 / 1100px) com menu hambúrguer.
- **Marca:** cores e tipografia (Archivo + Inter) conforme o Manual de Identidade Visual; elemento «X» como padrão discreto; ícones de linha.

## Blog — como adicionar um artigo

Os artigos vivem no array `ARTICLES` em **`build.mjs`**. Cada artigo é um objeto:

```js
{
  slug: 'ftth-portugal-estado-cobertura',   // URL kebab-case, sem stopwords → /blog/<slug>.html
  cat: 'fibra',                              // chave de CATEGORIES (fibra, construcao, manutencao, regulamentacao, casos, insights)
  date: '2026-08-01',                        // ISO YYYY-MM-DD
  langs: {                                   // só os idiomas que existirem (hreflang liga automaticamente)
    pt: {
      title: '…', desc: '…',                 // <title> e meta description
      excerpt: '…',                          // resumo no card (máx. ~3 linhas)
      body: `<h2 id="seccao-1">…</h2><p>…</p>…`,  // corpo HTML; os <h2 id> geram o índice "Neste artigo"
    },
    // en: {…}, fr: {…}   // opcional; artigo #5 (Bélgica) é só en+fr
  },
}
```

Depois: `node build.mjs` regenera índice, artigo, `hreflang`, schema.org `Article`, tempo de leitura e sitemap.

- **Blocos especiais no corpo:** `<blockquote>…</blockquote>` (citação Azul Sinal) e `<div class="note"><strong>Nota técnica.</strong> …</div>`.
- **Traduções cruzadas:** basta acrescentar `en`/`fr` ao mesmo objeto — o seletor de idioma e o `hreflang` passam a ligá-las.
- **Imagem OG (1200×630):** colocar em `assets/img/blog/<slug>-og.png` (ver o template usado no piloto).
- **Autor com foto/bio (futuro):** hoje o autor é "Equipa Império Global" (`BLOG_UI[lang].author`). Para múltiplos autores, criar um objeto `AUTHORS` e um campo `author` no artigo.

## Aguardando input do cliente (TODOs)

Elementos que dependem de confirmação — cada um marcado com `<!-- TODO -->` no código:

- [ ] **Autorização para nomear MEO / NOS / Vodafone / Proximus** — afeta a linha do hero e a página Sobre (aguarda Soraia).
- [ ] **Email `denuncias@imperioglobal.eu`** — confirmar/criar; usado no Canal de Denúncias (formulário + email direto).
- [ ] **Certificações** (ISO 9001 / 14001 / 45001, Alvará IMPIC, ANACOM, EN 1090…) — slot pronto e comentado no rodapé; fornecer PNGs em `/assets/certifications/`.
- [ ] **Fotografias reais da operação** — para o futuro banco de imagens do blog.
- [ ] **Nomes de 3 projetos** referenciáveis publicamente — para a futura página `/projetos`.
- [ ] **Datas** (aprovação do Código de Ética) e **comarca/sede** (Termos) — placeholders `<!-- TODO -->`.
- [ ] **Formspree ID** e ativação do **WhatsApp** (ver acima).

## Notas

- **Traduções EN/FR** foram feitas a partir do PT (validado). **Devem passar por revisão nativa** antes da publicação — FR em registo europeu/Bélgica.
- **Logótipo:** o site usa o **logótipo oficial** do cliente (`assets/logo/imperio-oficial.png`, recortado e com fundo transparente) no header e no rodapé. O símbolo do favicon (`imperio_symbol.svg`) é uma recriação do globo; substituir pelo símbolo oficial vetorial se disponibilizado. Para logótipo nítido em ecrãs de alta resolução, fornecer versão **SVG** e trocar `imperio-oficial.png` por ela.
- Idioma de referência: **Português europeu (PT-PT)**.
