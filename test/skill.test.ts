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
// El vector es la salida de `supcoflow describe --json` de la terminal fijada. Se leen sus claves en inglés
// (`commands`, `name`, `global_flags`) y, por si la 0.9.0 publicada conserva las del 0.7.0, las castellanas:
// al re-sincronizar el vector con la terminal real, esto es lo único que puede necesitar tocarse.
function leerDescribe(archivo: string): Describir {
  const crudo = JSON.parse(leer(RAIZ, "test", "vectores", archivo));
  const comandos = (crudo.commands ?? crudo.comandos) as { name?: string; nombre?: string; flags: string[] }[];
  return {
    version: crudo.version,
    comandos: comandos.map((c) => ({ nombre: (c.name ?? c.nombre)!, flags: c.flags })),
    flags_globales: crudo.global_flags ?? crudo.flags_globales,
  };
}
const describir: Describir = leerDescribe("describe-0.9.0.json");

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
// Comandos y flags contra `describe --json`.
// El vector da cada comando como UN nombre ("guide publish", "install record",
// "whoami") y cada flag como "--x: explicación" (o "--repo owner/repo: ..."), con
// los globales aparte. Por eso: de cada `supcoflow` se leen las dos palabras que le
// siguen y se prueba primero el nombre de dos palabras y después el de una (el más
// largo gana); si ninguno está en el vector, es un comando inventado.
// Sólo se miran los pedazos de código (``…`` y bloques): la prosa dice «supcoflow»
// como nombre del producto («el chat de supcoflow»), y `/supcoflow go` es la orden
// de la persona al asistente, no un comando de terminal.
// ---------------------------------------------------------------------------------
const NOMBRES = new Set(describir.comandos.map((c) => c.nombre));
// Grupos: la primera palabra de los comandos de dos palabras en el vector real
// ("guide publish", "install record", "chat on"...). Los demás son de una
// palabra ("whoami", "widget", "test"). En 0.9.0 ninguna palabra es a la vez grupo y comando.
const GRUPOS = new Set([...NOMBRES].filter((n) => n.includes(" ")).map((n) => n.split(" ")[0]));
const SOLOS = new Set([...NOMBRES].filter((n) => !n.includes(" ")));
const FLAGS_CONOCIDOS = new Set(
  [...describir.comandos.flatMap((c) => c.flags), ...describir.flags_globales].flatMap((f) => {
    const m = f.match(/^(--[a-z][a-z-]*)(?:,\s*(-[a-z]))?/);
    return m ? [m[1], ...(m[2] ? [m[2]] : [])] : [];
  }),
);
// Los flags de CADA comando (más los globales): la terminal real rechaza con `flag_no_aplica`
// (salida 3) un flag que existe pero es de otro comando, p. ej. `widget --ceiling`.
// `FLAGS_CONOCIDOS` (la unión) sólo vale para lo que no está dentro de una invocación.
const nombresDeFlags = (lista: string[]): string[] =>
  lista.flatMap((f) => {
    const m = f.match(/^(--[a-z][a-z-]*)(?:,\s*(-[a-z]))?/);
    return m ? [m[1], ...(m[2] ? [m[2]] : [])] : [];
  });
const FLAGS_GLOBALES = new Set(nombresDeFlags(describir.flags_globales));
const FLAGS_POR_COMANDO = new Map<string, Set<string>>(
  describir.comandos.map((c) => [c.nombre, new Set([...nombresDeFlags(c.flags), ...FLAGS_GLOBALES])]),
);
// Flags de otras herramientas que la skill puede nombrar. Lista cerrada: un flag
// ajeno nuevo se agrega acá a propósito; cualquier otro desconocido falla.
// --force está sólo para que la skill pueda PROHIBIRLO («Nunca `--force`»), no para usarlo.
const FLAGS_AJENOS = new Set(["--save-exact", "--porcelain", "--short", "--ignored", "--name-only", "--force", "--show-current", "--list"]);

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
// shell. `supcoflow` como nombre de otra cosa (@supcoflow/chat, .supcoflow/guide.md,
// supcoflow-skills, chat.supcoflow.dev) no es invocación.
// `git remote add supcoflow <url>` nombra un remoto de git que se llama así: tampoco es una invocación (1A.1, 2a).
const INVOCACION = /(?<![/\w@.-])(?<!git remote (?:add|set-url) )supcoflow(?:@[\w.]+)?(?![\w/@-]|\.\w)([^&|;]*)/g;
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
// que no es flag tiene que formar un comando del vector: `guide delete` falla aunque
// `guide` exista, y `guide` sin subcomando también. Un comando de una palabra no mira
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

// El comando de una invocación (el nombre de describir: «widget», «guide check»), o null si
// no es uno (eso lo dice `comandosInventados`, no éste).
function comandoDe(tokens: string[]): string | null {
  const [a, b] = tokens.filter((t) => !t.startsWith("-"));
  if (a === undefined) return null;
  if (SOLOS.has(a)) return a;
  if (GRUPOS.has(a) && b !== undefined && NOMBRES.has(`${a} ${b}`)) return `${a} ${b}`;
  return null;
}

// Dentro de una invocación de supcoflow, el flag tiene que ser de ESE comando (o global): uno
// que existe en otro comando también falla, como en la terminal real. Si el comando no existe
// no se mira (ya lo marca `comandosInventados`) y vale la unión. Fuera de una invocación (npm,
// git, prosa) vale lo de describir o la lista cerrada de ajenos: `npx skills add x --foo` falla.
export function flagsInventados(texto: string): string[] {
  const malos: string[] = [];
  const FLAG = /(?<![\w-])(--[a-z][a-z-]*)/g;
  for (const pedazo of pedazosDeCodigo(texto)) {
    const invocaciones = invocacionesDe(pedazo);
    for (const m of pedazo.matchAll(FLAG)) {
      const inv = invocaciones.find((r) => m.index! >= r.desde && m.index! < r.hasta);
      if (!inv) {
        if (!FLAGS_CONOCIDOS.has(m[1]) && !FLAGS_AJENOS.has(m[1])) malos.push(m[1]);
        continue;
      }
      const comando = comandoDe(inv.tokens);
      const propios = comando ? FLAGS_POR_COMANDO.get(comando)! : FLAGS_CONOCIDOS;
      if (!propios.has(m[1])) malos.push(m[1]);
    }
  }
  for (const m of prosa(texto).matchAll(FLAG))
    if (!FLAGS_CONOCIDOS.has(m[1]) && !FLAGS_AJENOS.has(m[1])) malos.push(m[1]);
  return malos;
}

