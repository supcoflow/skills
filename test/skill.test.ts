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
    expect(flagsInventados("`supcoflow widget --json`")).toEqual([]);
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
  // PENDIENTE DE RE-SINCRONIZAR: el de esta rama sale del contrato del plan (T2.3), no de la rama del motor.
  const HUELLA_DE_LA_GUIA_DE_EJEMPLO =
    "c046cd9570fd50c58ef0059dc10d3ea87e2e66a886ad547cfb4dbcc1d4f69f2e";
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
  it("la skill es la 0.3.0 y fija la terminal 0.8.0", () => {
    expect((encabezadoYaml(skillMd).metadata as Record<string, string>).version).toBe("0.3.0");
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
  it("hay motivos", () => expect(motivos.length).toBeGreaterThan(10));
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
  it("la pregunta de datos dice la verdad entera: lo que no se permite tampoco lo ve la IA del chat", () => {
    const p5 = seccion(skillMd, /^## 5\./m, /^## 6\./m);
    expect(P(p5)).toMatch(/the chat's AI does not see it either/);
    expect(P(p5)).toMatch(/does not offer screenshots or pointing at elements/);
    expect(P(skillMd)).not.toMatch(/2\.2\.1/); // se borró la salvedad del chat 2.2.1
    expect(P(skillMd)).not.toMatch(/does not cover what the chat's AI sees/);
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

describe("no dos chats (R7, spec §10.3)", () => {
  const p10 = () => seccion(skillMd, /^## 10\./m, /^## 11\./m);
  it("el orden para elegir el archivo", () => {
    enOrden(p10(), [
      "1. The `archivo` recorded in `.supcoflow/instalacion.json`",
      "2. The file the layout imports, read from the code",
      "3. One of `archivos_anteriores`",
      "4. `archivo_sugerido`",
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
