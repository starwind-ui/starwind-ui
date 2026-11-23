The fixture uses projected Styled components in all four frameworks. The stage also runs the
existing Form, Button Group, and Native Select cases.

[SalahAdDin's PR #290](https://github.com/starwind-ui/starwind-ui/pull/290) supplied the logical
spacing corrections for Accordion, Table, Native Select, Input, and Input Group. The scoped
fixture checks their current contracts, including all Native Select sizes and real file inputs.

| Row                         | Before and expected result                                                                                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button Group                | The RTL inner seam measured 2px for plain buttons. The corrected pairs have one 1px seam in either direction. Focus rings and the vertical group keep their existing rules.                                                                     |
| Toggle Group / Input OTP    | Horizontal ends round in source order. Zero-spacing outlined toggles retain a 1px seam. OTP's extra all-side border previously gave the LTR join two borders as well; both directions now use one.                                              |
| Field / Form / Input        | The file button in each real input keeps 16px of space before the filename. Field's responsive grid retains label and control order. Invalid Form summary links align to their own inline start.                                                |
| Accordion / Table           | Trigger and header text use start alignment. Checkbox cells remove end padding. The table's 2px vertical checkbox offset stays physical.                                                                                                        |
| Native Select / Input Group | The default Native Select had 12px of RTL end padding and a chevron on the right; its 36px end padding now clears the icon. Group addon padding and button margins follow their declared align value. Block addons keep their vertical spacing. |
| Breadcrumb / Pagination     | Default reading arrows reverse. Custom icons and the vertical chevrons retain their original orientation.                                                                                                                                       |
| Prose                       | The closed marker points to inline end. Open markers point down. A nested LTR island uses its own direction. Native list indentation already follows inline start.                                                                              |
| Avatar / Checkbox           | Compiled logical margins make avatar overlap 8/10/12px by size and give each checkbox an 8px label gap. Checkbox previously animated that gap to zero for the first RTL frame. Its visual-state transition now excludes margins.                |
