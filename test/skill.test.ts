import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos: es el mismo algoritmo que usa `npm run huella`
import { calcularHuella } from "../scripts/huella.mjs";

const RAIZ = join(__dirname, "..");
const CARPETA = join(RAIZ, "skills", "supcoflow");
const leer = (...p: string[]) => readFileSync(join(...p), "utf8");

const skillMd = leer(CARPETA, "SKILL.md");
const textosDeLaSkill: { ruta: string; texto: string }[] = [
  { ruta: "SKILL.md", texto: skillMd },
  ...readdirSync(join(CARPETA, "referencias")).map((f) => ({
    ruta: `referencias/${f}`,
    texto: leer(CARPETA, "referencias", f),
  })),
];

type Describir = {
  version: string;
  comandos: { nombre: string; flags: string[] }[];
  flags_globales: string[];
};
const describir: Describir = JSON.parse(leer(RAIZ, "test", "vectores", "describir-0.6.0.json"));

// ---------------------------------------------------------------------------------
// YAML mínimo: el encabezado de una skill es chico y fijo (escalares y UN nivel
// anidado). Una dependencia de YAML entera para esto sería superficie sin motivo.
// ---------------------------------------------------------------------------------
function encabezadoYaml(texto: string): Record<string, unknown> {
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("falta el encabezado YAML entre ---");
  const salida: Record<string, unknown> = {};
  let anidado: Record<string, string> | null = null;
  for (const linea of m[1].split("\n")) {
    if (!linea.trim()) continue;
    const sangrada = /^\s+/.test(linea);
    const kv = linea.trim().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) throw new Error(`línea de YAML que no entiendo: ${linea}`);
    const [, clave, crudo] = kv;
    const valor = crudo.replace(/^"(.*)"$/, "$1");
    if (sangrada) {
      if (!anidado) throw new Error(`sangría sin padre: ${linea}`);
      anidado[clave] = valor;
    } else if (crudo === "") {
      anidado = {};
      salida[clave] = anidado;
    } else {
      anidado = null;
      salida[clave] = valor;
    }
  }
  return salida;
}

// ---------------------------------------------------------------------------------
// Comandos y flags contra `describir --json`.
// El vector da cada comando como UN nombre ("guia publicar", "instalacion anotar",
// "quien-soy") y cada flag como "--x: explicación" (o "--repo owner/repo: ..."), con
// los globales aparte. Por eso: de cada `supcoflow` se leen las dos palabras que le
// siguen y se prueba primero el nombre de dos palabras y después el de una (el más
// largo gana); si ninguno está en el vector, es un comando inventado.
// Sólo se miran los pedazos de código (``…`` y bloques): la prosa dice «supcoflow»
// como nombre del producto («el chat de supcoflow»), y `/supcoflow go` es la orden
// de la persona al asistente, no un comando de terminal.
// ---------------------------------------------------------------------------------
const NOMBRES = new Set(describir.comandos.map((c) => c.nombre));
// Grupos: la primera palabra de los comandos de dos palabras en el vector real
// ("guia publicar", "instalacion anotar", "chat prender"...). Los demás son de una
// palabra ("quien-soy", "widget"). En 0.6.0 ninguna palabra es a la vez grupo y comando.
const GRUPOS = new Set([...NOMBRES].filter((n) => n.includes(" ")).map((n) => n.split(" ")[0]));
const SOLOS = new Set([...NOMBRES].filter((n) => !n.includes(" ")));
const FLAGS_CONOCIDOS = new Set(
  [...describir.comandos.flatMap((c) => c.flags), ...describir.flags_globales].flatMap((f) => {
    const m = f.match(/^(--[a-z][a-z-]*)(?:,\s*(-[a-z]))?/);
    return m ? [m[1], ...(m[2] ? [m[2]] : [])] : [];
  }),
);
// Flags de otras herramientas que la skill puede nombrar. Lista cerrada: un flag
// ajeno nuevo se agrega acá a propósito; cualquier otro desconocido falla.
// --force está sólo para que la skill pueda PROHIBIRLO («Nunca `--force`»), no para usarlo.
const FLAGS_AJENOS = new Set(["--save-exact", "--porcelain", "--short", "--ignored", "--name-only", "--force"]);

function pedazosDeCodigo(texto: string): string[] {
  const salida: string[] = [];
  const sinBloques = texto.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, b: string) => {
    salida.push(...b.split("\n"));
    return "\n";
  });
  for (const m of sinBloques.matchAll(/`([^`\n]+)`/g)) salida.push(m[1]);
  return salida;
}

function prosa(texto: string): string {
  return texto.replace(/```[^\n]*\n[\s\S]*?```/g, "\n").replace(/`[^`\n]+`/g, " ");
}

