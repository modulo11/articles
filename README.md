# Markdown To HTML

This project aims to provide an easy way to compile [Markdown](https://github.github.com/gfm/) files to HTML. It will generate a fully functional HTML page with CSS similar to [GitHubs' markdown](https://github.com/sindresorhus/github-markdown-css). The generated HTML files are placed inside an dedicated folder to be served by a web server, allowing for example a deployment of [GithHub Pages](https://pages.github.com/).

A deployed example can be found [here](https://diba1013.github.io/markdown-to-html/).

## Installation

This project requires [Node.js](https://nodejs.org/) to run, however [Yarn](https://yarnpkg.com) is the prefered package manager. To execute the compilation step, [gulp](https://gulpjs.com/) is used. Note that not all gulp tasks are exposed to Node.js; it is adviced to use a task detector or to look into [`gulpfile.js`](./gulpfile.js) for available tasks.

*This project is designed to be used within Visual Studio Code, so that you may easily execute the defined gulp tasks.*

## Configuration

This projects' configuration is available in [`config.json`](./config.json). 

| Config      | Type        | Description                                                                            |
| :---------- | :---------- | :------------------------------------------------------------------------------------- |
| root        | `string`    | The directory of the markdown and assets files.                                        |
| out         | `string`    | The output directory where the `${src}` are compiled to. This directory can be served. |
| standalone  | `bool`      | If a standalone HTML without dependencies should be generated.                         |
| files       | `Article[]` | The markdown files to be compiled to HTML.                                             |
|             |             |                                                                                        |
| **Article** |             |                                                                                        |
| title       | `string`    | The title of the article displayed in HTML.                                            |
| name        | `string`    | The name of the file without extension.                                                |

#### Files

All files necessary are to be placed in `${root}`. The below structure is transfered to `${out}` upon compilation.

```
${root} / ${out}
 +- assets
 |   +- css 
 |   +- images
 +- *.md / *.html
```

* All stylesheets are placed in `${root}/assets/css` as [`.sass`](https://sass-lang.com/) files.
* All images are placed in `${root}/assets/images` as any file you choose.

#### Standalone

The `standalone` option allows for independent HTML to be generated into `${out}/standalone/`. All external dependecies like *stylesheets* as `style`, *JavaScript* as `script` and *images* as base64) are inlined.

## Extending this template

This template is supposed to be just a starter with some useful default configuration. It might gain additional features, but it is left to the user to define additional configurations, plugins or expand the template.

#### HTML

The content for the HTMl is compiled by [markdown-it](https://github.com/markdown-it/markdown-it). There are plenty of [plugins](https://www.npmjs.com/search?q=keywords:markdown-it-plugin) available which extend both the markdown syntax as well as the generated HTML.

The external structure is injected by [handlebars](https://handlebarsjs.com/) with `${root}/assets/template.hbs` where the compiled content is inserted into `<article>`.

You may choose to throw the markdown file against [GitHub's `/markdown` API](https://developer.github.com/v3/markdown/).
