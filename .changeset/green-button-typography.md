---
'@graphiql/react': patch
---

Refresh the top bar's "Run" button: add a play icon before the label, a faint divider before the keyboard shortcut, and recolor the shortcut keys into translucent chips that sit on the green fill instead of dark boxes. The label now uses medium weight rather than the heavier bold. Also remove the hardcoded bold weight from the primary button variant (used by the collections dialogs) so its label matches the other buttons.
