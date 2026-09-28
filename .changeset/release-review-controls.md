---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Reduced the JavaScript needed by standalone form controls such as Checkbox and Select. Field continues to discover and connect controls when it is used.

Fixed React 18 cleanup when a Portal is removed while its parent component stays mounted. Removed content is now cleared from the component's registered parts.

Color Picker in React reuses its controls when a value change leaves their structure unchanged. Controls added or changed by your app still refresh before controlled values are applied.
