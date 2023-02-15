const express = require("express");
const DIDKit = require('@spruceid/didkit-wasm-node');
const Database = require("@replit/database");

const path = require("path");
const port = 3000;

const server = express();
const db = new Database();

server.use(express.urlencoded({ extended: true }));
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'public')));

server.get("/", (req, res) => {
  res.render('pages/index')
});

server.post("/profile", async (req, res) => {
  var handle = req.body.fhandle;
  console.log(await db.list("handle-"));
  
  var handleAlreadyTaken = await handleUniqueness(handle);

  if (handleAlreadyTaken == false) {
    var result = await createAccount(handle);

    res.render('pages/profile', {
      did: result["did"],
      key: result["key"],
      handle: handle,
      doc: JSON.stringify(JSON.parse(await result["doc"]), null, 2)
    });
  } else {
    console.log("Handle already taken");
    res.status(404).send("Handle already taken");
  };
});

server.listen(port, (err) => {
  if (err) throw err;
  console.log(
    `> Ready on ${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  );
});

async function handleUniqueness(handle) {
  var handlesTaken = await db.list("handle-");
  return handlesTaken.includes(`handle-${handle}`);
};

async function createAccount(handle) {
  var key = DIDKit.generateEd25519Key();
  var did = DIDKit.keyToDID('key', key);
  var doc = DIDKit.resolveDID(did, "{}");

  db.set(did, {"key": key, "handle": handle});
  db.set(`handle-${handle}` , did);
  console.log(key);
  console.log(did);

  return {key: key, did: did, doc:doc}
};