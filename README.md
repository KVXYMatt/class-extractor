# class-extractor README

Extracts CSS classes from a selection of markup and formats it into a useable list to paste into your CSS/LESS/SASS/whatever. Uses htmlparser2 so should be reasonably good at finding the right stuff.

## Install

```bash
ext install class-extractor
```

## Usage

Class Extractor adds two commands, `Extract CSS classes from HTML` and `Extract LESS/SCSS BEM classes from HTML`. Select some HTML markup, run either command (I recommend mapping your preferred option to something like `Ctrl + Alt + X`) and the CSS classes are added to your clipboard in the order they appear with no duplicates. The output format by default is `[className] { }`, however this is configurable in the settings. The LESS/SCSS BEM option will automatically indent.

It's recommended to edit your output format in the JSON settings editor as the VS Code interface doesn't render newlines and will escape backslash characters.

## Requirements

Uses the [ncp](https://github.com/xavi-/node-copy-paste) package, may require external dependencies in Linux and macOS.

## Development

- Fork and clone repository
  
  ```console
  git clone
  ```

- Install dependencies

  ```console
  npm install
  ```

- Make changes

- Install vsce

  ```console
  npm install -g vsce
  ```

- Build
  ```console
  vsce package
  ```

- Install on vscode
  
  - Plugins
  - Install from VSIX

## Future Plans

- [ ] Proper unit testing & code restructure to allow proper unit testing
- [x] Indentation in class structure to match existing markup. Makes BEM work a little better
- [ ] Automatically indent based on file or workspace preferences
- [ ] Get indentation working better with incorrect BEM structure
- [ ] Option for BEM sorting but without nesting classes

## Release Notes

### 1.1.0

Rewrote BEM option and allowed for custom output templating

### 1.0.4

Added BEM option for indented languages like LESS and SCSS thanks to [@LuisReinoso](https://github.com/LuisReinoso)

### 1.0.3

Added some install and usage documentation and fixed dependency vulnerabilities

### 1.0.1

Many minor fixes. Tags with no attributes, empty classes and things other than tags (script blocks, comments etc...) will now be properly ignored

### 1.0.0

Initial release

## Thanks

Special thanks to ardcore for [this Atom plugin](https://github.com/ardcore/atom-html-to-css) from which this extension draws its origins.