// La huella de la skill: SHA-256 del texto que la persona recibe, para que cambiar el
// texto sin subir `metadata.version` sea un test rojo y no un descuido (decisión 9).
//
// Algoritmo (si lo tocás, cambia toda huella guardada): se listan SKILL.md y todos los
// archivos de referencias/ (recursivo), se ordenan por ruta relativa a skills/supcoflow
// con "/" como separador y orden de bytes, y por cada uno se alimenta el hash con
// ruta, "\0", contenido (bytes tal cual) y "\0". El nombre entra para que renombrar o
// mover un archivo también cambie la huella.
//
// Uso: `npm run huella` imprime; `npm run huella -- --escribir` actualiza
// test/vectores/huella-de-la-skill.json. Se NIEGA a escribir si el texto cambió y la
// versión es la ya registrada: hay que subir metadata.version primero. Una skill sin
// publicar puede rehacer su huella con `--escribir --sin-subir-version` (a propósito
// largo: que se vea en el commit que se decidió). Hoy la versión sin publicar es la 0.3.0 (la 0.2.1 ya salió).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// La única versión que puede rehacer su huella: la que todavía no se publicó. Al publicarla, pasar a la siguiente.
const SIN_PUBLICAR = "0.3.0";

// HUELLA_RAIZ sólo existe para que el test pruebe las negativas sobre una copia.
const RAIZ = process.env.HUELLA_RAIZ ?? join(dirname(fileURLToPath(import.meta.url)), "..");
export const CARPETA_DE_LA_SKILL = join(RAIZ, "skills", "supcoflow");
export const ARCHIVO_DE_HUELLA = join(RAIZ, "test", "vectores", "huella-de-la-skill.json");

function archivosDe(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivosDe(join(dir, e.name)) : [join(dir, e.name)],
  );
}

export function rutasDeLaSkill() {
  const rutas = [
    "SKILL.md",
    ...archivosDe(join(CARPETA_DE_LA_SKILL, "referencias")).map((a) =>
      relative(CARPETA_DE_LA_SKILL, a).split("\\").join("/"),
    ),
  ];
  return rutas.sort((a, b) => (Buffer.compare(Buffer.from(a), Buffer.from(b))));
}

export function calcularHuella() {
  const h = createHash("sha256");
  for (const ruta of rutasDeLaSkill()) {
    h.update(ruta);
    h.update("\0");
    h.update(readFileSync(join(CARPETA_DE_LA_SKILL, ruta)));
    h.update("\0");
  }
  return h.digest("hex");
}

export function versionDeLaSkill() {
  const m = readFileSync(join(CARPETA_DE_LA_SKILL, "SKILL.md"), "utf8").match(
    /^\s+version:\s*"([^"]+)"\s*$/m,
  );
  if (!m) throw new Error("SKILL.md no tiene metadata.version");
  return m[1];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = versionDeLaSkill();
  const huella = calcularHuella();
  const args = process.argv.slice(2);
  if (!args.includes("--escribir")) {
    console.log(JSON.stringify({ version, huella }, null, 2));
  } else {
    const previo = existsSync(ARCHIVO_DE_HUELLA)
      ? JSON.parse(readFileSync(ARCHIVO_DE_HUELLA, "utf8"))
      : null;
    // Una versión publicada no se reescribe NUNCA: SIN_PUBLICAR es la única sin publicar.
    // Si se publica, esta excepción hay que sacarla junto con SIN_PUBLICAR de acá.
    if (args.includes("--sin-subir-version") && previo && previo.version !== SIN_PUBLICAR) {
      console.error(
        `--sin-subir-version sólo vale para la ${SIN_PUBLICAR} (sin publicar); la registrada es ${previo.version}: subí metadata.version.`,
      );
      process.exit(1);
    }
    if (
      previo &&
      previo.version === version &&
      previo.huella !== huella &&
      !args.includes("--sin-subir-version")
    ) {
      console.error(
        `El texto cambió pero metadata.version sigue en ${version}. Subí la versión en SKILL.md ` +
          "(o, si la skill no se publicó, repetí con --sin-subir-version).",
      );
      process.exit(1);
    }
    writeFileSync(ARCHIVO_DE_HUELLA, JSON.stringify({ version, huella }, null, 2) + "\n");
    console.log(`huella-de-la-skill.json: ${version} ${huella}`);
  }
}
