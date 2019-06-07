# Hero Board

## About

**Hero Board** is an "alt-tab" tool for creating and customizing Dota 2 heroes layouts written in AngularJS.

The board is made out of layouts which you can create, delete or import.

Every layout is empty by default, but you can add new categories to it and fill them with heroes by dragging them from the sidebar or using hero adding menu.

It's using browser's local storage, supports file and link export/import features.

## Main Depedencies

- fomantic-ui-css
- gulp
- angularjs
- browser-sync

## Configuration

Copy `config.example.json` to `config.json` and put your Steam API Key here. That's about it.

## Gulp commands

- `build` - build the app
- `watch` - launch development server and watch mode
- `prod` - build the app for production (using minification)
- `dota-heroes` - get heroes metadata
- `dota-portraits` - load hero portraits (requires dota-heroes result)

Supporting commands:

- `clean`
- `copy`
- `default`
- `images`
- `revision`
- `scripts`
- `styles`
- `template`
- `vendor`