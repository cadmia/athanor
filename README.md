#static-prototype-env

This is an environment for static prototyping. It is built using Nunjucks for templating, Express for serving, and whatever you feel like for asset compilation!

## Installation

* Clone the base repository.
* Create a config.json (minimally just a blank object)
* Run `node index.js` to run.
* Start building.

## Configuration

Configuration is simple, but may seem a bit complex. This is a list of options.

| Name               | Type          | Description                                    |
| ------------------ | ------------- | ---------------------------------------------- |
| port               | int           | Port to run webserver on (default 9876)        |
| staticDir          | string        | Directory to serve static files from/build to  |
| templateDir        | string        | Directory to serve/search templates from       |
| watch              | array         | List of files/directories to watch for changes |
| watch[].dir        | string (req)  | Directory (or path to file) to watch           |
| watch[].build      | string (req)  | Build command (see Build)                      |
| watch[].files      | object        | Optional list of input=>output files           |

### Build

Watched build can work in one of two ways. If files is omitted, build will only be run once. Elsewise, it will be run once per entry.

Three variables will be injected when build is run: `${changed}`, `${src}`, and `${dest}`. `${changed}` is the file that was changed. `${src}` is the input file. `${dest}` is the output file.

The watch step will watch an entire directory, including any newly created files or deleted ones. It will ignore any files with a tilde in the name.

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
