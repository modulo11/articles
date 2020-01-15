const gulp = require("gulp")
const del = require("del")
const rename = require("gulp-rename")
const fs = require("fs");

const sass = require("gulp-sass")
const csso = require("gulp-csso")

const markdown = require("gulp-markdownit")

const handlebars = require("gulp-hb");
const inline = require('gulp-inline-source')

const config = require("./config.json")

const src = {
    markdown: `${config.root}`,
    handlebars: {
        partials: `${config.root}/assets/partials/**/*.hbs`,
        template: `${config.root}/assets/template.hbs`,
    },
    logo: `assets/images/logo.svg`
}

const categories = config.categories.map(category => {
    const path = category.root || "."
    const root = category.root ? `categories/${path}` : "src";
    return {
        name: category.name,
        path: path,
        root: root,
        src: {
            css: `${root}/assets/css/*.sass`,
            images: `${root}/assets/images/**`
        },
        out: {
            css: `${config.out}/${path}/assets/css`,
            images: `${config.out}/${path}/assets/images`
        },
        logo: exists(`${root}/${src.logo}`) ? `${path}/${src.logo}` : `${src.logo}`,
        articles: category.files.map(article => {
            return {
                title: article.title,
                name: article.name,
                wip: article.wip,
                src: `${root}/${article.name}.md`,
                out: `${config.out}/${path}`
            }
        })
    }
})

// Gulp pipeline options

const options = {
    sass: {
        includePaths: ["node_modules"]
    },
    markdown: {
        options: {
            linkify: true,
            typographer: true,
        },
        plugins: [
            {
                plugin: require("markdown-it-footnote")
            },
            {
                plugin: require("markdown-it-github-headings"),
            },
            {
                plugin: require("markdown-it-attrs"),
                options: {
                    allowedAttributes: ["id", "class", /^data(-\w+)+$/]
                }
            },
            {
                plugin: require("markdown-it-implicit-figures"),
                options: {
                    figcaption: true
                }
            }
        ]
    }
}

/* Tasks */

function exists(path) {
    return fs.existsSync(path)
}

function read(path) {
    if (exists(path)) {
        return fs.readFileSync(path).toString()
    }
    return undefined;
}

// Helper

function public(name, task) {
    gulp.task(name, task); // Note that this is deprecated, however, the actual usage below does not work
    //exports[name] = task;
}

function private(name, task) {
    task.displayName = name;
    return task;
}

function copy(src, dest, alt) {
    return private(
        "copy:" + (alt === undefined ? ` "${src}" to "${dest}"` : alt),
        () => gulp.src(src).pipe(gulp.dest(dest))
    );
}

function clean(src, alt) {
    return private(
        "clean:" + (alt === undefined ? ` "${src}"` : alt),
        () => del(src, { force: true })
    );
}

// Misc

function copyImages(category) {
    return private(
        `copy:img:${category.name}`,
        copy(category.src.images, category.out.images)
    );
}

function compileCSS(category) {
    return private(
        `compile:css:${category.name}`,
        () => {
            return gulp.src(category.src.css)
                .pipe(sass(options.sass))
                .pipe(csso())
                .pipe(gulp.dest(category.out.css))
        }
    );
}

function buildCategory(category) {
    return gulp.parallel(
        copyImages(category),
        compileCSS(category)
    )
}

// Markdown to HTML

function compileMarkdown(category, article) {
    return private(
        `compile:html:${category.name}:${article.name}`,
        () => {
            return gulp.src(article.src)
                .pipe(markdown(options.markdown))
                .pipe(gulp.dest(`${article.out}/raw`))
        }
    )
}

function injectHTML(category, article) {
    return private(
        `build:html:${category.name}:${article.name}`,
        () => {
            const engine = handlebars()
                .partials(src.handlebars.partials)
                .data({
                    category: category,
                    article: article,
                    server: config.server,
                    content: read(`${article.out}/raw/${article.name}.html`),
                })

            const template = gulp.src(src.handlebars.template)
                .pipe(engine) //
                .pipe(rename(`${article.name}.html`))
                .pipe(gulp.dest(article.out))

            if (config.standalone) {
                return template
                    .pipe(inline({
                        attribute: false,
                        rootpath: config.out,
                        saveRemote: false,
                        svgAsImage: true,
                    }))
                    .pipe(gulp.dest(`${article.out}/standalone`))
            }

            return template;
        }
    )
}

function buildMarkdown(category, article) {
    return gulp.series(
        compileMarkdown(category, article),
        injectHTML(category, article)
    )
}

public("build:md", gulp.parallel(
    categories.map(category => {
        return gulp.parallel(
            category.articles.map(article => {
                return buildMarkdown(category, article)
            })
        )
    })
))

// Global

public("clean", clean(config.out));

public("watch", () => {
    return gulp.watch([
        `${src.markdown}/*.md`,
        src.template,
        src.css,
        src.images
    ], gulp.series("build"))
});

public("build", gulp.series(
    // Ensure these compiled files are available for markdown html
    gulp.parallel(
        categories.map(buildCategory)
    ),
    "build:md"
));

public("install", gulp.series("clean", "build"));