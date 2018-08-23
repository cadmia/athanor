const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const nunjucks = require('nunjucks');
const ncp = require('ncp').ncp;

const compileFiles = () => {
  const files = fs.readdirSync(path.join(global.athanor.root, global.athanor.templateDir))
    .filter(name => !name.match(/(^(.*\/)?(?=_))_/));

  const env = nunjucks.configure(path.join(global.athanor.root, global.athanor.templateDir), {
    autoescape: true
  });

  for (let file of files) {
    const fullFilePath = path.join(global.athanor.root, global.athanor.templateDir, file);
    const fullBuildPath = path.join(global.athanor.root, global.athanor.buildDir, file).replace(".njk", ".html");

    if (!fs.statSync(fullFilePath).isFile()) continue;

    env.render(fullFilePath, (err, res) => {
      if (err) {
        console.error("[BUILD]: Error compiling " + fullFilePath + ":");
        throw err;
      }
      fs.writeFile(fullBuildPath, res, (err) => {
        if(err) {
          console.error("[BUILD]: Error writing " + fullBuildPath + ":");
          throw err;
        }
      });
    });

  }
}

const compileAssets = () => {
  const srcDir = path.join(global.athanor.root, global.athanor.staticDir);
  const destDir = path.join(global.athanor.root, global.athanor.buildDir);

  ncp(srcDir, destDir, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

module.exports = () => {
  if (!global.athanor.buildDir) {
    console.error("[BUILD]: No build dir specified.");
    return;
  }

  fs.mkdir(path.join(global.athanor.root, global.athanor.buildDir), (err) => {
    compileAssets();
    compileFiles();
  });
}
