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
  recrutamento: 'recrutamento.html', contacto: 'contacto.html',
  privacidade: 'privacidade.html', e404: '404.html',
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

// Ligação interna RELATIVA entre páginas (preserva a página ao trocar de idioma).
const relLink = (fromLang, toLang, page) => {
  const up = upFor(fromLang);
  const toDir = toLang === 'pt' ? '' : `${toLang}/`;
  const file = page === 'index' ? '' : FILE[page];
  const r = up + toDir + file;
  return r === '' ? './' : r;
};

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
};

/* =====================================================================
   CONTEÚDO (fonte única). PT-PT é o idioma de referência e validado.
   EN/FR são tradução profissional — TODO: revisão nativa antes de publicar.
   ===================================================================== */
const STRINGS = {
  pt: {
    htmlLang: 'pt',
    nav: { index:'Início', sobre:'Sobre', servicos:'Serviços', areas:'Áreas de Atuação', recrutamento:'Recrutamento', contacto:'Contacto' },
    skip: 'Saltar para o conteúdo',
    tagline: 'Construção, expansão e manutenção de infraestruturas de telecomunicações em Portugal e na Bélgica.',
    footer: {
      nav:'Navegação', empresa:'Empresa', contacto:'Contacto',
      privacidade:'Política de Privacidade', rights:'Todos os direitos reservados.',
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
        visao:'Ser uma referência nacional na execução de infraestruturas técnicas, reconhecida pela inovação, competência e excelência operacional, crescendo de forma sustentável para novas áreas e mercados.',
        valoresT:'Valores',
        valores:[
          { t:'Compromisso', d:'Cumprimos o que prometemos, com responsabilidade e rigor.' },
          { t:'Confiança', d:'Construímos relações sólidas através da transparência e da qualidade.' },
          { t:'Inovação', d:'Evoluímos continuamente para soluções mais eficientes e preparadas para o futuro.' },
        ],
        presencaTitle:'Presença internacional',
        presenca:'Fundada em 2017, a Império Global evoluiu da instalação e manutenção de redes ADSL para as soluções de fibra ótica (FTTH) e infraestruturas de nova geração. Portugal é hoje o mercado principal e concentra a maior parte da operação; a presença na Bélgica reflete uma trajetória de crescimento sustentada, construída sobre a confiança de operadores, empresas privadas e entidades públicas. A operação em dois países permite-nos partilhar competências, escalar equipas e responder a projetos de grande dimensão com a mesma exigência técnica.',
      },
      servicos: {
        title:'Serviços — Império Global', desc:'Construção, expansão e manutenção de infraestruturas de telecomunicações: redes fixas, fibra ótica e cobre, manutenção preventiva e corretiva.',
        h1:'Serviços', eyebrow:'O que oferecemos',
        intro:'Cobrimos todo o ciclo de vida das infraestruturas de acesso — da construção à manutenção — para operadores, empresas privadas e entidades públicas.',
        items:[
          { i:'build', t:'Construção de redes fixas', d:'Execução de raiz de infraestruturas de acesso, do planeamento à ligação final.' },
          { i:'expand', t:'Expansão e ampliação de traçados', d:'Prolongamento e densificação de redes existentes para acompanhar a procura.' },
          { i:'maint', t:'Manutenção preventiva e corretiva', d:'Planos de manutenção que asseguram a fiabilidade, disponibilidade e desempenho das redes.' },
          { i:'repair', t:'Reparação de avarias', d:'Diagnóstico e resolução de avarias com capacidade de resposta e redução do tempo de indisponibilidade.' },
          { i:'fiber', t:'Instalação e ligação de cabos de fibra ótica', d:'Lançamento, fusão e ligação de fibra ótica, do troço principal ao ponto de acesso.' },
          { i:'copper', t:'Instalação e ligação de cabos de cobre', d:'Instalação, ligação e certificação de infraestruturas em cobre.' },
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
      e404: {
        title:'Página não encontrada — Império Global', desc:'A página que procura não existe.',
        code:'404', h1:'Página não encontrada', text:'A página que procura não existe ou foi movida.', btn:'Voltar ao início',
      },
    },
  },

  en: {
    htmlLang: 'en',
    nav: { index:'Home', sobre:'About', servicos:'Services', areas:'Areas of Operation', recrutamento:'Careers', contacto:'Contact' },
    skip: 'Skip to content',
    tagline: 'Construction, expansion and maintenance of telecommunications infrastructure in Portugal and Belgium.',
    footer: { nav:'Navigation', empresa:'Company', contacto:'Contact', privacidade:'Privacy Policy', rights:'All rights reserved.' },
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
        visao:'To be a national reference in the delivery of technical infrastructure, recognised for innovation, competence and operational excellence, growing sustainably into new areas and markets.',
        valoresT:'Values',
        valores:[
          { t:'Commitment', d:'We deliver on what we promise, with responsibility and rigour.' },
          { t:'Trust', d:'We build solid relationships through transparency and quality.' },
          { t:'Innovation', d:'We continuously evolve towards more efficient, future-ready solutions.' },
        ],
        presencaTitle:'International presence',
        presenca:'Founded in 2017, Império Global evolved from the installation and maintenance of ADSL networks to optical fibre (FTTH) solutions and next-generation infrastructure. Portugal is today the main market and concentrates most of the operation; our presence in Belgium reflects a sustained growth path, built on the trust of operators, private companies and public entities. Operating across two countries lets us share expertise, scale teams and take on large-scale projects with the same technical demands.',
      },
      servicos: {
        title:'Services — Império Global', desc:'Construction, expansion and maintenance of telecommunications infrastructure: fixed networks, optical fibre and copper, preventive and corrective maintenance.',
        h1:'Services', eyebrow:'What we offer',
        intro:'We cover the entire lifecycle of access infrastructure — from construction to maintenance — for operators, private companies and public entities.',
        items:[
          { i:'build', t:'Fixed network construction', d:'Ground-up delivery of access infrastructure, from planning to final connection.' },
          { i:'expand', t:'Route expansion and extension', d:'Extension and densification of existing networks to keep pace with demand.' },
          { i:'maint', t:'Preventive and corrective maintenance', d:'Maintenance plans ensuring the reliability, availability and performance of networks.' },
          { i:'repair', t:'Fault repair', d:'Diagnosis and resolution of faults with fast response and reduced downtime.' },
          { i:'fiber', t:'Optical fibre installation and connection', d:'Laying, splicing and connecting optical fibre, from the main span to the access point.' },
          { i:'copper', t:'Copper cable installation and connection', d:'Installation, connection and certification of copper infrastructure.' },
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
      e404: { title:'Page not found — Império Global', desc:'The page you are looking for does not exist.', code:'404', h1:'Page not found', text:'The page you are looking for does not exist or has been moved.', btn:'Back to home' },
    },
  },

  fr: {
    htmlLang: 'fr',
    nav: { index:'Accueil', sobre:'À propos', servicos:'Services', areas:"Zones d'intervention", recrutamento:'Recrutement', contacto:'Contact' },
    skip: 'Aller au contenu',
    tagline: "Construction, expansion et maintenance d'infrastructures de télécommunications au Portugal et en Belgique.",
    footer: { nav:'Navigation', empresa:'Entreprise', contacto:'Contact', privacidade:'Politique de confidentialité', rights:'Tous droits réservés.' },
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
        visao:"Être une référence nationale dans la réalisation d'infrastructures techniques, reconnue pour son innovation, sa compétence et son excellence opérationnelle, en croissant durablement vers de nouveaux domaines et marchés.",
        valoresT:'Valeurs',
        valores:[
          { t:'Engagement', d:'Nous tenons nos promesses, avec responsabilité et rigueur.' },
          { t:'Confiance', d:'Nous bâtissons des relations solides par la transparence et la qualité.' },
          { t:'Innovation', d:"Nous évoluons en continu vers des solutions plus efficaces et prêtes pour l'avenir." },
        ],
        presencaTitle:'Présence internationale',
        presenca:"Fondée en 2017, Império Global est passée de l'installation et de la maintenance de réseaux ADSL aux solutions de fibre optique (FTTH) et aux infrastructures de nouvelle génération. Le Portugal est aujourd'hui le marché principal et concentre l'essentiel de l'activité ; notre présence en Belgique reflète une trajectoire de croissance durable, bâtie sur la confiance des opérateurs, des entreprises privées et des entités publiques. Cette activité dans deux pays nous permet de partager les compétences, de faire évoluer les équipes et de mener des projets d'envergure avec la même exigence technique.",
      },
      servicos: {
        title:'Services — Império Global', desc:"Construction, expansion et maintenance d'infrastructures de télécommunications : réseaux fixes, fibre optique et cuivre, maintenance préventive et corrective.",
        h1:'Services', eyebrow:'Notre offre',
        intro:"Nous couvrons tout le cycle de vie des infrastructures d'accès — de la construction à la maintenance — pour les opérateurs, les entreprises privées et les entités publiques.",
        items:[
          { i:'build', t:'Construction de réseaux fixes', d:"Déploiement d'infrastructures d'accès de A à Z, de la planification au raccordement final." },
          { i:'expand', t:'Expansion et extension des tracés', d:'Extension et densification des réseaux existants pour suivre la demande.' },
          { i:'maint', t:'Maintenance préventive et corrective', d:'Des plans de maintenance qui assurent la fiabilité, la disponibilité et la performance des réseaux.' },
          { i:'repair', t:'Réparation de pannes', d:"Diagnostic et résolution des pannes avec réactivité et réduction des temps d'indisponibilité." },
          { i:'fiber', t:'Installation et raccordement de fibre optique', d:"Tirage, soudure et raccordement de la fibre optique, du tronçon principal au point d'accès." },
          { i:'copper', t:'Installation et raccordement de câbles en cuivre', d:"Installation, raccordement et certification d'infrastructures en cuivre." },
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
      e404: { title:'Page introuvable — Império Global', desc:'La page que vous recherchez n’existe pas.', code:'404', h1:'Page introuvable', text:'La page que vous recherchez n’existe pas ou a été déplacée.', btn:'Retour à l’accueil' },
    },
  },
};

/* =====================================================================
   TEMPLATES
   ===================================================================== */
const logoAlt = 'Império Global';

function head(lang, page, S) {
  const p = S.pages[page];
  const B = upFor(lang);
  const canonical = BASE + pathFor(lang, page);
  const alt = LANGS.map(l => `  <link rel="alternate" hreflang="${l}" href="${BASE + pathFor(l, page)}">`).join('\n');
  const jsonld = page === 'index' ? `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"Império Global","legalName":"Império Global Telecomunicações Unipessoal, Lda.","foundingDate":"2017","url":"${BASE}/","logo":"${BASE}/assets/favicon/icon-512.png","description":"${S.tagline}","areaServed":["PT","BE"],"email":"geral@imperioglobal.eu","sameAs":[]}
  </script>` : '';
  const noindex = page === 'e404' ? '\n  <meta name="robots" content="noindex">' : '';
  return `<!doctype html>
<html lang="${S.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}">${noindex}
  <link rel="canonical" href="${canonical}">
${alt}
  <link rel="alternate" hreflang="x-default" href="${BASE}/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${OG_LOCALE[lang]}">
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.desc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BASE}/assets/img/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.title}">
  <meta name="twitter:description" content="${p.desc}">
  <meta name="twitter:image" content="${BASE}/assets/img/og-image.png">
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

function header(lang, page, S) {
  const B = upFor(lang);
  const links = ['index','sobre','servicos','areas','recrutamento','contacto']
    .map(k => `          <a href="${relLink(lang, lang, k)}"${k === page ? ' aria-current="page"' : ''}>${S.nav[k]}</a>`)
    .join('\n');
  const langsel = LANGS.map(l =>
    `<a href="${relLink(lang, l, page)}" hreflang="${l}"${l === lang ? ' aria-current="true"' : ''}>${l.toUpperCase()}</a>`
  ).join('<span>|</span>');
  return `
  <header class="site-header">
    <div class="container nav">
      <a class="nav__logo" href="${relLink(lang, lang, 'index')}" aria-label="${logoAlt}">
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

function footer(lang, S) {
  const B = upFor(lang);
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
          <a href="${relLink(lang,lang,'index')}">${S.nav.index}</a><br>
          <a href="${relLink(lang,lang,'sobre')}">${S.nav.sobre}</a><br>
          <a href="${relLink(lang,lang,'servicos')}">${S.nav.servicos}</a><br>
          <a href="${relLink(lang,lang,'areas')}">${S.nav.areas}</a>
        </div>
        <div>
          <h4>${S.footer.empresa}</h4>
          <a href="${relLink(lang,lang,'recrutamento')}">${S.nav.recrutamento}</a><br>
          <a href="${relLink(lang,lang,'contacto')}">${S.nav.contacto}</a><br>
          <a href="${relLink(lang,lang,'privacidade')}">${S.footer.privacidade}</a>
        </div>
        <div>
          <h4>${S.footer.contacto}</h4>
          <a href="mailto:geral@imperioglobal.eu">geral@imperioglobal.eu</a>
        </div>
      </div>
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
      <a href="${relLink(lang,lang,'privacidade')}" class="btn btn--secundario">${S.cookies.more}</a>
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
function bodyIndex(lang, S) {
  const p = S.pages.index;
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
        <div class="grid grid--4" style="margin-top:2.5rem">${cards}
        </div>
        <p class="center" style="margin-top:2.5rem"><a href="${relLink(lang,lang,'servicos')}" class="btn btn--secundario">${p.servAll}</a></p>
      </div>
    </section>
    <section class="section section--nevoa">
      <div class="container">
        <span class="eyebrow rv">${p.whyEyebrow}</span>
        <h2 class="rv">${p.whyTitle}</h2>
        <div class="grid grid--4" style="margin-top:2.5rem">${pillars}
        </div>
      </div>
    </section>
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

function bodyRecrutamento(lang, S) {
  const p = S.pages.recrutamento; const f = p.f;
  const opts = p.areas.map(a => `<option>${a}</option>`).join('');
  const consent = p.consent.replace('{priv}', relLink(lang, lang, 'privacidade'));
  return `
    <section class="hero" style="padding-block:clamp(56px,9vw,110px)">
      <div class="hero__pattern" aria-hidden="true"></div>
      <div class="container hero__inner"><span class="eyebrow">${p.eyebrow}</span><h1>${p.h1}</h1></div>
    </section>
    <section class="section">
      <div class="container">
        <p class="lead rv">${p.intro}</p>
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

function bodyPrivacidade(lang, S) {
  const p = S.pages.privacidade;
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
  recrutamento: bodyRecrutamento, contacto: bodyContacto, privacidade: bodyPrivacidade, e404: body404,
};

/* =====================================================================
   GERAÇÃO
   ===================================================================== */
let count = 0;
for (const lang of LANGS) {
  const S = STRINGS[lang];
  for (const page of PAGES) {
    const html = head(lang, page, S) + header(lang, page, S) + BODY[page](lang, S) + footer(lang, S) + '\n';
    const rel = pathFor(lang, page);
    const outPath = ROOT + (page === 'index' ? (lang === 'pt' ? 'index.html' : `${lang}/index.html`) : rel.replace(/^\//, ''));
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    count++;
  }
}
console.log(`Gerado(s) ${count} ficheiro(s) HTML (${LANGS.length} idiomas × ${PAGES.length} páginas).`);
