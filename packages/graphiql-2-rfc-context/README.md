[Discord Channel](https://discord.gg/NP5vbPeUFp)

# GraphiQL 2.x - React Context RFC Proposal

This effort was merge to master in spring of 2020, and then moved to this workspace for the time being until we address some of the issues

## Features

- hooks rewrite for react 16. _gets rid of deprecated methods_
- swap out codemirror for monaco
- partial re-theming with new component library and a customizable`theme-ui`
- context implementation
- i18n using `i18n-next`

## Consider this a Starting Point

The choice to use React context for editor session state proved less than ideal.

So, the challenge is to take this and run with it, rewrite it to use a state management approach that makes more sense and is pluggable

## Ideal Proposal

> TODO
