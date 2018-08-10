const express = require('express');
const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const _ = require('lodash');

const readConfig = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
}

const app = express();
var config = readConfig();
var watchers = []; // Who watches the watchers? I do

const port = process.env.PORT || config.port || 9876;
const templateDir = config.templateDir || "templates";
const staticDir = config.staticDir || "static";

console.log(config);

const genFileWatcher = (dir, buildCmd, fileLinks) => {
  return (eventType, filename) => {
    if (filename.indexOf("~") !== -1) return;

    const fileChanged = path.relative(process.cwd(), filename);
    const gen = "[" + dir.toUpperCase() + "]: ";
    console.log(gen + "File " + fileChanged + " changed (" + eventType + ").");
    let cmd = _.template(buildCmd);
    let args = {
      changed: filename,
      dir: dir,
      src: path.join(dir, filename),
      dest: path.join(staticDir, filename)
    }

    if (fileLinks) {
      for (var link in fileLinks) {
        let targs = Object.assign({}, args, { src: path.join(dir, link), dest: path.join(staticDir, fileLinks[link]) });
        let lcmd = cmd(targs);
        console.log(gen + "Running " + lcmd + "...");
        exec(lcmd, (err, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.log(stderr);
        });
      }
    } else {
      let lcmd = cmd(args);
      console.log(gen + "Running " + lcmd + "...");
      exec(lcmd, (err, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        console.log("Done.");
      });
    }
  };
};

const buildWatchStructure = () => {
  const watch = config.watch;

  // Remove old watchers
  for (let watcher of watchers) {
    watcher.close();
  }
  watchers = [];

  // Build new watchers
  if (watch) {
    for (var watchdef of watch) {
      let dirs = watchdef.dir;
      let build = watchdef.build;
      let files = watchdef.files;

      if (!Array.isArray(dirs)) {
        dirs = [dirs];
      }

      for (let dir of dirs) {
        watchers.push(fs.watch(path.join(__dirname, dir), { persistent: true, recursive: true }, _.throttle(genFileWatcher(dir, build, files), 1000)));
      }
    }
  }
};

buildWatchStructure();
fs.watch(path.join(__dirname, "config.json"), { persistent: true }, _.throttle(() => {
  config = readConfig();
  if (!config) return;

  buildWatchStructure();
}, 1000));

nunjucks.configure(templateDir, {
  autoescape: true,
  noCache: true,
  express: app
});

app.use(express.static(path.join(__dirname, staticDir)));

const handleRoute = (route, res) => {
  route = path.join(__dirname, templateDir, route);
  if (!fs.existsSync(route)) {
    var troute = route + ".html";
    if (!fs.existsSync(troute)) {
      troute = route + ".htm";
      if (!fs.existsSync(troute)) {
        troute = route + ".njk";
        if (!fs.existsSync(troute)) {
          res.status(404).send("Not found.");
          return;
        }
        else
        {
          route = troute;
        }
      }
      else
      {
        route = troute;
      }
    }
    else
    {
      route = troute;
    }
  }

  nunjucks.renderString(fs.readFileSync(route).toString(), (err, ret) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(ret);
    }
  });
}

app.get('/', (req, res) => {
  let contents = fs.readFileSync(path.join(__dirname, "inc", "dir.njk"));
  res.send(nunjucks.renderString(contents.toString(), { dirs: fs.readdirSync(path.join(__dirname, templateDir)) }));
});

app.get('*', (req, res) => {
  handleRoute(req.path, res);
});

app.listen(port, () => {
  console.log(`Server is listening on ${port}.`)
});
