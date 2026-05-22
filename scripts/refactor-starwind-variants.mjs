import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Project, SyntaxKind } from "ts-morph";

const projectRoot = process.cwd();
const targetRoot = path.resolve(projectRoot, process.argv[2] ?? "src/components/starwind");
const tsProject = new Project({ useInMemoryFileSystem: true });
const changedFiles = new Set();
const folderVariants = new Map();

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      return walk(absolutePath);
    }

    return [absolutePath];
  });
}

function getFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return null;
  }

  return {
    content: match[1],
    end: match[0].length,
    marker: match[0].slice(match[0].length - 3),
  };
}

function normalizeSpecifier(specifier) {
  return specifier.trim().replace(/^type\s+/, "");
}

function updateTailwindVariantsImport(frontmatter) {
  return frontmatter
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(
        /^(\s*)import\s+\{([^}]+)\}\s+from\s+["']tailwind-variants["'];\s*$/,
      );

      if (!match) {
        return line;
      }

      const indent = match[1];
      const remaining = match[2]
        .split(",")
        .map((specifier) => specifier.trim())
        .filter((specifier) => specifier && specifier !== "tv");

      if (remaining.length === 0) {
        return null;
      }

      const onlyTypes = remaining.every((specifier) => specifier.startsWith("type "));
      const specifiers = remaining
        .map((specifier) => (onlyTypes ? normalizeSpecifier(specifier) : specifier))
        .join(", ");

      if (onlyTypes) {
        return `${indent}import type { ${specifiers} } from "tailwind-variants";`;
      }

      return `${indent}import { ${specifiers} } from "tailwind-variants";`;
    })
    .filter((line) => line !== null)
    .join("\n");
}

