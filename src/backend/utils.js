require("dotenv").config();

const jws = require("jws");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { XMLHttpRequest } = require("xmlhttprequest");
//const jquery = require("jquery");
const DOMParser = require("dom-parser");

console.log("Connession al DB");
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

//-----------
// Query promise
//-----------
function queryPromise(str, params) {
  return new Promise((resolve, reject) => {
    pool.query(str, params, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

//-------------
// genQueryText
//-------------
//generate the query text for updating wallet table
const genQueryText = (symbol) => {
  if (symbol == "EUR")
    return "UPDATE wallet SET wallet_eu = $1 WHERE email = $2"; //eu wallet
  else return "UPDATE wallet SET wallet_usd = $1 WHERE email = $2"; //usd wallet
};

//-----------
// Hash pw
//-----------
const passwordHash = async (password, saltRounds) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (err) {
    console.log(err);
    return false;
  }
};

//-------------
// Verify pw
//-------------
const comparePasswords = async (password, hash) => {
  try {
    const matchFound = await bcrypt.compare(password, hash);
    console.log("Risultato confronto pw: " + matchFound);
    return matchFound;
  } catch (err) {
    console.log(err);
    return false;
  }
};

//--------------
// Verifying jwt
//--------------
const verifyJwt = (jwt) => {
  try {
   // console.log("JWT: " + jwt);
    const ver = jws.verify(jwt, "HS256", process.env.SECRET_KEY);
    console.log("Verifica del JWT: " + ver); 
    const { payload } = jws.decode(jwt);
    return { ver, payload };
  } catch (err) {
    console.log(err);
    return false;
  }
};

//--------------------
//Extract wallet value
//--------------------
const getWalletValue = async (email, symbol) => {
  try {
    if (symbol == "EUR")
      return (
        await queryPromise("SELECT wallet_eu FROM wallet WHERE email = $1", [
          email,
        ])
      ).rows[0].wallet_eu;

    if (symbol == "USD")
      return (
        await queryPromise("SELECT wallet_usd FROM wallet WHERE email = $1", [
          email,
        ])
      ).rows[0].wallet_usd;
  } catch (err) {
    console.log("Errore in lettura DB: " + err);
  }
};

// --- Fetch version (for XML)
/* 
const getRateFetch = async () => {
  return fetch(
    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?46f0dd7988932599cb1bcac79a10a16a",
    {
      method: "GET",
      headers: new Headers({ "Content-Type": "text/xml" }),
      mode: "cors",
    }
  )
    .then((response) => response.text())
    .then((xmlString) => jquery.parseXML(xmlString))
    .then((data) => console.log(data));
};
*/

// --- Promisify AJAX version
/* 
const getPromiseRate = () => {
  console.log("Preparazione promise AJAX")
  return new Promise((resolve, reject) => {
    const rate = getRate();
    console.log("Risoluzione promise con rate: " + rate);
    resolve(rate);
  });
};
*/

//-----------------
// get exchange rate
//-----------------
const getRate = async () => {
  console.log("Preparazione handler AJAX");

  var x = new XMLHttpRequest();
  console.log("Apertura richiesta AJAX");
  x.open(
    "GET",
    //"https://www.w3schools.com/xml/plant_catalog.xml", 
    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?46f0dd7988932599cb1bcac79a10a16a",
    true
  ); //false ? 

  x.setRequestHeader("Content-Type", "text/xml");
  x.send(null);
  console.log("Richiesta AJAX inviata");

  x.onreadystatechange = function () {
    console.log("Cambiamento di stato AJAX: " + x.readyState);
    if (x.readyState == 4 && x.status == 200) {
      console.log("Risposta AJAX ricevuta");
      var docxml = x.responseXML; //empty 
      var doc = x.responseText; //not empty
      console.log(doc);
      console.log("\n\n" + docxml);

      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(doc, "text/xml");
      console.log(xmlDoc);
      console.log(xmlDoc.getElementsByTagName("Cube"));
      var rate = xmlDoc.getElementsByTagName("Cube")[2].getAttribute("rate"); //rate for EUR-USD exchange
      console.log("Tasso di scambio estratto: " + rate);
      return rate;
    }
  };
};

//-----------------
//convert value
//-----------------
const calcExchange = (value, from) => {
  const rate = getRate();
  if (from == "EUR") return value * rate;
  else return value / rate;
};

module.exports = {
  pool,
  queryPromise,
  passwordHash,
  comparePasswords,
  verifyJwt,
  getWalletValue,
  getRate,
  calcExchange,
  genQueryText,
};
