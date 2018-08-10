const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const path = require('path');

var watchers = []; // Who watches the watchers? I do

const genFileWatcher = (dir, cfg) => {
  const buildCmd = cfg.build;
  const fileLinks = cfg.files;
  const reload = cfg.livereload;

  return (eventType, filename) => {
    if (filename.indexOf("~") !== -1) return;
    const staticDir = global.athanor.staticDir;

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
        let promises = [];
        console.log(gen + "Running " + lcmd + "...");
        promises.push(exec(lcmd, (err, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.log(stderr);
        }));
        promises = Promise.all(promises).then(() => {
          if (global.athanor.wss) global.athanor.wss.broadcast(JSON.stringify({ type: "asset_changed", payload: filename }));
          console.log("Done.");
        });
      }
    } else {
      let lcmd = cmd(args);
      console.log(gen + "Running " + lcmd + "...");
      exec(lcmd, (err, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        if (global.athanor.wss) global.athanor.wss.broadcast(JSON.stringify({ type: "asset_changed", payload: filename }));
        console.log("Done.");
      });
    }
  };
};

const buildWatchStructure = () => {
  const watch = global.athanor.config.watch;

  // Remove old watchers
  for (let watcher of watchers) {
    watcher.close();
  }
  watchers = [];

  // Build new watchers
  if (watch) {
    for (var watchdef of watch) {
      let dirs = watchdef.dir;

      if (!Array.isArray(dirs)) {
        dirs = [dirs];
      }

      for (let dir of dirs) {
        watchers.push(fs.watch(path.join(global.athanor.root, dir), { persistent: true, recursive: true }, _.throttle(genFileWatcher(dir, watchdef), 1000)));
      }
    }
  }
};

module.exports = () => {
  buildWatchStructure();

  fs.watch(path.join(global.athanor.root, "config.json"), { persistent: true }, _.throttle(() => {
    const config = global.athanor.readConfig();
    if (!config) return;
    global.athanor.config = config;

    buildWatchStructure();
  }, 1000));

  fs.watch(path.join(global.athanor.root, global.athanor.templateDir), { persistent: true, recursive: true}, (eventType, fileName) => {
    if (fileName.indexOf("~") !== -1) return;
    if (global.athanor.wss) global.athanor.wss.broadcast(JSON.stringify({ type: "template_changed", payload: fileName }));
  });
};

