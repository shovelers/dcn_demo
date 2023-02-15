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

server.post("/account", async (req, res) => {
  var handle = req.body.fhandle;
  var handleAlreadyTaken = await handleUniqueness(handle);

  if (handleAlreadyTaken == false) {
    var result = await createAccount(handle);
    console.log(`Account created for handle:${handle}, did:${result["did"]}`);
    res.redirect(`profile/${result["did"]}`);
  } else {
    console.log(`Handle: ${handle} already taken`);
    res.status(404).send(`Handle: ${handle} already taken`);
  };
});

server.post("/signin", async (req, res) => {
  var handle = req.body.fhandle;
  
  var handleAlreadyTaken = await handleUniqueness(handle);

  if (handleAlreadyTaken == false) {
    console.log("Create an account first");
    res.status(404).send("Create an account first");
  } else {
    var did = await didByHandle(handle);
    console.log(`Profile lookup for handle:${handle}, DID: ${did}`);
    res.redirect(`profile/${did}`);
  };
});

server.get("/profile/:id", async (req, res) => {
  var params = req.params;
  var result = await db.get(params["id"]);
  var doc = DIDKit.resolveDID(params["id"], "{}");

  res.render('pages/profile',{
    did: params["id"],
    key: result["key"],
    handle: result["handle"],
    doc: JSON.stringify(JSON.parse(await doc), null, 2)
  });
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
  
  return {key: key, did: did, doc:doc}
};

async function didByHandle(handle) {
  return db.get(`handle-${handle}`)
};