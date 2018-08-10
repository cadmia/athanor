const express = require('express');
const nunjucks = require('nunjucks');
const WebSocket = require("ws");
const path = require('path');
const fs = require('fs');
const taskrunner = require('./taskrunner');

const injectWSCode = (code) => {
  const wsport = global.athanor.wsport;

  const inject = `<script>
    var ws = new WebSocket('ws://localhost:${wsport}');
    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      if (
            (data.type === "asset_changed") ||
            (data.type === "template_changed" && (window.location.pathname === "/" + data.payload || data.payload.indexOf("_") === 0 || data.payload.indexOf("/_") !== -1))
      ) {
        window.location.reload(true);
      }
      else if (data.type === "template_changed" && window.location.pathname === "/")
      {
        window.location = "/";
      }

    }
  </script>`;

  if (code.indexOf('<head>') !== -1) {
    return code.replace(/<head>/, "<head>" + inject);
  }
  return code + inject;
};

const handleRoute = (route, res) => {
  route = path.join(global.athanor.root, global.athanor.templateDir, route);
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
      res.send(injectWSCode(ret));
    }
  });
}

module.exports = () => {
  const app = express();
  const wss = new WebSocket.Server({ port: global.athanor.wsport });
  wss.broadcast = (data) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };
  global.athanor.wss = wss;

  nunjucks.configure(global.athanor.templateDir, {
    autoescape: true,
    noCache: true,
    express: app
  });

  app.use(express.static(path.join(global.athanor.root, global.athanor.staticDir)));

  app.get('/', (req, res) => {
    let contents = fs.readFileSync(path.join(global.athanor.root, "inc", "dir.njk"));
    const cmd = req.query.cmd;
    if (cmd) {
      taskrunner.runTask(cmd);
    }
    res.send(injectWSCode(nunjucks.renderString(contents.toString(), {
      dirs: fs.readdirSync(path.join(global.athanor.root, global.athanor.templateDir)),
      cmds: (global.athanor.config.tasks ? Object.keys(global.athanor.config.tasks) : [])
    })));
  });

  app.get('*', (req, res) => {
    handleRoute(req.path, res);
  });

  app.listen(global.athanor.port, () => {
    console.log(`Server is listening on ${global.athanor.port}.`)
  });
};