// Un ``` sin cerrar haría que el resto del archivo se lea como código (o al revés):
// que nada escape a los revisores por estar mal cerrado.
function fencesDesbalanceadas(texto: string): boolean {
  return texto.split("\n").filter((l) => /^\s*```/.test(l)).length % 2 !== 0;
}

// Una invocación va desde `supcoflow` (o `supcoflow@X`) hasta el próximo separador de
// shell. `supcoflow` como nombre de otra cosa (@supcoflow/chat, .supcoflow/guia.md,
// supcoflow-skills, chat.supcoflow.dev) no es invocación.
const INVOCACION = /(?<![/\w@.-])supcoflow(?:@[\w.]+)?(?![\w/@-]|\.\w)([^&|;]*)/g;
function invocacionesDe(pedazo: string): { tokens: string[]; desde: number; hasta: number }[] {
  return [...pedazo.matchAll(INVOCACION)].map((m) => ({
    tokens: m[1].split(/\s+/).filter(Boolean),
    desde: m.index!,
    hasta: m.index! + m[0].length,
  }));
}

// Regla del comando: se saltean los flags iniciales (`supcoflow --json widget`), y la
// primera palabra que no es flag, sea cual sea (mayúsculas, dígitos, guion bajo), tiene
// que ser un comando de una palabra o un grupo. Si es un grupo, la siguiente palabra
// que no es flag tiene que formar un comando del vector: `guia borrar` falla aunque
// `guia` exista, y `guia` sin subcomando también. Un comando de una palabra no mira
// lo que le sigue (son sus argumentos).
export function comandosInventados(texto: string): string[] {
  const malos: string[] = [];
  for (const pedazo of pedazosDeCodigo(texto)) {
    for (const { tokens } of invocacionesDe(pedazo)) {
      const palabras = tokens.filter((t) => !t.startsWith("-"));
      const [a, b] = palabras;
      if (a === undefined) continue; // `supcoflow` solo, o `supcoflow --json`
      if (SOLOS.has(a)) continue;
      if (GRUPOS.has(a)) {
        if (b !== undefined && NOMBRES.has(`${a} ${b}`)) continue;
        malos.push(b === undefined ? `${a} (falta el subcomando)` : `${a} ${b}`);
        continue;
      }
      malos.push(a);
    }
  }
  return malos;
}

// Dentro de una invocación de supcoflow, el flag tiene que existir en describir (ni
// siquiera vale uno ajeno conocido). Fuera de una invocación (npm, git, prosa) vale lo
// de describir o la lista cerrada de ajenos: `npx skills add x --foo` falla.
export function flagsInventados(texto: string): string[] {
  const malos: string[] = [];
  const FLAG = /(?<![\w-])(--[a-z][a-z-]*)/g;
  for (const pedazo of pedazosDeCodigo(texto)) {
    const rangos = invocacionesDe(pedazo);
    for (const m of pedazo.matchAll(FLAG)) {
      const dentro = rangos.some((r) => m.index! >= r.desde && m.index! < r.hasta);
      const ok = FLAGS_CONOCIDOS.has(m[1]) || (!dentro && FLAGS_AJENOS.has(m[1]));
      if (!ok) malos.push(m[1]);
    }
  }
  for (const m of prosa(texto).matchAll(FLAG))
    if (!FLAGS_CONOCIDOS.has(m[1]) && !FLAGS_AJENOS.has(m[1])) malos.push(m[1]);
  return malos;
}

// Las acciones que son de la consola (la API las rechaza por clave) y lo que gasta:
// ninguna puede aparecer como algo a correr. La terminal 0.6.0 no tiene ningún comando
// de estas (el vector lo prueba abajo), así que sólo puede asomar un comando inventado
// o un script del motor (`npm run tope|invitar|aprobar|operador|clave`).
const PROHIBIDOS: RegExp[] = [
  /supcoflow(?:@[\w.]+)?\s+(tope|probar|fabrica|desarrollo|acceso|invitar|aprobar|operador)\b/, // tope, gasto, fábrica, acceso
  /supcoflow(?:@[\w.]+)?\s+proyecto\s+(borrar|eliminar|delete|rm)\b/, // borrar el proyecto
  /supcoflow(?:@[\w.]+)?\s+(equipo|miembros|usuarios)\b/, // dar acceso a personas
  /npm run (tope|invitar|aprobar|operador|clave|clave-de-acceso)\b/,
  /--tope\b|--usd\b/,
];
function accionesProhibidas(texto: string): string[] {
  return pedazosDeCodigo(texto).filter((p) => PROHIBIDOS.some((r) => r.test(p)));
}

describe("el encabezado", () => {
  const y = encabezadoYaml(skillMd);
  it("name es supcoflow y es el nombre de la carpeta", () => {
    expect(y.name).toBe("supcoflow");
    expect(basename(CARPETA)).toBe(y.name);
  });
  it("description entra en 1024 caracteres", () => {
    expect(typeof y.description).toBe("string");
    expect((y.description as string).length).toBeGreaterThan(0);
    expect((y.description as string).length).toBeLessThanOrEqual(1024);
  });
  it("metadata.version es semver", () => {
    const meta = y.metadata as Record<string, string>;
    expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
  it("el parser mínimo rechaza lo que no entiende", () => {
    expect(() => encabezadoYaml("sin encabezado")).toThrow();
  });
});

describe("los comandos y flags contra describir", () => {
  it.each(textosDeLaSkill)("$ruta: cada `supcoflow <comando>` existe", ({ texto }) => {
    expect(comandosInventados(texto)).toEqual([]);
  });
  it.each(textosDeLaSkill)("$ruta: cada --flag existe", ({ texto }) => {
    expect(flagsInventados(texto)).toEqual([]);
  });
  it.each(textosDeLaSkill)("$ruta: los ``` están balanceados", ({ texto }) => {
    expect(fencesDesbalanceadas(texto)).toBe(false);
  });
  it("control: comandos inventados", () => {
    expect(comandosInventados("corré `supcoflow instalar`")).toEqual(["instalar"]);
    expect(comandosInventados("`supcoflow Foo`")).toEqual(["Foo"]);
    expect(comandosInventados("`supcoflow v2_x --json`")).toEqual(["v2_x"]);
    expect(comandosInventados("`supcoflow --json instalar`")).toEqual(["instalar"]);
    expect(comandosInventados("`supcoflow guia borrar`")).toEqual(["guia borrar"]);
    expect(comandosInventados("`supcoflow --json guia borrar`")).toEqual(["guia borrar"]);
    expect(comandosInventados("`supcoflow guia`")).toEqual(["guia (falta el subcomando)"]);
    expect(comandosInventados("`supcoflow widget && supcoflow nada`")).toEqual(["nada"]);
  });
  it("control: lo válido pasa", () => {
    expect(comandosInventados("```\nnpx -y supcoflow@0.6.0 guia publicar --json\n```")).toEqual([]);
    expect(comandosInventados("`supcoflow instalacion anotar --skill 0.1.0`")).toEqual([]);
    expect(comandosInventados("`supcoflow --json widget`")).toEqual([]);
    expect(comandosInventados("`supcoflow quien-soy | cat`")).toEqual([]);
    expect(comandosInventados("el chat de supcoflow instala; pedí `/supcoflow go`")).toEqual([]);
    expect(comandosInventados("`npm i @supcoflow/chat@2.2.1` en `.supcoflow/guia.md`")).toEqual([]);
  });
  it("control: flags inventados", () => {
    expect(flagsInventados("`supcoflow widget --magia`")).toEqual(["--magia"]);
    expect(flagsInventados("`supcoflow widget --save-exact`")).toEqual(["--save-exact"]);
    expect(flagsInventados("`npx skills add x --foo`")).toEqual(["--foo"]);
    expect(flagsInventados("`git status --bar`")).toEqual(["--bar"]);
    expect(flagsInventados("usá --inventado en prosa")).toEqual(["--inventado"]);
    expect(flagsInventados("`supcoflow widget --json`")).toEqual([]);
    expect(flagsInventados("`npm i @supcoflow/chat@2.2.1 --save-exact`")).toEqual([]);
    expect(flagsInventados("`git status --porcelain`")).toEqual([]);
  });
  it("control: un ``` sin cerrar se detecta", () => {
    expect(fencesDesbalanceadas("```\nsupcoflow widget\n")).toBe(true);
    expect(fencesDesbalanceadas("```\nx\n```\n")).toBe(false);
  });
});

