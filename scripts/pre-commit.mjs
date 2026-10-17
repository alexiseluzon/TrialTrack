import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const git = (args, cwd) => spawnSync("git", args, { cwd, encoding: "utf8" }).stdout.trim();

const root = git(["rev-parse", "--show-toplevel"]);
const staged = git(["diff", "--cached", "--name-only"], root).split("\n");
const touches = (dir) => staged.some((f) => f.startsWith(`${dir}/`));

function run(label, command, cwd) {
  console.log(`pre-commit: ${label}`);
  // Single command string + shell: Windows resolves npm.cmd itself; no bash involved.
  const result = spawnSync(command, { cwd, stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (touches("web")) {
  const web = join(root, "web");
  run("web lint", "npm run lint", web);
  run("web typecheck", "npm run typecheck", web);
  run("web tests", "npm test --silent", web);
}

if (touches("api")) {
  const api = join(root, "api");
  const venvPython = [".venv/Scripts/python.exe", ".venv/bin/python"]
    .map((p) => join(api, p))
    .find(existsSync);
  run("api tests", `"${venvPython ?? "python"}" -m pytest -q`, api);
}