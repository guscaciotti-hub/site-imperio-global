/* =====================================================================
   IMPÉRIO GLOBAL — Gerador estático de páginas (i18n)
   ---------------------------------------------------------------------
   PORQUÊ: o site é trilingue (PT/EN/FR) com 8 páginas cada = 24 ficheiros
   HTML. Para manter tudo consistente e editável a partir de UMA fonte,
   os textos vivem no objeto STRINGS abaixo e este script gera HTML
   ESTÁTICO puro (sem runtime, sem framework) para a raiz (PT), /en e /fr.

   COMO USAR:  node build.mjs
   O resultado são ficheiros .html estáticos, portáveis em qualquer host.
   Para editar textos, altere STRINGS e volte a correr o script.
   ===================================================================== */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const BASE = 'https://www.imperioglobal.eu'; // TODO: confirmar domínio final
const LANGS = ['pt', 'en', 'fr'];
const OG_LOCALE = { pt: 'pt_PT', en: 'en_GB', fr: 'fr_BE' };

// Nome do ficheiro por página (igual nos 3 idiomas → o seletor só troca o prefixo)
const FILE = {
  index: '', sobre: 'sobre.html', servicos: 'servicos.html', areas: 'areas.html',
  blog: 'blog/', recrutamento: 'recrutamento.html', contacto: 'contacto.html',
  privacidade: 'privacidade.html',
  canaldenuncias: 'canal-denuncias.html', codigoetica: 'codigo-etica.html',
  cookies: 'cookies.html', termos: 'termos.html',
  e404: '404.html',
};
const PAGES = Object.keys(FILE);

// Caminho absoluto a partir da raiz do site — usado para SEO (canonical/hreflang/OG).
const pathFor = (lang, page) => {
  const pre = lang === 'pt' ? '' : `/${lang}`;
  if (page === 'index') return pre + '/';
  return `${pre}/${FILE[page]}`;
};

// Prefixo relativo para assets (css/js/imagens) conforme a profundidade do idioma.
// PT está na raiz (''); EN/FR estão um nível abaixo ('../'). Torna o site portável
// em qualquer base (raiz de domínio, subpasta do GitHub Pages, etc.).
const upFor = (lang) => (lang === 'pt' ? '' : '../');

// Ligação interna RELATIVA com prefixo "up" explícito (nº de ../ até à raiz do site).
// Permite páginas em subpastas mais profundas (ex.: /blog/, /en/blog/).
const relLinkUp = (up, toLang, page) => {
  const toDir = toLang === 'pt' ? '' : `${toLang}/`;
  const file = page === 'index' ? '' : FILE[page];
  const r = up + toDir + file;
  return r === '' ? './' : r;
};
// Ligação interna RELATIVA entre páginas de profundidade padrão (preserva a página ao trocar de idioma).
const relLink = (fromLang, toLang, page) => relLinkUp(upFor(fromLang), toLang, page);
// Prefixo "up" para uma página (considera idioma + se está numa subpasta como /blog/).
const upForPage = (lang, page) => upFor(lang) + (page === 'blog' ? '../' : '');

/* -------------------------------------------------- Ícones de linha (SVG) */
const ICON = {
  build: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="10" r="4"/><circle cx="10" cy="38" r="4"/><circle cx="38" cy="38" r="4"/><path d="M24 14v10m0 0-11 11m11-11 11 11"/></svg>',
  expand: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 24h28"/><path d="M26 16l8 8-8 8"/><path d="M40 12v24"/></svg>',
  maint: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M31 9a8 8 0 0 0-10 10L9 31a3 3 0 0 0 0 4l4 4a3 3 0 0 0 4 0l12-12a8 8 0 0 0 10-10l-6 6-4-4 6-6z"/></svg>',
  fiber: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 40c0-12 8-20 20-20"/><path d="M40 8c0 12-8 20-20 20"/><circle cx="8" cy="40" r="2.5"/><circle cx="40" cy="8" r="2.5"/><circle cx="24" cy="24" r="2.5"/></svg>',
  repair: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v8m0 20v8M6 24h8m20 0h8"/><circle cx="24" cy="24" r="8"/></svg>',
  copper: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v12a14 14 0 0 0 28 0V10"/><path d="M6 10h8M34 10h8"/></svg>',
  wa: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2.1c1.8 1 3.8 1.5 5.9 1.5 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.4 1.2 1.2-4.3-.3-.4a10 10 0 0 1-1.6-5.4c0-5.6 4.6-10.2 10.2-10.2s10.2 4.6 10.2 10.2S21.6 25.8 16 25.8zm5.7-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a8.3 8.3 0 0 1-4.1-3.6c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 1.9.8 2.7.9 3.6.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  globe: '<svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".8"><ellipse cx="100" cy="75" rx="70" ry="55"/><path d="M30 75h140M100 20v110M45 45c30 20 80 20 110 0M45 105c30-20 80-20 110 0"/><circle cx="100" cy="75" r="5" fill="currentColor" stroke="none"/></svg>',
  survey: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="7" width="24" height="34" rx="2"/><path d="M19 7v-1h10v1"/><path d="M18 19h12M18 26h12M18 33h8"/></svg>',
  aerial: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v36"/><path d="M13 13l11-4 11 4"/><path d="M11 22l13-5 13 5"/><path d="M18 42h12"/></svg>',
  underground: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15h38"/><path d="M14 15v6a4 4 0 0 0 4 4h12a4 4 0 0 1 4 4v6"/><circle cx="14" cy="12" r="2"/><circle cx="34" cy="38" r="2"/><path d="M5 30h38" opacity=".45"/></svg>',
  quality: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 5l16 6v10c0 10-7 17-16 21-9-4-16-11-16-21V11z"/><path d="M17 24l5 5 9-11"/></svg>',
};

/* =====================================================================
   CONTEÚDO (fonte única). PT-PT é o idioma de referência e validado.
   EN/FR são tradução profissional — TODO: revisão nativa antes de publicar.
   ===================================================================== */
