const fs = require('fs');
const path = require('path');
const webserver = require('./inc/webserver');
const watcher = require('./inc/watcher');

const readConfig = () => {
  return JSON.parse(fs.readFileSync(path.join(global.athanor.root, 'config.json')));
}

global.athanor = {
  readConfig: readConfig,
  root: __dirname
};
global.athanor.config = readConfig();
global.athanor.port = process.env.PORT || athanor.config.port || 9876;
global.athanor.wsport = process.env.WSPORT || athanor.config.wsport || 42496;
global.athanor.templateDir = athanor.config.templateDir || "templates";
global.athanor.staticDir = athanor.config.staticDir || "static";

const args = () => {
  let arglist = process.argv;
  do {
    const item = arglist.shift();
    if (item.indexOf("index") !== -1 || item.indexOf("athanor") !== -1 || item === "ath") break;
  } while (arglist.length);

  if (!arglist.length) arglist = ["watch", "main"];
  for (let arg of arglist) {
    if (arg === "watch") watcher();
    if (arg === "main") webserver();
  }
};

args();
