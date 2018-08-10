const express = require('express');
const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const _ = require('lodash');

const app = express();
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
const port = process.env.PORT || config.port || 9876;
const watch = config.watch;

console.log(config);

const genFileWatcher = (dir, buildCmd, fileLinks) => {
  return (eventType, filename) => {
    if (filename.indexOf("~") !== -1) return;

    const fileChanged = path.relative(process.cwd(), filename);
    const gen = "[" + dir.toUpperCase() + "]: ";
    console.log(gen + "File " + fileChanged + " changed (" + eventType + ").");
    let cmd = buildCmd.replace(/\${changed}/, path.join(dir, filename));
    if (fileLinks) {
      for (var link in fileLinks) {
        let lcmd = cmd.replace(/\${src}/, path.join(dir, link)).replace(/\${dest}/, path.join("static", fileLinks[link]));
        console.log(gen + "Running " + lcmd + "...");
        exec(lcmd, (err, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.log(stderr);
        });
      }
    } else {
      console.log(gen + "Running " + cmd + "...");
      exec(cmd, (err, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
      });
    }
    console.log("Done.");
  };
};

if (watch) {
  for (var watchdef of watch) {
    let dir = watchdef.dir;
    let build = watchdef.build;
    let files = watchdef.files;

    fs.watch(path.join(__dirname, dir), { persistent: true, recursive: true }, _.throttle(genFileWatcher(dir, build, files), 1000));
  }
}

nunjucks.configure('templates', {
  autoescape: true,
  noCache: true,
  express: app
});

app.use(express.static(path.join(__dirname, 'static')));

const handleRoute = (route, res) => {
  route = path.join(__dirname, 'templates', route);
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
  res.send(nunjucks.renderString(contents.toString(), { dirs: fs.readdirSync(path.join(__dirname, "templates")) }));
});

app.get('*', (req, res) => {
  handleRoute(req.path, res);
});

app.listen(port, () => {
  console.log(`Server is listening on ${port}.`)
});
