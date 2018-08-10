const _ = require('lodash');
const exec = require('child_process').execSync;

const runTask = (taskid, opts) => {
  const tasks = global.athanor.config.tasks;
  if (!tasks) return;

  const task = tasks[taskid];
  const gen = taskid.toUpperCase();

  if (!task) {
    console.error("[" + gen + "]: No task '" + taskid + "'.");
    return;
  }

  cmds = task.cmds || task.cmd;
  if (!Array.isArray(cmds)) cmds = [cmds];

  console.log("[" + gen + "]: Running...");
  opts = Object.assign({}, task.args, (opts || {}));
  for (let cmd of cmds) {
    cmd = _.template(cmd)(opts);
    console.log("[" + gen + "]: Sending `" + cmd + "`.");
    exec(cmd, task.options);
  }
  console.log("[" + gen + "]: Done.");
}

const runStartupTasks = () => {
  const tasks = global.athanor.config.tasks;
  if (!tasks) return;

  for (let taskid in tasks) {
    if (tasks[taskid].startup) runTask(taskid);
  }
}

module.exports = {
  runTask,
  runStartupTasks
};
