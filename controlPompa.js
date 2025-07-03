const fs = require("fs");
const { Gpio } = require("pigpio");

const pinulGPIO = 17;
const pompa = new Gpio(pinulGPIO, { mode: Gpio.OUTPUT });
let pompaPornita = false;
let timer = null;

pompa.digitalWrite(0);

function scriuJurnalul(mesaj) {
  const timpul = new Date().toLocaleString("ro-RO");
  const linie = `[${timpul}] ${mesaj}\n`;
  fs.appendFile("./udare.log", linie, () => {});
  console.log(mesaj);
}

function citesteLogs() {
  try {
    const continut = fs.readFileSync("./udare.log", "utf8");
    const linii = continut.split("\n").filter((l) => l.trim());

    return linii
      .map((linie) => {
        const gasit = linie.match(/^\[([\d\.:\s,]+)\] (.+)$/);
        if (gasit) {
          const [zi, luna, an, ora] = gasit[1].split(/[\.,\s]+/);
          const data = new Date(`${an}-${luna}-${zi}T${ora}`);
          return {
            mesaj: gasit[2],
            data: data.toLocaleDateString("ro-RO"),
            ora: data.toLocaleTimeString("ro-RO"),
          };
        }
        return { mesaj: linie, data: "", ora: "" };
      })
      .reverse();
  } catch {
    return [];
  }
}

function stergeJurnalul(sursa) {
  try {
    fs.writeFileSync("./udare.log", "");
    scriuJurnalul(`ISTORIC STERS de pe ${sursa}`);
    return { succes: true, mesaj: "Istoric sters!" };
  } catch {
    return { succes: false, mesaj: "Eroare la stergere" };
  }
}

async function initializeazaGPIO() {
  try {
    pompa.digitalWrite(0);
    console.log(`GPIO ${pinulGPIO} initializat`);
    return true;
  } catch (error) {
    console.log("Eroare GPIO:", error.message);
    return false;
  }
}

async function controleazaPompa(porneste, durata = 30000, sursa = "sistem") {
  if (porneste && pompaPornita) {
    return { succes: false, mesaj: "Pompa deja pornita" };
  }

  try {
    pompa.digitalWrite(porneste ? 1 : 0);
    pompaPornita = porneste;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (porneste) {
      scriuJurnalul(`POMPA PORNITA de pe ${sursa}`);
      timer = setTimeout(() => {
        controleazaPompa(false, 0, "timer automat");
      }, durata);
      return { succes: true, mesaj: `POMPA PORNITA! (${durata / 1000}s)` };
    } else {
      scriuJurnalul(`POMPA OPRITA de pe ${sursa}`);
      return { succes: true, mesaj: "POMPA OPRITA!" };
    }
  } catch (error) {
    return { succes: false, mesaj: "Eroare GPIO: " + error.message };
  }
}

async function pornestePompa(durata = 30000, sursa = "sistem") {
  return await controleazaPompa(true, durata, sursa);
}

async function oprestePompa(sursa = "sistem") {
  return await controleazaPompa(false, 0, sursa);
}

function obtineStarea() {
  return {
    pompaPornita: pompaPornita,
    pinulGPIO: pinulGPIO,
    timpul: new Date().toLocaleString("ro-RO"),
  };
}

async function oprireDeUrgenta() {
  await controleazaPompa(false, 0, "urgenta");
  scriuJurnalul("SERVER oprit");
  pompa.digitalWrite(0);
}

process.on("SIGINT", () => {
  pompa.digitalWrite(0);
  process.exit();
});

process.on("SIGTERM", () => {
  pompa.digitalWrite(0);
  process.exit();
});

module.exports = {
  scriuJurnalul,
  citesteLogs,
  stergeJurnalul,
  initializeazaGPIO,
  pornestePompa,
  oprestePompa,
  obtineStarea,
  oprireDeUrgenta,
  pinulGPIO,
};
