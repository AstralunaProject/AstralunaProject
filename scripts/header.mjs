import { writeFileSync } from "node:fs";

const W = 1000;
const H = 240;

function aleatorio(semente) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const TEMAS = {
  dark: {
    ceu: ["#0b1026", "#1a1446", "#2b1b5a"],
    estrela: "#ffffff",
    lua: "#f5e6b8",
    brilhoLua: "#f5e6b8",
    titulo: "#f4f1ff",
    subtitulo: "#b9b3e6",
    destaque: "#c9a7ff",
    sakura: ["#ffc6dc", "#ff9ec4", "#ffd9e8"],
    kanji: "#ffffff",
  },
  light: {
    ceu: ["#e9e4ff", "#d8e3ff", "#fbe9f2"],
    estrela: "#6b5bd6",
    lua: "#f2c94c",
    brilhoLua: "#f2c94c",
    titulo: "#1f1846",
    subtitulo: "#4b4580",
    destaque: "#7a4fe0",
    sakura: ["#ff8fb8", "#f772a3", "#ffb3cf"],
    kanji: "#3b2a8a",
  },
};

function estrelas(t) {
  const r = aleatorio(20261030);
  let out = "";
  for (let i = 0; i < 70; i++) {
    const x = (r() * W).toFixed(1);
    const y = (r() * H).toFixed(1);
    const raio = (0.6 + r() * 1.6).toFixed(2);
    const dur = (2 + r() * 4).toFixed(2);
    const atraso = (r() * 5).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${raio}" fill="${t.estrela}" class="e" style="animation-duration:${dur}s;animation-delay:-${atraso}s"/>`;
  }
  return out;
}

const PETALA = "M0,-9 C5,-9 9,-4 7,3 C5,8 2,9 0,6 C-2,9 -5,8 -7,3 C-9,-4 -5,-9 0,-9 Z";

function sakura(t) {
  const r = aleatorio(4242);
  let out = "";
  for (let i = 0; i < 18; i++) {
    const x = (40 + r() * (W - 80)).toFixed(0);
    const escala = (0.55 + r() * 0.75).toFixed(2);
    const dur = (7 + r() * 7).toFixed(2);
    const atraso = (r() * 14).toFixed(2);
    const queda = 1 + (i % 3);
    const cor = t.sakura[i % t.sakura.length];
    out += `<g transform="translate(${x} -20)"><g class="p${queda}" style="animation-duration:${dur}s;animation-delay:-${atraso}s"><path d="${PETALA}" fill="${cor}" transform="scale(${escala})" opacity=".9"/></g></g>`;
  }
  return out;
}

function svg(nome) {
  const t = TEMAS[nome];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AstralunaProject: open source tools for developers building in Brazil">
<defs>
  <linearGradient id="ceu" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${t.ceu[0]}"/><stop offset=".55" stop-color="${t.ceu[1]}"/><stop offset="1" stop-color="${t.ceu[2]}"/>
  </linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="${t.brilhoLua}" stop-opacity=".45"/><stop offset="1" stop-color="${t.brilhoLua}" stop-opacity="0"/></radialGradient>
  <mask id="crescente"><circle cx="860" cy="92" r="44" fill="#fff"/><circle cx="880" cy="78" r="40" fill="#000"/></mask>
  <clipPath id="borda"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<style>
  .e { animation-name: brilho; animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
  @keyframes brilho { 0%,100% { opacity: .15 } 50% { opacity: 1 } }
  .halo { animation: pulso 6s ease-in-out infinite; transform-origin: 860px 92px; }
  @keyframes pulso { 0%,100% { transform: scale(1); opacity: .8 } 50% { transform: scale(1.12); opacity: 1 } }
  .cadente { animation: cadente 9s linear infinite; opacity: 0; }
  @keyframes cadente { 0% { transform: translate(0,0); opacity: 0 } 3% { opacity: 1 } 12% { transform: translate(-260px,130px); opacity: 0 } 100% { transform: translate(-260px,130px); opacity: 0 } }
  .p1, .p2, .p3 { animation-iteration-count: infinite; animation-timing-function: linear; }
  .p1 { animation-name: queda1; } .p2 { animation-name: queda2; } .p3 { animation-name: queda3; }
  @keyframes queda1 { 0% { transform: translate(0,0) rotate(0) } 50% { transform: translate(-40px,140px) rotate(200deg) } 100% { transform: translate(10px,290px) rotate(380deg) } }
  @keyframes queda2 { 0% { transform: translate(0,0) rotate(30deg) } 50% { transform: translate(35px,140px) rotate(-150deg) } 100% { transform: translate(-25px,290px) rotate(-320deg) } }
  @keyframes queda3 { 0% { transform: translate(0,0) rotate(-20deg) } 50% { transform: translate(-60px,150px) rotate(160deg) } 100% { transform: translate(-90px,290px) rotate(300deg) } }
  .kanji { font: 700 150px 'Yu Mincho', 'Hiragino Mincho ProN', 'Noto Serif JP', 'Noto Serif CJK JP', 'IPAMincho', serif; fill: ${t.kanji}; opacity: .07; }
  .jp { font: 500 15px 'Yu Gothic', 'Hiragino Sans', 'Noto Sans JP', 'Noto Sans CJK JP', 'IPAGothic', sans-serif; fill: ${t.subtitulo}; letter-spacing: 2px; animation: surge 1.4s 1.2s ease-out both; }
  .titulo { font: 700 54px 'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif; fill: ${t.titulo}; letter-spacing: -1px; animation: surge 1.4s ease-out both; }
  .sub { font: 400 21px 'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif; fill: ${t.subtitulo}; animation: surge 1.4s .5s ease-out both; }
  .tag { font: 600 15px 'Segoe UI', Ubuntu, 'Helvetica Neue', Arial, sans-serif; fill: ${t.destaque}; letter-spacing: 3px; animation: surge 1.4s .9s ease-out both; }
  @keyframes surge { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } .cadente, .p1, .p2, .p3 { display: none; } }
</style>
<g clip-path="url(#borda)">
  <rect width="${W}" height="${H}" fill="url(#ceu)"/>
  ${estrelas(t)}
  <g class="cadente"><line x1="700" y1="30" x2="760" y2="0" stroke="${t.estrela}" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>
  <text x="600" y="200" class="kanji">星月</text>
  <circle class="halo" cx="860" cy="92" r="90" fill="url(#halo)"/>
  <rect x="800" y="40" width="120" height="110" fill="${t.lua}" mask="url(#crescente)"/>
  <text x="64" y="96" class="titulo">AstralunaProject</text>
  <text x="66" y="138" class="sub">Open source tools for developers building in Brazil</text>
  <text x="66" y="182" class="tag">TYPESCRIPT · PYTHON · OPEN SOURCE</text>
  <text x="66" y="212" class="jp">星月プロジェクト · オープンソース</text>
  ${sakura(t)}
</g>
</svg>
`;
}

for (const nome of Object.keys(TEMAS)) writeFileSync(new URL(`../assets/header-${nome}.svg`, import.meta.url), svg(nome));
console.log("assets/header-dark.svg e assets/header-light.svg gerados");
