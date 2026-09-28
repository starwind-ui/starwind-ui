---
"starwind": patch
---

Fixed missing styles when setting up Starwind in an Astro project without a shared layout. The CLI now imports the stylesheet in the home page and tells you which file it updated. If it cannot add the import, it shows you what to add yourself.

When a component fails to install, the CLI now shows an error and exits with a failure code so scripts and CI can detect the problem. It also lists the components that installed successfully.
