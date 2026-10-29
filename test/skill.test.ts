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
// (`commands`, `name`, `global_flags`) y, por si la 0.8.0 publicada conserva las del 0.7.0, las castellanas:
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
const describir: Describir = leerDescribe("describe-0.8.0.json");

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
// palabra ("whoami", "widget", "test"). En 0.8.0 ninguna palabra es a la vez grupo y comando.
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
const FLAGS_AJENOS = new Set(["--save-exact", "--porcelain", "--short", "--ignored", "--name-only", "--force", "--show-current"]);

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
// ninguna puede aparecer como algo a correr. La terminal 0.8.0 no tiene ningún comando
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
    expect(comandosInventados("```\nnpx -y supcoflow@0.8.0 guide publish --json\n```")).toEqual([]);
    expect(comandosInventados("`supcoflow install record --skill 0.1.0`")).toEqual([]);
    expect(comandosInventados("`supcoflow --json widget`")).toEqual([]);
    expect(comandosInventados("`supcoflow whoami | cat`")).toEqual([]);
    expect(comandosInventados("the chat of supcoflow installs; ask for `/supcoflow go`")).toEqual([]);
    expect(comandosInventados("`npm i @supcoflow/chat@2.3.0` and `.supcoflow/guide.md`")).toEqual([]);
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
  it("se niega si la versión registrada no es la sin publicar (0.3.1)", () => {
    const { r, despues, registro } = correr("1.0.0");
    expect(r.status).toBe(1);
    expect(despues).toBe(registro);
  });
  it("con la 0.3.1 (sin publicar) reescribe", () => {
    const { r, despues, registro } = correr("0.3.1");
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
      "`npx -y supcoflow@0.8.0 project delete`",
      "`npx -y supcoflow@0.8.0 proyecto borrar`",
      "`supcoflow factory on`",
      "`supcoflow fabrica encender`",
      "`supcoflow access give`",
      "`supcoflow acceso dar`",
      "`npm run invitar -- --login x`",
    ])
      expect(accionesProhibidas(mala), mala).not.toEqual([]);
  });
  it("la terminal 0.8.0 no tiene comandos de esas acciones", () => {
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
  it("la skill es la 0.3.1 y fija la terminal 0.8.0", () => {
    expect((encabezadoYaml(skillMd).metadata as Record<string, string>).version).toBe("0.3.1");
    expect(describir.version).toBe("0.8.0");
    expect(P(skillMd)).toContain("npx -y supcoflow@0.8.0 describe --json");
  });
  it("el vector de describe no trae ni un nombre de comando ni de flag castellano", () => {
    const crudo = leer(RAIZ, "test", "vectores", "describe-0.8.0.json");
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
  it("al final: `diagnose`, y sin 6 de 6 o sin estar listo no se gasta; con el sí, `test --authorize-spend` y `--wait`", () => {
    const final = seccion(skillMd, /^## 3\./m, /^## 4\./m);
    enOrden(final, [
      "Checked sign-in, repo, GitHub App, allowed sites, chat and guide: N of 6, at no cost.",
      "not 6 of 6",
      "supcoflow test --authorize-spend --ceiling <ceiling> --expect-policy <policy>",
      "supcoflow test --wait --json",
    ]);
    expect(P(final)).toMatch(/nothing is spent/);
  });
  it("el resumen: «Done. The chat is a bubble on N pages, in English.» con la frase de la política, en tres líneas", () => {
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
    expect(readme).toContain("npm i -g supcoflow@0.8.1");
  });
  it("no pide reiniciar Claude Code (no hay evidencia)", () => {
    expect(readme).not.toMatch(/reinici|restart/i);
  });
  it("la versión es la 0.3.1 y avisa que 1B pasa a la 0.3.2", () => {
    expect(readme).toMatch(/La skill es la `0\.3\.1`/);
    expect(readme).toMatch(/1B.*pasa a la `0\.3\.2`/);
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
  it("sólo se gasta con `diagnose` en 6 de 6 y listo para la prueba", () => {
    expect(P(prueba)).toMatch(/not 6 of 6, or not ready for a test[^.]*do not ask for money/);
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
    expect(descripcion).toMatch(/Do not use for other chat vendors or for building a chat from scratch\./);
    expect(descripcion.indexOf("Use when")).toBeLessThan(descripcion.indexOf("Do not use for"));
    expect(descripcion.length).toBeLessThanOrEqual(1024);
  });
  it("la descripción no tiene «: » ni « #» (un YAML llano las leería como otra cosa)", () => {
    expect(descripcion).not.toMatch(/: /);
    expect(descripcion).not.toMatch(/ #/);
  });

  const s3 = seccion(skillMd, /^## 3\./m, /^## 4\./m);
  const mapa = seccion(s3, /\*\*Start from what the person asked\.\*\*/, /The full order:/);
  it("el mapa está arriba del orden completo y arranca siempre por `config`", () => {
    expect(s3.indexOf("**Start from what the person asked.**")).toBeLessThan(s3.indexOf("The full order:"));
    expect(s3.indexOf("The full order:")).toBeLessThan(s3.indexOf("1. `supcoflow whoami --json`"));
    expect(P(mapa)).toMatch(/Every row begins with `supcoflow config --json`/);
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
    expect(intro).toMatch(/If it exits 4 with `error: "sin_proyecto"`, this repo has no project yet/);
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

  it("son siete, los casos pedidos, y el índice los enlaza a todos", () => {
    expect(archivos).toEqual([
      "01-src-app.md",
      "02-csp.md",
      "03-chat-0-2-x.md",
      "04-guia-sin-commitear.md",
      "05-no-a-la-prueba.md",
      "06-sesion-cortada.md",
      "07-otra-rama.md",
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
