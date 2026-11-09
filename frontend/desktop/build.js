// Prepara e impacchetta CineStudio per Mac (.dmg).
//
//   1. prende la versione web esportata da Expo (../dist)
//   2. la copia in desktop/web, che è quello che l'app desktop mostra
//   3. installa le librerie la prima volta (electron, electron-builder)
//   4. crea il .dmg in desktop/release
//
// Si lancia con:  npm run dist      (dentro frontend/desktop)
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const desktopDir = __dirname;
const frontendDir = path.resolve(__dirname, "..");
const dist = path.join(frontendDir, "dist");
const web = path.join(desktopDir, "web");
const buildDir = path.join(desktopDir, "build");

function fail(msg) {
  console.error("\n✖ " + msg + "\n");
  process.exit(1);
}

// 1. la versione web dell'app: si riesporta SEMPRE.
// Copiare una dist/ già presente vuol dire impacchettare codice vecchio (è
// successo: l'app desktop continuava a usare il bundle precedente), e
// `--clear` svuota anche la cache di Metro, perché l'indirizzo del backend
// viene scritto dentro il bundle in fase di esportazione.
console.log("› Esporto la versione web dell'app (un minuto) …");
fs.rmSync(dist, { recursive: true, force: true });
const exp = spawnSync("npx", ["expo", "export", "--platform", "web", "--clear"], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: false,
});
if (exp.status !== 0 || !fs.existsSync(path.join(dist, "index.html"))) {
  fail("L'esportazione della versione web non è riuscita (vedi messaggi sopra).");
}

// 2. copia dist -> desktop/web
console.log("› Copio la versione web in desktop/web …");
fs.rmSync(web, { recursive: true, force: true });
fs.cpSync(dist, web, { recursive: true });

// 3. icona dell'app
fs.mkdirSync(buildDir, { recursive: true });
const icon = path.join(frontendDir, "assets", "images", "icon.png");
if (fs.existsSync(icon)) fs.copyFileSync(icon, path.join(buildDir, "icon.png"));

// 4. librerie: solo la prima volta (o quando mancano)
if (!fs.existsSync(path.join(desktopDir, "node_modules", "electron-builder"))) {
  console.log("› Prima volta: scarico electron e electron-builder (qualche minuto) …");
  const install = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: desktopDir,
    stdio: "inherit",
  });
  if (install.status !== 0) fail("L'installazione delle librerie non è riuscita (vedi messaggi sopra).");
}

// 5. costruzione del .dmg UNIVERSALE: un solo file che gira sia sui Mac Intel
// sia su quelli Apple Silicon (dentro ci sono le due versioni di Electron).
// Senza --universal electron-builder userebbe solo l'architettura di questo
// Mac (Intel), e il .dmg non partirebbe in modo nativo su Apple Silicon.
console.log("› Creo il .dmg universale (la prima volta scarica Electron, circa 100 MB) …");
const builder = path.join(desktopDir, "node_modules", ".bin", "electron-builder");
const out = spawnSync(builder, ["--mac", "dmg", "--universal"], { cwd: desktopDir, stdio: "inherit" });
if (out.status !== 0) fail("electron-builder si è fermato con un errore (vedi messaggi sopra).");

const release = path.join(desktopDir, "release");
const dmgs = fs.existsSync(release)
  ? fs.readdirSync(release).filter((f) => f.endsWith(".dmg"))
  : [];
console.log("\n✔ Fatto.");
if (dmgs.length) {
  for (const d of dmgs) console.log("  " + path.join(release, d));
  console.log("\nApri il .dmg e trascina CineStudio nella cartella Applicazioni.");
} else {
  console.log("  Controlla la cartella: " + release);
}
