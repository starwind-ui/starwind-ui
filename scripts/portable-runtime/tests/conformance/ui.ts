import type { Locator, Page } from "playwright";
import { expect } from "vitest";
import { attributeDifferenceIsListed } from "./differences";
import type { EventEntry } from "./fixtures/shared/harness";

export const TARGETS = ["astro", "react", "vue", "svelte"] as const;
export type Target = (typeof TARGETS)[number];

/** [event, value, reason]. An omitted reason is not compared. */
export type ExpectedEvent = [event: string, value: unknown, reason?: string];

export type AttributeSurface = Record<string, Record<string, Record<string, string>>>;

const POLL_TIMEOUT = 1500;

/** Waits for `read` to give `expected`. It works inside concurrent scenarios and shared captures. */
async function poll(label: string, read: () => Promise<unknown>, expected: unknown): Promise<void> {
  const want = JSON.stringify(expected);
  const deadline = Date.now() + POLL_TIMEOUT;
  while (true) {
    const value = JSON.stringify(await read());
    if (value === want) return;
    if (Date.now() > deadline) throw new Error(`${label}: expected ${want}, received ${value}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

/** The one API that scenarios use. It hides all target differences behind `data-testid`. */
export class Ui {
  constructor(
    readonly page: Page,
    readonly target: Target,
    private readonly reference: (
      name: string,
      capture: (astro: Ui) => Promise<unknown>,
    ) => Promise<unknown>,
  ) {}

  /**
   * Compares a captured attribute surface with what the same steps give on Astro. Each difference
   * prints as `phase part attribute: target value, astro value`.
   */
  async matchesAstro(
    name: string,
    actual: AttributeSurface,
    capture: (astro: Ui) => Promise<AttributeSurface>,
  ): Promise<void> {
    if (this.target === "astro") return;
    const reference = (await this.reference(name, capture)) as AttributeSurface;
    const differences: string[] = [];
    for (const [phase, parts] of Object.entries(actual)) {
      for (const [part, attributes] of Object.entries(parts)) {
        const expected = reference[phase]?.[part] ?? {};
        for (const attribute of new Set([...Object.keys(attributes), ...Object.keys(expected)])) {
          const mine = attributes[attribute] ?? null;
          const astro = expected[attribute] ?? null;
          if (mine === astro) continue;
          if (attributeDifferenceIsListed(this.target, phase, part, attribute)) continue;
          differences.push(`${phase} ${part} ${attribute}: ${this.target} ${mine}, astro ${astro}`);
        }
      }
    }
    if (differences.length > 0) {
      throw new Error(`Attributes differ from Astro:\n${differences.join("\n")}`);
    }
  }

  t(id: string): Locator {
    return this.page.locator(`[data-testid="${id}"]`);
  }

  async settle(): Promise<void> {
    await this.page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
        ),
    );
  }

  async clearEvents(): Promise<void> {
    await this.settle();
    await this.page.evaluate(() => {
      window.__cf.events.length = 0;
    });
  }

  async cancel(instance: string, event: string): Promise<void> {
    await this.page.evaluate(
      ([key]) => {
        window.__cf.cancel[key!] = true;
      },
      [`${instance}:${event}`],
    );
  }

  async refuse(instance: string, value = true): Promise<void> {
    await this.page.evaluate(
      ([id, refuse]) => {
        window.__cf.refuse[id as string] = refuse as boolean;
      },
      [instance, value] as const,
    );
  }

  async parentWrite(instance: string, value: unknown): Promise<void> {
    await this.page.evaluate(
      ([id, next]) => {
        window.__cf.parents[id as string]!.write(next);
      },
      [instance, value] as const,
    );
    await this.settle();
  }

  async parentValue(instance: string): Promise<unknown> {
    return this.page.evaluate((id) => window.__cf.parents[id]!.read(), instance);
  }

  async entries(instance: string): Promise<EventEntry[]> {
    return this.page.evaluate(
      (id) => window.__cf.events.filter((entry) => entry.instance === id),
      instance,
    );
  }

  /** Change events only, in the order they fired. Model writes are read with `modelWrites`. */
  async changes(instance: string): Promise<ExpectedEvent[]> {
    return (await this.entries(instance))
      .filter((entry) => !entry.event.startsWith("model:"))
      .map((entry) => [entry.event, entry.value, entry.reason]);
  }

  /** Waits for the sequence, then proves that nothing more fires after it. */
  async expectChanges(instance: string, expected: ExpectedEvent[]): Promise<void> {
    const matches = async () => {
      const actual = await this.changes(instance);
      return actual.map(([event, value, reason], index) => {
        const wantsReason = expected[index]?.[2] !== undefined;
        return wantsReason ? [event, value, reason] : [event, value];
      });
    };
    const shape = expected.map((entry) => (entry[2] === undefined ? entry.slice(0, 2) : entry));
    await poll(`${instance} changes`, matches, shape);
    await this.settle();
    expect(await matches()).toEqual(shape);
  }

  /** Vue reports model writes apart from change events. Other targets have no such channel. */
  async expectModelWrites(instance: string, model: string, expected: unknown[]): Promise<void> {
    if (this.target !== "vue") return;
    const actual = (await this.entries(instance))
      .filter((entry) => entry.event === `model:${model}`)
      .map((entry) => entry.value);
    expect(actual).toEqual(expected);
  }

  /** Every named payload field must reach the fixture on all targets. */
  async expectFields(instance: string, event: string, expected: string[]): Promise<void> {
    const entry = (await this.entries(instance)).find((item) => item.event === event);
    const missing = expected.filter((field) => !entry?.fields.includes(field));
    expect(missing).toEqual([]);
  }

  async expectPrevious(instance: string, event: string, expected: unknown): Promise<void> {
    const entry = (await this.entries(instance)).find((item) => item.event === event);
    expect(entry?.previous).toEqual(expected);
  }

  async attr(id: string, name: string): Promise<string | null> {
    return this.t(id).first().getAttribute(name);
  }

  async expectAttr(id: string, name: string, expected: string | null): Promise<void> {
    await poll(`${id} ${name}`, () => this.attr(id, name), expected);
  }

  async expectValue(id: string, expected: string): Promise<void> {
    await poll(`${id} value`, () => this.t(id).first().inputValue(), expected);
  }

  async expectVisible(id: string, expected = true): Promise<void> {
    await poll(`${id} visible`, () => this.t(id).first().isVisible(), expected);
  }

  async expectText(id: string, expected: string): Promise<void> {
    await poll(
      `${id} text`,
      async () => (await this.t(id).first().textContent())?.trim(),
      expected,
    );
  }

  async expectFocus(id: string): Promise<void> {
    await poll(
      "focus",
      () => this.page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
      id,
    );
  }

  /** Reads what the browser would submit. */
  async formEntries(formId: string): Promise<[string, string][]> {
    return this.page.evaluate((id) => {
      const form = document.getElementById(id) as HTMLFormElement;
      return [...new FormData(form).entries()].map(
        ([name, value]) => [name, String(value)] as [string, string],
      );
    }, formId);
  }

  async expectFormEntry(formId: string, name: string, expected: string | null): Promise<void> {
    const read = async () => {
      const entries = await this.formEntries(formId);
      return entries.find(([key]) => key === name)?.[1] ?? null;
    };
    await poll(`${formId} entry ${name}`, read, expected);
  }

  async resetForm(formId: string): Promise<void> {
    await this.page.evaluate((id) => {
      (document.getElementById(id) as HTMLFormElement).reset();
    }, formId);
    await this.settle();
    await this.settle();
  }
}
