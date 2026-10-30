import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const USUARIO = "AstralunaProject";
const PACOTES_NPM = ["cnpj-alfa-scan", "esocial-ts"];
const DESTINO = process.argv.find((a) => a.startsWith("--saida="))?.slice(8) ?? "dist";
const FIXTURE = process.argv.find((a) => a.startsWith("--fixture="))?.slice(10);

const TEMAS = {
  dark: { fundo: "#151030", borda: "#2e2566", titulo: "#f4f1ff", texto: "#d6d1f5", suave: "#8f88c2", destaque: "#c9a7ff", sakura: "#ff9ec4", ok: "#7bd88f", aberto: "#ffcc66" },
  light: { fundo: "#fbf9ff", borda: "#e1dbfa", titulo: "#1f1846", texto: "#3b3566", suave: "#7c76a8", destaque: "#7a4fe0", sakura: "#f772a3", ok: "#1f8a4c", aberto: "#a86b00" },
};
const CORES_LINGUAGEM = { TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", HTML: "#e34c26", CSS: "#663399", Shell: "#89e051", "C#": "#178600", Java: "#b07219", Dockerfile: "#384d54", PowerShell: "#012456", Batchfile: "#C1F12E" };
const FONTE = "'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif";
const FONTE_JP = "'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', 'Noto Sans CJK JP', 'IPAGothic', sans-serif";

async function api(caminho) {
  const resposta = await fetch(`https://api.github.com${caminho}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": USUARIO },
  });
  if (!resposta.ok) throw new Error(`GitHub ${resposta.status} em ${caminho}: ${await resposta.text()}`);
  return resposta.json();
}

async function coletar() {
  const repos = (await api(`/users/${USUARIO}/repos?type=owner&per_page=100`)).filter((r) => !r.fork && !r.private && r.name !== USUARIO);
  const bytes = {};
  for (const repo of repos) {
    for (const [linguagem, n] of Object.entries(await api(`/repos/${repo.full_name}/languages`))) bytes[linguagem] = (bytes[linguagem] ?? 0) + n;
  }
  const prs = await api(`/search/issues?q=${encodeURIComponent(`is:pr author:${USUARIO} -user:${USUARIO}`)}&per_page=1`);
  const recentes = await api(`/search/issues?q=${encodeURIComponent(`author:${USUARIO} -user:${USUARIO}`)}&sort=updated&order=desc&per_page=5`);
  const issues = await api(`/search/issues?q=${encodeURIComponent(`is:issue author:${USUARIO} -user:${USUARIO}`)}&per_page=1`);
  const mergeados = await api(`/search/issues?q=${encodeURIComponent(`is:pr is:merged author:${USUARIO} -user:${USUARIO}`)}&per_page=1`);
  const npm = [];
  for (const nome of PACOTES_NPM) {
    const r = await fetch(`https://registry.npmjs.org/${nome}/latest`);
    if (r.ok) npm.push({ nome, versao: (await r.json()).version });
  }
  return {
    repositorios: repos.length,
    estrelas: repos.reduce((s, r) => s + r.stargazers_count, 0),
    linguagens: bytes,
    prsExternos: prs.total_count,
    prsMergeados: mergeados.total_count,
    issuesExternas: issues.total_count,
    npm,
    contribuicoes: recentes.items.map((i) => ({
      repo: i.repository_url.split("/repos/")[1],
      numero: i.number,
      titulo: i.title,
      tipo: i.pull_request ? "pr" : "issue",
      estado: i.pull_request?.merged_at ? "mergeado" : i.state === "open" ? "aberto" : "fechado",
    })),
  };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const largo = (c) => /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(c);
function cortar(texto, limite) {
  let usado = 0;
  let saida = "";
  for (const c of texto) {
    usado += largo(c) ? 2 : 1;
    if (usado > limite) return `${saida.trimEnd()}…`;
    saida += c;
  }
  return saida;
}
const PETALA = "M0,-9 C5,-9 9,-4 7,3 C5,8 2,9 0,6 C-2,9 -5,8 -7,3 C-9,-4 -5,-9 0,-9 Z";

function moldura(t, largura, altura, titulo, jp, conteudo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${esc(titulo)}">
<style>
  .t { font: 700 18px ${FONTE}; fill: ${t.titulo}; }
  .jp { font: 500 12px ${FONTE_JP}; fill: ${t.suave}; letter-spacing: 2px; }
  .n { font: 700 26px ${FONTE}; fill: ${t.destaque}; }
  .r { font: 400 13px ${FONTE}; fill: ${t.suave}; }
  .x { font: 400 14px ${FONTE}, ${FONTE_JP}; fill: ${t.texto}; }
  .s { font: 600 11px ${FONTE}; }
  .l { animation: entra .8s ease-out both; }
  @keyframes entra { from { opacity: 0; transform: translateX(-6px) } to { opacity: 1; transform: none } }
  .gira { animation: gira 8s linear infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes gira { to { transform: rotate(360deg) } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect x=".5" y=".5" width="${largura - 1}" height="${altura - 1}" rx="14" fill="${t.fundo}" stroke="${t.borda}"/>
<g transform="translate(28 34)"><path class="gira" d="${PETALA}" fill="${t.sakura}"/></g>
<text x="46" y="40" class="t">${esc(titulo)}</text>
<text x="${largura - 24}" y="40" class="jp" text-anchor="end">${esc(jp)}</text>
${conteudo}
</svg>
`;
}

function cardEstatisticas(d, t) {
  const numeros = [
    [d.repositorios, "projetos públicos"],
    [d.npm.length, "pacotes no npm"],
    [d.prsExternos + d.issuesExternas, "contribuições externas"],
  ];
  if (d.estrelas >= 10) numeros.push([d.estrelas, "estrelas"]);
  const largura = 495;
  const passo = (largura - 48) / numeros.length;
  let html = numeros
    .map(([n, r], i) => `<g class="l" style="animation-delay:${i * 0.15}s"><text x="${24 + i * passo}" y="92" class="n">${n}</text><text x="${24 + i * passo}" y="112" class="r">${esc(r)}</text></g>`)
    .join("");

  const total = Object.values(d.linguagens).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(d.linguagens).sort((a, b) => b[1] - a[1]).slice(0, 5);
  let x = 24;
  const barra = top
    .map(([nome, n]) => {
      const w = Math.max(2, ((largura - 48) * n) / total);
      const r = `<rect x="${x.toFixed(1)}" y="138" width="${w.toFixed(1)}" height="8" fill="${CORES_LINGUAGEM[nome] ?? t.suave}"/>`;
      x += w;
      return r;
    })
    .join("");
  html += `<clipPath id="b"><rect x="24" y="138" width="${largura - 48}" height="8" rx="4"/></clipPath><g clip-path="url(#b)">${barra}</g>`;
  html += top
    .map(([nome, n], i) => {
      const cx = 24 + (i % 3) * 150;
      const cy = 170 + Math.floor(i / 3) * 20;
      return `<circle cx="${cx + 5}" cy="${cy - 4}" r="5" fill="${CORES_LINGUAGEM[nome] ?? t.suave}"/><text x="${cx + 16}" y="${cy}" class="r">${esc(nome)} ${((100 * n) / total).toFixed(1)}%</text>`;
    })
    .join("");
  return moldura(t, largura, 210, "Estatísticas", "統計", html);
}

function cardContribuicoes(d, t) {
  const largura = 495;
  const itens = d.contribuicoes.slice(0, 5);
  const rotulo = (c) => (c.tipo === "issue" ? (c.estado === "aberto" ? "ISSUE" : "ISSUE ✓") : c.estado === "mergeado" ? "MERGEADO" : c.estado === "aberto" ? "PR ABERTO" : "PR FECHADO");
  const cor = (c) => (c.estado === "mergeado" || (c.tipo === "issue" && c.estado !== "aberto") ? t.ok : c.estado === "aberto" ? t.aberto : t.suave);
  const html = itens.length
    ? itens
        .map((c, i) => {
          const y = 76 + i * 44;
          return `<g class="l" style="animation-delay:${i * 0.12}s"><text x="24" y="${y}" class="s" fill="${cor(c)}">${rotulo(c)}</text><text x="112" y="${y}" class="x">${esc(cortar(c.titulo, 46))}</text><text x="112" y="${y + 18}" class="r">${esc(c.repo)}#${c.numero}</text></g>`;
        })
        .join("")
    : `<text x="24" y="90" class="r">Nenhuma contribuição externa ainda.</text>`;
  return moldura(t, largura, Math.max(120, 80 + itens.length * 44), "Contribuições em outros projetos", "貢献", html);
}

const dados = FIXTURE ? JSON.parse(readFileSync(FIXTURE, "utf8")) : await coletar();
mkdirSync(DESTINO, { recursive: true });
for (const [nome, tema] of Object.entries(TEMAS)) {
  writeFileSync(`${DESTINO}/estatisticas-${nome}.svg`, cardEstatisticas(dados, tema));
  writeFileSync(`${DESTINO}/contribuicoes-${nome}.svg`, cardContribuicoes(dados, tema));
}
console.log(`cards gerados em ${DESTINO}/`);