function addVariantsImport(frontmatter, names) {
  const uniqueNames = [...new Set(names)].sort();

  if (uniqueNames.length === 0) {
    return frontmatter;
  }

  const importText = `import { ${uniqueNames.join(", ")} } from "./variants";`;
  const existingMatch = frontmatter.match(/import\s+\{([^}]+)\}\s+from\s+["']\.\/variants["'];/);

  if (existingMatch) {
    const existingNames = existingMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const mergedNames = [...new Set([...existingNames, ...uniqueNames])].sort();
    return frontmatter.replace(
      existingMatch[0],
      `import { ${mergedNames.join(", ")} } from "./variants";`,
    );
  }

  const lines = frontmatter.split("\n");
  let insertIndex = 0;

  while (insertIndex < lines.length && lines[insertIndex].startsWith("import ")) {
    insertIndex += 1;
  }

  lines.splice(insertIndex, 0, importText);

  return lines.join("\n");
}

function compactBlankLines(source) {
  return source.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function collectExistingVariantNames(source) {
  const sourceFile = tsProject.createSourceFile(`existing-${Math.random()}.ts`, source, {
    overwrite: true,
  });

  return new Set(
    sourceFile
      .getVariableStatements()
      .filter((statement) => statement.hasExportKeyword())
      .flatMap((statement) =>
        statement.getDeclarations().map((declaration) => declaration.getName()),
      ),
  );
}

function getTvExportStatements(frontmatter, filePath) {
  const sourceFile = tsProject.createSourceFile(`${filePath}.ts`, frontmatter, { overwrite: true });

  return sourceFile
    .getVariableStatements()
    .filter((statement) => statement.hasExportKeyword())
    .map((statement) => {
      const declarations = statement.getDeclarations();
      const tvDeclarations = declarations.filter((declaration) => {
        const initializer = declaration.getInitializer();

        return (
          initializer?.getKind() === SyntaxKind.CallExpression &&
          initializer.getExpression().getText() === "tv"
        );
      });

      if (tvDeclarations.length !== declarations.length || tvDeclarations.length === 0) {
        return null;
      }

      return {
        names: tvDeclarations.map((declaration) => declaration.getName()),
        text: statement.getText(),
        start: statement.getFullStart(),
        end: statement.getEnd(),
      };
    })
    .filter(Boolean);
}

function refactorAstroFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  const frontmatter = getFrontmatter(source);

  if (!frontmatter || !frontmatter.content.includes("tv(")) {
    return;
  }

  const statements = getTvExportStatements(frontmatter.content, filePath);

  if (statements.length === 0) {
    return;
  }

  const folder = path.dirname(filePath);
  const variantNames = statements.flatMap((statement) => statement.names);
  const variants = folderVariants.get(folder) ?? [];
  folderVariants.set(folder, [...variants, ...statements.map((statement) => statement.text)]);

  let nextFrontmatter = frontmatter.content;

  for (const statement of [...statements].sort((a, b) => b.start - a.start)) {
    nextFrontmatter =
      nextFrontmatter.slice(0, statement.start) + nextFrontmatter.slice(statement.end);
  }

  nextFrontmatter = updateTailwindVariantsImport(nextFrontmatter);
  nextFrontmatter = addVariantsImport(nextFrontmatter, variantNames);
  nextFrontmatter = compactBlankLines(nextFrontmatter);

  const nextSource = `---\n${nextFrontmatter}---${source.slice(frontmatter.end)}`;

  if (nextSource !== source) {
    writeFileSync(filePath, nextSource);
    changedFiles.add(path.relative(projectRoot, filePath));
  }
}

function writeVariantsFiles() {
  for (const [folder, statements] of folderVariants.entries()) {
    const variantsPath = path.join(folder, "variants.ts");
    const existingSource = existsSync(variantsPath) ? readFileSync(variantsPath, "utf8") : "";
    const existingNames = existingSource ? collectExistingVariantNames(existingSource) : new Set();
    const newStatements = statements.filter((statement) => {
      const sourceFile = tsProject.createSourceFile(`variant-${Math.random()}.ts`, statement, {
        overwrite: true,
      });
      const names = sourceFile
        .getVariableStatements()
        .flatMap((item) => item.getDeclarations().map((declaration) => declaration.getName()));

      return names.some((name) => !existingNames.has(name));
    });

    if (newStatements.length === 0) {
      continue;
    }

    const prefix = existingSource.trim()
      ? existingSource.trimEnd()
      : 'import { tv } from "tailwind-variants";\n';
    const nextSource = `${prefix}\n\n${newStatements.join("\n\n")}\n`;

    writeFileSync(variantsPath, nextSource);
    changedFiles.add(path.relative(projectRoot, variantsPath));
  }
}

function parseNamedImports(specifiers) {
  return specifiers
    .split(",")
    .map((specifier) => specifier.trim())
    .filter(Boolean)
    .map((specifier) => specifier.split(/\s+as\s+/)[0].trim());
}

function updateAstroFileImports(filePath, variantNamesSet, folder) {
  const source = readFileSync(filePath, "utf8");
  const frontmatter = getFrontmatter(source);

  if (!frontmatter) {
    return;
  }

  let changed = false;
  let fm = frontmatter.content;
  const collectedVariantNames = [];

  // Mixed default + named from .astro in the same folder
  fm = fm.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+["'](\.\/[^"']+\.astro)["'];\s*$/gm,
    (match, defaultName, specifiersStr, importPath) => {
      const resolved = path.resolve(folder, importPath);

      if (path.dirname(resolved) !== folder) {
        return match;
      }

      const specifiers = specifiersStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const variantSpecifiers = specifiers.filter((s) => variantNamesSet.has(s));
      const nonVariantSpecifiers = specifiers.filter((s) => !variantNamesSet.has(s));

      if (variantSpecifiers.length === 0) {
        return match;
      }

      changed = true;
      collectedVariantNames.push(...variantSpecifiers);

      if (nonVariantSpecifiers.length === 0) {
        return `import ${defaultName} from "${importPath}";`;
      }

      return `import ${defaultName}, { ${nonVariantSpecifiers.join(", ")} } from "${importPath}";`;
    },
  );

  // Pure named from .astro in the same folder
  fm = fm.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["'](\.\/[^"']+\.astro)["'];\s*$/gm,
    (match, specifiersStr, importPath) => {
      const resolved = path.resolve(folder, importPath);

      if (path.dirname(resolved) !== folder) {
        return match;
      }

      const specifiers = specifiersStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const variantSpecifiers = specifiers.filter((s) => variantNamesSet.has(s));
      const nonVariantSpecifiers = specifiers.filter((s) => !variantNamesSet.has(s));

      if (variantSpecifiers.length === 0) {
        return match;
      }

      changed = true;
      collectedVariantNames.push(...variantSpecifiers);

      if (nonVariantSpecifiers.length === 0) {
        return "";
      }

      return `import { ${nonVariantSpecifiers.join(", ")} } from "${importPath}";`;
    },
  );

  if (changed) {
    fm = addVariantsImport(fm, collectedVariantNames);
    fm = compactBlankLines(fm);

    const nextSource = `---\n${fm}---${source.slice(frontmatter.end)}`;

    writeFileSync(filePath, nextSource);
    changedFiles.add(path.relative(projectRoot, filePath));
  }
}

function updateIndexFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  const collectedNames = [];
  let nextSource = source.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+["'](\.\/[^"']+\.astro)["'];\s*$/gm,
    (_match, defaultName, namedImports, importPath) => {
      collectedNames.push(...parseNamedImports(namedImports));
      return `import ${defaultName} from "${importPath}";`;
    },
  );

  nextSource = nextSource.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["'](\.\/[^"']+\.astro)["'];\s*$/gm,
    (_match, namedImports) => {
      collectedNames.push(...parseNamedImports(namedImports));
      return "";
    },
  );

  if (collectedNames.length === 0) {
    return;
  }

  const uniqueNames = [...new Set(collectedNames)].sort();
  const variantsImportMatch = nextSource.match(
    /^import\s+\{([^}]+)\}\s+from\s+["']\.\/variants["'];\s*$/m,
  );

  if (variantsImportMatch) {
    const existingNames = parseNamedImports(variantsImportMatch[1]);
    const mergedNames = [...new Set([...existingNames, ...uniqueNames])].sort();
    nextSource = nextSource.replace(
      variantsImportMatch[0],
      `import { ${mergedNames.join(", ")} } from "./variants";`,
    );
  } else {
    const lines = nextSource.split("\n");
    let insertIndex = 0;

    while (insertIndex < lines.length && lines[insertIndex].startsWith("import ")) {
      insertIndex += 1;
    }

    lines.splice(insertIndex, 0, `import { ${uniqueNames.join(", ")} } from "./variants";`);
    nextSource = lines.join("\n");
  }

  nextSource = nextSource.replace(/\n{3,}/g, "\n\n");

  if (nextSource !== source) {
    writeFileSync(filePath, nextSource);
    changedFiles.add(path.relative(projectRoot, filePath));
  }
}

if (!existsSync(targetRoot)) {
  throw new Error(`Target directory does not exist: ${targetRoot}`);
}

const files = walk(targetRoot);

for (const file of files.filter((item) => item.endsWith(".astro"))) {
  refactorAstroFile(file);
}

writeVariantsFiles();

// Fix named imports from .astro files that now live in variants.ts
for (const [folder, _statements] of folderVariants.entries()) {
  const variantsPath = path.join(folder, "variants.ts");

  if (!existsSync(variantsPath)) {
    continue;
  }

  const variantNames = collectExistingVariantNames(readFileSync(variantsPath, "utf8"));

  if (variantNames.size === 0) {
    continue;
  }

  const astroFiles = readdirSync(folder)
    .filter((f) => f.endsWith(".astro"))
    .map((f) => path.join(folder, f));

  for (const filePath of astroFiles) {
    updateAstroFileImports(filePath, variantNames, folder);
  }
}

for (const file of files.filter((item) => item.endsWith("index.ts"))) {
  updateIndexFile(file);
}

if (changedFiles.size === 0) {
  console.log("No Starwind variant files needed refactoring.");
} else {
  console.log("Refactored Starwind variant files:");
  for (const file of [...changedFiles].sort()) {
    console.log(`- ${file}`);
  }
}
