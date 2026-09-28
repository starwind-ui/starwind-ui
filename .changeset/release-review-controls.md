---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Reduced the JavaScript loaded by form controls used without Field, including Checkbox and Select. Controls still connect to Field when it is used.

In React 18, removing a Portal now releases references to its removed popup elements while the parent component stays mounted.

React Color Picker now avoids rebuilding its controls when only the selected color changes. It still connects controls that your app adds or replaces.