describe("la versión de la terminal", () => {
  const fijadas = skillMd.match(/supcoflow@[^\s`'")]+/g) ?? [];
  it("SKILL.md fija la terminal y es la del vector", () => {
    expect(fijadas.length).toBeGreaterThan(0);
    for (const f of fijadas) expect(f).toBe(`supcoflow@${describir.version}`);
  });
  it("ningún archivo usa @latest ni una versión distinta", () => {
    for (const { texto } of textosDeLaSkill) {
      expect(texto).not.toMatch(/supcoflow@latest/);
      for (const f of texto.match(/(?<![/\w-])supcoflow@[^\s`'")]+/g) ?? [])
        expect(f).toBe(`supcoflow@${describir.version}`);
    }
  });
});

describe("la guía de ejemplo", () => {
  const ejemplo = leer(RAIZ, "test", "vectores", "guia-de-ejemplo.md");
  // Calculado una vez y comparado a mano con src/guia/vectores/guia-de-ejemplo.md del
  // motor: si el motor cambia su ejemplo, este número y la copia se rehacen juntos.
  const HUELLA_DE_LA_GUIA_DE_EJEMPLO =
    "cf6189313894995b9715def5f6b9df94b0501717f056bd0317ffa8a7225095dd";
  it("el vector es el mismo que el del motor", () => {
    expect(createHash("sha256").update(readFileSync(join(RAIZ, "test/vectores/guia-de-ejemplo.md"))).digest("hex")).toBe(
      HUELLA_DE_LA_GUIA_DE_EJEMPLO,
    );
  });
  it("referencias/guia.md lo incluye literal", () => {
    expect(leer(CARPETA, "referencias", "guia.md")).toContain(ejemplo.trimEnd());
  });
});