const STRINGS = {
  pt: {
    htmlLang: 'pt',
    nav: { index:'Início', sobre:'Sobre', servicos:'Serviços', areas:'Áreas de Atuação', blog:'Blog', recrutamento:'Recrutamento', contacto:'Contacto' },
    skip: 'Saltar para o conteúdo',
    tagline: 'Construção, expansão e manutenção de infraestruturas de telecomunicações em Portugal e na Bélgica.',
    footer: {
      nav:'Navegação', empresa:'Empresa', contacto:'Contacto',
      privacidade:'Política de Privacidade', rights:'Todos os direitos reservados.',
      gov:'Governance & Conformidade', cookies:'Política de Cookies', termos:'Termos e Condições',
      codigoetica:'Código de Ética e Conduta', canaldenuncias:'Canal de Denúncias',
    },
    cookies: {
      text:'Utilizamos cookies para melhorar a sua experiência e analisar o tráfego. Os cookies de análise só são carregados após o seu consentimento.',
      accept:'Aceitar', reject:'Recusar', more:'Saber mais',
    },
    cta: { title:'Vamos construir a próxima ligação?', text:'Fale connosco sobre o seu projeto de infraestruturas de telecomunicações.', btn:'Fale connosco' },
    pages: {
      index: {
        title:'Império Global — Infraestruturas de telecomunicações · Portugal e Bélgica',
        desc:'A Império Global constrói, expande e mantém infraestruturas de telecomunicações em Portugal e na Bélgica, ao serviço de operadores, empresas privadas e entidades públicas.',
        heroTitle:'Construímos as redes que ligam Portugal e a Bélgica.',
        heroSub:'Soluções end-to-end para construção, expansão e manutenção de infraestruturas de telecomunicações. Ao serviço de operadores, empreiteiros e entidades públicas.',
        ctaPrimary:'Fale connosco', ctaSecondary:'Os nossos serviços',
        heroStats:[ { v:'8', l:'anos de operação' }, { v:'50+', l:'profissionais especializados' }, { v:'2', l:'países · Portugal e Bélgica' } ],
        trust:'Parceiro de operadores de referência.',
        servEyebrow:'O que fazemos', servTitle:'Infraestruturas que suportam as redes de acesso',
        serv:[
          { i:'build', t:'Construção de redes', d:'Implementação de raiz de infraestruturas de acesso, com rigor de execução e conformidade técnica.' },
          { i:'expand', t:'Expansão de traçados', d:'Ampliação e prolongamento de redes existentes para acompanhar o crescimento da procura.' },
          { i:'maint', t:'Manutenção e reparação de avarias', d:'Manutenção preventiva e corretiva que assegura a fiabilidade, disponibilidade e desempenho das redes.' },
          { i:'fiber', t:'Fibra ótica e cobre', d:'Instalação e ligação de cabos de fibra ótica e de cobre, do troço principal ao ponto de acesso.' },
        ],
        servAll:'Ver todos os serviços',
        whyEyebrow:'Porquê a Império Global', whyTitle:'Solidez técnica em cada etapa',
        pillars:[
          { t:'Rigor de execução', d:'Processos técnicos rigorosos, do planeamento à entrega, com foco na conformidade.' },
          { t:'Fiabilidade', d:'Infraestruturas que asseguram a fiabilidade, disponibilidade e desempenho das redes.' },
          { t:'Capacidade de resposta', d:'Equipas e viaturas prontas para intervir e reduzir o tempo de indisponibilidade.' },
          { t:'Visão de escala', d:'Operação em dois países e capacidade para acompanhar projetos de grande dimensão.' },
        ],
        stats:[ { n:50, pre:'+', l:'Colaboradores' }, { n:2, pre:'', l:'Países de operação' }, { n:20, pre:'', l:'Viaturas de intervenção' } ],
      },
      sobre: {
        title:'Sobre — Império Global', desc:'Especialistas na construção, expansão e manutenção de infraestruturas de telecomunicações, com operação em Portugal e na Bélgica.',
        h1:'Sobre a Império Global', eyebrow:'Quem somos',
        intro:'A Império Global é especialista na construção, expansão e manutenção de infraestruturas de telecomunicações. Desenvolvemos, implementamos e asseguramos a manutenção de redes de fibra ótica e infraestruturas de acesso que suportam os serviços dos principais operadores.',
        missaoT:'Missão',
        missao:'Planeamos, construímos e mantemos infraestruturas de telecomunicações com rigor técnico e compromisso, garantindo redes fiáveis, preparadas para responder às exigências do presente e do futuro. Transformamos desafios em soluções e cada projeto numa relação de confiança.',
        visaoT:'Visão',
        visao:'Ser uma referência internacional na execução de infraestruturas técnicas, reconhecida pela inovação, competência e excelência operacional, crescendo de forma sustentável para novas áreas e mercados.',
        valoresT:'Valores',
        valores:[
          { t:'Compromisso', d:'Cumprimos o que prometemos, com responsabilidade e rigor.' },
          { t:'Confiança', d:'Construímos relações sólidas através da transparência e da qualidade.' },
          { t:'Inovação', d:'Evoluímos continuamente para soluções mais eficientes e preparadas para o futuro.' },
        ],
        dadosTitle:'A Império Global em números',
        dados:[
          { v:'8', l:'anos de operação', d:'Desde 2017 a construir e a manter infraestruturas de acesso.' },
          { v:'50+', l:'profissionais especializados', d:'Equipas técnicas de campo e de gestão.' },
          { v:'2', l:'países', d:'Operação em Portugal e na Bélgica, com a mesma exigência técnica.' },
        ],
        presencaTitle:'Presença internacional',
        presenca:'Fundada em 2017, a Império Global evoluiu da instalação e manutenção de redes ADSL para as soluções de fibra ótica (FTTH) e infraestruturas de nova geração. Portugal é hoje o mercado principal e concentra a maior parte da operação; a presença na Bélgica reflete uma trajetória de crescimento sustentada, construída sobre a confiança de operadores, empresas privadas e entidades públicas. A operação em dois países permite-nos partilhar competências, escalar equipas e responder a projetos de grande dimensão com a mesma exigência técnica.',
      },
      servicos: {
        title:'Serviços — Império Global', desc:'Construção, expansão e manutenção de infraestruturas de telecomunicações: redes fixas, fibra ótica e cobre, manutenção preventiva e corretiva.',
        h1:'Serviços', eyebrow:'O que oferecemos',
        intro:'Cobrimos todo o ciclo de vida das infraestruturas de acesso — da construção à manutenção — para operadores, empresas privadas e entidades públicas.',
        items:[
          { i:'survey', t:'Survey e levantamento técnico', d:'Levantamento de campo e preparação de projeto para a execução das infraestruturas.' },
          { i:'aerial', t:'Construção de redes aéreas', d:'Instalação de infraestruturas de acesso em apoios aéreos, do traçado à ligação.' },
          { i:'underground', t:'Construção de redes subterrâneas', d:'Execução de condutas e traçados subterrâneos, coordenada com as entidades competentes.' },
          { i:'expand', t:'Expansão e ampliação de traçados', d:'Prolongamento e densificação de redes existentes para acompanhar a procura.' },
          { i:'maint', t:'Manutenção preventiva', d:'Planos de manutenção que asseguram a fiabilidade, disponibilidade e desempenho das redes.' },
          { i:'repair', t:'Diagnóstico e resolução de avarias', d:'Deteção e reparação de avarias com capacidade de resposta e redução do tempo de indisponibilidade.' },
          { i:'fiber', t:'Instalação e ligação de cabos de fibra ótica', d:'Lançamento, fusão e ligação de fibra ótica, do troço principal ao ponto de acesso.' },
          { i:'copper', t:'Instalação e ligação de cabos de cobre', d:'Instalação, ligação e certificação de infraestruturas em cobre.' },
          { i:'quality', t:'Controlo de qualidade e auditoria de redes', d:'Verificação, certificação e auditoria técnica das infraestruturas executadas.' },
        ],
      },
      areas: {
        title:'Áreas de Atuação — Império Global', desc:'Operação em Portugal e na Bélgica, ao serviço de operadores, empresas privadas e entidades públicas.',
        h1:'Áreas de Atuação', eyebrow:'Onde atuamos',
        intro:'Operamos em dois países europeus, com equipas próprias e capacidade de intervenção local.',
        paises:[
          { nome:'Portugal', d:'Atuação em território nacional na construção, expansão e manutenção de infraestruturas de acesso, ao serviço de operadores, empresas privadas e entidades públicas.' },
          { nome:'Bélgica', d:'Operação no mercado belga em infraestruturas de telecomunicações, com equipas dedicadas à construção e manutenção de redes de fibra ótica e cobre.' },
        ],
      },
      recrutamento: {
        title:'Recrutamento — Império Global', desc:'Junte-se a uma equipa em crescimento nas infraestruturas de telecomunicações em Portugal e na Bélgica.',
        h1:'Recrutamento', eyebrow:'Carreiras',
        intro:'Junte-se a uma equipa em crescimento, que constrói e mantém as infraestruturas que ligam pessoas e empresas. Valorizamos o rigor técnico, a segurança e o espírito de equipa.',
        formTitle:'Candidatura espontânea',
        f:{ nome:'Nome', email:'Email', telefone:'Telefone', area:'Área de interesse', msg:'Mensagem', cv:'Currículo (PDF ou DOC, máx. 5 MB)', submit:'Enviar candidatura' },
        areas:['Construção de redes','Manutenção e reparação','Fibra ótica e cobre','Engenharia e projeto','Administrativo','Outra'],
        consent:'Li e aceito a <a href="{priv}">Política de Privacidade</a> e autorizo o tratamento dos meus dados para efeitos de recrutamento.',
      },
      contacto: {
        title:'Contacto — Império Global', desc:'Fale connosco sobre o seu projeto de infraestruturas de telecomunicações em Portugal ou na Bélgica.',
        h1:'Contacto', eyebrow:'Fale connosco',
        intro:'Tem um projeto de infraestruturas de telecomunicações? Envie-nos a sua mensagem e a nossa equipa entrará em contacto.',
        formTitle:'Envie-nos uma mensagem',
        f:{ nome:'Nome', empresa:'Empresa', email:'Email', telefone:'Telefone', assunto:'Assunto', msg:'Mensagem', submit:'Enviar mensagem' },
        assuntos:['Pedido de proposta','Parceria','Recrutamento','Outro'],
        consent:'Li e aceito a <a href="{priv}">Política de Privacidade</a> e autorizo o tratamento dos meus dados para resposta ao meu pedido.',
        infoTitle:'Contactos',
        email:'geral@imperioglobal.eu',
        phone:'+351 000 000 000', /* TODO: telefone real */
        morada:'Morada a confirmar · Portugal', /* TODO: morada real */
        mapa:'Mapa disponível em breve',
      },
      privacidade: {
        title:'Política de Privacidade — Império Global', desc:'Política de privacidade e tratamento de dados pessoais da Império Global, em conformidade com o RGPD.',
        h1:'Política de Privacidade', eyebrow:'RGPD',
        blocks:[
          ['Responsável pelo tratamento','O responsável pelo tratamento dos dados pessoais é a Império Global Telecomunicações Unipessoal, Lda. <!-- TODO: NIPC e morada da sede -->. Para qualquer questão relacionada com dados pessoais, contacte <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
          ['Dados recolhidos e finalidades','Recolhemos os dados que nos fornece através dos formulários de contacto e de recrutamento (nome, email, telefone, empresa, mensagem e, no caso de candidaturas, o currículo). Os dados são tratados para responder aos seus pedidos, gerir candidaturas e cumprir obrigações legais.'],
          ['Prazos de conservação','Os dados de contacto são conservados pelo período necessário à resposta e ao cumprimento de obrigações legais. Os currículos recebidos em processos de recrutamento são conservados por um período máximo de <!-- TODO: definir prazo, ex. 12 meses --> após a receção, salvo consentimento para conservação mais prolongada.'],
          ['Direitos do titular','Pode exercer, a qualquer momento, os direitos de acesso, retificação, apagamento, limitação, portabilidade e oposição ao tratamento dos seus dados, bem como retirar o consentimento. Para tal, contacte-nos por email. Tem ainda o direito de apresentar reclamação junto da Comissão Nacional de Proteção de Dados (CNPD).'],
          ['Cookies','Utilizamos cookies essenciais ao funcionamento do site e, mediante o seu consentimento, cookies de análise. Pode gerir a sua escolha através do banner de cookies.'],
          ['Contacto','Para exercer os seus direitos ou esclarecer dúvidas sobre esta política, contacte <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      canaldenuncias: {
        title:'Canal de Denúncias Interno — Império Global',
        desc:'Canal de denúncias interno da Império Global, em cumprimento da Lei n.º 93/2021 (Diretiva UE 2019/1937), com confidencialidade e proteção do denunciante.',
        eyebrow:'Conformidade', h1:'Canal de Denúncias Interno',
        intro:'A Império Global disponibiliza este canal para receber, em condições de confidencialidade e proteção do denunciante, comunicações relativas a irregularidades ou infrações de que se tenha conhecimento no âmbito profissional. O presente canal cumpre o disposto na Lei n.º 93/2021, de 20 de dezembro, que transpõe a Diretiva (UE) 2019/1937 do Parlamento Europeu e do Conselho, relativa à proteção das pessoas que denunciam violações do direito da União.',
        matTitle:'O que pode denunciar',
        matters:['Contratação pública','Serviços, produtos e mercados financeiros e prevenção do branqueamento de capitais','Segurança e conformidade dos produtos','Segurança dos transportes','Proteção do ambiente','Segurança dos alimentos e saúde animal','Saúde pública','Defesa do consumidor','Proteção da privacidade e dos dados pessoais e segurança das redes e sistemas de informação','Corrupção, fraude e conflitos de interesse','Assédio e discriminação no âmbito profissional'],
        garTitle:'Garantias',
        garantias:['Confidencialidade da identidade do denunciante e de terceiros mencionados na denúncia','Possibilidade de apresentação de denúncia anónima','Proteção contra atos de retaliação, nos termos do artigo 21.º da Lei n.º 93/2021','Análise das denúncias por responsável designado internamente, com isenção e imparcialidade','Comunicação da receção no prazo de 7 dias e do seguimento no prazo máximo de 3 meses'],
        comoTitle:'Como denunciar',
        comoIntro:'Disponibilizamos dois canais em paralelo. Para preservar o anonimato, recomenda-se o formulário, deixando em branco o campo de email.',
        canal1T:'Formulário (recomendado para anonimato)',
        canal1D:'Preencha os campos abaixo. O campo de email é opcional — se pretender manter o anonimato, não o preencha.',
        form:{
          assunto:'Assunto', categoria:'Categoria',
          categorias:['Contratação pública','Serviços e mercados financeiros','Segurança de produtos','Segurança dos transportes','Proteção do ambiente','Saúde pública','Defesa do consumidor','Proteção de dados','Corrupção e fraude','Assédio ou discriminação','Outra'],
          descricao:'Descrição da situação',
          evidencias:'Evidências (opcional · PDF, DOC ou imagem, máx. 10 MB)',
          email:'Email de contacto (opcional)',
          emailHint:'Deixe em branco para manter o anonimato. Se indicar um email, poderemos comunicar-lhe o seguimento.',
          declaro:'Declaro que a informação prestada é verdadeira e apresentada de boa fé, nos termos da Lei n.º 93/2021.',
          submit:'Submeter denúncia',
        },
        canal2T:'Email direto',
        canal2D:'Em alternativa, pode remeter a sua comunicação para o endereço dedicado do canal de denúncias.',
        footnote:'Este canal destina-se exclusivamente a denúncias de infrações ao abrigo da Lei n.º 93/2021. Para outros assuntos, consulte a nossa página de <a href="{contacto}">Contacto</a>.',
      },
      codigoetica: {
        title:'Código de Ética e Conduta — Império Global',
        desc:'Código de Ética e Conduta da Império Global: valores, princípios de conduta e relação com clientes, parceiros e colaboradores.',
        eyebrow:'Governance', h1:'Código de Ética e Conduta',
        updated:'Versão 1.0 · Próxima revisão em 12 meses', download:'Descarregar em PDF',
        sections:[
          { h:'1. Preâmbulo', body:'<p>O presente Código de Ética e Conduta estabelece os princípios e as regras de conduta que orientam a atividade da Império Global Telecomunicações Unipessoal, Lda. Aplica-se a todos os colaboradores, bem como a parceiros, fornecedores e demais terceiros que atuem em nome ou por conta da empresa.</p>' },
          { h:'2. Valores', body:'<p>A nossa conduta assenta em três valores:</p><ul><li><strong>Compromisso</strong> — cumprimos o que prometemos, com responsabilidade e rigor.</li><li><strong>Confiança</strong> — construímos relações sólidas através da transparência e da qualidade.</li><li><strong>Inovação</strong> — evoluímos continuamente para soluções mais eficientes e preparadas para o futuro.</li></ul>' },
          { h:'3. Princípios de conduta', body:'<ul><li><strong>Integridade e honestidade</strong> — atuamos com verdade e coerência entre o que dizemos e o que fazemos.</li><li><strong>Rigor técnico e segurança</strong> — cumprimos as normas técnicas e de segurança no trabalho, protegendo pessoas e infraestruturas.</li><li><strong>Respeito no local de trabalho</strong> — assumimos tolerância zero perante o assédio e a discriminação.</li><li><strong>Confidencialidade e proteção de dados</strong> — tratamos os dados pessoais em conformidade com o RGPD.</li><li><strong>Prevenção de conflitos de interesse</strong> — declaramos e evitamos situações que oponham interesses pessoais aos da empresa ou dos clientes.</li><li><strong>Concorrência leal</strong> — competimos com base no mérito técnico, respeitando o direito da concorrência.</li><li><strong>Anticorrupção e antissuborno</strong> — não oferecemos nem aceitamos vantagens indevidas, sob qualquer forma.</li><li><strong>Sustentabilidade ambiental</strong> — minimizamos o impacto ambiental das nossas operações.</li></ul>' },
          { h:'4. Relação com clientes e parceiros', body:'<p>Pautamos a relação com operadores, empreiteiros e entidades públicas pela transparência, pelo cumprimento dos compromissos contratuais e pela confidencialidade da informação a que temos acesso. Recusamos qualquer prática que comprometa a isenção na adjudicação ou execução de trabalhos.</p>' },
          { h:'5. Relação com colaboradores', body:'<p>Promovemos condições de trabalho seguras, o desenvolvimento profissional através da formação e a valorização baseada no mérito. Rejeitamos qualquer forma de discriminação em razão de origem, género, idade, convicções ou qualquer outra característica pessoal.</p>' },
          { h:'6. Cumprimento e comunicação de irregularidades', body:'<p>O incumprimento deste Código pode ser comunicado, em confidencialidade, através do nosso <a href="{canal}">Canal de Denúncias</a>, nos termos da Lei n.º 93/2021. A empresa garante a proteção do denunciante contra retaliação.</p>' },
          { h:'7. Aprovação e revisão', body:'<p>Este Código foi aprovado pela Administração da Império Global. <!-- TODO: data de aprovação --> Será revisto periodicamente, no prazo máximo de 12 meses, ou sempre que se justifique por alterações legais ou organizacionais.</p>' },
        ],
      },
      cookies: {
        title:'Política de Cookies — Império Global',
        desc:'Política de cookies do website da Império Global: o que são, que cookies utilizamos e como gerir o seu consentimento.',
        eyebrow:'RGPD', h1:'Política de Cookies',
        blocks:[
          ['O que são cookies','Cookies são pequenos ficheiros de texto guardados no seu dispositivo quando visita um website. Servem para o site funcionar corretamente e, mediante consentimento, para analisar a sua utilização.'],
          ['Cookies que utilizamos','Utilizamos cookies essenciais, necessários ao funcionamento do site e à memorização das suas preferências (por exemplo, a sua escolha quanto a cookies). Utilizamos ainda, apenas após o seu consentimento, cookies de análise que nos ajudam a compreender como o site é utilizado.'],
          ['Gestão do consentimento','No primeiro acesso é apresentado um aviso onde pode aceitar ou recusar os cookies de análise. A sua escolha é guardada no seu navegador e pode ser alterada a qualquer momento, limpando os dados do site no navegador.'],
          ['Como desativar cookies','Pode configurar o seu navegador para bloquear ou eliminar cookies. A desativação de cookies essenciais pode afetar o funcionamento do site.'],
          ['Contacto','Para questões sobre esta política, contacte <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      termos: {
        title:'Termos e Condições — Império Global',
        desc:'Termos e condições de utilização do website da Império Global.',
        eyebrow:'Legal', h1:'Termos e Condições',
        blocks:[
          ['Objeto','Os presentes termos regulam a utilização do website da Império Global Telecomunicações Unipessoal, Lda. A navegação no site implica a aceitação integral destes termos.'],
          ['Propriedade intelectual','Os conteúdos do site — textos, imagens, logótipos, grafismos e código — são propriedade da Império Global ou de terceiros que autorizaram a sua utilização, estando protegidos por direitos de propriedade intelectual. Não é permitida a reprodução sem autorização.'],
          ['Utilização permitida','O utilizador compromete-se a usar o site de forma lícita e a não praticar atos que possam prejudicar o seu funcionamento ou segurança.'],
          ['Limitação de responsabilidade','A informação disponibilizada tem caráter informativo. A Império Global não se responsabiliza por eventuais danos decorrentes da utilização do site ou da sua indisponibilidade temporária.'],
          ['Ligações para sites terceiros','O site pode conter ligações para sites de terceiros, sobre cujos conteúdos a Império Global não tem controlo nem responsabilidade.'],
          ['Lei aplicável e foro','Estes termos regem-se pela lei portuguesa. Para a resolução de qualquer litígio é competente o foro da comarca da sede da empresa, com renúncia a qualquer outro. <!-- TODO: confirmar comarca/sede -->'],
          ['Contacto','Para esclarecimentos, contacte <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      e404: {
        title:'Página não encontrada — Império Global', desc:'A página que procura não existe.',
        code:'404', h1:'Página não encontrada', text:'A página que procura não existe ou foi movida.', btn:'Voltar ao início',
      },
    },
  },

  en: {
    htmlLang: 'en',
    nav: { index:'Home', sobre:'About', servicos:'Services', areas:'Areas of Operation', blog:'Blog', recrutamento:'Careers', contacto:'Contact' },
    skip: 'Skip to content',
    tagline: 'Construction, expansion and maintenance of telecommunications infrastructure in Portugal and Belgium.',
    footer: { nav:'Navigation', empresa:'Company', contacto:'Contact', privacidade:'Privacy Policy', rights:'All rights reserved.',
      gov:'Governance & Compliance', cookies:'Cookie Policy', termos:'Terms & Conditions',
      codigoetica:'Code of Ethics & Conduct', canaldenuncias:'Whistleblowing Channel' },
    cookies: { text:'We use cookies to improve your experience and analyse traffic. Analytics cookies are only loaded after your consent.', accept:'Accept', reject:'Decline', more:'Learn more' },
    cta: { title:'Shall we build the next connection?', text:'Talk to us about your telecommunications infrastructure project.', btn:'Contact us' },
    pages: {
      index: {
        title:'Império Global — Telecommunications infrastructure · Portugal and Belgium',
        desc:'Império Global builds, expands and maintains telecommunications infrastructure in Portugal and Belgium, serving operators, private companies and public entities.',
        heroTitle:'We build the networks that connect Portugal and Belgium.',
        heroSub:'End-to-end solutions for the construction, expansion and maintenance of telecommunications infrastructure. Serving operators, contractors and public entities.',
        ctaPrimary:'Contact us', ctaSecondary:'Our services',
        heroStats:[ { v:'8', l:'years of operation' }, { v:'50+', l:'specialised professionals' }, { v:'2', l:'countries · Portugal and Belgium' } ],
        trust:'Trusted partner of leading operators.',
        servEyebrow:'What we do', servTitle:'Infrastructure that supports access networks',
        serv:[
          { i:'build', t:'Network construction', d:'Ground-up delivery of access infrastructure, with execution rigour and technical compliance.' },
          { i:'expand', t:'Route expansion', d:'Extension and densification of existing networks to keep pace with growing demand.' },
          { i:'maint', t:'Maintenance and fault repair', d:'Preventive and corrective maintenance ensuring the reliability, availability and performance of networks.' },
          { i:'fiber', t:'Optical fibre and copper', d:'Installation and connection of optical fibre and copper cables, from the main span to the access point.' },
        ],
        servAll:'View all services',
        whyEyebrow:'Why Império Global', whyTitle:'Technical solidity at every stage',
        pillars:[
          { t:'Execution rigour', d:'Rigorous technical processes, from planning to delivery, focused on compliance.' },
          { t:'Reliability', d:'Infrastructure that ensures the reliability, availability and performance of networks.' },
          { t:'Responsiveness', d:'Teams and vehicles ready to intervene and reduce downtime.' },
          { t:'Scale', d:'Operations in two countries and the capacity to handle large-scale projects.' },
        ],
        stats:[ { n:50, pre:'+', l:'Employees' }, { n:2, pre:'', l:'Countries of operation' }, { n:20, pre:'', l:'Intervention vehicles' } ],
      },
      sobre: {
        title:'About — Império Global', desc:'Specialists in the construction, expansion and maintenance of telecommunications infrastructure, operating in Portugal and Belgium.',
        h1:'About Império Global', eyebrow:'Who we are',
        intro:'Império Global specialises in the construction, expansion and maintenance of telecommunications infrastructure. We develop, implement and maintain optical fibre networks and access infrastructure that support the services of leading operators.',
        missaoT:'Mission',
        missao:'We plan, build and maintain telecommunications infrastructure with technical rigour and commitment, ensuring reliable networks ready to meet the demands of today and tomorrow. We turn challenges into solutions and every project into a relationship of trust.',
        visaoT:'Vision',
        visao:'To be an international reference in the delivery of technical infrastructure, recognised for innovation, competence and operational excellence, growing sustainably into new areas and markets.',
        valoresT:'Values',
        valores:[
          { t:'Commitment', d:'We deliver on what we promise, with responsibility and rigour.' },
          { t:'Trust', d:'We build solid relationships through transparency and quality.' },
          { t:'Innovation', d:'We continuously evolve towards more efficient, future-ready solutions.' },
        ],
        dadosTitle:'Império Global in numbers',
        dados:[
          { v:'8', l:'years of operation', d:'Building and maintaining access infrastructure since 2017.' },
          { v:'50+', l:'specialised professionals', d:'Field and management technical teams.' },
          { v:'2', l:'countries', d:'Operating in Portugal and Belgium with the same technical demands.' },
        ],
        presencaTitle:'International presence',
        presenca:'Founded in 2017, Império Global evolved from the installation and maintenance of ADSL networks to optical fibre (FTTH) solutions and next-generation infrastructure. Portugal is today the main market and concentrates most of the operation; our presence in Belgium reflects a sustained growth path, built on the trust of operators, private companies and public entities. Operating across two countries lets us share expertise, scale teams and take on large-scale projects with the same technical demands.',
      },
      servicos: {
        title:'Services — Império Global', desc:'Construction, expansion and maintenance of telecommunications infrastructure: fixed networks, optical fibre and copper, preventive and corrective maintenance.',
        h1:'Services', eyebrow:'What we offer',
        intro:'We cover the entire lifecycle of access infrastructure — from construction to maintenance — for operators, private companies and public entities.',
        items:[
          { i:'survey', t:'Survey and technical assessment', d:'Field survey and project preparation for the delivery of the infrastructure.' },
          { i:'aerial', t:'Aerial network construction', d:'Installation of access infrastructure on aerial supports, from route to connection.' },
          { i:'underground', t:'Underground network construction', d:'Delivery of ducts and underground routes, coordinated with the relevant authorities.' },
          { i:'expand', t:'Route expansion and extension', d:'Extension and densification of existing networks to keep pace with demand.' },
          { i:'maint', t:'Preventive maintenance', d:'Maintenance plans ensuring the reliability, availability and performance of networks.' },
          { i:'repair', t:'Fault diagnosis and repair', d:'Detection and repair of faults with fast response and reduced downtime.' },
          { i:'fiber', t:'Optical fibre installation and connection', d:'Laying, splicing and connecting optical fibre, from the main span to the access point.' },
          { i:'copper', t:'Copper cable installation and connection', d:'Installation, connection and certification of copper infrastructure.' },
          { i:'quality', t:'Quality control and network auditing', d:'Verification, certification and technical auditing of the infrastructure delivered.' },
        ],
      },
      areas: {
        title:'Areas of Operation — Império Global', desc:'Operating in Portugal and Belgium, serving operators, private companies and public entities.',
        h1:'Areas of Operation', eyebrow:'Where we operate',
        intro:'We operate in two European countries, with in-house teams and local intervention capacity.',
        paises:[
          { nome:'Portugal', d:'Nationwide activity in the construction, expansion and maintenance of access infrastructure, serving operators, private companies and public entities.' },
          { nome:'Belgium', d:'Operations in the Belgian market in telecommunications infrastructure, with teams dedicated to building and maintaining optical fibre and copper networks.' },
        ],
      },
      recrutamento: {
        title:'Careers — Império Global', desc:'Join a growing team in telecommunications infrastructure in Portugal and Belgium.',
        h1:'Careers', eyebrow:'Careers',
        intro:'Join a growing team that builds and maintains the infrastructure connecting people and businesses. We value technical rigour, safety and teamwork.',
        formTitle:'Open application',
        f:{ nome:'Name', email:'Email', telefone:'Phone', area:'Area of interest', msg:'Message', cv:'Résumé (PDF or DOC, max. 5 MB)', submit:'Send application' },
        areas:['Network construction','Maintenance and repair','Optical fibre and copper','Engineering and design','Administrative','Other'],
        consent:'I have read and accept the <a href="{priv}">Privacy Policy</a> and consent to the processing of my data for recruitment purposes.',
      },
      contacto: {
        title:'Contact — Império Global', desc:'Talk to us about your telecommunications infrastructure project in Portugal or Belgium.',
        h1:'Contact', eyebrow:'Get in touch',
        intro:'Do you have a telecommunications infrastructure project? Send us a message and our team will get back to you.',
        formTitle:'Send us a message',
        f:{ nome:'Name', empresa:'Company', email:'Email', telefone:'Phone', assunto:'Subject', msg:'Message', submit:'Send message' },
        assuntos:['Request for proposal','Partnership','Careers','Other'],
        consent:'I have read and accept the <a href="{priv}">Privacy Policy</a> and consent to the processing of my data to respond to my request.',
        infoTitle:'Contacts', email:'geral@imperioglobal.eu', phone:'+351 000 000 000',
        morada:'Address to be confirmed · Portugal', mapa:'Map available soon',
      },
      privacidade: {
        title:'Privacy Policy — Império Global', desc:'Privacy and personal data policy of Império Global, in accordance with the GDPR.',
        h1:'Privacy Policy', eyebrow:'GDPR',
        blocks:[
          ['Data controller','The controller of personal data is Império Global Telecomunicações Unipessoal, Lda. <!-- TODO: tax number and registered address -->. For any question regarding personal data, contact <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
          ['Data collected and purposes','We collect the data you provide through the contact and recruitment forms (name, email, phone, company, message and, for applications, your résumé). Data is processed to respond to your requests, manage applications and comply with legal obligations.'],
          ['Retention periods','Contact data is kept for as long as necessary to respond and to comply with legal obligations. Résumés received in recruitment processes are kept for a maximum period of <!-- TODO: define period, e.g. 12 months --> after receipt, unless consent is given for longer retention.'],
          ['Your rights','You may exercise, at any time, the rights of access, rectification, erasure, restriction, portability and objection to the processing of your data, as well as withdraw consent. To do so, contact us by email. You also have the right to lodge a complaint with the supervisory authority.'],
          ['Cookies','We use cookies essential to the operation of the site and, with your consent, analytics cookies. You can manage your choice through the cookie banner.'],
          ['Contact','To exercise your rights or clarify any question about this policy, contact <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      canaldenuncias: {
        title:'Internal Whistleblowing Channel — Império Global',
        desc:'Império Global internal whistleblowing channel, in compliance with Portuguese Law 93/2021 (EU Directive 2019/1937), with confidentiality and whistleblower protection.',
        eyebrow:'Compliance', h1:'Internal Whistleblowing Channel',
        intro:'Império Global provides this channel to receive, under conditions of confidentiality and protection of the whistleblower, reports of irregularities or infringements witnessed in a professional context. This channel complies with Portuguese Law 93/2021 of 20 December, which transposes Directive (EU) 2019/1937 of the European Parliament and of the Council on the protection of persons who report breaches of Union law.',
        matTitle:'What you can report',
        matters:['Public procurement','Financial services, products and markets and prevention of money laundering','Product safety and compliance','Transport safety','Protection of the environment','Food safety and animal health','Public health','Consumer protection','Protection of privacy and personal data, and security of networks and information systems','Corruption, fraud and conflicts of interest','Harassment and discrimination in a professional context'],
        garTitle:'Guarantees',
        garantias:['Confidentiality of the whistleblower and of third parties mentioned in the report','Possibility of submitting an anonymous report','Protection against retaliation, under Article 21 of Law 93/2021','Reports handled by an internally designated officer, impartially','Acknowledgement of receipt within 7 days and follow-up within a maximum of 3 months'],
        comoTitle:'How to report',
        comoIntro:'Two channels are available in parallel. To preserve anonymity, we recommend the form, leaving the email field blank.',
        canal1T:'Form (recommended for anonymity)',
        canal1D:'Complete the fields below. The email field is optional — to remain anonymous, leave it blank.',
        form:{
          assunto:'Subject', categoria:'Category',
          categorias:['Public procurement','Financial services and markets','Product safety','Transport safety','Protection of the environment','Public health','Consumer protection','Data protection','Corruption and fraud','Harassment or discrimination','Other'],
          descricao:'Description of the situation',
          evidencias:'Evidence (optional · PDF, DOC or image, max. 10 MB)',
          email:'Contact email (optional)',
          emailHint:'Leave blank to remain anonymous. If you provide an email, we can inform you of the follow-up.',
          declaro:'I declare that the information provided is true and submitted in good faith, under Law 93/2021.',
          submit:'Submit report',
        },
        canal2T:'Direct email',
        canal2D:'Alternatively, you may send your report to the channel’s dedicated email address.',
        footnote:'This channel is intended exclusively for reports of breaches under Law 93/2021. For other matters, please see our <a href="{contacto}">Contact</a> page.',
      },
      codigoetica: {
        title:'Code of Ethics & Conduct — Império Global',
        desc:'Império Global Code of Ethics and Conduct: values, conduct principles and relationships with clients, partners and employees.',
        eyebrow:'Governance', h1:'Code of Ethics & Conduct',
        updated:'Version 1.0 · Next review in 12 months', download:'Download as PDF',
        sections:[
          { h:'1. Preamble', body:'<p>This Code of Ethics and Conduct sets out the principles and rules of conduct that guide the activity of Império Global Telecomunicações Unipessoal, Lda. It applies to all employees, as well as to partners, suppliers and other third parties acting in the name of or on behalf of the company.</p>' },
          { h:'2. Values', body:'<p>Our conduct rests on three values:</p><ul><li><strong>Commitment</strong> — we deliver on what we promise, with responsibility and rigour.</li><li><strong>Trust</strong> — we build solid relationships through transparency and quality.</li><li><strong>Innovation</strong> — we continuously evolve towards more efficient, future-ready solutions.</li></ul>' },
          { h:'3. Principles of conduct', body:'<ul><li><strong>Integrity and honesty</strong> — we act truthfully and consistently between what we say and do.</li><li><strong>Technical rigour and safety</strong> — we comply with technical and workplace safety standards, protecting people and infrastructure.</li><li><strong>Respect in the workplace</strong> — we adopt zero tolerance of harassment and discrimination.</li><li><strong>Confidentiality and data protection</strong> — we process personal data in accordance with the GDPR.</li><li><strong>Prevention of conflicts of interest</strong> — we declare and avoid situations that pit personal interests against those of the company or clients.</li><li><strong>Fair competition</strong> — we compete on technical merit, respecting competition law.</li><li><strong>Anti-corruption and anti-bribery</strong> — we neither offer nor accept undue advantages of any kind.</li><li><strong>Environmental sustainability</strong> — we minimise the environmental impact of our operations.</li></ul>' },
          { h:'4. Relationship with clients and partners', body:'<p>We conduct our relationships with operators, contractors and public entities with transparency, fulfilling contractual commitments and protecting the confidentiality of the information we access. We reject any practice that compromises impartiality in the award or execution of work.</p>' },
          { h:'5. Relationship with employees', body:'<p>We promote safe working conditions, professional development through training and merit-based recognition. We reject any form of discrimination based on origin, gender, age, beliefs or any other personal characteristic.</p>' },
          { h:'6. Compliance and reporting of irregularities', body:'<p>Breaches of this Code may be reported, in confidence, through our <a href="{canal}">Whistleblowing Channel</a>, under Law 93/2021. The company guarantees the protection of whistleblowers against retaliation.</p>' },
          { h:'7. Approval and review', body:'<p>This Code was approved by the Management of Império Global. <!-- TODO: approval date --> It will be reviewed periodically, within a maximum of 12 months, or whenever justified by legal or organisational changes.</p>' },
        ],
      },
      cookies: {
        title:'Cookie Policy — Império Global',
        desc:'Cookie policy of the Império Global website: what cookies are, which ones we use and how to manage your consent.',
        eyebrow:'GDPR', h1:'Cookie Policy',
        blocks:[
          ['What cookies are','Cookies are small text files stored on your device when you visit a website. They allow the site to function correctly and, with your consent, to analyse how it is used.'],
          ['Cookies we use','We use essential cookies, necessary for the site to work and to remember your preferences (for example, your cookie choice). We also use, only after your consent, analytics cookies that help us understand how the site is used.'],
          ['Managing consent','On your first visit a notice is shown where you can accept or decline analytics cookies. Your choice is stored in your browser and can be changed at any time by clearing the site data in your browser.'],
          ['How to disable cookies','You can configure your browser to block or delete cookies. Disabling essential cookies may affect how the site works.'],
          ['Contact','For questions about this policy, contact <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      termos: {
        title:'Terms & Conditions — Império Global',
        desc:'Terms and conditions of use of the Império Global website.',
        eyebrow:'Legal', h1:'Terms & Conditions',
        blocks:[
          ['Purpose','These terms govern the use of the website of Império Global Telecomunicações Unipessoal, Lda. Browsing the site implies full acceptance of these terms.'],
          ['Intellectual property','The site’s content — texts, images, logos, graphics and code — is the property of Império Global or of third parties who authorised its use, protected by intellectual property rights. Reproduction without authorisation is not permitted.'],
          ['Permitted use','The user undertakes to use the site lawfully and not to carry out acts that may harm its operation or security.'],
          ['Limitation of liability','The information provided is for informational purposes. Império Global is not liable for any damages arising from the use of the site or its temporary unavailability.'],
          ['Links to third-party sites','The site may contain links to third-party sites, over whose content Império Global has no control or responsibility.'],
          ['Applicable law and jurisdiction','These terms are governed by Portuguese law. Any dispute shall be subject to the courts of the company’s registered seat, to the exclusion of any other. <!-- TODO: confirm jurisdiction/seat -->'],
          ['Contact','For clarifications, contact <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      e404: { title:'Page not found — Império Global', desc:'The page you are looking for does not exist.', code:'404', h1:'Page not found', text:'The page you are looking for does not exist or has been moved.', btn:'Back to home' },
    },
  },

  fr: {
    htmlLang: 'fr',
    nav: { index:'Accueil', sobre:'À propos', servicos:'Services', areas:"Zones d'intervention", blog:'Blog', recrutamento:'Recrutement', contacto:'Contact' },
    skip: 'Aller au contenu',
    tagline: "Construction, expansion et maintenance d'infrastructures de télécommunications au Portugal et en Belgique.",
    footer: { nav:'Navigation', empresa:'Entreprise', contacto:'Contact', privacidade:'Politique de confidentialité', rights:'Tous droits réservés.',
      gov:'Gouvernance & Conformité', cookies:'Politique de cookies', termos:'Conditions générales',
      codigoetica:'Code d’éthique et de conduite', canaldenuncias:'Canal de signalement' },
    cookies: { text:"Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic. Les cookies d'analyse ne sont chargés qu'après votre consentement.", accept:'Accepter', reject:'Refuser', more:'En savoir plus' },
    cta: { title:'Construisons la prochaine connexion ?', text:"Parlez-nous de votre projet d'infrastructures de télécommunications.", btn:'Contactez-nous' },
    pages: {
      index: {
        title:'Império Global — Infrastructures de télécommunications · Portugal et Belgique',
        desc:"Império Global construit, étend et entretient des infrastructures de télécommunications au Portugal et en Belgique, au service des opérateurs, des entreprises privées et des entités publiques.",
        heroTitle:'Nous construisons les réseaux qui relient le Portugal et la Belgique.',
        heroSub:"Des solutions end-to-end pour la construction, l'expansion et la maintenance d'infrastructures de télécommunications. Au service des opérateurs, des entreprises de travaux et des entités publiques.",
        ctaPrimary:'Contactez-nous', ctaSecondary:'Nos services',
        heroStats:[ { v:'8', l:'ans d’activité' }, { v:'50+', l:'professionnels spécialisés' }, { v:'2', l:'pays · Portugal et Belgique' } ],
        trust:"Partenaire d'opérateurs de référence.",
        servEyebrow:'Ce que nous faisons', servTitle:"Des infrastructures qui soutiennent les réseaux d'accès",
        serv:[
          { i:'build', t:'Construction de réseaux', d:"Déploiement d'infrastructures d'accès de A à Z, avec rigueur d'exécution et conformité technique." },
          { i:'expand', t:'Expansion des tracés', d:'Extension et densification des réseaux existants pour suivre la croissance de la demande.' },
          { i:'maint', t:'Maintenance et réparation de pannes', d:'Maintenance préventive et corrective assurant la fiabilité, la disponibilité et la performance des réseaux.' },
          { i:'fiber', t:'Fibre optique et cuivre', d:"Installation et raccordement de câbles en fibre optique et en cuivre, du tronçon principal au point d'accès." },
        ],
        servAll:'Voir tous les services',
        whyEyebrow:'Pourquoi Império Global', whyTitle:'Une solidité technique à chaque étape',
        pillars:[
          { t:"Rigueur d'exécution", d:"Des processus techniques rigoureux, de la planification à la livraison, axés sur la conformité." },
          { t:'Fiabilité', d:'Des infrastructures qui assurent la fiabilité, la disponibilité et la performance des réseaux.' },
          { t:'Réactivité', d:"Des équipes et des véhicules prêts à intervenir et à réduire les temps d'indisponibilité." },
          { t:"Vision d'échelle", d:"Une activité dans deux pays et la capacité de mener des projets d'envergure." },
        ],
        stats:[ { n:50, pre:'+', l:'Collaborateurs' }, { n:2, pre:'', l:'Pays' }, { n:20, pre:'', l:"Véhicules d'intervention" } ],
      },
      sobre: {
        title:'À propos — Império Global', desc:"Spécialistes de la construction, de l'expansion et de la maintenance d'infrastructures de télécommunications, au Portugal et en Belgique.",
        h1:'À propos d’Império Global', eyebrow:'Qui sommes-nous',
        intro:"Império Global est spécialisée dans la construction, l'expansion et la maintenance d'infrastructures de télécommunications. Nous développons, mettons en œuvre et assurons la maintenance de réseaux en fibre optique et d'infrastructures d'accès qui soutiennent les services des principaux opérateurs.",
        missaoT:'Mission',
        missao:"Nous planifions, construisons et entretenons des infrastructures de télécommunications avec rigueur technique et engagement, en garantissant des réseaux fiables, prêts à répondre aux exigences d'aujourd'hui et de demain. Nous transformons les défis en solutions et chaque projet en une relation de confiance.",
        visaoT:'Vision',
        visao:"Être une référence internationale dans la réalisation d'infrastructures techniques, reconnue pour son innovation, sa compétence et son excellence opérationnelle, en croissant durablement vers de nouveaux domaines et marchés.",
        valoresT:'Valeurs',
        valores:[
          { t:'Engagement', d:'Nous tenons nos promesses, avec responsabilité et rigueur.' },
          { t:'Confiance', d:'Nous bâtissons des relations solides par la transparence et la qualité.' },
          { t:'Innovation', d:"Nous évoluons en continu vers des solutions plus efficaces et prêtes pour l'avenir." },
        ],
        dadosTitle:'Império Global en chiffres',
        dados:[
          { v:'8', l:'ans d’activité', d:'Construction et maintenance d’infrastructures d’accès depuis 2017.' },
          { v:'50+', l:'professionnels spécialisés', d:'Équipes techniques de terrain et de gestion.' },
          { v:'2', l:'pays', d:'Activité au Portugal et en Belgique, avec la même exigence technique.' },
        ],
        presencaTitle:'Présence internationale',
        presenca:"Fondée en 2017, Império Global est passée de l'installation et de la maintenance de réseaux ADSL aux solutions de fibre optique (FTTH) et aux infrastructures de nouvelle génération. Le Portugal est aujourd'hui le marché principal et concentre l'essentiel de l'activité ; notre présence en Belgique reflète une trajectoire de croissance durable, bâtie sur la confiance des opérateurs, des entreprises privées et des entités publiques. Cette activité dans deux pays nous permet de partager les compétences, de faire évoluer les équipes et de mener des projets d'envergure avec la même exigence technique.",
      },
      servicos: {
        title:'Services — Império Global', desc:"Construction, expansion et maintenance d'infrastructures de télécommunications : réseaux fixes, fibre optique et cuivre, maintenance préventive et corrective.",
        h1:'Services', eyebrow:'Notre offre',
        intro:"Nous couvrons tout le cycle de vie des infrastructures d'accès — de la construction à la maintenance — pour les opérateurs, les entreprises privées et les entités publiques.",
        items:[
          { i:'survey', t:'Survey et relevé technique', d:"Relevé de terrain et préparation du projet pour la réalisation des infrastructures." },
          { i:'aerial', t:'Construction de réseaux aériens', d:"Installation d'infrastructures d'accès sur appuis aériens, du tracé au raccordement." },
          { i:'underground', t:'Construction de réseaux souterrains', d:"Réalisation de conduites et de tracés souterrains, coordonnée avec les autorités compétentes." },
          { i:'expand', t:'Expansion et extension des tracés', d:'Extension et densification des réseaux existants pour suivre la demande.' },
          { i:'maint', t:'Maintenance préventive', d:'Des plans de maintenance qui assurent la fiabilité, la disponibilité et la performance des réseaux.' },
          { i:'repair', t:'Diagnostic et résolution de pannes', d:"Détection et réparation des pannes avec réactivité et réduction des temps d'indisponibilité." },
          { i:'fiber', t:'Installation et raccordement de fibre optique', d:"Tirage, soudure et raccordement de la fibre optique, du tronçon principal au point d'accès." },
          { i:'copper', t:'Installation et raccordement de câbles en cuivre', d:"Installation, raccordement et certification d'infrastructures en cuivre." },
          { i:'quality', t:'Contrôle qualité et audit des réseaux', d:"Vérification, certification et audit technique des infrastructures réalisées." },
        ],
      },
      areas: {
        title:"Zones d'intervention — Império Global", desc:'Activité au Portugal et en Belgique, au service des opérateurs, des entreprises privées et des entités publiques.',
        h1:"Zones d'intervention", eyebrow:'Où nous intervenons',
        intro:'Nous intervenons dans deux pays européens, avec des équipes internes et une capacité d’intervention locale.',
        paises:[
          { nome:'Portugal', d:"Activité sur tout le territoire national dans la construction, l'expansion et la maintenance d'infrastructures d'accès, au service des opérateurs, des entreprises privées et des entités publiques." },
          { nome:'Belgique', d:'Activité sur le marché belge en infrastructures de télécommunications, avec des équipes dédiées à la construction et à la maintenance de réseaux en fibre optique et en cuivre.' },
        ],
      },
      recrutamento: {
        title:'Recrutement — Império Global', desc:"Rejoignez une équipe en croissance dans les infrastructures de télécommunications au Portugal et en Belgique.",
        h1:'Recrutement', eyebrow:'Carrières',
        intro:'Rejoignez une équipe en croissance qui construit et entretient les infrastructures reliant les personnes et les entreprises. Nous valorisons la rigueur technique, la sécurité et l’esprit d’équipe.',
        formTitle:'Candidature spontanée',
        f:{ nome:'Nom', email:'Email', telefone:'Téléphone', area:'Domaine d’intérêt', msg:'Message', cv:'CV (PDF ou DOC, max. 5 Mo)', submit:'Envoyer la candidature' },
        areas:['Construction de réseaux','Maintenance et réparation','Fibre optique et cuivre','Ingénierie et conception','Administratif','Autre'],
        consent:'J’ai lu et j’accepte la <a href="{priv}">Politique de confidentialité</a> et je consens au traitement de mes données à des fins de recrutement.',
      },
      contacto: {
        title:'Contact — Império Global', desc:"Parlez-nous de votre projet d'infrastructures de télécommunications au Portugal ou en Belgique.",
        h1:'Contact', eyebrow:'Contactez-nous',
        intro:"Vous avez un projet d'infrastructures de télécommunications ? Envoyez-nous un message et notre équipe vous recontactera.",
        formTitle:'Envoyez-nous un message',
        f:{ nome:'Nom', empresa:'Entreprise', email:'Email', telefone:'Téléphone', assunto:'Objet', msg:'Message', submit:'Envoyer le message' },
        assuntos:['Demande de devis','Partenariat','Recrutement','Autre'],
        consent:'J’ai lu et j’accepte la <a href="{priv}">Politique de confidentialité</a> et je consens au traitement de mes données pour répondre à ma demande.',
        infoTitle:'Contacts', email:'geral@imperioglobal.eu', phone:'+351 000 000 000',
        morada:'Adresse à confirmer · Portugal', mapa:'Carte disponible prochainement',
      },
      privacidade: {
        title:'Politique de confidentialité — Império Global', desc:'Politique de confidentialité et de traitement des données personnelles d’Império Global, conforme au RGPD.',
        h1:'Politique de confidentialité', eyebrow:'RGPD',
        blocks:[
          ['Responsable du traitement','Le responsable du traitement des données personnelles est Império Global Telecomunicações Unipessoal, Lda. <!-- TODO: numéro fiscal et adresse du siège -->. Pour toute question relative aux données personnelles, contactez <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
          ['Données collectées et finalités','Nous collectons les données que vous fournissez via les formulaires de contact et de recrutement (nom, email, téléphone, entreprise, message et, pour les candidatures, votre CV). Les données sont traitées pour répondre à vos demandes, gérer les candidatures et respecter les obligations légales.'],
          ['Durées de conservation','Les données de contact sont conservées le temps nécessaire à la réponse et au respect des obligations légales. Les CV reçus dans le cadre du recrutement sont conservés pour une durée maximale de <!-- TODO: définir la durée, ex. 12 mois --> après réception, sauf consentement à une conservation plus longue.'],
          ['Vos droits','Vous pouvez exercer à tout moment les droits d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition au traitement de vos données, et retirer votre consentement. Pour cela, contactez-nous par email. Vous avez également le droit d’introduire une réclamation auprès de l’autorité de contrôle compétente.'],
          ['Cookies','Nous utilisons des cookies essentiels au fonctionnement du site et, avec votre consentement, des cookies d’analyse. Vous pouvez gérer votre choix via le bandeau de cookies.'],
          ['Contact','Pour exercer vos droits ou toute question sur cette politique, contactez <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      canaldenuncias: {
        title:'Canal de signalement interne — Império Global',
        desc:'Canal de signalement interne d’Império Global, conforme à la loi portugaise 93/2021 (directive UE 2019/1937), avec confidentialité et protection du lanceur d’alerte.',
        eyebrow:'Conformité', h1:'Canal de signalement interne',
        intro:'Império Global met à disposition ce canal pour recevoir, dans des conditions de confidentialité et de protection du lanceur d’alerte, des communications relatives à des irrégularités ou infractions dont on a connaissance dans un contexte professionnel. Ce canal est conforme à la loi portugaise 93/2021 du 20 décembre, qui transpose la directive (UE) 2019/1937 du Parlement européen et du Conseil sur la protection des personnes qui signalent des violations du droit de l’Union.',
        matTitle:'Ce que vous pouvez signaler',
        matters:['Marchés publics','Services, produits et marchés financiers et prévention du blanchiment de capitaux','Sécurité et conformité des produits','Sécurité des transports','Protection de l’environnement','Sécurité des aliments et santé animale','Santé publique','Protection des consommateurs','Protection de la vie privée et des données personnelles et sécurité des réseaux et systèmes d’information','Corruption, fraude et conflits d’intérêts','Harcèlement et discrimination en contexte professionnel'],
        garTitle:'Garanties',
        garantias:['Confidentialité du lanceur d’alerte et des tiers mentionnés dans le signalement','Possibilité de signalement anonyme','Protection contre les représailles, au titre de l’article 21 de la loi 93/2021','Signalements traités par un responsable désigné en interne, avec impartialité','Accusé de réception sous 7 jours et suivi dans un délai maximal de 3 mois'],
        comoTitle:'Comment signaler',
        comoIntro:'Deux canaux sont disponibles en parallèle. Pour préserver l’anonymat, nous recommandons le formulaire, en laissant le champ e-mail vide.',
        canal1T:'Formulaire (recommandé pour l’anonymat)',
        canal1D:'Remplissez les champs ci-dessous. Le champ e-mail est facultatif — pour rester anonyme, laissez-le vide.',
        form:{
          assunto:'Objet', categoria:'Catégorie',
          categorias:['Marchés publics','Services et marchés financiers','Sécurité des produits','Sécurité des transports','Protection de l’environnement','Santé publique','Protection des consommateurs','Protection des données','Corruption et fraude','Harcèlement ou discrimination','Autre'],
          descricao:'Description de la situation',
          evidencias:'Preuves (facultatif · PDF, DOC ou image, max. 10 Mo)',
          email:'E-mail de contact (facultatif)',
          emailHint:'Laissez vide pour rester anonyme. Si vous indiquez un e-mail, nous pourrons vous communiquer le suivi.',
          declaro:'Je déclare que les informations fournies sont véridiques et présentées de bonne foi, au titre de la loi 93/2021.',
          submit:'Soumettre le signalement',
        },
        canal2T:'E-mail direct',
        canal2D:'Vous pouvez également adresser votre communication à l’adresse e-mail dédiée du canal de signalement.',
        footnote:'Ce canal est destiné exclusivement aux signalements d’infractions au titre de la loi 93/2021. Pour toute autre question, consultez notre page <a href="{contacto}">Contact</a>.',
      },
      codigoetica: {
        title:'Code d’éthique et de conduite — Império Global',
        desc:'Code d’éthique et de conduite d’Império Global : valeurs, principes de conduite et relations avec les clients, partenaires et collaborateurs.',
        eyebrow:'Gouvernance', h1:'Code d’éthique et de conduite',
        updated:'Version 1.0 · Prochaine révision dans 12 mois', download:'Télécharger en PDF',
        sections:[
          { h:'1. Préambule', body:'<p>Le présent Code d’éthique et de conduite définit les principes et les règles de conduite qui orientent l’activité d’Império Global Telecomunicações Unipessoal, Lda. Il s’applique à tous les collaborateurs, ainsi qu’aux partenaires, fournisseurs et autres tiers agissant au nom ou pour le compte de l’entreprise.</p>' },
          { h:'2. Valeurs', body:'<p>Notre conduite repose sur trois valeurs :</p><ul><li><strong>Engagement</strong> — nous tenons nos promesses, avec responsabilité et rigueur.</li><li><strong>Confiance</strong> — nous bâtissons des relations solides par la transparence et la qualité.</li><li><strong>Innovation</strong> — nous évoluons en continu vers des solutions plus efficaces et prêtes pour l’avenir.</li></ul>' },
          { h:'3. Principes de conduite', body:'<ul><li><strong>Intégrité et honnêteté</strong> — nous agissons avec vérité et cohérence entre nos paroles et nos actes.</li><li><strong>Rigueur technique et sécurité</strong> — nous respectons les normes techniques et de sécurité au travail, en protégeant les personnes et les infrastructures.</li><li><strong>Respect sur le lieu de travail</strong> — nous adoptons une tolérance zéro envers le harcèlement et la discrimination.</li><li><strong>Confidentialité et protection des données</strong> — nous traitons les données personnelles conformément au RGPD.</li><li><strong>Prévention des conflits d’intérêts</strong> — nous déclarons et évitons les situations opposant des intérêts personnels à ceux de l’entreprise ou des clients.</li><li><strong>Concurrence loyale</strong> — nous rivalisons sur le mérite technique, dans le respect du droit de la concurrence.</li><li><strong>Anticorruption</strong> — nous n’offrons ni n’acceptons aucun avantage indu, sous quelque forme que ce soit.</li><li><strong>Durabilité environnementale</strong> — nous réduisons l’impact environnemental de nos opérations.</li></ul>' },
          { h:'4. Relation avec les clients et partenaires', body:'<p>Nous entretenons nos relations avec les opérateurs, les entreprises de travaux et les entités publiques dans la transparence, en respectant les engagements contractuels et la confidentialité des informations auxquelles nous accédons. Nous refusons toute pratique compromettant l’impartialité dans l’attribution ou l’exécution des travaux.</p>' },
          { h:'5. Relation avec les collaborateurs', body:'<p>Nous promouvons des conditions de travail sûres, le développement professionnel par la formation et la reconnaissance fondée sur le mérite. Nous rejetons toute forme de discrimination fondée sur l’origine, le genre, l’âge, les convictions ou toute autre caractéristique personnelle.</p>' },
          { h:'6. Conformité et signalement d’irrégularités', body:'<p>Le non-respect de ce Code peut être signalé, en toute confidentialité, via notre <a href="{canal}">Canal de signalement</a>, au titre de la loi 93/2021. L’entreprise garantit la protection du lanceur d’alerte contre les représailles.</p>' },
          { h:'7. Approbation et révision', body:'<p>Ce Code a été approuvé par la Direction d’Império Global. <!-- TODO: date d’approbation --> Il sera révisé périodiquement, dans un délai maximal de 12 mois, ou chaque fois que des changements légaux ou organisationnels le justifient.</p>' },
        ],
      },
      cookies: {
        title:'Politique de cookies — Império Global',
        desc:'Politique de cookies du site d’Império Global : ce que sont les cookies, ceux que nous utilisons et comment gérer votre consentement.',
        eyebrow:'RGPD', h1:'Politique de cookies',
        blocks:[
          ['Que sont les cookies','Les cookies sont de petits fichiers texte enregistrés sur votre appareil lorsque vous visitez un site. Ils permettent au site de fonctionner correctement et, avec votre consentement, d’analyser son utilisation.'],
          ['Cookies que nous utilisons','Nous utilisons des cookies essentiels, nécessaires au fonctionnement du site et à la mémorisation de vos préférences (par exemple votre choix concernant les cookies). Nous utilisons également, uniquement après votre consentement, des cookies d’analyse qui nous aident à comprendre l’utilisation du site.'],
          ['Gestion du consentement','Lors de votre première visite, un avis vous permet d’accepter ou de refuser les cookies d’analyse. Votre choix est enregistré dans votre navigateur et peut être modifié à tout moment en effaçant les données du site.'],
          ['Comment désactiver les cookies','Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies. La désactivation des cookies essentiels peut affecter le fonctionnement du site.'],
          ['Contact','Pour toute question sur cette politique, contactez <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      termos: {
        title:'Conditions générales — Império Global',
        desc:'Conditions générales d’utilisation du site d’Império Global.',
        eyebrow:'Légal', h1:'Conditions générales',
        blocks:[
          ['Objet','Les présentes conditions régissent l’utilisation du site d’Império Global Telecomunicações Unipessoal, Lda. La navigation sur le site implique l’acceptation intégrale de ces conditions.'],
          ['Propriété intellectuelle','Les contenus du site — textes, images, logos, graphismes et code — sont la propriété d’Império Global ou de tiers en ayant autorisé l’utilisation, et sont protégés par des droits de propriété intellectuelle. Leur reproduction sans autorisation est interdite.'],
          ['Utilisation autorisée','L’utilisateur s’engage à utiliser le site de manière licite et à ne pas commettre d’actes susceptibles de nuire à son fonctionnement ou à sa sécurité.'],
          ['Limitation de responsabilité','Les informations fournies ont un caractère informatif. Império Global n’est pas responsable des dommages éventuels résultant de l’utilisation du site ou de son indisponibilité temporaire.'],
          ['Liens vers des sites tiers','Le site peut contenir des liens vers des sites tiers, sur le contenu desquels Império Global n’a aucun contrôle ni responsabilité.'],
          ['Droit applicable et juridiction','Les présentes conditions sont régies par le droit portugais. Tout litige relève des tribunaux du siège de l’entreprise, à l’exclusion de tout autre. <!-- TODO: confirmer juridiction/siège -->'],
          ['Contact','Pour tout éclaircissement, contactez <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>.'],
        ],
      },
      e404: { title:'Page introuvable — Império Global', desc:'La page que vous recherchez n’existe pas.', code:'404', h1:'Page introuvable', text:'La page que vous recherchez n’existe pas ou a été déplacée.', btn:'Retour à l’accueil' },
    },
  },
};

/* =====================================================================
   TEMPLATES
   ===================================================================== */
const logoAlt = 'Império Global';

function head(lang, page, S, up = upFor(lang), seo = null) {
  const p = S.pages[page] || {};
  const B = up;
  const title = seo ? seo.title : p.title;
  const desc = seo ? seo.desc : p.desc;
  const canonical = seo ? seo.canonical : BASE + pathFor(lang, page);
  const alt = seo ? seo.alt : LANGS.map(l => `  <link rel="alternate" hreflang="${l}" href="${BASE + pathFor(l, page)}">`).join('\n');
  const ogImage = seo && seo.ogImage ? seo.ogImage : `${BASE}/assets/img/og-image.png`;
  const jsonld = seo && seo.schema ? `\n  <script type="application/ld+json">\n  ${seo.schema}\n  </script>` : (page === 'index' ? `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"Império Global","legalName":"Império Global Telecomunicações Unipessoal, Lda.","foundingDate":"2017","url":"${BASE}/","logo":"${BASE}/assets/favicon/icon-512.png","description":"${S.tagline}","areaServed":["PT","BE"],"email":"geral@imperioglobal.eu","sameAs":[]}
  </script>` : '');
  const noindex = page === 'e404' ? '\n  <meta name="robots" content="noindex">' : '';
  return `<!doctype html>
<html lang="${S.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${desc}">${noindex}
  <link rel="canonical" href="${canonical}">
${alt}
  <link rel="alternate" hreflang="x-default" href="${BASE}/">
  <meta property="og:type" content="${seo ? 'article' : 'website'}">
  <meta property="og:locale" content="${OG_LOCALE[lang]}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="icon" href="${B}assets/favicon/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${B}assets/favicon/icon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${B}assets/favicon/icon-180.png">
  <link rel="manifest" href="${B}site.webmanifest">
  <meta name="theme-color" content="#013F80">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="${B}css/style.css">${jsonld}
</head>
<body>
  <a href="#conteudo" class="skip-link" style="position:absolute;left:-999px">${S.skip}</a>`;
}

function header(lang, page, S, up = upFor(lang), opts = {}) {
  const B = up;
  const active = opts.active || page;
  const links = ['index','sobre','servicos','areas','blog','recrutamento','contacto']
    .map(k => `          <a href="${relLinkUp(up, lang, k)}"${k === active ? ' aria-current="page"' : ''}>${S.nav[k]}</a>`)
    .join('\n');
  const langsel = opts.langsel || LANGS.map(l =>
    `<a href="${relLinkUp(up, l, page)}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`
  ).join('<span>|</span>');
  return `
  <header class="site-header">
    <div class="container nav">
      <a class="nav__logo" href="${relLinkUp(up, lang, 'index')}" aria-label="${logoAlt}">
        <img src="${B}assets/logo/imperio-oficial.png" alt="${logoAlt}" width="640" height="197">
      </a>
      <button class="nav__toggle" aria-label="${S.nav.index}" aria-expanded="false" aria-controls="menu-principal"><span></span></button>
      <div class="nav__menu" id="menu-principal">
        <nav class="nav__links" aria-label="${S.footer.nav}">
${links}
        </nav>
        <div class="lang" aria-label="idioma">${langsel}</div>
      </div>
    </div>
  </header>
  <main id="conteudo">`;
}

function footer(lang, S, up = upFor(lang)) {
  const B = up;
  return `
  </main>
  <footer class="site-footer">
    <div class="container">
      <div class="footer__grid">
        <div>
          <img class="footer__logo" src="${B}assets/logo/imperio-oficial.png" alt="${logoAlt}" width="640" height="197">
          <p>${S.tagline}</p>
        </div>
        <div>
          <h4>${S.footer.nav}</h4>
          <a href="${relLinkUp(up,lang,'index')}">${S.nav.index}</a><br>
          <a href="${relLinkUp(up,lang,'sobre')}">${S.nav.sobre}</a><br>
          <a href="${relLinkUp(up,lang,'servicos')}">${S.nav.servicos}</a><br>
          <a href="${relLinkUp(up,lang,'areas')}">${S.nav.areas}</a><br>
          <a href="${relLinkUp(up,lang,'blog')}">${S.nav.blog}</a>
        </div>
        <div>
          <h4>${S.footer.empresa}</h4>
          <a href="${relLinkUp(up,lang,'recrutamento')}">${S.nav.recrutamento}</a><br>
          <a href="${relLinkUp(up,lang,'contacto')}">${S.nav.contacto}</a>
        </div>
        <div>
          <h4>${S.footer.gov}</h4>
          <a href="${relLinkUp(up,lang,'privacidade')}">${S.footer.privacidade}</a><br>
          <a href="${relLinkUp(up,lang,'cookies')}">${S.footer.cookies}</a><br>
          <a href="${relLinkUp(up,lang,'codigoetica')}">${S.footer.codigoetica}</a><br>
          <a href="${relLinkUp(up,lang,'canaldenuncias')}">${S.footer.canaldenuncias}</a><br>
          <a href="${relLinkUp(up,lang,'termos')}">${S.footer.termos}</a>
        </div>
        <div>
          <h4>${S.footer.contacto}</h4>
          <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>
        </div>
      </div>
      <!-- CERTIFICAÇÕES — aguarda confirmação do cliente.
           Slot para 3–6 selos (ISO 9001/14001/45001, Alvará IMPIC, ANACOM, EN 1090…),
           faixa horizontal, cada selo ~60px de altura em fundo branco.
           Ativar removendo os comentários e fornecendo os PNGs em /assets/certifications/.
      <div class="footer-certifications">
        <img src="${up}assets/certifications/iso-9001.png" alt="ISO 9001" height="60">
        <img src="${up}assets/certifications/iso-14001.png" alt="ISO 14001" height="60">
        <img src="${up}assets/certifications/iso-45001.png" alt="ISO 45001" height="60">
      </div>
      -->
      <!-- TODO: <div class="footer-socials"> LinkedIn, etc. — quando o cliente fornecer perfis. -->
      <div class="footer__bottom">
        <span>© <span data-year>2026</span> Império Global. ${S.footer.rights}</span>
        <span>Portugal · ${lang === 'fr' ? 'Belgique' : lang === 'en' ? 'Belgium' : 'Bélgica'}</span>
      </div>
    </div>
  </footer>
  <div class="cookies" role="dialog" aria-label="cookies">
    <p>${S.cookies.text}</p>
    <div class="cookies__actions">
      <button class="btn btn--primario" data-cookie="accept">${S.cookies.accept}</button>
      <button class="btn btn--secundario" data-cookie="reject">${S.cookies.reject}</button>
      <a href="${relLinkUp(up,lang,'privacidade')}" class="btn btn--secundario">${S.cookies.more}</a>
    </div>
  </div>
  <a class="whatsapp-float" href="#" aria-label="WhatsApp" rel="noopener">${ICON.wa}</a>
  <script src="${B}js/main.js" defer></script>
</body>
</html>`;
}

function ctaFinal(lang, S) {
  return `
    <section class="section cta-final">
      <div class="container">
        <h2 class="rv">${S.cta.title}</h2>
        <p class="lead rv" style="margin:0 auto 1.5rem">${S.cta.text}</p>
        <a href="${relLink(lang,lang,'contacto')}" class="btn btn--primario rv">${S.cta.btn}</a>
      </div>
    </section>`;
}

/* -------------------------------------------------- Corpo por página */
function bodyIndex(lang, S, up = upFor(lang)) {
  const p = S.pages.index;
  const HX = HOME_EXTRA[lang];
  const cards = p.serv.map(s => `
          <article class="card rv">
            <div class="card__icon" aria-hidden="true">${ICON[s.i]}</div>
            <h3>${s.t}</h3><p>${s.d}</p>
          </article>`).join('');
  const pillars = p.pillars.map(x => `
          <div class="pillar rv"><h3>${x.t}</h3><p>${x.d}</p></div>`).join('');
  // Números do hero — estáticos (valor final desde o 1.º frame; só fade-in via .rv, sem contagem)
  const heroStats = p.heroStats.map(x => `
          <div class="hero-stat"><span class="hero-stat__num">${x.v}</span><span class="hero-stat__label">${x.l}</span></div>`).join('');
  // Secção do blog na home — últimos artigos
  const blogHref = relLinkUp(up, lang, 'blog');
  const latest = ARTICLES.filter(a => a.langs[lang]).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  const blogSection = latest.length ? `
    <section class="section section--nevoa">
      <div class="container">
        <div class="section-head">
          <div><span class="eyebrow rv">${HX.blogEyebrow}</span><h2 class="rv mb-0">${HX.blogTitle}</h2></div>
          <a href="${blogHref}" class="btn btn--secundario rv">${HX.blogAll}</a>
        </div>
        <div class="post-grid" style="margin-top:2.5rem">${latest.map(a => articleCard(lang, a, blogHref, up)).join('')}</div>
      </div>
    </section>` : '';
  // Secção Newsletter (premium)
  const nlConsent = HX.nlConsent.replace('{priv}', relLinkUp(up, lang, 'privacidade'));
  const newsletter = `
    <section class="newsletter section--x">
      <div class="container newsletter__inner">
        <span class="eyebrow rv">${HX.nlEyebrow}</span>
        <h2 class="rv">${HX.nlTitle}</h2>
        <p class="newsletter__text rv">${HX.nlText}</p>
        <!-- Newsletter via Formspree — TODO: confirmar lista/endpoint dedicado. -->
        <form class="newsletter__form rv" data-formspree method="POST" novalidate>
          <input type="hidden" name="_subject" value="Newsletter — Império Global">
          <div class="newsletter__row">
            <input id="nl-email" name="email" type="email" required placeholder="${HX.nlPlaceholder}" aria-label="${HX.nlPlaceholder}">
            <button type="submit" class="btn btn--primario">${HX.nlBtn}</button>
          </div>
          <div class="consent newsletter__consent">
            <input id="nl-consent" name="consentimento" type="checkbox" required>
            <label for="nl-consent">${nlConsent}</label>
          </div>
          <p class="form__status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>`;
  return `
    <section class="hero hero--home">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner">
        <h1 class="rv">${p.heroTitle}</h1>
        <p class="hero__sub rv">${p.heroSub}</p>
        <!-- TODO: se autorizado pelo cliente (aguarda resposta da Soraia), inserir aqui a linha "Ao serviço de MEO, NOS, Vodafone e Proximus." em Archivo SemiBold 1.1rem, cor Prata Técnica (#AFC4D6). -->
        <div class="hero-stats rv" role="list" aria-label="Números da empresa">${heroStats}
        </div>
        <div class="hero__cta rv">
          <a href="${relLink(lang,lang,'contacto')}" class="btn btn--primario">${p.ctaPrimary}</a>
          <a href="${relLink(lang,lang,'servicos')}" class="btn btn--fantasma">${p.ctaSecondary}</a>
        </div>
      </div>
    </section>
    <div class="trust"><div class="container"><strong>${p.trust}</strong>
      <!-- TODO: logótipos de operadores só mediante autorização do cliente. --></div></div>
    <section class="section">
      <div class="container">
        <span class="eyebrow rv">${p.servEyebrow}</span>
        <h2 class="rv">${p.servTitle}</h2>
        <div class="grid grid--4 stagger" style="margin-top:2.5rem">${cards}
        </div>
        <p class="center" style="margin-top:2.5rem"><a href="${relLink(lang,lang,'servicos')}" class="btn btn--secundario">${p.servAll}</a></p>
      </div>
    </section>
    <section class="section section--escura section--x">
      <div class="container">
        <span class="eyebrow rv">${p.whyEyebrow}</span>
        <h2 class="rv">${p.whyTitle}</h2>
        <div class="grid grid--4 stagger" style="margin-top:2.5rem">${pillars}
        </div>
      </div>
    </section>${blogSection}${newsletter}
${ctaFinal(lang, S)}`;
}

function bodySobre(lang, S) {
  const p = S.pages.sobre;
  const valores = p.valores.map(x => `
          <article class="card"><h3>${x.t}</h3><p>${x.d}</p></article>`).join('');
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>
    <section class="section">
      <div class="container">
        <p class="lead rv">${p.intro}</p>
        <div class="grid grid--2" style="margin-top:2.5rem">
          <div class="pillar rv"><h3>${p.missaoT}</h3><p>${p.missao}</p></div>
          <div class="pillar rv"><h3>${p.visaoT}</h3><p>${p.visao}</p></div>
        </div>
      </div>
    </section>
    <section class="section section--nevoa">
      <div class="container">
        <span class="eyebrow rv">${p.valoresT}</span>
        <div class="mvv" style="margin-top:1.5rem">${valores}
        </div>
      </div>
    </section>
    <section class="section section--escura">
      <div class="container">
        <span class="eyebrow rv">${p.dadosTitle}</span>
        <div class="stats-cards" style="margin-top:2rem">${p.dados.map(x => `
          <div class="stat-card rv"><span class="hero-stat__num">${x.v}</span><span class="stat-card__label">${x.l}</span><p>${x.d}</p></div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container prose rv">
        <h2>${p.presencaTitle}</h2>
        <p>${p.presenca}</p>
      </div>
    </section>${ctaFinal(lang, S)}`;
}

function bodyServicos(lang, S) {
  const p = S.pages.servicos;
  // dados num array único → fácil acrescentar serviços
  const items = p.items.map(s => `
          <article class="card rv">
            <div class="card__icon" aria-hidden="true">${ICON[s.i]}</div>
            <h3>${s.t}</h3><p>${s.d}</p>
          </article>`).join('');
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1><p class="hero__sub" style="margin-bottom:0">${p.intro}</p></div>
    </section>
    <section class="section">
      <div class="container">
        <div class="grid grid--3">${items}
        </div>
      </div>
    </section>${ctaFinal(lang, S)}`;
}

function bodyAreas(lang, S) {
  const p = S.pages.areas;
  const paises = p.paises.map((c, i) => `
        <div class="pais rv"${i % 2 ? ' style="direction:rtl"' : ''}>
          <div style="direction:ltr">
            <span class="eyebrow">${c.nome}</span>
            <h2 style="margin-bottom:.75rem">${c.nome}</h2>
            <p class="lead" style="margin:0">${c.d}</p>
          </div>
          <div class="pais__mapa" style="direction:ltr" aria-hidden="true">${ICON.globe}</div>
        </div>`).join('<div style="height:3rem"></div>');
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1><p class="hero__sub" style="margin-bottom:0">${p.intro}</p></div>
    </section>
    <section class="section">
      <div class="container">${paises}
      </div>
    </section>${ctaFinal(lang, S)}`;
}

function field(id, label, input, req = true) {
  return `
          <div class="field">
            <label for="${id}">${label}${req ? ' <span class="req">*</span>' : ''}</label>
            ${input}
          </div>`;
}

function bodyRecrutamento(lang, S, up = upFor(lang)) {
  const p = S.pages.recrutamento; const f = p.f;
  const opts = p.areas.map(a => `<option>${a}</option>`).join('');
  const consent = p.consent.replace('{priv}', relLink(lang, lang, 'privacidade'));
  // Banner de topo (imagem com título e intro embutidos) — só PT, pois o texto é PT.
  const imgHero = lang === 'pt';
  const hero = imgHero ? `
    <h1 class="sr-only">${p.h1}</h1>
    <section class="section article-lead">
      <div class="container">
        <figure class="article-cover page-cover">
          <img src="${up}assets/img/recrutamento.jpg" alt="${p.eyebrow} — ${p.h1}. ${p.intro}" width="1717" height="916" loading="eager" fetchpriority="high">
        </figure>
      </div>
    </section>` : `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>`;
  return `${hero}
    <section class="section"${imgHero ? ' style="padding-top:clamp(24px,4vw,40px)"' : ''}>
      <div class="container">
        ${imgHero ? '' : `<p class="lead rv">${p.intro}</p>`}
        <h2 class="rv" style="margin:2.5rem 0 1.5rem">${p.formTitle}</h2>
        <!-- Formspree: ver FORMSPREE_ID em /js/main.js. Alternativa Netlify Forms: ver README. -->
        <form class="form rv" data-formspree method="POST" enctype="multipart/form-data" novalidate>
          <div class="form__row">
            ${field('r-nome', f.nome, '<input id="r-nome" name="nome" type="text" required autocomplete="name">')}
            ${field('r-email', f.email, '<input id="r-email" name="email" type="email" required autocomplete="email">')}
          </div>
          <div class="form__row">
            ${field('r-tel', f.telefone, '<input id="r-tel" name="telefone" type="tel" autocomplete="tel">', false)}
            ${field('r-area', f.area, `<select id="r-area" name="area">${opts}</select>`, false)}
          </div>
          ${field('r-msg', f.msg, '<textarea id="r-msg" name="mensagem"></textarea>', false)}
          ${field('r-cv', f.cv, '<input id="r-cv" name="cv" type="file" accept=".pdf,.doc,.docx">', false)}
          <div class="consent">
            <input id="r-consent" name="consentimento" type="checkbox" required>
            <label for="r-consent" style="color:inherit;font-weight:400">${consent}</label>
          </div>
          <div><button type="submit" class="btn btn--primario">${f.submit}</button></div>
          <p class="form__status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>`;
}

function bodyContacto(lang, S) {
  const p = S.pages.contacto; const f = p.f;
  const opts = p.assuntos.map(a => `<option>${a}</option>`).join('');
  const consent = p.consent.replace('{priv}', relLink(lang, lang, 'privacidade'));
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>
    <section class="section">
      <div class="container">
        <p class="lead rv">${p.intro}</p>
        <div class="grid grid--2" style="margin-top:2.5rem;align-items:start">
          <div class="rv">
            <h2 style="margin-bottom:1.5rem">${p.formTitle}</h2>
            <form class="form" data-formspree method="POST" novalidate>
              <div class="form__row">
                ${field('c-nome', f.nome, '<input id="c-nome" name="nome" type="text" required autocomplete="name">')}
                ${field('c-empresa', f.empresa, '<input id="c-empresa" name="empresa" type="text" autocomplete="organization">', false)}
              </div>
              <div class="form__row">
                ${field('c-email', f.email, '<input id="c-email" name="email" type="email" required autocomplete="email">')}
                ${field('c-tel', f.telefone, '<input id="c-tel" name="telefone" type="tel" autocomplete="tel">', false)}
              </div>
              ${field('c-assunto', f.assunto, `<select id="c-assunto" name="assunto">${opts}</select>`, false)}
              ${field('c-msg', f.msg, '<textarea id="c-msg" name="mensagem" required></textarea>')}
              <div class="consent">
                <input id="c-consent" name="consentimento" type="checkbox" required>
                <label for="c-consent" style="color:inherit;font-weight:400">${consent}</label>
              </div>
              <div><button type="submit" class="btn btn--primario">${f.submit}</button></div>
              <p class="form__status" role="status" aria-live="polite"></p>
            </form>
          </div>
          <div class="rv">
            <h2 style="margin-bottom:1.5rem">${p.infoTitle}</h2>
            <div class="contact-block">
              <div class="contact-item">${ICON.mail}<div><strong>Email</strong><a href="mailto:${p.email}">${p.email}</a></div></div>
              <div class="contact-item">${ICON.phone}<div><strong>${f.telefone}</strong>${p.phone}</div></div>
              <div class="contact-item">${ICON.pin}<div><strong>${lang==='fr'?'Adresse':lang==='en'?'Address':'Morada'}</strong>${p.morada}</div></div>
            </div>
            <div class="pais__mapa" style="margin-top:1.5rem;aspect-ratio:16/9" aria-hidden="true">${ICON.globe}</div>
            <!-- TODO: substituir por mapa/morada reais quando definidos. Sem embed de terceiros até então. -->
          </div>
        </div>
      </div>
    </section>`;
}

// Builder genérico de página de prosa (privacidade, cookies, termos)
function bodyProse(lang, S, key) {
  const p = S.pages[key];
  const blocks = p.blocks.map(([h, t]) => `
        <h2>${h}</h2>\n        <p>${t}</p>`).join('');
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>
    <section class="section">
      <div class="container prose">${blocks}
      </div>
    </section>`;
}

// Canal de Denúncias (Lei 93/2021) — página institucional com formulário confidencial
function bodyCanal(lang, S) {
  const p = S.pages.canaldenuncias; const f = p.form;
  const matters = p.matters.map(m => `<li>${m}</li>`).join('');
  const gar = p.garantias.map(g => `<li>${g}</li>`).join('');
  const cats = f.categorias.map(c => `<option>${c}</option>`).join('');
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>
    <section class="section">
      <div class="container prose">
        <p class="lead">${p.intro}</p>
        <h2>${p.matTitle}</h2>
        <ul>${matters}</ul>
        <h2>${p.garTitle}</h2>
        <ul>${gar}</ul>
      </div>
    </section>
    <section class="section section--nevoa">
      <div class="container">
        <h2 class="rv">${p.comoTitle}</h2>
        <p class="lead rv" style="margin-bottom:2rem">${p.comoIntro}</p>
        <div class="grid grid--2" style="align-items:start">
          <div class="rv">
            <h3 style="margin-bottom:.75rem">${p.canal1T}</h3>
            <p style="color:var(--cinza-texto);margin-bottom:1.25rem">${p.canal1D}</p>
            <!-- Formspree: endpoint dedicado. TODO: confirmar o email denuncias@imperioglobal.eu com o cliente. -->
            <form class="form" data-formspree method="POST" enctype="multipart/form-data" novalidate>
              ${field('d-assunto', f.assunto, '<input id="d-assunto" name="assunto" type="text" required>')}
              ${field('d-cat', f.categoria, `<select id="d-cat" name="categoria">${cats}</select>`, false)}
              ${field('d-desc', f.descricao, '<textarea id="d-desc" name="descricao" required></textarea>')}
              ${field('d-file', f.evidencias, '<input id="d-file" name="evidencias" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" data-maxmb="10">', false)}
              ${field('d-email', f.email, '<input id="d-email" name="email" type="email" autocomplete="email">', false)}
              <p style="font-size:.85rem;color:var(--cinza-texto);margin:-.4rem 0 0">${f.emailHint}</p>
              <div class="consent">
                <input id="d-consent" name="declaracao" type="checkbox" required>
                <label for="d-consent" style="color:inherit;font-weight:400">${f.declaro}</label>
              </div>
              <div><button type="submit" class="btn btn--primario">${f.submit}</button></div>
              <p class="form__status" role="status" aria-live="polite"></p>
            </form>
          </div>
          <div class="rv">
            <h3 style="margin-bottom:.75rem">${p.canal2T}</h3>
            <p style="color:var(--cinza-texto);margin-bottom:1.25rem">${p.canal2D}</p>
            <div class="contact-block">
              <div class="contact-item">${ICON.mail}<div><strong>Email</strong><a href="mailto:denuncias@imperioglobal.eu">denuncias@imperioglobal.eu</a></div></div>
            </div>
          </div>
        </div>
        <p style="font-size:.9rem;color:var(--cinza-texto);margin-top:2rem;max-width:72ch">${p.footnote.replace('{contacto}', relLink(lang, lang, 'contacto'))}</p>
      </div>
    </section>`;
}

// Código de Ética e Conduta — HTML + botão de download (window.print) com estilos de impressão
function bodyCodigo(lang, S) {
  const p = S.pages.codigoetica;
  const secs = p.sections.map(s => `
        <h2>${s.h}</h2>
        ${s.body}`).join('').replace(/{canal}/g, relLink(lang, lang, 'canaldenuncias'));
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner">
        <span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1>
        <p style="color:var(--prata-tecnica);margin:.75rem 0 0">${p.updated}</p>
      </div>
    </section>
    <section class="section">
      <div class="container prose codigo-doc">
        <p class="no-print" style="margin-bottom:2rem"><button type="button" class="btn btn--secundario" onclick="window.print()">${p.download}</button></p>
        ${secs}
      </div>
    </section>`;
}

function body404(lang, S) {
  const p = S.pages.e404;
  return `
    <section class="erro">
      <div class="code">${p.code}</div>
      <h1>${p.h1}</h1>
      <p class="lead" style="margin:1rem auto 2rem">${p.text}</p>
      <a href="${relLink(lang,lang,'index')}" class="btn btn--primario">${p.btn}</a>
    </section>`;
}

const BODY = {
  index: bodyIndex, sobre: bodySobre, servicos: bodyServicos, areas: bodyAreas,
  recrutamento: bodyRecrutamento, contacto: bodyContacto,
  privacidade: (l, S) => bodyProse(l, S, 'privacidade'),
  cookies: (l, S) => bodyProse(l, S, 'cookies'),
  termos: (l, S) => bodyProse(l, S, 'termos'),
  canaldenuncias: bodyCanal, codigoetica: bodyCodigo,
  blog: bodyBlogIndex,
  e404: body404,
};

/* =====================================================================
   BLOG — categorias, artigos, helpers e templates
   Para acrescentar um artigo: adicionar um objeto a ARTICLES (ver README).
   ===================================================================== */
const CATEGORIES = {
  pt: { fibra:'Fibra Ótica', construcao:'Construção de Redes', manutencao:'Manutenção e Operação', regulamentacao:'Regulamentação', casos:'Casos e Projetos', insights:'Insights do Setor' },
  en: { fibra:'Optical Fibre', construcao:'Network Construction', manutencao:'Maintenance & Operation', regulamentacao:'Regulation', casos:'Cases & Projects', insights:'Industry Insights' },
  fr: { fibra:'Fibre optique', construcao:'Construction de réseaux', manutencao:'Maintenance et exploitation', regulamentacao:'Réglementation', casos:'Cas et projets', insights:'Perspectives du secteur' },
};
const BLOG_UI = {
  pt: { metaTitle:'Blog — Insights técnicos | Império Global', metaDesc:'Análises, boas práticas e perspetivas sobre construção, expansão e manutenção de infraestruturas de telecomunicações.', eyebrow:'Blog', h1:'Insights técnicos', lead:'Análises, boas práticas e perspetivas sobre construção, expansão e manutenção de infraestruturas de telecomunicações.', all:'Todas', min:'min de leitura', by:'Por', toc:'Neste artigo', related:'Artigos relacionados', ctaTitle:'Precisa de apoio técnico para o seu projeto?', ctaBtn:'Fale connosco', author:'Equipa Império Global', empty:'Sem artigos nesta categoria.' },
  en: { metaTitle:'Blog — Technical insights | Império Global', metaDesc:'Analysis, best practices and perspectives on the construction, expansion and maintenance of telecommunications infrastructure.', eyebrow:'Blog', h1:'Technical insights', lead:'Analysis, best practices and perspectives on the construction, expansion and maintenance of telecommunications infrastructure.', all:'All', min:'min read', by:'By', toc:'In this article', related:'Related articles', ctaTitle:'Need technical support for your project?', ctaBtn:'Contact us', author:'Império Global Team', empty:'No articles in this category.' },
  fr: { metaTitle:'Blog — Perspectives techniques | Império Global', metaDesc:"Analyses, bonnes pratiques et perspectives sur la construction, l'expansion et la maintenance d'infrastructures de télécommunications.", eyebrow:'Blog', h1:'Perspectives techniques', lead:"Analyses, bonnes pratiques et perspectives sur la construction, l'expansion et la maintenance d'infrastructures de télécommunications.", all:'Toutes', min:'min de lecture', by:'Par', toc:'Dans cet article', related:'Articles liés', ctaTitle:'Besoin d’un appui technique pour votre projet ?', ctaBtn:'Contactez-nous', author:'Équipe Império Global', empty:'Aucun article dans cette catégorie.' },
};
// Meta da página índice do blog (programático, para o head genérico)
for (const l of LANGS) {
  STRINGS[l].pages.blog = { title: BLOG_UI[l].metaTitle, desc: BLOG_UI[l].metaDesc };
}

// Textos da Home: secção do blog + newsletter
const HOME_EXTRA = {
  pt: { blogEyebrow:'Insights', blogTitle:'Do nosso blog', blogAll:'Ver o blog',
    nlEyebrow:'Newsletter', nlTitle:'Um artigo técnico por mês. Sem ruído.',
    nlText:'Receba as nossas análises sobre construção, expansão e manutenção de infraestruturas de telecomunicações. Um email por mês — cancela quando quiser.',
    nlPlaceholder:'O seu email profissional', nlBtn:'Subscrever',
    nlConsent:'Autorizo o envio da newsletter e li a <a href="{priv}">Política de Privacidade</a>.' },
  en: { blogEyebrow:'Insights', blogTitle:'From our blog', blogAll:'Visit the blog',
    nlEyebrow:'Newsletter', nlTitle:'One technical article a month. No noise.',
    nlText:'Get our analysis on the construction, expansion and maintenance of telecommunications infrastructure. One email a month — unsubscribe anytime.',
    nlPlaceholder:'Your work email', nlBtn:'Subscribe',
    nlConsent:'I agree to receive the newsletter and have read the <a href="{priv}">Privacy Policy</a>.' },
  fr: { blogEyebrow:'Perspectives', blogTitle:'Notre blog', blogAll:'Voir le blog',
    nlEyebrow:'Newsletter', nlTitle:'Un article technique par mois. Sans bruit.',
    nlText:'Recevez nos analyses sur la construction, l’expansion et la maintenance d’infrastructures de télécommunications. Un e-mail par mois — désabonnement à tout moment.',
    nlPlaceholder:'Votre e-mail professionnel', nlBtn:'S’abonner',
    nlConsent:'J’accepte de recevoir la newsletter et j’ai lu la <a href="{priv}">Politique de confidentialité</a>.' },
};

const articleUrl = (lang, art) => (lang === 'pt' ? `/blog/${art.slug}.html` : `/${lang}/blog/${art.slug}.html`);
const stripTags = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const readingTime = (html) => Math.max(1, Math.round(stripTags(html).split(' ').length / 200));
// Índice "Neste artigo" derivado dos <h2 id="…"> do corpo
const tocFromBody = (html) => [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(m => ({ id: m[1], t: m[2].replace(/<[^>]+>/g, '') }));

// Seletor de idioma para artigos: aponta para a tradução se existir, senão para o índice do blog
function articleLangSel(lang, art, up) {
  return LANGS.map(l => {
    const href = art.langs[l] ? `${art.slug}.html` : relLinkUp(up, l, 'blog');
    // se estamos noutra pasta de idioma, o slug simples só serve para o próprio idioma
    const realHref = (l === lang) ? `${art.slug}.html` : (art.langs[l] ? relLinkUp(up, l, 'blog') + `${art.slug}.html` : relLinkUp(up, l, 'blog'));
    return `<a href="${realHref}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`;
  }).join('<span>|</span>');
}

function articleCard(lang, art, hrefPrefix = '', assetUp = '') {
  const a = art.langs[lang]; if (!a) return '';
  const cat = CATEGORIES[lang][art.cat] || art.cat;
  const rt = readingTime(a.body);
  const href = `${hrefPrefix}${art.slug}.html`;
  const hasCover = !!art.cover;
  const coverStyle = hasCover ? ` style="background-image:url('${assetUp}assets/img/blog/${art.cover}')"` : '';
  return `
        <article class="post-card" data-cat="${art.cat}">
          <a href="${href}" class="post-card__thumb${hasCover ? ' post-card__thumb--img' : ''}"${coverStyle} aria-hidden="true" tabindex="-1"><span>${cat}</span></a>
          <div class="post-card__body">
            <span class="badge">${cat}</span>
            <h3><a href="${href}">${a.title}</a></h3>
            <p>${a.excerpt}</p>
            <div class="post-card__meta">${fmtDate(lang, art.date)} · ${rt} ${BLOG_UI[lang].min}</div>
          </div>
        </article>`;
}

function bodyBlogIndex(lang, S, up) {
  const ui = BLOG_UI[lang];
  const arts = ARTICLES.filter(a => a.langs[lang]).sort((a, b) => (a.date < b.date ? 1 : -1));
  const cats = [...new Set(arts.map(a => a.cat))];
  const filters = `<button class="chip is-active" data-filter="all">${ui.all}</button>` +
    cats.map(c => `<button class="chip" data-filter="${c}">${CATEGORIES[lang][c]}</button>`).join('');
  const cards = arts.map(a => articleCard(lang, a, '', up)).join('') || `<p>${ui.empty}</p>`;
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,100px)">
      <div class="container hero__inner"><span class="eyebrow">${ui.eyebrow}</span><h1>${ui.h1}</h1><p class="hero__sub" style="margin-bottom:0">${ui.lead}</p></div>
    </section>
    <section class="section">
      <div class="container">
        <div class="chips" role="group" aria-label="Filtro por categoria">${filters}</div>
        <div class="post-grid" style="margin-top:2rem">${cards}
        </div>
      </div>
    </section>`;
}

function headArticle(lang, art, S, up) {
  const a = art.langs[lang];
  const canonical = BASE + articleUrl(lang, art);
  const avail = LANGS.filter(l => art.langs[l]);
  const alt = avail.map(l => `  <link rel="alternate" hreflang="${l}" href="${BASE + articleUrl(l, art)}">`).join('\n');
  const rt = readingTime(a.body);
  const ogImg = `${BASE}/assets/img/blog/${art.cover || art.slug + '-og.png'}`;
  const schema = `{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(a.title)},"description":${JSON.stringify(a.desc)},"inLanguage":"${lang}","datePublished":"${art.date}","author":{"@type":"Organization","name":"Império Global"},"publisher":{"@type":"Organization","name":"Império Global","logo":{"@type":"ImageObject","url":"${BASE}/assets/favicon/icon-512.png"}},"mainEntityOfPage":"${canonical}","image":"${ogImg}","timeRequired":"PT${rt}M"}`;
  return head(lang, 'blog', S, up, {
    title: `${a.title} — Império Global`, desc: a.desc, canonical, alt,
    ogImage: ogImg, schema,
  });
}

function bodyArticle(lang, art, S, up) {
  const a = art.langs[lang]; const ui = BLOG_UI[lang];
  const cat = CATEGORIES[lang][art.cat] || art.cat;
  const rt = readingTime(a.body);
  const toc = tocFromBody(a.body);
  const tocHtml = toc.length ? `
        <nav class="toc" aria-label="${ui.toc}">
          <strong>${ui.toc}</strong>
          <ul>${toc.map(x => `<li><a href="#${x.id}">${x.t}</a></li>`).join('')}</ul>
        </nav>` : '';
  // relacionados: mesma categoria, outros idiomas presentes
  const related = ARTICLES.filter(x => x.slug !== art.slug && x.cat === art.cat && x.langs[lang]).slice(0, 3);
  const relHtml = related.length ? `
    <section class="section section--nevoa">
      <div class="container">
        <h2 style="margin-bottom:1.5rem">${ui.related}</h2>
        <div class="post-grid">${related.map(r => articleCard(lang, r, '', up)).join('')}</div>
      </div>
    </section>` : '';
  const hero = art.cover ? `
    <h1 class="sr-only">${a.title}</h1>
    <section class="section article-lead">
      <div class="container">
        <a class="article-back" href="${relLinkUp(up, lang, 'blog')}">← ${S.nav.blog}</a>
        <figure class="article-cover">
          <img src="${up}assets/img/blog/${art.cover}" alt="${a.title}" width="1536" height="1024" loading="eager" fetchpriority="high">
        </figure>
        <p class="article-meta article-lead__meta"><span class="badge">${cat}</span>${ui.by} ${ui.author} · ${fmtDate(lang, art.date)} · ${rt} ${ui.min}</p>
      </div>
    </section>` : `
    <section class="hero" style="padding-block:clamp(48px,8vw,88px)">
      <div class="container hero__inner" style="max-width:820px">
        <span class="eyebrow">${cat}</span>
        <h1 style="font-size:clamp(1.8rem,4.5vw,2.5rem)">${a.title}</h1>
        <p class="article-meta">${ui.by} ${ui.author} · ${fmtDate(lang, art.date)} · ${rt} ${ui.min}</p>
      </div>
    </section>`;
  return `${hero}
    <section class="section" style="padding-top:clamp(24px,4vw,40px)">
      <div class="container">
        <div class="article">
          ${tocHtml}
          <div class="article__body">${a.body}</div>
          <div class="article-cta">
            <h2>${ui.ctaTitle}</h2>
            <a href="${relLinkUp(up, lang, 'contacto')}" class="btn btn--primario">${ui.ctaBtn}</a>
          </div>
        </div>
      </div>
    </section>${relHtml}`;
}

// Datas formatadas por idioma (sem Date.now — recebe string ISO "YYYY-MM-DD")
function fmtDate(lang, iso) {
  const [y, m, d] = iso.split('-');
  const meses = {
    pt: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    fr: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
  };
  const mes = meses[lang][parseInt(m, 10) - 1];
  return lang === 'en' ? `${mes} ${parseInt(d, 10)}, ${y}` : `${parseInt(d, 10)} de ${mes} de ${y}`;
}

const ARTICLES = [
  {
    slug: 'manutencao-preventiva-corretiva-fibra-otica',
    cat: 'manutencao',
    date: '2026-07-21',
    cover: 'manutencao-preventiva-corretiva-fibra-otica-cover.jpg',
    langs: {
      pt: {
        title: 'Manutenção preventiva vs. corretiva em redes de fibra ótica',
        desc: 'Quando a manutenção preventiva justifica o investimento face à corretiva em redes de fibra ótica — critérios técnicos e de custo para gestores de rede.',
        excerpt: 'Comparação técnica entre manutenção preventiva e corretiva em fibra ótica: indicadores, custos e critérios de decisão para gestores de rede.',
        body: `
<p class="lead">Numa rede de fibra ótica, a diferença entre reparar depois da falha e antecipar a falha não é apenas operacional — é económica e contratual. Este artigo enquadra os critérios que ajudam um gestor de rede a decidir onde e quando cada abordagem se justifica.</p>

<h2 id="duas-logicas">Preventiva e corretiva: duas lógicas distintas</h2>
<p>A manutenção corretiva atua depois da falha: uma avaria interrompe o serviço e a equipa desloca-se para localizar e reparar o troço afetado. A manutenção preventiva atua antes: inspeções, medições e substituições programadas que procuram evitar a falha ou detetá-la na fase inicial, quando o custo de intervenção ainda é baixo.</p>
<p>A distinção não é meramente terminológica. Cada abordagem tem uma estrutura de custos, um perfil de risco e implicações contratuais próprias — sobretudo quando a rede suporta serviços críticos com níveis de serviço (SLA) associados à disponibilidade. Tratar as duas como opostas é um erro: na prática, uma rede bem gerida combina-as, aplicando cada uma ao segmento onde compensa.</p>

<h2 id="indicadores">Indicadores que justificam a preventiva</h2>
<p>A decisão de investir em manutenção preventiva depende de indicadores mensuráveis, entre os quais:</p>
<ul>
<li><strong>Disponibilidade contratada.</strong> Quanto mais exigente for o SLA, menor é a tolerância a falhas não planeadas — e maior o valor de as antecipar.</li>
<li><strong>Custo da indisponibilidade.</strong> Inclui penalizações contratuais, perda de serviço a jusante e a mobilização de equipas em regime de urgência, tipicamente mais cara do que uma intervenção planeada.</li>
<li><strong>Idade e histórico do traçado.</strong> Troços mais antigos, com juntas e caixas sujeitas a infiltração, apresentam maior probabilidade de degradação progressiva.</li>
<li><strong>Exposição a fatores externos.</strong> Obras de terceiros, roedores, humidade e esforços mecânicos são causas frequentes de degradação que a inspeção periódica deteta cedo.</li>
</ul>
<p>A regra de decisão é direta: quando o custo esperado da falha — a probabilidade de ocorrer multiplicada pelo seu impacto — excede o custo do programa preventivo, a preventiva justifica-se economicamente.</p>

<blockquote>A pergunta não é "preventiva ou corretiva?", mas "que parte da rede justifica preventiva e com que frequência?".</blockquote>

<h2 id="modelo-custo">Um modelo simples de custo</h2>
<p>Sem entrar em modelação complexa, é útil raciocinar em três parcelas. A primeira é o custo do programa preventivo: mão de obra de inspeção, medições e substituições programadas. A segunda é o custo esperado das falhas residuais que a preventiva não elimina. A terceira é o custo das falhas num cenário puramente corretivo, incluindo penalizações e intervenções de urgência.</p>
<p>A preventiva compensa quando a soma das duas primeiras parcelas é inferior à terceira. Este raciocínio explica por que a mesma rede pode justificar preventiva no backbone e corretiva num troço terminal de baixa criticidade: muda o impacto da falha, muda a conclusão.</p>

<h2 id="otdr">OTDR e monitorização: detetar antes de falhar</h2>
<p>O reflectómetro ótico no domínio do tempo (OTDR) é o instrumento central da manutenção de fibra. Ao injetar um impulso e medir a luz retrodifundida, permite localizar, ao longo do troço, atenuações anómalas, juntas degradadas e curvaturas excessivas, com indicação da distância a que ocorrem.</p>
<p>O valor preventivo surge na análise de tendência: comparar medições OTDR sucessivas revela degradação lenta muito antes de esta se traduzir numa interrupção de serviço. Em redes de maior criticidade, a monitorização pode ser contínua, com sistemas que vigiam a atenuação e alertam quando um limiar é ultrapassado. A escolha entre medição periódica e monitorização contínua é, também ela, uma decisão de custo-benefício: a segunda tem custo de instalação, mas reduz o tempo de deteção.</p>

<div class="note"><strong>Nota técnica.</strong> Uma variação de atenuação numa junta, detetável por OTDR muito antes de causar corte, é um exemplo típico de falha que a manutenção preventiva resolve a baixo custo — e que a corretiva só resolve depois da interrupção do serviço.</div>

<h2 id="corretiva-racional">Quando a corretiva é a opção racional</h2>
<p>A manutenção preventiva não é universalmente superior. Em troços de baixa criticidade, com SLA folgado e baixo custo de indisponibilidade, o investimento em inspeção programada pode não compensar. Nesses casos, uma estratégia essencialmente corretiva minimiza o custo total — desde que a capacidade de resposta esteja garantida.</p>
<p>O fator determinante é o tempo de reposição (MTTR). Uma organização com equipas, viaturas e materiais prontos consegue reparar avarias com rapidez suficiente para que o impacto de uma abordagem corretiva se mantenha aceitável. Sem essa capacidade de resposta, a corretiva deixa de ser uma escolha racional e passa a ser exposição a risco.</p>

<h2 id="criterios">Um enquadramento prático de decisão</h2>
<p>Na prática, as redes segmentam o traçado por criticidade:</p>
<ul>
<li><strong>Troços críticos</strong> (backbone, ligações a nós importantes, clientes com SLA exigente): preventiva com medição periódica e, quando se justifica, monitorização contínua.</li>
<li><strong>Troços intermédios:</strong> inspeção preventiva com menor frequência, orientada por histórico e por fatores de exposição.</li>
<li><strong>Troços de baixa criticidade:</strong> abordagem corretiva, sustentada por capacidade de resposta rápida.</li>
</ul>
<p>Esta segmentação evita dois erros simétricos: sobreinvestir em preventiva onde não compensa e expor a corretiva troços cuja falha tem custo elevado.</p>

<h2 id="contexto">Contexto: uma rede em expansão</h2>
<p>A dimensão da rede de fibra em Portugal reforça a relevância da manutenção. Portugal está entre os países europeus com maior cobertura de fibra ótica até casa (FTTH); os dados atualizados de cobertura e de acessos são publicados periodicamente pela <a href="https://www.anacom.pt" target="_blank" rel="noopener">ANACOM</a>. Uma base instalada extensa significa mais quilómetros de traçado a manter — e maior retorno de uma política de manutenção bem dimensionada.</p>

<h2 id="conclusao">Conclusão</h2>
<p>Preventiva e corretiva não são alternativas mutuamente exclusivas, mas ferramentas para segmentos diferentes da mesma rede. A decisão assenta em indicadores mensuráveis — disponibilidade contratada, custo da indisponibilidade, criticidade do troço e capacidade de resposta — e não em preferências genéricas. O objetivo é o mesmo que orienta toda a operação de infraestruturas de acesso: assegurar a fiabilidade, a disponibilidade e o desempenho das redes ao menor custo total.</p>
`,
      },
    },
  },
];

/* =====================================================================
   GERAÇÃO
   ===================================================================== */
let count = 0;
for (const lang of LANGS) {
  const S = STRINGS[lang];
  for (const page of PAGES) {
    const up = upForPage(lang, page);
    const html = head(lang, page, S, up) + header(lang, page, S, up) + BODY[page](lang, S, up) + footer(lang, S, up) + '\n';
    let outPath;
    if (page === 'blog') outPath = ROOT + (lang === 'pt' ? 'blog/index.html' : `${lang}/blog/index.html`);
    else if (page === 'index') outPath = ROOT + (lang === 'pt' ? 'index.html' : `${lang}/index.html`);
    else outPath = ROOT + pathFor(lang, page).replace(/^\//, '');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    count++;
  }
}

/* -------------------------------------------------- Artigos do blog (páginas individuais) */
for (const art of ARTICLES) {
  for (const lang of LANGS) {
    if (!art.langs[lang]) continue;             // só gera idiomas que existem
    const S = STRINGS[lang];
    const up = upFor(lang) + '../';             // artigos vivem em /blog/ (ou /en/blog/)
    const html = headArticle(lang, art, S, up) + header(lang, 'blog', S, up, { active: 'blog', langsel: articleLangSel(lang, art, up) })
      + bodyArticle(lang, art, S, up) + footer(lang, S, up) + '\n';
    const outPath = ROOT + (lang === 'pt' ? `blog/${art.slug}.html` : `${lang}/blog/${art.slug}.html`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    count++;
  }
}
console.log(`Gerado(s) ${count} ficheiro(s) HTML (${LANGS.length} idiomas × ${PAGES.length} páginas).`);

/* -------------------------------------------------- sitemap.xml (automático) */
const SITEMAP_PAGES = PAGES.filter(p => p !== 'e404');
const pageUrls = SITEMAP_PAGES.map(page => {
  const alts = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE + pathFor(l, page)}"/>`).join('\n');
  return `  <url>\n    <loc>${BASE + pathFor('pt', page)}</loc>\n${alts}\n  </url>`;
}).join('\n');
const artUrls = ARTICLES.map(art => {
  const avail = LANGS.filter(l => art.langs[l]);
  const loc = BASE + articleUrl(avail[0], art);
  const alts = avail.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE + articleUrl(l, art)}"/>`).join('\n');
  return `  <url>\n    <loc>${loc}</loc>\n${alts}\n  </url>`;
}).join('\n');
const urls = pageUrls + '\n' + artUrls;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado automaticamente por build.mjs. Não editar à mão. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
writeFileSync(ROOT + 'sitemap.xml', sitemap);
console.log(`sitemap.xml atualizado (${SITEMAP_PAGES.length} páginas × ${LANGS.length} idiomas).`);
