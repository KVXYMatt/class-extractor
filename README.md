# class-extractor README

Extracts CSS classes from a selection of markup and formats it into a useable list to paste into your CSS/LESS/SASS/whatever. Uses htmlparser2 so should be reasonably good at finding the right stuff.

## Install

```bash
ext install class-extractor
```

## Usage

Class Extractor adds just one command, `Extract CSS classes from HTML`. Select some HTML markup, run the command (I recommend mapping it to something like `Ctrl + Alt + X`) and the CSS classes are added to your clipboard in the order they appear with no duplicates, and in the format `.[className] { }`.

## Requirements

Uses the [ncp](https://github.com/xavi-/node-copy-paste) package, may require external dependencies in Linux and macOS.

## Future Plans

- Proper unit testing & code restructure to allow proper unit testing
- Indentation in class structure to match existing markup. Makes BEM work a little better

## Release Notes

### 1.0.3

Added some install and usage documentation and fixed dependency vulnerabilities

### 1.0.1

Many minor fixes. Tags with no attributes, empty classes and things other than tags (script blocks, comments etc...) will now be properly ignored

### 1.0.0

Initial release

## Thanks

Special thanks to ardcore for [this Atom plugin](https://github.com/ardcore/atom-html-to-css) from which this extension draws its origins.