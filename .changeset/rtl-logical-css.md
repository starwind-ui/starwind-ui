---
"starwind": patch
---

Accordion, Table, Native Select, Select, Dialog, Sheet, Input, Input Group, and Switch now mirror correctly in right-to-left pages such as `dir="rtl"` Arabic. Before, text stayed left-aligned, and close buttons, select arrows, check marks, file-input spacing, input-group padding, and switch labels stayed on the physical left or right. Run `starwind update` for these components to get the fix. Left-to-right pages look the same. Sheet `side="left"` and `side="right"` still mean the physical side.