// Las acciones que son de la consola (la API las rechaza por clave) y lo que gasta:
// ninguna puede aparecer como algo a correr. La terminal 0.9.0 no tiene ningún comando
// de estas (el vector lo prueba abajo), así que sólo puede asomar un comando inventado
// o un script del motor (`npm run tope|invitar|aprobar|operador|clave`).
const PROHIBIDOS: RegExp[] = [
  /supcoflow(?:@[\w.]+)?\s+(cap|factory|development|access|invite|approve|operator|tope|fabrica|desarrollo|acceso|invitar|aprobar|operador)\b/, // tope, gasto, fábrica, acceso
  /supcoflow(?:@[\w.]+)?\s+(project|proyecto)\s+(delete|remove|rm|borrar|eliminar)\b/, // borrar el proyecto
  /supcoflow(?:@[\w.]+)?\s+(team|members|users|equipo|miembros|usuarios)\b/, // dar acceso a personas
  /npm run (tope|invitar|aprobar|operador|clave|clave-de-acceso)\b/,
  /--tope\b|--cap\b|--usd\b/,
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
    expect(comandosInventados("run `supcoflow deploy`")).toEqual(["deploy"]);
    expect(comandosInventados("run `supcoflow install`")).toEqual(["install (falta el subcomando)"]);
    expect(comandosInventados("`supcoflow Foo`")).toEqual(["Foo"]);
    expect(comandosInventados("`supcoflow v2_x --json`")).toEqual(["v2_x"]);
    expect(comandosInventados("`supcoflow --json deploy`")).toEqual(["deploy"]);
    expect(comandosInventados("`supcoflow guide delete`")).toEqual(["guide delete"]);
    expect(comandosInventados("`supcoflow --json guide delete`")).toEqual(["guide delete"]);
    expect(comandosInventados("`supcoflow guide`")).toEqual(["guide (falta el subcomando)"]);
    expect(comandosInventados("`supcoflow widget && supcoflow nada`")).toEqual(["nada"]);
    // los nombres castellanos de la 0.7.0 son alias ocultos: no salen en `describe`, la skill no los usa
    expect(comandosInventados("`supcoflow quien-soy`")).toEqual(["quien-soy"]);
    expect(comandosInventados("`supcoflow guia publicar`")).toEqual(["guia"]);
    expect(comandosInventados("`supcoflow probar --json`")).toEqual(["probar"]);
  });
  it("control: lo válido pasa", () => {
    expect(comandosInventados("```\nnpx -y supcoflow@0.9.0 guide publish --json\n```")).toEqual([]);
    expect(comandosInventados("`supcoflow install record --skill 0.1.0`")).toEqual([]);
    expect(comandosInventados("`supcoflow --json widget`")).toEqual([]);
    expect(comandosInventados("`supcoflow whoami | cat`")).toEqual([]);
    expect(comandosInventados("the chat of supcoflow installs; ask for `/supcoflow go`")).toEqual([]);
    expect(comandosInventados("`npm i @supcoflow/chat@2.3.0` and `.supcoflow/guide.md`")).toEqual([]);
    // el remoto de git que se llama «supcoflow» no es una invocación de la terminal
    expect(comandosInventados("`git remote add supcoflow https://github.com/o/r.git`")).toEqual([]);
    expect(comandosInventados("`git remote set-url supcoflow https://github.com/o/r.git`")).toEqual([]);
    expect(comandosInventados("`git remote add supcoflow x && supcoflow deploy`")).toEqual(["deploy"]);
  });
  it("control: flags inventados", () => {
    expect(flagsInventados("`supcoflow widget --magia`")).toEqual(["--magia"]);
    expect(flagsInventados("`supcoflow widget --save-exact`")).toEqual(["--save-exact"]);
    expect(flagsInventados("`npx skills add x --foo`")).toEqual(["--foo"]);
    expect(flagsInventados("`git status --bar`")).toEqual(["--bar"]);
    expect(flagsInventados("use --inventado in prose")).toEqual(["--inventado"]);
    expect(flagsInventados("`supcoflow test --autorizo-gasto`")).toEqual(["--autorizo-gasto"]); // alias oculto de la 0.7.0
    expect(flagsInventados("`supcoflow data set --permitir nada`")).toEqual(["--permitir"]);
    // un flag real puesto en un comando que no es suyo: la terminal lo rechaza (flag_no_aplica)
    expect(flagsInventados("`supcoflow widget --ceiling 2 --json`")).toEqual(["--ceiling"]);
    expect(flagsInventados("`supcoflow guide check --authorize-spend --json`")).toEqual(["--authorize-spend"]);
    expect(flagsInventados("`supcoflow --json guide check --authorize-spend`")).toEqual(["--authorize-spend"]);
    expect(flagsInventados("`supcoflow test --allow nothing`")).toEqual(["--allow"]);
    expect(flagsInventados("`supcoflow whoami && supcoflow widget --expect-policy save`")).toEqual(["--expect-policy"]);
    expect(flagsInventados("`supcoflow widget --json`")).toEqual([]);
    expect(flagsInventados("`supcoflow guide check --json`")).toEqual([]);
    expect(flagsInventados("`supcoflow data set --allow nothing`")).toEqual([]);
    expect(flagsInventados("`npm i @supcoflow/chat@2.3.0 --save-exact`")).toEqual([]);
    expect(flagsInventados("`supcoflow test --authorize-spend --ceiling 2.00 --expect-policy save`")).toEqual([]);
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

describe("el vector de describe es el de la terminal 0.9.0 (T9)", () => {
  const crudo = leer(RAIZ, "test", "vectores", "describe-0.9.0.json");
  const nombresDeArchivo = readdirSync(join(RAIZ, "test", "vectores"));
  it("hay un único vector de describe y es el de la 0.9.0", () => {
    expect(nombresDeArchivo.filter((f) => f.startsWith("describe-"))).toEqual(["describe-0.9.0.json"]);
    expect(JSON.parse(crudo).version).toBe("0.9.0");
  });
  it("lo que la skill nombra de la 0.8.1 sigue en lo que la terminal dice: maquina, intento_pendiente, contexto_incoherente y el remoto supcoflow", () => {
    for (const nombre of ["maquina", "intento_pendiente", "contexto_incoherente", "proyecto_del_clon_distinto", "archivo_del_clon_ilegible", "dueno_distinto_del_login", "sin_github", "git remote add supcoflow"])
      expect(crudo, nombre).toContain(nombre);
    for (const nombre of ["maquina", "intento_pendiente", "contexto_incoherente", "sin_repo"])
      expect(textosDeLaSkill.some(({ texto }) => texto.includes(nombre)), `la skill no nombra ${nombre}`).toBe(true);
  });
  it("el vector no es el de la 0.8.0: `project show` trae `contexto` y `test` trae `maquina`", () => {
    const d = JSON.parse(crudo) as { comandos: { nombre: string; resumen: string }[] };
    expect(d.comandos.find((c) => c.nombre === "project show")!.resumen).toContain("`contexto`");
    expect(d.comandos.find((c) => c.nombre === "test")!.resumen).toContain("`maquina`");
  });
  it("lo que la skill 0.4 usa de la 0.9.0 está en lo que la terminal dice: interfaz_propia, --shape own-interface, --file repetible, total 7 y aviso", () => {
    const d = JSON.parse(crudo) as { comandos: { nombre: string; flags: string[] }[] };
    expect(d.comandos.find((c) => c.nombre === "widget")!.flags.join("\n")).toContain("interfaz_propia");
    const registro = d.comandos.find((c) => c.nombre === "install record")!.flags.join("\n");
    expect(registro).toMatch(/--shape widget\|own-interface/);
    expect(registro).toMatch(/--file path:[^\n]*can be repeated/);
    expect(d.comandos.find((c) => c.nombre === "diagnose")!.flags.join("\n")).toContain("total: 7");
    for (const nombre of ["interfaz_propia", "own-interface", "aviso", "archivos", "forma", "contrato"])
      expect(crudo, nombre).toContain(nombre);
  });
});

describe("la guía de ejemplo", () => {
  const ejemplo = leer(RAIZ, "test", "vectores", "guia-de-ejemplo.md");
  // Calculado una vez y comparado a mano con src/guia/vectores/guia-de-ejemplo.md del
  // motor (T2.3): si el motor cambia su ejemplo, este número y la copia se rehacen juntos.
  // El vector es copia de `src/guia/vectores/guia-de-ejemplo.md` de fm/e1-motor (plan 1A, T4.1); V-K lo compara antes de publicar.
  const HUELLA_DE_LA_GUIA_DE_EJEMPLO =
    "5a3e96c98f5a7fe05791084bf56520f17cfcc696f135045584515024f9e897ad";
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
  it("se niega si la versión registrada no es la sin publicar (0.4.0)", () => {
    const { r, despues, registro } = correr("1.0.0");
    expect(r.status).toBe(1);
    expect(despues).toBe(registro);
  });
  it("con la 0.4.0 (sin publicar) reescribe", () => {
    const { r, despues, registro } = correr("0.4.0");
    expect(r.status).toBe(0);
    expect(despues).not.toBe(registro);
  });
});

// El único comando que gasta, tal cual: el techo y la política son los que la persona vio (R5), nunca releídos.
const COMANDO_QUE_GASTA = "`supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy> --json`";

describe("lo que la skill no hace", () => {
  it.each(textosDeLaSkill)("$ruta: ninguna acción de consola ni de gasto aparece como algo a correr", ({ texto }) => {
    expect(accionesProhibidas(texto)).toEqual([]);
  });
  it("control: el revisor las atrapa", () => {
    for (const mala of [
      "`supcoflow tope --usd 50`",
      "`npx -y supcoflow@0.9.0 project delete`",
      "`npx -y supcoflow@0.9.0 proyecto borrar`",
      "`supcoflow factory on`",
      "`supcoflow fabrica encender`",
      "`supcoflow access give`",
      "`supcoflow acceso dar`",
      "`npm run invitar -- --login x`",
    ])
      expect(accionesProhibidas(mala), mala).not.toEqual([]);
  });
  it("la terminal 0.9.0 no tiene comandos de esas acciones", () => {
    for (const nombre of NOMBRES) expect(nombre).not.toMatch(/\bcap\b|delete|factory|access|invite|tope|borrar|fabrica|acceso|invitar/);
  });
  it("--authorize-spend sólo se nombra en el nivel 3 y en las reglas, y el nivel 3 pregunta antes", () => {
    for (const { ruta, texto } of textosDeLaSkill)
      if (texto.includes("--authorize-spend"))
        expect(["SKILL.md", "referencias/prueba.md"], ruta).toContain(ruta);
    const prueba = leer(CARPETA, "referencias", "prueba.md");
    const iPregunta = prueba.indexOf("**Ask the person**");
    const iComando = prueba.indexOf(COMANDO_QUE_GASTA);
    expect(iPregunta).toBeGreaterThan(0);
    expect(iComando).toBeGreaterThan(iPregunta);
    expect(prueba).toMatch(/never add `--authorize-spend` on your own/);
    expect(skillMd).toMatch(/never add\s+`--authorize-spend` without that yes/);
  });
  it("el nivel 3 nunca relanza un arranque_incierto desde la terminal y cuenta el cobro pendiente como tal", () => {
    const prueba = leer(CARPETA, "referencias", "prueba.md");
    expect(prueba).toMatch(/An `arranque_incierto` is not relaunched from the terminal/);
    expect(prueba).toMatch(/Never count it as 0/);
    expect(prueba).toMatch(/`pendiente` or `perdido`/);
  });
  it("ninguna clave scf_ escrita en los textos", () => {
    for (const { texto } of textosDeLaSkill) expect(texto).not.toMatch(/scf_[A-Za-z0-9]{8,}/);
  });
});

// ---------------------------------------------------------------------------------
// 0.3.0: inglés, la escena de la landing, las reglas del negocio con el diff, un solo chat.
// ---------------------------------------------------------------------------------
// Los textos se reparten en renglones al escribirlos: las frases se buscan con los espacios normalizados.
const P = (t: string) => t.replace(/\s+/g, " ");
// La promesa de 1B pide que el chat NO ofrezca capturas / señalar si el acuerdo las rechaza.
// En 1A el botón sigue apareciendo; ninguna instrucción puede mandar a «comprobar» lo contrario.
const PROMESA_DE_1B_EN_EL_BOTON: RegExp[] = [
  /\b(?:chat|widget)\b[^.]{0,40}\b(?:must|should|shall|will)? ?not (?:offer|show|display|attach)\b/i,
  /\b(?:does not|doesn't|do not|don't) (?:offer|show|display)\b[^.]{0,60}\b(?:screenshot|attach|pointing|point at)/i,
];
const seccion = (texto: string, desde: RegExp, hasta?: RegExp): string => {
  const i = texto.search(desde);
  expect(i, `no encuentro ${desde}`).toBeGreaterThanOrEqual(0);
  const resto = texto.slice(i + 1);
  const j = hasta ? resto.search(hasta) : -1;
  return j < 0 ? texto.slice(i) : texto.slice(i, i + 1 + j);
};
const enOrden = (crudo: string, piezas: string[]) => {
  const texto = P(crudo);
  let desde = -1;
  for (const p of piezas) {
    const i = texto.indexOf(p, desde + 1);
    expect(i, `falta, o está fuera de orden: ${p}`).toBeGreaterThan(desde);
    desde = i;
  }
};

describe("el texto está en inglés", () => {
  // Alarma parcial, no prueba: atrapa un renglón castellano olvidado, no una frase mal traducida (eso se lee).
  it.each(textosDeLaSkill)("$ruta: ningún carácter castellano (¿ ¡ ñ tildes)", ({ texto }) => {
    expect(texto.match(/[¿¡ñáéíóú]/g) ?? []).toEqual([]);
  });
  it("conserva «hablale a la persona en su idioma» (la charla del asistente no es el producto)", () => {
    expect(P(skillMd)).toMatch(/Talk to the person in the language they use/);
  });
  it("la skill es la 0.4.0 y fija la terminal 0.9.0", () => {
    expect((encabezadoYaml(skillMd).metadata as Record<string, string>).version).toBe("0.4.0");
    expect(describir.version).toBe("0.9.0");
    expect(P(skillMd)).toContain("npx -y supcoflow@0.9.0 describe --json");
    expect(P(skillMd)).toContain('if it says `"version":"0.9.0"`');
  });
  it("el vector de describe no trae ni un nombre de comando ni de flag castellano", () => {
    const crudo = leer(RAIZ, "test", "vectores", "describe-0.9.0.json");
    for (const castellano of ["quien-soy", "describir", "guia publicar", "instalacion anotar", "--autorizo-gasto", "--permitir", "--modo"])
      expect(crudo, castellano).not.toContain(castellano);
  });
});

describe("la tabla de errores de la guía sale de los motivos del motor", () => {
  type Motivo = { motivo: string; queHacer: string };
  const motivos: Motivo[] = JSON.parse(leer(RAIZ, "test", "vectores", "motivos-de-la-guia.json"));
  const guia = leer(CARPETA, "referencias", "guia.md");
  // `motivos-del-motor.json` es copia byte a byte de `src/guia/vectores/motivos.json` del motor (plan 1A, T4.1);
  // `motivos-de-la-guia.json` le suma `queHacer`, que es propio de la skill. El conjunto tiene que ser EXACTAMENTE el del motor.
  const delMotor: string[] = JSON.parse(leer(RAIZ, "test", "vectores", "motivos-del-motor.json"));
  it("hay motivos", () => expect(motivos.length).toBeGreaterThan(10));
  it("el conjunto de motivos de la skill es exactamente el del motor, sin repetidos", () => {
    expect(new Set(delMotor).size).toBe(delMotor.length);
    expect(motivos.map((m) => m.motivo).sort()).toEqual([...delMotor].sort());
  });
  it("cada motivo del motor tiene una fila en la tabla de errores de referencias/guia.md", () => {
    const filas = guia.split("\n").filter((l) => l.startsWith("| `"));
    for (const m of delMotor) expect(filas.filter((f) => f.startsWith(`| \`${m}\` |`)), m).toHaveLength(1);
  });
  it.each(motivos)("$motivo", ({ motivo, queHacer }) => {
    expect(P(guia)).toContain(`\`${motivo}\``);
    expect(P(guia)).toContain(queHacer);
  });
  it("usa la ruta nueva y las etiquetas nuevas, y nombra la caída a la vieja", () => {
    expect(P(guia)).toContain(".supcoflow/guide.md");
    for (const etiqueta of ["What it's for:", "What users can do:", "Common problems:", "Where:"]) expect(P(guia)).toContain(etiqueta);
    expect(P(guia)).toMatch(/\.supcoflow\/guia\.md` is the old name/);
  });
});

describe("la escena de la landing (spec §10)", () => {
  it("al conectar el repo dice las dos frases de la landing", () => {
    expect(P(skillMd)).toContain("The Supcoflow GitHub App isn't on <owner/repo> yet. Approve it in the browser.");
    expect(P(skillMd)).toContain("Connected. Created the project <slug>.");
  });
  it("las tres preguntas, con el texto exacto y en orden, en un solo bloque", () => {
    enOrden(skillMd, [
      "What can the chat see about your users?",
      "1. Who they are, the page, and screenshots",
      "2. Only the page and browser",
      "3. Only what they type",
      "What happens when someone reports a problem?",
      "1. Look into it right away",
      "2. Save it for me to review",
      "Run one real test now?",
      "1. Yes, run one test — up to US$ <ceiling> of your team's US$ <cap> monthly cap (US$ <balance> left)",
      "2. Not now",
    ]);
  });
  it("cada respuesta de la primera pregunta va a un `data set --allow`", () => {
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).toMatch(/`supcoflow data set --allow user_id,user_role[^`]*page_and_browser[^`]*screenshots[^`]*elements[^`]*`/);
    expect(P(p5)).toMatch(/`supcoflow data set --allow page_and_browser`/);
    expect(P(p5)).toMatch(/`supcoflow data set --allow nothing`/);
  });
  it("la pregunta de datos conserva la salvedad de hoy (1A): el acuerdo no frena lo que ve la IA del chat", () => {
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).toMatch(/limits what is SAVED in Supcoflow and what the investigating AI reads, not what the chat's AI sees while it talks/);
    expect(P(p5)).toMatch(/this chat always offers users screenshots and pointing at elements/);
    expect(P(p5)).toMatch(/if the agreement rejects them, they are discarded when saved/);
  });
  it("ninguna frase de la promesa de 1B (skill 0.3.2, tras 1A.1) en el texto", () => {
    for (const { ruta, texto } of textosDeLaSkill) {
      expect(P(texto), ruta).not.toMatch(/does not see it either/);
      expect(P(texto), ruta).not.toMatch(/does not offer screenshots or pointing at elements/);
      expect(P(texto), ruta).not.toMatch(/unless they are allowed/);
      expect(PROMESA_DE_1B_EN_EL_BOTON.some((r) => r.test(P(texto))), ruta).toBe(false);
    }
  });
  it("control: el detector de la promesa de 1B en el botón ve las formulaciones de «el chat no debe ofrecer»", () => {
    const detecta = (t: string) => PROMESA_DE_1B_EN_EL_BOTON.some((r) => r.test(t));
    expect(detecta("If they did not allow them, the chat must not offer to attach one: check that.")).toBe(true);
    expect(detecta("the chat should not offer screenshots")).toBe(true);
    expect(detecta("check that the chat does not show the screenshot button")).toBe(true);
    expect(detecta("the chat must not show the pointing tool")).toBe(true);
    expect(detecta("The chat's screenshot button can still show up, and that is not a failure of this stage.")).toBe(false);
    expect(detecta("the chat always offers users screenshots and pointing at elements")).toBe(false);
  });
  it("la prueba de nivel 2 (captura) conserva la salvedad de 1A: sin permiso no se adjunta, el botón puede seguir", () => {
    const prueba = leer(CARPETA, "referencias", "prueba.md");
    const n2 = seccion(prueba, /^## Level 2\b/m, /^## Level 3\b/m);
    expect(P(n2)).toMatch(/If they did not allow them, attach none to test/);
    expect(P(n2)).toMatch(/screenshot button can still show up, and that is not a failure of this stage/);
    expect(P(n2)).toMatch(/the agreement acts when the report is SAVED and on the AI that investigates, not on what the chat's AI sees while it talks/);
    expect(P(n2)).toMatch(/Do not report it as a privacy failure and do not change the widget to hide it/);
  });
  it("la tercera es la prueba, no las reglas del negocio: «Save it» dice que no gasta", () => {
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).toMatch(/With "Save it for me to review", option 1 of the third question says the test spends nothing/);
    expect(P(p5)).not.toMatch(/Anything about your business/);
  });
  it("antes de las preguntas corre `test --json` sin autorizar para tener techo, saldo y tope", () => {
    const iCorre = skillMd.indexOf("`supcoflow test --json`");
    expect(iCorre).toBeGreaterThan(0);
    expect(iCorre).toBeLessThan(skillMd.indexOf("What can the chat see about your users?"));
    expect(P(skillMd)).toMatch(/ceiling, balance and cap/);
  });
  it("«From your code: …, on N pages» con N contado de los page.tsx bajo el layout elegido", () => {
    expect(P(skillMd)).toContain("From your code: ");
    expect(P(skillMd)).toMatch(/on N pages/);
    expect(P(skillMd)).toMatch(/count the `page\.tsx` files under the layout/);
  });
  it("el sí de la pregunta 3 autoriza UNA prueba con ESE techo y ESA política", () => {
    expect(P(skillMd)).toContain(COMANDO_QUE_GASTA.replace(" --json`", "`").replace(" --json", ""));
    expect(P(skillMd)).toMatch(/exactly the ceiling you showed and the policy you offered/);
    expect(P(skillMd)).toMatch(/Never a number you re-read/);
    expect(P(skillMd)).toMatch(/`techo_distinto` or `politica_distinta`: ask again with the new numbers/);
  });
  it("`--authorize-spend` va siempre con `--ceiling` y `--expect-policy`", () => {
    for (const { ruta, texto } of textosDeLaSkill)
      for (const pedazo of pedazosDeCodigo(texto).filter((p) => /\bsupcoflow\b.*\btest\b.*--authorize-spend/.test(p))) {
        expect(pedazo, ruta).toMatch(/--ceiling/);
        expect(pedazo, ruta).toMatch(/--expect-policy/);
      }
  });
  it("al final: `diagnose`, y sin estar listo (o con un punto que no es un aviso en falla) no se gasta; con el sí, `test --authorize-spend` y `--wait`", () => {
    const final = seccion(skillMd, /^## 3\./m, /^## 4\./m);
    enOrden(final, [
      "Checked sign-in, repo, GitHub App, allowed sites, chat, guide and interface: N of 7, at no cost.",
      "not ready for a test",
      "supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy>",
      "supcoflow test --wait --json",
    ]);
    expect(P(final)).toMatch(/nothing is spent/);
  });
  it("el resumen: «Done. The chat is a bubble on N pages, in English.» (widget) con la frase de la política, en tres líneas", () => {
    const resumen = seccion(skillMd, /^## 13\./m);
    expect(P(resumen)).toContain("Done. The chat is a bubble on N pages, in English.");
    expect(P(resumen)).toContain("Each problem gets looked into and ends up as an issue.");
    expect(P(resumen)).toContain("Each problem is saved for you to review.");
    expect(P(resumen)).toMatch(/three lines at most/);
    expect(P(resumen)).toMatch(/pushing the guide to GitHub is up to you/);
  });
});

describe("la guía: reglas del negocio y diff antes del commit (spec §10.1, decisión 4)", () => {
  const p9 = () => seccion(skillMd, /^## 9\./m, /^## 10\./m);
  const PREGUNTA = "Anything about your business the chat must know — deadlines, refunds, prices? I won't guess them from the code.";
  it("la pregunta de reglas del negocio va en el mismo mensaje que el diff y el mensaje de commit", () => {
    const paso1 = seccion(p9(), /^1\./m, /^2\./m);
    expect(P(paso1)).toContain(PREGUNTA);
    expect(P(paso1)).toMatch(/git diff -- \.supcoflow\/guide\.md/);
    expect(P(paso1)).toMatch(/the exact commit message/);
    expect(P(paso1)).toMatch(/ONE message/);
  });
  it("la pregunta aparece ANTES del commit", () => {
    const nueve = P(p9());
    expect(nueve.indexOf(PREGUNTA)).toBeGreaterThan(0);
    expect(nueve.indexOf(PREGUNTA)).toBeLessThan(nueve.indexOf("git commit -m"));
  });
  it("si contesta con reglas: se agregan a la guía, `guide check` otra vez y el diff de nuevo antes del commit", () => {
    expect(P(p9())).toMatch(/If they answer with rules[^]*add them to the guide[^]*`supcoflow guide check --json` again[^]*show the diff again before the commit/);
  });
  it("«nunca las deduzcas del código» se conserva y la pregunta no es una de las tres", () => {
    expect(P(skillMd)).toMatch(/Never deduce them from the code/);
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).not.toContain(PREGUNTA);
  });
  it("nunca git push, y avisa que subir la guía a GitHub queda en manos de la persona", () => {
    expect(P(p9())).toMatch(/Never `git push`/);
    expect(P(p9())).toContain("Pushing the guide to GitHub is up to you");
  });
  it("publica con `guide publish` sin `--from-github`", () => {
    expect(P(p9())).toContain("`supcoflow guide publish --json`");
    expect(P(p9())).toMatch(/without `--from-github`/);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 4: el commit de la guía cae en la rama que esté. La skill la mira y avisa.
// ---------------------------------------------------------------------------------
describe("la rama del commit de la guía (1A.1, fricción 4)", () => {
  const p9 = () => P(seccion(skillMd, /^## 9\./m, /^## 10\./m));
  const paso1 = () => P(seccion(seccion(skillMd, /^## 9\./m, /^## 10\./m), /^1\./m, /^2\./m));
  // Comandos de git que cambian o crean ramas: la skill no puede nombrarlos en §9 (sólo `git branch --show-current`).
  const CAMBIA_DE_RAMA = /git (?:checkout|switch)\b|git branch (?!--show-current)\S+|git (?:stash|reset)\b/;
  it("antes de preguntar lee la rama con `git branch --show-current` y la compara con la `rama` del proyecto", () => {
    expect(paso1()).toContain("`git branch --show-current`");
    expect(paso1()).toMatch(/`rama`/);
    expect(paso1()).toMatch(/`supcoflow project show --json`/);
    expect(paso1().indexOf("`git branch --show-current`")).toBeLessThan(paso1().indexOf("ONE message"));
  });
  it("en la rama principal: la pregunta del commit nombra la rama", () => {
    expect(paso1()).toMatch(/on the project's main branch[^.]*the question names the branch/i);
    expect(paso1()).toContain("I'll leave it in a local commit on `<branch>`");
  });
  it("en otra rama: lo dice, recomienda no commitear ahí y ofrece dos opciones dentro de la misma pregunta", () => {
    expect(paso1()).toMatch(/On another branch[^]*say so and recommend not committing there/);
    expect(paso1()).toMatch(/commit anyway on that branch/);
    expect(paso1()).toMatch(/do not commit now: the guide is published anyway, and it is committed on `<rama>` when they want/);
    expect(paso1()).toMatch(/not a new question/i);
  });
  it("sin rama (HEAD suelto o salida vacía): recomienda no commitear, y si igual quiere, avisa que no queda en ninguna rama", () => {
    expect(paso1()).toMatch(/No branch \(detached HEAD, empty output\)[^]*recommend not committing/);
    expect(paso1()).toMatch(/the commit would stay on no branch/);
  });
  it("si no se puede leer la rama se trata como «sin rama»: lo seguro", () => {
    expect(paso1()).toMatch(/If you cannot read the branch, treat it as no branch/);
  });
  it("nunca cambia de rama ni crea una: §9 no nombra checkout, switch ni `git branch <nombre>`", () => {
    expect(p9()).toMatch(/Never change the branch or create one/);
    expect(p9()).not.toMatch(CAMBIA_DE_RAMA);
  });
  it("control: el detector de comandos que cambian de rama atrapa los que importan y deja pasar --show-current", () => {
    for (const mala of ["git checkout main", "git switch -c x", "git branch nueva", "git stash", "git reset --hard"])
      expect(mala, mala).toMatch(CAMBIA_DE_RAMA);
    expect("`git branch --show-current`").not.toMatch(CAMBIA_DE_RAMA);
  });
  it("el resumen (§13): sin commit, la línea 3 suma el comando para commitear en la rama del proyecto, sin pasar de tres líneas", () => {
    const r = P(seccion(skillMd, /^## 13\./m));
    expect(r).toMatch(/commit `\.supcoflow\/guide\.md` on `<rama>` when you want/);
    expect(r).toMatch(/three lines at most/);
  });
  it("con un no (o la opción de no commitear) no se commitea, y el aviso del punto 4 sigue", () => {
    expect(P(seccion(skillMd, /^## 9\./m, /^## 10\./m))).toMatch(/With a no[^.]*do not commit[^]*the notice of point 4 goes/);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 5: se ve en qué paso va, sin JSON y sin grep/sed en pantalla.
// ---------------------------------------------------------------------------------
describe("progreso visible, sin JSON ni pipelines de shell (1A.1, fricción 5)", () => {
  const s2 = () => P(seccion(skillMd, /^## 2\./m, /^## 3\./m));
  const s3 = () => P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
  const s13 = () => P(seccion(skillMd, /^## 13\./m));
  it("en el recorrido completo, cada paso empieza con una línea «Step N of 9: …»", () => {
    expect(s2()).toMatch(/In the full order, start each step with one line: "Step N of 9: <what it is>"/);
    expect(s2()).toContain('(for example "Step 3 of 9: your settings")');
  });
  it("el recorrido completo tiene exactamente nueve pasos (el «9» de la línea es cierto)", () => {
    const orden = seccion(skillMd, /^The full order:/m, /^Testing beyond that/m);
    const pasos = orden.split("\n").filter((l) => /^\d+\. /.test(l)).map((l) => Number(l.match(/^(\d+)\./)![1]));
    expect(pasos).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("las líneas de paso no se mezclan con el resumen: no cuentan en las tres líneas y no van en él", () => {
    expect(s13()).toMatch(/The step lines of point 2 are not part of the summary/);
    expect(s13()).toMatch(/three lines at most/);
    for (const forma of s13().match(/\d\. "[^"]*"/g) ?? []) expect(forma).not.toMatch(/Step \d/);
  });
  it("nunca se pega el JSON de la terminal: se dice qué significa en una frase", () => {
    expect(s2()).toContain("Never paste the terminal's JSON to the person: say what it means in one sentence.");
  });
  it("la app se lee con las herramientas de archivo y de búsqueda, no con pipelines de shell", () => {
    expect(s2()).toContain(
      "Read the app's files with your file-reading and search tools, not with shell pipelines (`grep`, `sed`, `cat`).",
    );
    expect(s3()).toMatch(/Read the code \(with your file tools, as point 2 says\)/);
  });
  it("el nivel 3 dice una línea por vuelta de `--wait`, con los minutos que lleva", () => {
    const prueba = P(leer(CARPETA, "referencias", "prueba.md"));
    expect(prueba).toMatch(/5: still running; in the same turn, run the same command again\. Ask the person nothing, but say one line per round: how many minutes it has been running/);
  });
  it("no se inventa que la terminal diga el paso siguiente (eso es 0.9.0, no esta versión)", () => {
    for (const { ruta, texto } of textosDeLaSkill) expect(P(texto), ruta).not.toMatch(/next step[^.]*terminal prints|terminal (?:tells|says) (?:you )?the next step/i);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 1: el comando sigue agnóstico; el README explica cómo elegir el asistente.
// ---------------------------------------------------------------------------------
describe("el README de la instalación (1A.1, fricción 1)", () => {
  const readme = P(leer(RAIZ, "README.md"));
  it("el comando es el agnóstico de hoy: sin `-y`, sin `--agent` y sin `--all`", () => {
    expect(readme).toContain("npx skills add supcoflow/skills");
    for (const pedazo of pedazosDeCodigo(leer(RAIZ, "README.md")).filter((p) => /skills add/.test(p)))
      expect(pedazo).not.toMatch(/\s(?:-y|-a|--yes|--agent|--all)\b/);
  });
  it("ya no dice que el repo de GitHub no existe", () => {
    expect(readme).not.toMatch(/todavía no existe/);
    expect(readme).not.toMatch(/Mientras tanto, se puede copiar/);
  });
  it("dice las tres vías del instalador tal cual y una línea para la terminal instalada", () => {
    expect(readme).toContain("In your own terminal, check the agents it selects: Claude Code isn't ticked the first time.");
    expect(readme).toContain("If it first asks about Eve and you use another agent, answer no to get the list.");
    expect(readme).toContain(
      "If your coding agent runs it, it installs for that agent without asking, and it replaces an earlier install of this skill.",
    );
    expect(readme).toContain("npm i -g supcoflow@0.9.0");
  });
  it("no pide reiniciar Claude Code (no hay evidencia)", () => {
    expect(readme).not.toMatch(/reinici|restart/i);
  });
  it("la versión es la 0.4.0, fija la terminal 0.9.0 y avisa que 1B queda para una versión posterior", () => {
    expect(readme).toMatch(/La skill es la `0\.4\.0`/);
    expect(readme).toMatch(/Fija la terminal en `npx -y supcoflow@0\.9\.0`/);
    expect(readme).toMatch(/1B.*queda para una versión posterior a la `0\.4\.0`/);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 3: el aviso llega ANTES del sí al gasto (`maquina` e `intento_pendiente` de `test --json`).
// ---------------------------------------------------------------------------------
describe("el aviso antes del sí al gasto (1A.1, fricción 3)", () => {
  const paso4 = () => P(seccion(skillMd, /^4\. `supcoflow test --json`/m, /^5\. /m));
  const prueba = () => P(leer(CARPETA, "referencias", "prueba.md"));
  const punto2 = () => P(seccion(leer(CARPETA, "referencias", "prueba.md"), /^2\. `supcoflow test --json`/m, /^3\. \*\*Ask the person/m));
  it("el paso 4 lee `maquina` e `intento_pendiente` de `test --json`", () => {
    expect(paso4()).toContain("`maquina`");
    expect(paso4()).toContain("`intento_pendiente`");
  });
  it("con `maquina.ok` en false dice por qué ANTES de las tres preguntas y en la tercera ofrece sólo «Not now»", () => {
    expect(paso4()).toMatch(/If `maquina\.ok` is `false`, say why[^.]*BEFORE the three questions/);
    expect(paso4()).toMatch(/in the third offer only "Not now"/);
  });
  it("con un `intento_pendiente` de otro techo u otra política: lo dice y ofrece retomar ESE pedido, sin un sí nuevo para otra prueba", () => {
    expect(paso4()).toMatch(/If `intento_pendiente` is not `null` and its ceiling or policy differ from the ones of this `test --json`, say so and offer to resume that same request/);
    expect(paso4()).toMatch(/not a new test/);
  });
  it("prueba.md punto 2: trae `maquina` e `intento_pendiente`, y lo que se muestra es sólo el techo y la política", () => {
    expect(punto2()).toMatch(/`maquina` \{ ok, impedimentos \}/);
    expect(punto2()).toMatch(/`intento_pendiente` \{ techo_usd, politica \}/);
  });
  it("prueba.md: con `maquina.ok` en false no se pide plata; en true significa «ningún impedimento», no una promesa", () => {
    expect(punto2()).toMatch(/If `maquina\.ok` is `false`, do not ask for money: tell them each `detalle` first/);
    expect(punto2()).toMatch(/`maquina\.ok: true` means no obstacle was found, not a promise that saving will work/);
  });
  it("prueba.md punto 2: el pedido pendiente se retoma por su propio camino, no por la pregunta de una prueba nueva", () => {
    expect(punto2()).toMatch(/Follow \*\*Resuming a pending request\*\* below instead/);
    expect(punto2()).toMatch(/a new test cannot start while a request is pending/);
  });
  it("el nivel 1 lista `maquina` entre lo que `diagnose` dice, y el paso 9 no gasta si no está listo", () => {
    expect(P(leer(CARPETA, "referencias", "prueba.md"))).toMatch(/`maquina`: whether this machine can save the test request/);
    expect(P(seccion(skillMd, /^## 3\./m, /^## 4\./m))).toMatch(/it is not ready for a test, or a point that is not an `aviso` one fails, say so and nothing\s+is spent/);
  });
  it("el flujo de gasto sigue igual: nunca `--authorize-spend` sin el sí a los números", () => {
    expect(paso4()).not.toContain("--authorize-spend");
  });
});

// ---------------------------------------------------------------------------------
// Revisión GPT, vuelta 1 (hallazgos 1 y 2): recuperar un pedido pendiente es OTRO camino que pedir una prueba nueva:
// su propio sí, sus propios números, y el pedido antiguo sin política avisa que puede gastar hasta su techo.
// ---------------------------------------------------------------------------------
describe("recuperar un pedido pendiente no es pedir una prueba nueva (revisión 1A.1, vuelta 1)", () => {
  const pruebaMd = () => leer(CARPETA, "referencias", "prueba.md");
  const retomar = () => P(seccion(pruebaMd(), /^### Resuming a pending request/m));
  const punto2 = () => P(seccion(pruebaMd(), /^2\. `supcoflow test --json`/m, /^3\. \*\*Ask the person/m));
  const punto4 = () => P(seccion(pruebaMd(), /^4\. Only with the yes/m, /^5\. /m));
  const paso4 = () => P(seccion(skillMd, /^4\. `supcoflow test --json`/m, /^5\. /m));
  const paso9 = () => P(seccion(seccion(skillMd, /^The full order:/m, /^Testing beyond that/m), /^9\. /m));

  it("la sección existe, está antes del resumen y sus pasos van en orden: decir, pedir el sí a ESE pedido, correr el comando de recuperación", () => {
    enOrden(retomar(), [
      "There's a test request from before",
      "A yes to point 3",
      "is not a yes to this",
      "the recovery command",
      "without `--message`",
      "go to point 5",
    ]);
  });
  it("muestra el techo y la política del pendiente, y no abre una prueba nueva", () => {
    expect(retomar()).toMatch(/up to US\$ <its ceiling>, policy <investigate\|save>/);
    expect(retomar()).toMatch(/No new test is started/);
    expect(retomar()).toMatch(/Show only its ceiling and its policy, never its message or its key/);
  });
  it("el comando de recuperación lleva el techo y la política DEL PENDIENTE, no los del diagnóstico actual ni los ofrecidos", () => {
    expect(retomar()).toContain("`supcoflow test --authorize-spend --ceiling <its ceiling> --expect-policy <its policy> --json`");
    expect(retomar()).toMatch(/its own ceiling and policy, not the ones of this `test --json` and not the ones you offered/);
    expect(retomar()).toMatch(/`relevar` is `investigate`, `guardar` is `save`/);
  });
  it("techo distinto, política distinta y pendiente sin política (o con la máquina impedida) quedan cubiertos", () => {
    expect(punto2()).toMatch(/when its ceiling or its policy differ from the ones of this `test --json`, or it has `politica: null`/);
    expect(punto2()).toMatch(/If `maquina\.ok` is `false`[^]*do not offer to resume it/);
    expect(paso4()).toMatch(/If `maquina\.ok` is `false`[^]*do not offer to resume/);
  });
  it("sin poder retomarlo (no lo quiere, o la máquina no puede) sólo se ofrece «Not now»: una prueba nueva no arranca con un pendiente", () => {
    expect(punto2()).toMatch(/If the person does not want to resume it, offer only "Not now"/);
  });
  it("punto 4: ante `intento_pendiente` se repite con los números del PENDIENTE, y si el sí fue a otros números se vuelve a preguntar", () => {
    expect(punto4()).toMatch(/`intento_pendiente`[^]*the yes you just got was to the numbers of that same pending request/);
    expect(punto4()).toMatch(/other numbers or `politica: null`, the yes you have does not cover it: go to \*\*Resuming a pending request\*\* and ask again/);
    expect(punto4()).toMatch(/do not repeat the command with the numbers you offered/);
  });
  it("«es el mismo sí» sólo vale para los mismos números que la persona acaba de aceptar", () => {
    for (const m of P(pruebaMd()).matchAll(/same yes/g)) {
      const alrededor = P(pruebaMd()).slice(Math.max(0, m.index! - 160), m.index! + 60);
      expect(alrededor, alrededor).toMatch(/the numbers of that same pending request/);
    }
  });
  it("pendiente SIN política (la 0.7.0): el aviso de gasto propio, sin prometer gratis aunque hoy diga `guardar`", () => {
    expect(retomar()).toMatch(/`politica: null`[^.]*saved by the old 0\.7\.0 terminal[^.]*its policy was never fixed/);
    expect(retomar()).toMatch(/recovering it may spend up to its ceiling, whatever the current policy says/);
    expect(retomar()).toMatch(/even if the current policy is `guardar`/);
    expect(retomar()).toMatch(/Never tell them it is free/);
  });
  it("pendiente sin política: un sí a una prueba gratis no sirve; si sólo autoriza eso, no se recupera", () => {
    expect(retomar()).toMatch(/A yes to a test that spends nothing is not that yes/);
    expect(retomar()).toMatch(/if they only authorize a test that spends nothing, stop: do not recover it/);
  });
  it("pendiente sin política: el comando es el que da la terminal tras «to recover that same request, repeat», y no se le inventa una política", () => {
    expect(retomar()).toMatch(/run exactly the command that the `message` of this `test --json` gives after "to recover that same request, repeat"/);
    expect(retomar()).toMatch(/Do not add a policy to it/);
  });
  it("las dos recetas de la recuperación sólo pasan a `--wait` con salida 5 y `prueba_id`; si no, se maneja el resultado como en el punto 4 (revisión vuelta 2, P3)", () => {
    const pasos = retomar().split(/(?= [123]\. [A-Z])/).filter((t) => /^ [123]\. /.test(t));
    expect(pasos).toHaveLength(3);
    const recetas = pasos.filter((t) => /go to point 5/.test(t));
    expect(recetas).toHaveLength(2);
    for (const receta of recetas) {
      expect(receta).toMatch(/Only with exit 5 and a `prueba_id`, go to point 5; otherwise handle the result as in point 4/);
      expect(receta).not.toMatch(/Then point 5/);
    }
    expect(retomar()).toMatch(/`techo_distinto` or `politica_distinta`: go back to point 2 and ask again with the new numbers, before any new test/);
  });
  it("el paso 4 y el paso 9 de SKILL.md distinguen recuperar de pedir una prueba nueva y remiten a prueba.md", () => {
    expect(paso4()).toMatch(/in place of option 1 of the third question/);
    expect(paso4()).toMatch(/Resuming a pending request/);
    expect(paso9()).toMatch(/If instead they said yes to resuming a pending request[^.]*do not use these values/);
    expect(paso9()).toMatch(/Resuming a pending request/);
  });
  it("ningún texto escribe el alias viejo de la 0.7.0: sólo se remite a lo que la terminal imprime", () => {
    for (const { ruta, texto } of textosDeLaSkill) expect(texto, ruta).not.toMatch(/autorizo-gasto|supcoflow probar/);
  });
});

// ---------------------------------------------------------------------------------
// Revisión GPT, vuelta 1 (hallazgo 3): retomar una sesión cortada empieza como toda entrada.
// ---------------------------------------------------------------------------------
describe("retomar una sesión cortada empieza como toda entrada (revisión 1A.1, vuelta 1)", () => {
  it("SKILL.md: la reanudación remite al comienzo común (`project show`, la línea de contexto, `config`), no sólo a `config`", () => {
    expect(P(skillMd)).toMatch(/Every step can be resumed: if the session is cut, `\/supcoflow go` starts like every row \(`project show`, the context line, then `config`\)/);
    expect(P(skillMd)).not.toMatch(/starts with `config`/);
  });
  it("el escenario 6 y su fila del índice empiezan por `project show` y la línea de contexto", () => {
    const dir = join(RAIZ, "docs", "escenarios");
    const e6 = P(leer(dir, "06-sesion-cortada.md"));
    expect(e6).toMatch(/empieza por `supcoflow project show --json`, dice la línea de contexto/);
    expect(e6).toMatch(/y luego `supcoflow config --json`/);
    expect(P(leer(dir, "README.md"))).toMatch(/\| 6 \|[^|]*\|[^|]*retoma desde `project show` y `config`/);
  });
  it("el escenario 4 (pedido parcial) también empieza por `project show`", () => {
    expect(P(leer(join(RAIZ, "docs", "escenarios"), "04-guia-sin-commitear.md"))).toMatch(/En \(i\) el asistente empieza por `supcoflow project show --json`, dice la línea de contexto/);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 2a: un `origin` con alias de SSH se asocia con un remoto `supcoflow`, con el sí de la persona.
// ---------------------------------------------------------------------------------
describe("el remoto `supcoflow` para un origin con alias de SSH (1A.1, fricción 2a)", () => {
  const s3 = () => P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
  const parrafo = () => s3().slice(s3().indexOf("If the first command that needs the repo"), s3().indexOf("| The person asked"));
  it("ante `sin_repo` por un alias de SSH muestra el comando exacto del mensaje, dice que sólo toca la configuración de git de este clon y que nunca se trae nada", () => {
    expect(parrafo()).toMatch(/exits 3 with `error: "sin_repo"`/);
    expect(parrafo()).toContain("`git remote add supcoflow https://github.com/<owner>/<repo>.git`");
    expect(parrafo()).toMatch(/show the person that exact command/);
    expect(parrafo()).toMatch(/only touches this clone's git settings and is never fetched/);
  });
  it("lo corre sólo con el sí de la persona, y es un permiso como el del commit, no una cuarta pregunta", () => {
    expect(parrafo()).toMatch(/run it only with their yes/);
    expect(parrafo()).toMatch(/a permission like the commit's, not a fourth question/);
  });
  it("después sigue sin `--repo`, y si el mensaje no trae comando, frena", () => {
    expect(parrafo()).toMatch(/go on without `--repo`/);
    expect(parrafo()).toMatch(/If the message gives no command, tell the person what it says and stop/);
  });
  it("no corre `ssh` ni toca la configuración de SSH, y no usa el comando para traer nada", () => {
    for (const { ruta, texto } of textosDeLaSkill) {
      expect(P(texto), ruta).not.toMatch(/\bssh -G\b|\bssh-keyscan\b|git fetch|git pull|git remote update/);
    }
  });
  it("sirve también para `falta_guia` y `sin_clon` (el mismo comando)", () => {
    expect(parrafo()).toMatch(/`falta_guia` or `sin_clon`[^.]*same command/);
  });
});

// ---------------------------------------------------------------------------------
// 1A.1, fricción 6: ¿este repo va con la cuenta en la que estoy? La terminal junta el contexto y frena; la skill lo dice.
// ---------------------------------------------------------------------------------
describe("el contexto del repo y la cuenta (1A.1, fricción 6)", () => {
  const s3 = () => P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
  const intro = () => s3().slice(s3().indexOf("**Start from what the person asked.**"), s3().indexOf("If the first command that needs the repo"));
  const paso2 = () => P(seccion(seccion(skillMd, /^The full order:/m, /^Testing beyond that/m), /^2\. /m, /^3\. /m));
  it("todas las filas empiezan por `project show --json`, después del login y antes de `config`", () => {
    expect(intro()).toMatch(/Every row begins with `supcoflow project show --json` \(with exit 2, the login of point 2 first\), then `supcoflow config --json`/);
    expect(intro().indexOf("`supcoflow project show --json`")).toBeLessThan(intro().indexOf("`supcoflow config --json`"));
  });
  it("dice la línea de `contexto` en palabras, también cuando todo cierra", () => {
    expect(intro()).toMatch(/The `contexto` of `project show` says who the person is, in which team, which repo and which project: say it in words, also when everything fits/);
    expect(intro()).toContain("You're @<login> in team <team>; this repo <owner/repo>; its project <id> (existing)");
    expect(intro()).toMatch(/no project yet/);
  });
  it("con 4 `contexto_incoherente` para, dice el mensaje tal cual y no crea, conecta ni publica nada", () => {
    expect(intro()).toMatch(/exits 4 with `error: "contexto_incoherente"`[^]*stop, say its message as is, and create, connect and publish nothing/);
    expect(intro()).toMatch(/do not retry or work around it/);
  });
  it("nunca borra ni edita el `.supcoflow/proyecto.json` por su cuenta", () => {
    expect(intro()).toMatch(/never delete or edit `\.supcoflow\/proyecto\.json` on your own/);
  });
  it("el paso 2 del recorrido completo también frena si `project create` sale 4 `contexto_incoherente` (dueño distinto, sin GitHub): posible, no prueba", () => {
    expect(paso2()).toMatch(/If `project show` \(before `repo connect`\) or `project create` exits 4 with `contexto_incoherente`[^.]*stop and say its message/);
    expect(paso2()).toMatch(/a possible mismatch, not proof/);
  });
  it("el paso 2 sigue siendo `project show` y, sin proyecto, `repo connect`", () => {
    expect(s3()).toMatch(/2\. `supcoflow project show --json`; if there is no project: `supcoflow repo connect --start --json`/);
  });
  it("el nombre del equipo en vez del código no se promete (queda para más adelante)", () => {
    expect(P(skillMd)).not.toMatch(/team name/i);
  });
  it("no se ofrece `--repo` ni borrar el archivo del clon para salir de un `contexto_incoherente`", () => {
    expect(intro()).not.toMatch(/pass `--repo`|use `--repo`|delete `\.supcoflow\/proyecto\.json`/);
  });
});

describe("no dos chats (R7, spec §10.3)", () => {
  const p10 = () => seccion(skillMd, /^## 10\./m, /^## 11\./m);
  it("el orden para elegir el archivo", () => {
    enOrden(p10(), [
      "1. The `archivo` recorded in `.supcoflow/instalacion.json`",
      "2. The file the layout imports, read from the code",
      "3. One of `nextjs.archivos_anteriores`",
      "4. `nextjs.archivo_sugerido`",
    ]);
  });
  it("con más de un chat montado se para y se pregunta", () => {
    expect(P(p10())).toMatch(/more than one is mounted, stop and ask/);
  });
  it("«no pisar» nombra los casos nuevos: sin commit, registrado pero borrado, symlink y no versionado", () => {
    const pisar = seccion(skillMd, /^## 7\./m, /^## 8\./m);
    for (const caso of ["uncommitted changes", "registered but deleted", "symlink", "not versioned"]) expect(P(pisar), caso).toContain(caso);
  });
  it("cada `install record` lleva `--file`, y el archivo realmente usado es el último paso", () => {
    const invocaciones = textosDeLaSkill.flatMap(({ ruta, texto }) =>
      pedazosDeCodigo(texto).filter((p) => /\binstall record\b/.test(p)).map((p) => ({ ruta, p })),
    );
    expect(invocaciones.length).toBeGreaterThan(0);
    for (const { ruta, p } of invocaciones) expect(p, ruta).toMatch(/--file /);
    expect(P(skillMd)).toMatch(/the file you really used/);
  });
  it("los dos nombres de archivo del motor aparecen tal cual en SKILL.md §10 (V-K, «el archivo del chat»)", () => {
    expect(P(p10())).toContain("app/_supcoflow/support-chat.tsx");
    expect(P(p10())).toContain("app/_supcoflow/chat-de-soporte.tsx");
  });
  it("la ruta sugerida es la de la 0.3.0 y la vieja se actualiza en su lugar", () => {
    expect(P(p10())).toMatch(/updated in place/);
    expect(leer(CARPETA, "referencias", "nextjs.md")).toContain("app/_supcoflow/support-chat.tsx");
  });
});

describe("el nivel 3 en la 0.3.0", () => {
  const prueba = leer(CARPETA, "referencias", "prueba.md");
  it("manda el techo y la política que la persona vio, y ante un cambio vuelve a preguntar", () => {
    expect(P(prueba)).toContain(COMANDO_QUE_GASTA);
    expect(P(prueba)).toMatch(/`techo_distinto` or `politica_distinta` \(4\)/);
  });
  it("sólo se gasta con `diagnose` listo para la prueba y sin un punto que no es un aviso en falla (0.4.0: ya no «6 de 6»)", () => {
    expect(P(prueba)).toMatch(/not ready for a test[^.]*a point that is not an `aviso` one fails[^.]*do not ask for money/);
    expect(P(prueba)).not.toMatch(/6 of 6|N of 6/);
  });
});

describe("el mapa de «qué hacer según lo que pidió la persona» (A1) y la descripción (A2)", () => {
  const y = encabezadoYaml(skillMd);
  const descripcion = y.description as string;

  it("la descripción tiene la forma «Use when… / Do not use for…» con los momentos reales", () => {
    expect(descripcion).toMatch(/\bUse when\b/);
    expect(descripcion).toMatch(/add a support or help chat/);
    expect(descripcion).toMatch(/users get stuck/);
    expect(descripcion).toMatch(/why the support chat isn't showing/);
    expect(descripcion).toContain('"chat de soporte"');
    expect(descripcion).toContain('"/supcoflow go"');
    expect(descripcion).toMatch(/Do not use for other chat vendors\./);
    expect(descripcion).not.toMatch(/from scratch/);
    expect(descripcion).toMatch(/app's own components, icons and styles/);
    expect(descripcion.indexOf("Use when")).toBeLessThan(descripcion.indexOf("Do not use for"));
    expect(descripcion.length).toBeLessThanOrEqual(1024);
  });
  it("la descripción no tiene «: » ni « #» (un YAML llano las leería como otra cosa)", () => {
    expect(descripcion).not.toMatch(/: /);
    expect(descripcion).not.toMatch(/ #/);
  });

  const s3 = seccion(skillMd, /^## 3\./m, /^## 4\./m);
  const mapa = seccion(s3, /\*\*Start from what the person asked\.\*\*/, /The full order:/);
  it("el mapa está arriba del orden completo y arranca siempre por `project show` y después `config`", () => {
    expect(s3.indexOf("**Start from what the person asked.**")).toBeLessThan(s3.indexOf("The full order:"));
    expect(s3.indexOf("The full order:")).toBeLessThan(s3.indexOf("1. `supcoflow whoami --json`"));
    expect(P(mapa)).toMatch(/Every row begins with `supcoflow project show --json` \(with exit 2, the login of point 2 first\), then `supcoflow config --json`/);
  });
  it("cada pedido va a su camino (diagnose, guía, sólo la primera pregunta, prueba, orden completo)", () => {
    const filas = mapa.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| The person asked") && !l.startsWith("|---"));
    expect(filas).toHaveLength(5);
    const fila = (re: RegExp) => P(filas.find((l) => re.test(l)) ?? "");
    expect(fila(/Does the chat work/)).toMatch(/`supcoflow diagnose --json`.*No test, nothing is spent/);
    expect(fila(/Update the guide/)).toMatch(/Points 8 and 9.*Do not ask about data, policy or the test\. The questions and permissions of points 7 and 9 stay \(overwriting, the business rules, the commit\)/);
    expect(fila(/what the chat sees/)).toMatch(/Only the first question of point 5, with its scope warning, and all of its table, including what changes in the app's code\. Do not ask the second or the third question\. The permissions of point 7 before touching files stay/);
    expect(fila(/Test it/)).toMatch(/referencias\/prueba\.md.*Level 3 spends: only with its own yes/);
    expect(fila(/Install it/)).toMatch(/`\/supcoflow go`.*The full order below, steps 1 to 9/);
  });
  it("el mapa no tiene prohibiciones absolutas que choquen con los permisos de los puntos 7 y 9", () => {
    expect(P(mapa)).not.toMatch(/Nothing else is asked/);
    expect(P(mapa)).not.toMatch(/No other question/);
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).toMatch(/in the full order and for whatever is still unset \(a request to change only the data uses the first one: see the map of point 3\)/);
  });
  it("si `config` sale 4 `sin_proyecto`: al instalar se sigue por el paso 2; en un pedido parcial se ofrece la instalación y no se crea nada; otro 4 se detiene", () => {
    const intro = P(seccion(s3, /\*\*Start from what the person asked\.\*\*/, /\| The person asked/));
    expect(intro).toMatch(/If `project show` brings `proyecto: null` or `config` exits 4 with `error: "sin_proyecto"`, this repo has no project yet/);
    expect(intro).toMatch(/When the person asked to install, go on to step 2 of the order \(connect the repo, create the project\) and read `config` again/);
    expect(intro).toMatch(/For any other row, tell them the installation is missing and offer the full order; create nothing for a diagnosis or a partial request/);
    expect(intro).toMatch(/Any other exit 4 is a decision for a person: stop/);
    expect(s3).toMatch(/^2\. `supcoflow project show --json`; if there is no project: `supcoflow repo connect --start --json`/m);
  });
  it("el mapa no abre ningún camino que gaste ni nombra el flag de gasto", () => {
    expect(mapa).not.toContain("--authorize-spend");
    expect(P(mapa)).not.toMatch(/supcoflow test/);
  });
  it("lo que el mapa señala existe: puntos 8 y 9, la primera pregunta del 5 y el paso 9 del orden", () => {
    expect(skillMd).toMatch(/^## 8\. The guide/m);
    expect(skillMd).toMatch(/^## 9\. Publish the guide/m);
    expect(skillMd).toMatch(/^## 5\. What you ALWAYS ask the person/m);
    expect(s3).toMatch(/^9\. `supcoflow diagnose --json`/m);
    expect(s3).toMatch(/^6\. `git status/m);
  });
});

describe("los escenarios para correr a mano (A4, docs/escenarios, fuera de la skill)", () => {
  const dir = join(RAIZ, "docs", "escenarios");
  const archivos = readdirSync(dir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
  const indice = leer(dir, "README.md");

  it("son once, los casos pedidos, y el índice los enlaza a todos", () => {
    expect(archivos).toEqual([
      "01-src-app.md",
      "02-csp.md",
      "03-chat-0-2-x.md",
      "04-guia-sin-commitear.md",
      "05-no-a-la-prueba.md",
      "06-sesion-cortada.md",
      "07-otra-rama.md",
      "08-interfaz-propia-con-src.md",
      "09-interfaz-propia-sin-src.md",
      "10-sin-interfaz-propia.md",
      "11-conformidad-en-rojo.md",
    ]);
    for (const f of archivos) expect(indice, f).toContain(`(${f})`);
  });
  it.each(archivos)("%s tiene app de ejemplo, pedido y lo esperado", (f) => {
    const t = leer(dir, f);
    expect(t).toMatch(/^## App de ejemplo$/m);
    expect(t).toMatch(/^## Pedido$/m);
    expect(t).toMatch(/^## Lo esperado$/m);
    expect(t).toMatch(/lista común del README/);
  });
  it("el índice fija lo esperado en todos: un chat, guide check en 0, ningún gasto sin el sí, tres líneas, ningún push", () => {
    const comun = seccion(indice, /^## Lo esperado en TODOS los escenarios$/m);
    expect(comun).toMatch(/Un solo chat/);
    expect(comun).toMatch(/guide check --json` sale con 0/);
    expect(comun).toMatch(/Ningún gasto sin el sí/);
    expect(comun).toMatch(/tres líneas como máximo/);
    expect(comun).toMatch(/Ningún `git push`/);
  });
  it("dicen que están escritos y no corridos; viven fuera de skills/ (no cambian la huella)", () => {
    expect(indice).toMatch(/escritos, no corridos/);
    expect(dir.startsWith(CARPETA)).toBe(false);
  });
});

describe("el escenario 7 (1A.1, fricción 4): la rama del commit", () => {
  const t = leer(join(RAIZ, "docs", "escenarios"), "07-otra-rama.md");
  it("cubre la rama principal, otra rama y HEAD suelto, y que el asistente nunca cambia de rama", () => {
    expect(P(t)).toMatch(/\(a\)[^]*\(b\)[^]*\(c\)/);
    expect(P(t)).toMatch(/recomienda no commitear/);
    expect(P(t)).toMatch(/Nunca\*\* cambia de rama ni crea una/);
    expect(P(t)).toContain("`git branch --show-current`");
  });
});

describe("los escenarios cubren los pedidos parciales y el repo sin proyecto (revisión A1+A2+A4, vuelta 1)", () => {
  const dir = join(RAIZ, "docs", "escenarios");
  it("el escenario 4 prepara el proyecto conectado y el chat instalado, y separa el pedido parcial del completo", () => {
    const t = leer(dir, "04-guia-sin-commitear.md");
    const app = seccion(t, /^## App de ejemplo$/m, /^## Pedido$/m);
    expect(P(app)).toMatch(/proyecto de Supcoflow de prueba ya conectado al repo/);
    expect(P(app)).toMatch(/el chat ya instalado/);
    const pedido = seccion(t, /^## Pedido$/m, /^## Lo esperado$/m);
    expect(P(pedido)).toMatch(/\(i\)\*\* «actualizá la guía» \(pedido parcial: el asistente conserva el chat que ya está, no instala nada\)/);
    expect(P(pedido)).toMatch(/\(ii\)\*\* `\/supcoflow go`/);
    expect(P(t)).toMatch(/no hace\*\* las preguntas de datos, política ni prueba/);
  });
  it("la lista común deja claro que en un pedido parcial el chat es el que ya estaba", () => {
    const comun = seccion(leer(dir, "README.md"), /^## Lo esperado en TODOS los escenarios$/m);
    expect(P(comun)).toMatch(/En un pedido parcial .* es el que ya estaba: la app de ejemplo del escenario ya lo trae instalado y el asistente no instala ni agrega otro/);
  });
  it("el índice y el escenario 1 describen `sin_proyecto`: se continúa por el paso 2, no se detiene", () => {
    expect(P(leer(dir, "README.md"))).toMatch(/`sin_proyecto` en una app nueva: el asistente sigue por el paso 2 .* \*\*no se detiene\*\*/);
    expect(P(leer(dir, "01-src-app.md"))).toMatch(/`sin_proyecto`: el asistente \*\*continúa\*\* por `repo connect` y `project create` \(paso 2\)/);
  });
});

// ---------------------------------------------------------------------------------
// T9, skill 0.4: el camino «construir con tus componentes». El plan es data/ui-agnostico/report.md §2.5 y §5 T9, y
// las decisiones del dueño (D1 A, D2 A, D3 sin marca, D4 A con historial, D5 A).
// ---------------------------------------------------------------------------------
describe("la skill 0.4: construir el chat con los componentes de la app (T9)", () => {
  const p10 = () => P(seccion(skillMd, /^## 10\./m, /^## 11\./m));
  const p5 = () => P(seccion(skillMd, /^## 5\./m, /^## 6\./m));
  const p4 = () => P(seccion(skillMd, /^## 4\./m, /^## 5\./m));
  const propia = () => leer(CARPETA, "referencias", "interfaz-propia.md");

  it("la referencia existe y SKILL.md la enlaza desde el punto 10", () => {
    expect(readdirSync(join(CARPETA, "referencias"))).toContain("interfaz-propia.md");
    expect(p10()).toContain("[`referencias/interfaz-propia.md`](referencias/interfaz-propia.md)");
  });

  it("D1 A: construye con los componentes de la app por defecto, y el widget sólo si no hay camino (otro stack, sin `interfaz_propia`, `sin_publicar`, o lo pidió)", () => {
    const forma = P(seccion(skillMd, /^## 10\./m, /^### The widget/m));
    expect(forma).toMatch(/Run `supcoflow widget --json`/);
    expect(forma).toMatch(/built with the app's own components \(the own interface\) when ALL of these hold/);
    expect(forma).toMatch(/Next\.js with the App Router/);
    expect(forma).toMatch(/`interfaz_propia` is there and its `estado` is `disponible`/);
    expect(forma).toMatch(/the person did not ask for the widget/);
    expect(forma).toMatch(/Otherwise it is the widget/);
    expect(forma).toMatch(/`estado: sin_publicar`/);
    expect(forma).toMatch(/Say which form you chose and why in one line/);
  });

  it("la descripción y el punto 1 ya no prohíben construir un chat: dicen que se construye con la app", () => {
    expect(P(skillMd)).not.toMatch(/building a chat from scratch/);
    expect(P(seccion(skillMd, /^## 1\./m, /^## 2\./m))).toMatch(/built with the app's own components, icons and styles/);
    expect(P(seccion(skillMd, /^## 1\./m, /^## 2\./m))).toMatch(/never a design/);
  });

  it("el camino de la interfaz propia: lee la referencia, instala lo que da la terminal y no pega código de Supcoflow", () => {
    const propiaDeSkill = P(seccion(skillMd, /^### An own interface/m, /^## 11\./m));
    expect(propiaDeSkill).toMatch(/Read \[`referencias\/interfaz-propia\.md`\]/);
    expect(propiaDeSkill).toMatch(/`instalar` of `interfaz_propia`/);
    expect(propiaDeSkill).toMatch(/No code comes from the terminal to paste/);
  });

  it("nunca copia componentes con estilo, ni usa el widget, ni `chat brand`, ni agrega librerías de interfaz o íconos, ni pone la marca de Supcoflow (D3)", () => {
    const propiaDeSkill = P(seccion(skillMd, /^### An own interface/m, /^## 11\./m));
    expect(propiaDeSkill).toMatch(/Never copy a styled component/);
    expect(propiaDeSkill).toMatch(/never `ChatDeIntake`/);
    expect(propiaDeSkill).toMatch(/never `supcoflow chat brand`/);
    expect(propiaDeSkill).toMatch(/never add a component, icon or font library/);
    expect(propiaDeSkill).toMatch(/never a Supcoflow logo, name or link/);
  });

  it("los colores ya no se deciden con `chat brand` para la interfaz propia, y nunca se preguntan", () => {
    expect(p4()).toMatch(/for the widget[^.]*colors \(`supcoflow chat brand`\)/);
    expect(p4()).toMatch(/With an own interface[^.]*you never ask about colors, fonts or icons and never run `supcoflow chat brand`/);
    expect(p4()).toMatch(/What it does ask is how people open it/);
  });

  it("la captura y señalar: el widget siempre las ofrece, la interfaz propia sólo lo que elige la persona", () => {
    expect(p5()).toMatch(/with the widget, this chat always offers users screenshots and pointing at elements/);
    expect(p5()).toMatch(/an own interface offers only the tools of its second panel/);
  });

  it("D1/«la forma de abrirlo la decide el usuario»: un segundo panel con el texto exacto, sólo para la interfaz propia, en el mismo mensaje, sin colores", () => {
    enOrden(seccion(skillMd, /^## 5\./m, /^## 6\./m), [
      "Run one real test now?",
      "Own interface only: a second panel",
      "How should people open the chat?",
      "1. <your proposal: the trigger and what it opens, built with the app's own components",
      "2. A floating button in a corner that opens a panel",
      "3. Somewhere else (tell me where)",
      "Which tools should it offer to add evidence?",
      "1. Attach an image, take a screenshot and point at an element",
      "2. Only attach an image",
      "3. None",
    ]);
    expect(p5()).toMatch(/in the same message, after the three questions/);
    expect(p5()).toMatch(/Never colors, fonts or icons: the app already answers those/);
  });

  it("cada respuesta del segundo panel va a `capabilities`; la interfaz también sigue `state.allows`", () => {
    expect(p5()).toMatch(/`capabilities: \{ attachImage: true, screenshot: true, pickElement: true \}`/);
    expect(p5()).toMatch(/`capabilities: \{ attachImage: true, screenshot: false, pickElement: false \}`/);
    expect(p5()).toMatch(/`capabilities: \{ attachImage: false, screenshot: false, pickElement: false \}`/);
    expect(p5()).toMatch(/`newConversation` stays on/);
    expect(p5()).toMatch(/The interface also follows `state\.allows`/);
  });

  it("el usuario declarado: `user` (id, role, attributes) y `autoContext`, nunca el nombre", () => {
    expect(p5()).toMatch(/own interface[^.]*`user`[^.]*`id`, `role`[^.]*`attributes`/);
    expect(p5()).toMatch(/`autoContext: false`/);
    expect(p5()).toMatch(/Never `usuario\.nombre`/);
  });

  it("antes de aplicar, la propuesta dice disparador, componentes, íconos, archivos, herramientas y paquetes de prueba", () => {
    const p6 = P(seccion(skillMd, /^## 6\./m, /^## 7\./m));
    for (const parte of ["which trigger and where", "which of the app's components and icons it reuses", "which files it creates", "which tools it offers", "whether it adds test packages"])
      expect(p6, parte).toContain(parte);
  });

  it("el paso 5 decide la forma antes de las preguntas: `widget --json` sólo lee", () => {
    const s3 = P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
    expect(s3).toMatch(/If the app is Next\.js \(App Router\), also run `supcoflow widget --json` here \(it only reads\) to decide the form/);
    expect(s3.indexOf("also run `supcoflow widget --json` here")).toBeLessThan(s3.indexOf("the three questions (point 5)"));
  });

  it("el registro: `--shape own-interface` y un `--file` por cada archivo del chat; la versión del contrato la anota la terminal", () => {
    const s3 = P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
    expect(s3).toMatch(/For an own interface add `--shape own-interface` and one `--file` for each file of the interface/);
    expect(p10()).toMatch(/`supcoflow install record --skill <version> --shape own-interface --file <each file of the interface> --json`/);
    expect(p10()).toMatch(/the terminal writes the contract version from the installed package/);
  });

  it("no hay dos chats: un widget ya montado se frena y se pregunta, y los archivos no se borran por su cuenta", () => {
    const propiaDeSkill = P(seccion(skillMd, /^### An own interface/m, /^## 11\./m));
    expect(propiaDeSkill).toMatch(/If the widget is already mounted.*stop and ask/);
    expect(propiaDeSkill).toMatch(/never delete the file/);
  });

  it("el CSP de la interfaz propia es la regla de siempre, con la línea `csp` de `interfaz_propia`", () => {
    const propiaDeSkill = P(seccion(skillMd, /^### An own interface/m, /^## 11\./m));
    expect(propiaDeSkill).toMatch(/CSP: the same rule as the widget's[^.]*`csp` line of `interfaz_propia`/);
  });

  it("la verificación no gasta: conformidad sobre el backend falso y vista en un navegador; el nivel 2 y el 3 siguen siendo de la persona", () => {
    const propiaDeSkill = P(seccion(skillMd, /^### An own interface/m, /^## 11\./m));
    expect(propiaDeSkill).toMatch(/conformance checks and the fake backend[^.]*spend nothing/);
    expect(propiaDeSkill).toMatch(/Level 2 and level 3 of \[`referencias\/prueba\.md`\].*stay the person's/);
  });

  it("el resumen de la interfaz propia: dónde se abre y con qué está hecha, en tres líneas", () => {
    const resumen = P(seccion(skillMd, /^## 13\./m));
    expect(resumen).toContain("With an own interface line 1 is \"Done. The chat opens from <the trigger>, built with your own components, on N pages, in <the language of its texts>.\"");
    expect(resumen).toMatch(/line 3 also says whether the conformance checks ran/);
  });

  it("el paso 9 con la 0.9.0: `listo` manda y un punto `aviso` (la interfaz) baja la cuenta pero no frena la prueba", () => {
    const s3 = P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
    expect(s3).toMatch(/A failing `aviso` point \(the interface one\) lowers the count but does not stop a test: say what it says/);
    expect(P(leer(CARPETA, "referencias", "prueba.md"))).toMatch(/Checked sign-in, repo, GitHub App, allowed sites, chat, guide and interface: N of 7, at no cost\./);
  });

  it("el nivel 2 de prueba.md también vale para la interfaz propia: el disparador propio en lugar de la burbuja", () => {
    const n2 = P(seccion(leer(CARPETA, "referencias", "prueba.md"), /^## Level 2\b/m, /^## Level 3\b/m));
    expect(n2).toMatch(/the chat shows up where you put it \(the widget's bubble, or the trigger of the own interface\)/);
    expect(n2).toMatch(/with an own interface[^.]*the tools it offers/);
  });
});

describe("referencias/interfaz-propia.md (T9): el procedimiento del plan §2.5", () => {
  const t = () => leer(CARPETA, "referencias", "interfaz-propia.md");
  const txt = () => P(t());

  it("tiene los seis pasos del plan en orden: detectar, proponer, preguntar, escribir, verificar, anotar", () => {
    enOrden(t(), [
      "1. **Detect**",
      "2. **Propose and show before writing**",
      "3. **Ask only what changes the result**",
      "4. **Write**",
      "5. **Check**",
      "6. **Record**",
    ]);
  });

  it("dice cuándo aplica: Next.js (App Router), `interfaz_propia` disponible; si no, el widget", () => {
    expect(txt()).toMatch(/Next\.js \(App Router\)/);
    expect(txt()).toMatch(/`estado` is `disponible`/);
    expect(txt()).toMatch(/Pages Router[^.]*not tested/);
  });

  it("lee el contrato del paquete instalado, sin red: contract.json y el documento", () => {
    expect(txt()).toContain("`contrato`");
    expect(txt()).toContain("node_modules/@supcoflow/chat/contract.json");
    expect(txt()).toContain("node_modules/@supcoflow/chat/docs/presentation-contract.md");
    expect(txt()).toMatch(/offline/);
    expect(txt()).toMatch(/if the installed contract says something different from this file, the contract wins/i);
  });

  it("detecta el sistema de diseño: componentes, íconos, estilos, modo oscuro, i18n y un lugar de la app donde ya vive la ayuda", () => {
    for (const señal of [
      "components.json", "@radix-ui/*", "@mui/material", "@chakra-ui/react", "@mantine/core", "antd", "@headlessui/react", "react-aria-components", "@heroui/react", "daisyui", "react-bootstrap",
      "lucide-react", "@heroicons/react", "@tabler/icons-react", "react-icons", "@phosphor-icons/react", "@radix-ui/react-icons", "@mui/icons-material", "@fortawesome/*", "@iconify/react",
      "Tailwind", "CSS Modules", "styled-components", "emotion", "vanilla-extract", "Sass",
      "next-themes", "next-intl", "react-i18next", "lingui", "formatjs", "cmdk",
    ])
      expect(t(), señal).toContain(señal);
  });

  it("reglas de escritura: reutilizar antes que componer, componer antes que crear; sin librerías ni fuentes nuevas; ícono propio sólo si la app no tiene librería", () => {
    expect(txt()).toMatch(/reuse before composing, compose before creating/i);
    expect(txt()).toMatch(/never add a component, icon or font library/);
    expect(txt()).toMatch(/If the app has no icon library[^.]*inline SVG/);
    expect(txt()).toMatch(/never a second icon library/);
    expect(txt()).toMatch(/Respect focus, the keyboard \(Esc\), `prefers-reduced-motion` and phones/);
  });

  it("nunca copia el ejemplo del paquete tal cual: es un esqueleto, cada elemento se cambia por el de la app", () => {
    expect(txt()).toMatch(/examples\/react\/SupportChat\.tsx/);
    expect(txt()).toMatch(/skeleton, not a design/);
    expect(txt()).toMatch(/Never leave its bare elements/);
  });

  it("Next.js: archivo con \"use client\", el hook en un componente que vive tanto como el chat, el layout de servidor sólo pasa valores serializables", () => {
    expect(txt()).toContain('"use client"');
    expect(txt()).toMatch(/`useSupportChat`/);
    expect(txt()).toMatch(/a component that stays mounted as long as the chat should/);
    expect(txt()).toMatch(/serializable/);
    expect(txt()).toMatch(/Never create the chat while rendering/);
  });

  it("lo que NO se deja a la interfaz: el «Sí» sólo por un gesto sobre ESA confirmación, el texto del reporte en texto plano, el Markdown con el subconjunto seguro, sin HTML", () => {
    expect(txt()).toMatch(/`chat\.confirmReport\(question\.id\)` only from a press of the person/);
    expect(txt()).toMatch(/the report as plain text/i);
    expect(txt()).toMatch(/`parseAssistantText`/);
    expect(txt()).toMatch(/never `dangerouslySetInnerHTML`/);
    expect(txt()).toMatch(/never show `error\.message`/);
  });

  it("D2 A: declara `locale`, los textos del marco los escribe el agente en el idioma de la app y por el i18n de la app", () => {
    expect(txt()).toMatch(/Declare `locale`/);
    expect(txt()).toMatch(/the words of the two report buttons and of the frame around the report come from Supcoflow/);
    expect(txt()).toMatch(/through the app's i18n/);
  });

  it("D3 y D4 A: sin marca de Supcoflow; el historial (retomar al volver) es obligatorio: `resume` en true y `storage` sin `\"none\"`", () => {
    expect(txt()).toMatch(/no Supcoflow logo, name or link/);
    expect(txt()).toMatch(/leave `resume` at `true` and never set `storage` to `\"none\"`/);
    expect(txt()).toMatch(/Wait for `ready`/);
  });

  it("D4 A: encendido por defecto (imagen, captura, señalar, «leyendo la guía», nueva conversación); opcional (pasos, desenlace «respondida», arranques)", () => {
    for (const parte of ["attach an image", "screenshot", "point at an element", "reading the guide", "new conversation", "visible steps", "answered", "start suggestions"])
      expect(txt(), parte).toContain(parte);
    expect(txt()).toMatch(/declare[^.]*`capabilities`/);
  });

  it("un solo chat por proyecto y pestaña, y nunca dos a la vez (el widget y la interfaz propia)", () => {
    expect(txt()).toMatch(/One chat per project and tab/);
    expect(txt()).toMatch(/never the widget and the own interface together/);
  });

  it("verificar sin gastar: conformidad (checks.ts sin editar, plantilla adaptada), servidor falso en un navegador, y la lista manual dicha", () => {
    expect(txt()).toContain("node_modules/@supcoflow/chat/conformance/checks.ts");
    expect(txt()).toContain("chat.conformance.template.tsx");
    expect(txt()).toMatch(/Do not edit `checks\.ts`/);
    expect(txt()).toContain("npx supcoflow-chat-fake");
    expect(txt()).toMatch(/Never commit the fake server's address/);
    expect(txt()).toMatch(/A skipped check is not a pass/);
    expect(txt()).toMatch(/`MANUAL`/);
    expect(txt()).toMatch(/Nothing here spends anything/);
  });

  it("sin corredor de pruebas no se instala uno sin el sí de la persona: se dice que la conformidad no se corrió", () => {
    expect(txt()).toMatch(/If the app has no test runner[^.]*do not install one without the person's yes/);
    expect(txt()).toMatch(/say the conformance checks were not run/);
  });

  it("nunca manda un reporte real para probar, y nunca deja el backend falso en lo que se commitea", () => {
    expect(txt()).toMatch(/Never send a real report to test/);
    expect(txt()).toMatch(/only in development/);
  });

  it("anotar: `install record --shape own-interface` con cada archivo; volver a correr compara el contrato (mayor: conformidad otra vez; menor: ofrecer lo opcional)", () => {
    expect(txt()).toMatch(/install record --skill <version> --shape own-interface --file <file>/);
    expect(txt()).toMatch(/A newer major version.*run the conformance checks again/);
    expect(txt()).toMatch(/A newer minor or patch[^.]*offer what is new and optional/);
  });

  it("no promete lo que no existe: sin feedback 👍/👎 ni lista de conversaciones pasadas (P16 todavía no aplica)", () => {
    expect(txt()).toMatch(/does not exist: no thumbs up\/down/);
    expect(txt()).toMatch(/P16[^.]*does not apply yet/);
  });
});

describe("los escenarios nuevos de la T9 (8 a 11): interfaz propia y sus bordes", () => {
  const dir = join(RAIZ, "docs", "escenarios");
  const t = (f: string) => P(leer(dir, f));
  it("8 (con src/ y shadcn): componentes e íconos de la app, sin colores ni marca, forma y registro, y se verifica", () => {
    const e = t("08-interfaz-propia-con-src.md");
    expect(e).toMatch(/\*\*No pregunta por colores, fuentes ni íconos\*\*, no corre `supcoflow chat brand` y no importa `ChatDeIntake`/);
    expect(e).toMatch(/ninguna carpeta `app\/` en la raíz/);
    expect(e).toMatch(/ninguna marca de Supcoflow/);
    expect(e).toMatch(/`"use client"`/);
    expect(e).toMatch(/`--shape own-interface` y un `--file` por cada archivo del chat/);
    expect(e).toMatch(/«N of 7»/);
    expect(e).toMatch(/`checks\.ts` del paquete \*\*sin editar\*\*/);
    expect(e).toMatch(/`supcoflow-chat-fake`/);
    expect(e).toMatch(/no queda\*\* en lo que se commitea/);
  });
  it("9 (sin src/ y sin sistema de diseño): mismos tokens, nada nuevo instalado, idioma de la app, sin corredor de pruebas no se instala uno sin el sí", () => {
    const e = t("09-interfaz-propia-sin-src.md");
    expect(e).toMatch(/los mismos tokens/);
    expect(e).toMatch(/no\*\* instala Tailwind, ni una librería de íconos ni de componentes, ni fuentes/);
    expect(e).toMatch(/bajo `app\/`, \*\*no\*\* en un `src\/` inventado/);
    expect(e).toMatch(/\{ attachImage: true, screenshot: false, pickElement: false \}/);
    expect(e).toMatch(/`locale: "es"`/);
    expect(e).toMatch(/\*\*no instala uno sin el sí\*\* y dice que la conformidad no se corrió/);
  });
  it("10 (sin camino): dice en una línea por qué usa el widget, y no escribe interfaz ni segundo panel; cubre las cuatro causas", () => {
    const e = t("10-sin-interfaz-propia.md");
    for (const causa of ["(a)", "(b)", "(c)", "(d)", "sin_publicar", "no** manda `interfaz_propia`", "Pages Router"]) expect(e, causa).toContain(causa);
    expect(e).toMatch(/\*\*en una línea\*\* por qué usa el widget/);
    expect(e).toMatch(/\*\*sin\*\* el segundo panel/);
    expect(e).toMatch(/Done\. The chat is a bubble on N pages, in English\./);
  });
  it("11 (conformidad en rojo / widget ya montado): se arregla la interfaz y no el check; con un widget se para y se pregunta; nunca se gasta", () => {
    const e = t("11-conformidad-en-rojo.md");
    expect(e).toMatch(/arregla la interfaz, nunca el check ni `checks\.ts`/);
    expect(e).toMatch(/para y pregunta\*\* si reemplaza el widget: no hay dos chats/);
    expect(e).toMatch(/no borra\*\* el archivo del widget por su cuenta/);
    expect(e).toMatch(/En ningún caso aparece `--authorize-spend`/);
  });
  it("el índice los explica y no dice que nadie los corrió: dice qué se siguió y contra qué", () => {
    const indice = t("README.md");
    expect(indice).toMatch(/Once casos/);
    expect(indice).toMatch(/los escenarios 8 y 9 se siguieron con dos agentes de código contra un motor y un backend falsos/);
  });
});

describe("lo que dejó ver el primer ensayo con dos agentes (T9): fricciones reales del texto", () => {
  const p10 = () => P(seccion(skillMd, /^## 10\./m, /^## 11\./m));
  const p5 = () => P(seccion(skillMd, /^## 5\./m, /^## 6\./m));
  const propia = () => P(leer(CARPETA, "referencias", "interfaz-propia.md"));
  it("si la herramienta no muestra el código de un éxito, no se agrega `echo $?`", () => {
    expect(P(seccion(skillMd, /^## 2\./m, /^## 3\./m))).toMatch(/if your tool shows no code for a success, a result without an error is 0; never add `echo \$\?`/);
  });
  it("la referencia: ids en una constante copiada del JSON, portal y `words.close`, script `test` y vitest.config, y qué cubre lo saltado", () => {
    expect(propia()).toMatch(/in one constant \(or one environment variable\)[^|]*never typed from memory or invented/);
    expect(propia()).toMatch(/`root` is `document\.body`, and `words\.close` names the control/);
    expect(propia()).toMatch(/add `"test": "vitest run"`, and a `vitest\.config\.mts`[^]*with the app's path alias/);
    expect(propia()).toMatch(/say what covers that instead/);
  });
  it("la referencia: el componente recibe las opciones como props opcionales y cada control tiene un nombre accesible distinto", () => {
    expect(propia()).toMatch(/takes the chat options \(`backendUrl`, `fetch`, `storage`, `locale`, `user`\) as optional props that default to the app's own values/);
    expect(propia()).toMatch(/every control a distinct accessible name/);
  });
  it("nextjs.md dice que la interfaz propia se abrió en un navegador, contra el backend falso y nunca contra producción", () => {
    expect(P(leer(CARPETA, "referencias", "nextjs.md"))).toMatch(/was opened in Chrome on Next\.js 16\.4\.3.*against the fake backend of the package; never against production/);
  });
  it("revisión vuelta 1: el sí a la propuesta se define; la lista de `--file` es una sola; volver más tarde nombra los pasos; capabilities sigue a la primera respuesta; huecos de la conformidad", () => {
    const p6 = P(seccion(skillMd, /^## 6\./m, /^## 7\./m));
    expect(p6).toMatch(/the proposal goes in the same message as the panels of point 5, and their answers count as the yes only if the person does not correct the proposal; otherwise ask for the yes apart\. Nothing is written before it/);
    const lista = "the files of the interface (its components and styles), the file of the trigger if it is another, and the file that mounts it (the layout you edited); never the tests";
    expect(p10()).toContain(lista);
    expect(propia()).toContain(lista);
    expect(P(seccion(skillMd, /^## 3\./m, /^## 4\./m))).toMatch(/one `--file` for each file of the interface/);
    expect(p10()).toMatch(/exits 4 with `archivo_no_versionado` or `cambios_sin_commit`[^]*tell the person to commit or discard it, and never delete it or commit it yourself/);
    expect(propia()).toMatch(/install the version `interfaz_propia` gives now[^]*replace `checks\.ts` with the new one \(unedited\)[^]*record the installation again/);
    expect(p5()).toMatch(/When the first answer changes later, `capabilities` follows it: to 2 or 3, all three `false`; to 1, ask the tools question again/);
    expect(propia()).toMatch(/If the app already uses jest, vitest is still needed/);
    expect(propia()).toMatch(/hidden only by a class \(Tailwind's `hidden`\) looks open to the checks/);
    expect(propia()).toMatch(/If the app has a CSP with `connect-src`, the fake server's address is blocked in development too/);
    expect(propia()).toMatch(/if the app has none, a plain element styled with the app's own styles and tokens, never the skeleton's unstyled one/);
    expect(propia()).not.toMatch(/Never leave its bare elements in the app/);
  });
  it("ronda 3: con «Save» la opción 1 lleva su línea literal de gasto cero; con un acuerdo cerrado el segundo panel queda con una pregunta", () => {
    expect(p5()).toContain('print the option as written and add under it "This test spends nothing: it stops at the saved problem."');
    expect(p5()).toMatch(/the second panel then has only its first question/);
  });
  it("la interfaz, sus pruebas y `instalacion.json` no se commitean", () => {
    expect(p10()).toMatch(/Do not commit the interface, its tests or `\.supcoflow\/instalacion\.json`/);
  });
  it("la terminal se corre desde la carpeta de la app (lee el repo de su `origin`)", () => {
    expect(P(seccion(skillMd, /^## 2\./m, /^## 3\./m))).toMatch(/Run the terminal from the app's folder: it reads the repo from that folder's `origin`/);
  });
  it("el segundo panel no contradice la primera respuesta: con la 2 o la 3 se dice y se quita la opción 1 de las herramientas", () => {
    expect(p5()).toMatch(/when the first answer was 2 or 3[^"]*do not ask the tools question: say/);
    expect(p5()).toContain("Your data agreement doesn't take screenshots, images or pointed elements, so the chat won't offer evidence tools.");
    expect(p5()).toMatch(/an image counts as a screenshot/);
  });
  it("sin sesión no se permite `user_id,user_role`: no se pasa nada", () => {
    expect(p5()).toMatch(/If the app has no session, nothing is passed: leave `user_id,user_role` out of the list/);
  });
  it("si `instalar` no es una versión de npm (ruta o URL) se frena: no se puede commitear", () => {
    expect(p10()).toMatch(/If it is not an npm version of the package \(a path or a URL[^)]*\), stop and tell the person: that line cannot be committed/);
  });
  it("la propuesta del paso 5 sale de la app y la referencia; el contrato se lee al instalar y, si cambia lo propuesto, se pregunta de nuevo", () => {
    expect(p10()).toMatch(/the proposal of step 5 comes from the app's code and the reference; read the installed contract right after installing and, if it changes what you proposed, say so and ask before writing the interface/);
    expect(propia()).toMatch(/The package is installed at step 7 of SKILL\.md \(the app is touched only there\)/);
    expect(propia()).toMatch(/If what you read in the installed package changes the proposal[^.]*say so and ask again before writing/);
  });
  it("la interfaz y las pruebas no se commitean: son de la persona; sólo la guía tiene commit", () => {
    expect(p10()).toMatch(/they are the person's to review and commit\. Say it in line 3 of the summary/);
    expect(propia()).toMatch(/Do not commit the interface or the tests/);
    expect(propia()).not.toMatch(/Commit it with the person's yes/);
  });
  it("el resumen no obliga a decir «Done.» si algo quedó sin hacer: «Not finished: …»", () => {
    expect(P(seccion(skillMd, /^## 13\./m))).toMatch(/line 1 is not "Done\." but "Not finished: <what is missing>\."/);
  });
  it("`sites add` se verifica por su resultado; con `--json` la línea del diagnóstico se arma de `instalacion.ok` y `total`", () => {
    const s3 = P(seccion(skillMd, /^## 3\./m, /^## 4\./m));
    expect(s3).toMatch(/if its `sitios` does not list the site, say so and do not go on as if it were added/);
    expect(s3).toMatch(/build it from `instalacion\.ok` and `instalacion\.total`/);
  });
  it("la referencia: instrucciones propias de la app (AGENTS.md), carpeta de pruebas, conflicto de versiones, sin sesión, y el fondo del panel al capturar", () => {
    expect(propia()).toMatch(/`AGENTS\.md`, `CLAUDE\.md`\), follow them for how to write code in the app; they never change what point 5 of SKILL\.md makes you ask/);
    expect(propia()).toMatch(/`tests\/support-chat\/` if it has none/);
    expect(propia()).toMatch(/never force it and never raise the app's own dependencies without asking/);
    expect(propia()).toMatch(/An app with no session has nowhere to wire it: that check stays skipped/);
    expect(propia()).toMatch(/including any overlay or backdrop of the app's sheet or modal/);
    expect(propia()).toMatch(/Recommend the test packages/);
    expect(propia()).toMatch(/the one of its `<html lang>`/);
  });
});
