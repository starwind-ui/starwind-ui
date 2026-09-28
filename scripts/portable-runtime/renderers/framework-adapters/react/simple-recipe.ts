import type { CommandOperations } from "../../shared-recipes/simple/operations.js";
export const simpleRecipeOperations: CommandOperations = {
  initialValue: (name, expression) => `const ${name} = React.useRef(${expression}).current;`,
  owner: "owned.current",
  readInput: (prop) => prop.name,
  fieldName: (prop) => prop.attribute ?? prop.name,
  attribute: (name, expression) => `${name}={${expression}}`,
  declareOwner: (factory) =>
    `const owned = React.useRef<ReturnType<typeof ${factory}> | undefined>(undefined);`,
  lifecycle({ recipe, declaration, dispose, create, condition, commands }) {
    return `${declaration}
    useIsomorphicLayoutEffect(() => {
      const element = rootRef.current; if (!element${condition ? ` || !${condition}` : ""}) return;
      ${create}
      return () => { ${dispose} };
    }, [${recipe.enabledBy ?? ""}]);
    ${commands.map((c) => `useIsomorphicLayoutEffect(() => { ${c.body} }, [${[...c.reads, ...(recipe.enabledBy ? [recipe.enabledBy] : [])].join(", ")}]);`).join("\n")}`;
  },
  frame({ recipe, name, imports, fields, destructure, attrs, code }) {
    return `import { ${imports} } from '@starwind-ui/runtime/${recipe.runtime}';
import * as React from 'react';
import { setRef } from '../internal/compose-refs';
import { useIsomorphicLayoutEffect } from '../internal/use-isomorphic-layout-effect';
export type ${name}Props = Omit<React.ComponentPropsWithoutRef<'${recipe.tag}'>, ${recipe.props.map((p) => JSON.stringify(p.attribute ?? p.name)).join(" | ")}> & { ${fields} };
const ${name} = React.forwardRef<${recipe.element}, ${name}Props>(function ${name}({children, ${destructure}, ...rest}, forwardedRef) {
const rootRef = React.useRef<${recipe.element}>(null);
const composedRef = React.useCallback((element: ${recipe.element} | null) => { rootRef.current = element; return setRef(forwardedRef,element); }, [forwardedRef]);
${code}
return <${recipe.tag} {...rest} ${attrs} ref={composedRef}>{children}</${recipe.tag}>;
});
${name}.displayName = '${recipe.component}.Root';
export default ${name};`;
  },
};
