---
"starwind": patch
---

When `starwind add` installs Sidebar, it now adds any missing sidebar color tokens to your CSS file, as it does for the chart tokens when it installs Chart. Before, a stylesheet from an older setup without these tokens gave the Sidebar no colors. The command adds only the missing `--sidebar-*` and `--color-sidebar-*` tokens and keeps the values that you set. If your `:root` already sets some sidebar colors, it adds no dark mode values, so your colors stay in dark mode. If it cannot edit the file, it prints the token block for you to paste.