describe("la versión clavada al texto", () => {
  const registro = JSON.parse(leer(RAIZ, "test", "vectores", "huella-de-la-skill.json")) as {
    version: string;
    huella: string;
  };
  const version = (encabezadoYaml(skillMd).metadata as Record<string, string>).version;
  it("la huella del texto es la registrada para su versión", () => {
    const huella = calcularHuella();
    if (version === registro.version) {
      expect(
        huella,
        "el texto cambió y metadata.version sigue igual: subí la versión y corré `npm run huella -- --escribir`",
      ).toBe(registro.huella);
    } else {
      expect.fail(
        `metadata.version (${version}) no es la registrada (${registro.version}): corré \`npm run huella -- --escribir\``,
      );
    }
  });
});

describe("--sin-subir-version", () => {
  // Sobre una copia (HUELLA_RAIZ): la huella de una versión publicada no se reescribe.
  function correr(versionRegistrada: string) {
    const raiz = mkdtempSync(join(tmpdir(), "huella-"));
    cpSync(join(RAIZ, "skills"), join(raiz, "skills"), { recursive: true });
    cpSync(join(RAIZ, "test"), join(raiz, "test"), { recursive: true });
    const archivo = join(raiz, "test", "vectores", "huella-de-la-skill.json");
    const registro = JSON.stringify({ version: versionRegistrada, huella: "0".repeat(64) });
    writeFileSync(archivo, registro);
    const r = spawnSync("node", [join(RAIZ, "scripts", "huella.mjs"), "--escribir", "--sin-subir-version"], {
      env: { ...process.env, HUELLA_RAIZ: raiz },
      encoding: "utf8",
    });
    return { r, despues: readFileSync(archivo, "utf8"), registro };
  }
  it("se niega si la versión registrada no es la 0.1.0", () => {
    const { r, despues, registro } = correr("1.0.0");
    expect(r.status).toBe(1);
    expect(despues).toBe(registro);
  });
  it("con la 0.1.0 (sin publicar) reescribe", () => {
    const { r, despues, registro } = correr("0.1.0");
    expect(r.status).toBe(0);
    expect(despues).not.toBe(registro);
  });
});

describe("lo que la skill no hace", () => {
  it.each(textosDeLaSkill)("$ruta: ninguna acción de consola ni de gasto aparece como algo a correr", ({ texto }) => {
    expect(accionesProhibidas(texto)).toEqual([]);
  });
  it("control: el revisor las atrapa", () => {
    for (const mala of [
      "`supcoflow tope --usd 50`",
      "`npx -y supcoflow@0.6.0 proyecto borrar`",
      "`supcoflow fabrica encender`",
      "`supcoflow acceso dar`",
      "`npm run invitar -- --login x`",
    ])
      expect(accionesProhibidas(mala), mala).not.toEqual([]);
  });
  it("la terminal 0.6.0 no tiene comandos de esas acciones", () => {
    for (const nombre of NOMBRES) expect(nombre).not.toMatch(/tope|borrar|fabrica|acceso|probar|invitar/);
  });
  it("ninguna clave scf_ escrita en los textos", () => {
    for (const { texto } of textosDeLaSkill) expect(texto).not.toMatch(/scf_[A-Za-z0-9]{8,}/);
  });
});
