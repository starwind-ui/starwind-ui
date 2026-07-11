---
"starwind": major
---

Release the Runtime-aware Starwind CLI and the v2 bundled styled-component registry.

The CLI now installs styled components for Astro and React, provides explicit Primitive source add, update, list, search, and preview workflows, tracks mixed framework and registry sources, supports native Starwind Pro registry installs, and safely migrates existing projects to Runtime-backed components.

This release also makes component removal framework-aware, detects styled dependency cycles and local file conflicts, validates registry package specifications and configuration before mutation, confines managed paths to the project root, and restricts authenticated registry credentials to trusted origins.
