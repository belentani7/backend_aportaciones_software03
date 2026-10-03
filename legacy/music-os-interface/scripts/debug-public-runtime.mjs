import http from "node:http";

const targetUrl = process.argv[2] ?? "https://musicdash-nvtu2qua.manus.space/?v=bootstrap-final";
const debugPort = Number(process.env.CDP_PORT ?? 9222);
const requestJson = path => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port: debugPort, path }, response => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", chunk => { body += chunk; });
    response.on("end", () => resolve(JSON.parse(body)));
  }).on("error", reject);
});

const targets = await requestJson("/json");
const target = targets.find(item => item.type === "page");
if (!target?.webSocketDebuggerUrl) throw new Error("No page target available");
const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const messages = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown" || message.method === "Runtime.consoleAPICalled") messages.push(message);
  const resolver = pending.get(message.id);
  if (resolver) { pending.delete(message.id); resolver(message); }
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
const send = (method, params) => new Promise(resolve => {
  const id = ++nextId;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.navigate", { url: targetUrl });
await new Promise(resolve => setTimeout(resolve, 12000));
const evaluation = await new Promise(resolve => {
  const id = ++nextId;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: "JSON.stringify({root:document.querySelector('#root')?.innerHTML || '', body:document.body?.innerText || '', ready:document.readyState})", returnByValue: true } }));
});
console.log(JSON.stringify({ target: target.url, evaluation, messages }, null, 2));
socket.close();
