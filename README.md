# Athanor

This is an environment for static prototyping. It is built using Nunjucks for templating, Express for serving, and whatever you feel like for asset compilation!

## Installation

* Clone the base repository.
* Create a config.json (minimally just a blank object)
* Run `node index.js` to run.
* Start building.

## Configuration

Configuration is simple, but may seem a bit complex. This is a list of options.

| Name               | Type             | Description                                                     |
| ------------------ | ---------------- | --------------------------------------------------------------- |
| port               | int              | Port to run webserver on (default 9876)                         |
| wsport             | int              | Port to run websocket server on (def 42496)                     |
| staticDir          | string           | Directory to serve static files from/build to                   |
| templateDir        | string           | Directory to serve/search templates from                        |
| watch              | array            | List of files/directories to watch for changes                  |
| watch[].dir        | string/arr (req) | Directory (or path to file) to watch                            |
| watch[].build      | string (req)     | Build command (see Build)                                       |
| watch[].files      | object           | Optional list of input=>output files                            |
| watch[].livereload | boolean          | Enables livereload on builds                                    |
| tasks              | object           | Container of build tasks to run                                 |
| tasks[name]        | string           | Name of task                                                    |
| tasks[].cmd        | string/arr (req) | Command(s) to run.                                              |
| tasks[].options    | object           | Process options. See https://nodejs.org/api/child_process.html  |
| tasks[].args       | object           | Arguments to provide to the template runner as defaults.        |
| tasks[].startup    | boolean          | Run this task on a standard startup                             |

### Build

Watched build can work in one of two ways. If files is omitted, build will only be run once. Elsewise, it will be run once per entry.

Four variables will be injected when build is run: `${dir}` `${changed}`, `${src}`, and `${dest}`. `${changed}` is the file that was changed. `${src}` is the input file. `${dest}` is the output file, ${dir} is the directory being watched.

The watch step will watch an entire directory, including any newly created files or deleted ones. It will ignore any files with a tilde in the name.

You can also use `<% ... %>` to run arbitrary code (e.g. replacements) inside the build step

### Example configurations

```json
{
    "port": 2345
}
```

```json
{
    "watch": [
        {
            "dir": "sass",
            "build": "sass ${src} ${dest}",
            "files": {
                "site.scss": "site.css"
            }
        }
    ]
}
```

```json
{
    "watch": [
        {
            "dir": "js",
            "build": "webpack"
        }
    ]
}
```
