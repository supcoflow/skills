import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
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
const FLAGS_CONOCIDOS = new Set(
  [...describir.comandos.flatMap((c) => c.flags), ...describir.flags_globales].flatMap((f) => {
    const m = f.match(/^(--[a-z][a-z-]*)(?:,\s*(-[a-z]))?/);
    return m ? [m[1], ...(m[2] ? [m[2]] : [])] : [];
  }),
);

function pedazosDeCodigo(texto: string): string[] {
  const salida: string[] = [];
  const sinBloques = texto.replace(/```[^\n]*\n([\s\S]*?)```/g, (_, b: string) => {
    salida.push(...b.split("\n"));
    return "\n";
  });
  for (const m of sinBloques.matchAll(/`([^`\n]+)`/g)) salida.push(m[1]);
  return salida;
}

function comandosInventados(texto: string): string[] {
  const malos: string[] = [];
  for (const pedazo of pedazosDeCodigo(texto)) {
    for (const m of pedazo.matchAll(/(?<![/\w@-])supcoflow(?:@[\w.]+)?(?:\s+([a-z][a-z-]*)(?:\s+([a-z][a-z-]*))?)?/g)) {
      const [, a, b] = m;
      if (!a) continue; // `supcoflow` solo, o `npx -y supcoflow@0.6.0` partido en otra línea
      const dos = b ? `${a} ${b}` : null;
      if (dos && NOMBRES.has(dos)) continue;
      if (NOMBRES.has(a)) continue;
      malos.push(dos ?? a);
    }
  }
  return malos;
}

const HERRAMIENTAS_AJENAS = /\b(npm|pnpm|yarn|bun|git|npx skills|node)\b/;
function flagsInventados(texto: string): string[] {
  const malos: string[] = [];
  for (const linea of texto.split("\n")) {
    // `--save-exact` de npm o `--` de git no son nuestros; en una línea que además
    // nombra a supcoflow, en cambio, todo flag tiene que existir.
    if (HERRAMIENTAS_AJENAS.test(linea) && !/supcoflow\s/.test(linea)) continue;
    for (const m of linea.matchAll(/(?<![\w-])(--[a-z][a-z-]*)/g)) {
      if (!FLAGS_CONOCIDOS.has(m[1])) malos.push(m[1]);
    }
  }
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
  it("control: un comando o un flag inventados hacen fallar al revisor", () => {
    expect(comandosInventados("corré `supcoflow instalar`")).toEqual(["instalar"]);
    expect(comandosInventados("```\nnpx -y supcoflow@0.6.0 guia publicar --json\n```")).toEqual([]);
    expect(comandosInventados("`supcoflow instalacion anotar --skill 0.1.0`")).toEqual([]);
    expect(comandosInventados("`supcoflow guia borrar`")).toEqual(["guia borrar"]);
    expect(comandosInventados("el chat de supcoflow instala; pedí `/supcoflow go`")).toEqual([]);
    expect(flagsInventados("`supcoflow widget --magia`")).toEqual(["--magia"]);
    expect(flagsInventados("`supcoflow widget --json`")).toEqual([]);
    expect(flagsInventados("`npm i @supcoflow/chat@2.2.1 --save-exact`")).toEqual([]);
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
