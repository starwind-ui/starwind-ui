import { Prose } from "../kit";

export function ProseDemo() {
  return (
    <section className="space-y-4" id="react-runtime-prose-demo">
      <h2 className="text-2xl font-semibold">Prose</h2>

      <Prose className="runtime-prose-custom max-w-[32.5rem]">
        <h3 id="react-runtime-prose-heading">Portable typography</h3>
        <p id="react-runtime-prose-paragraph">
          Prose styles markdown-like content with Starwind spacing, heading, link, list, and code
          treatment while keeping the wrapper easy to customize.
        </p>
        <ul id="react-runtime-prose-list">
          <li>Scoped list markers</li>
          <li>
            Inline <code id="react-runtime-prose-code">code</code> receives the prose treatment.
          </li>
        </ul>
        <div className="not-sw-prose">
          <h3 id="react-runtime-prose-escaped-heading">Escaped heading</h3>
          <p>
            Escaped content keeps native inline{" "}
            <code id="react-runtime-prose-escaped-code">code</code> styling.
          </p>
        </div>
      </Prose>
    </section>
  );
}
