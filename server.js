const express = require("express");
const {
  scriuJurnalul,
  citesteLogs,
  stergeJurnalul,
  initializeazaGPIO,
  pornestePompa,
  oprestePompa,
  obtineStarea,
  oprireDeUrgenta,
  pinulGPIO,
} = require("./controlPompa");

console.log("Server pornit...");

const app = express();
app.use(express.static("public"));

app.get("/", (cerere, raspuns) => {
  raspuns.sendFile(__dirname + "/public/index.html");
});

app.post("/api/porneste", async (cerere, raspuns) => {
  console.log("START de pe WEB...");

  const rezultat = await pornestePompa(30000, "interfata WEB");

  if (rezultat.succes) {
    raspuns.json({ stare: rezultat.mesaj });
  } else {
    raspuns.status(500).json({ eroare: rezultat.mesaj });
  }
});

app.post("/api/opreste", async (cerere, raspuns) => {
  console.log("STOP de pe WEB...");

  const rezultat = await oprestePompa("interfata WEB manual");

  if (rezultat.succes) {
    raspuns.json({ stare: rezultat.mesaj });
  } else {
    raspuns.status(500).json({ eroare: rezultat.mesaj });
  }
});

app.get("/api/jurnal", (cerere, raspuns) => {
  const jurnal = citesteLogs();
  raspuns.json({ jurnal: jurnal });
});

app.post("/api/sterge-jurnal", (cerere, raspuns) => {
  const rezultat = stergeJurnalul("interfata WEB");
  if (rezultat.succes) {
    raspuns.json({ stare: rezultat.mesaj });
  } else {
    raspuns.status(500).json({ eroare: rezultat.mesaj });
  }
});

app.get("/api/stare", (cerere, raspuns) => {
  const starea = obtineStarea();
  raspuns.json(starea);
});

process.on("SIGINT", async () => {
  console.log("Opresc server...");
  await oprireDeUrgenta();
  process.exit(0);
});

initializeazaGPIO().then((succes) => {
  if (succes) {
    app.listen(3000, "0.0.0.0", () => {
      scriuJurnalul("SERVER  pornit pe portul 3000");
      console.log("Server: http://localhost:3000");
      console.log(`Folosesc GPIO ${pinulGPIO} (GPIO 17 fizic)`);
      console.log("Timer: 30 secunde");
      console.log("Sistem gata!");
    });
  } else {
    console.log("Nu poate fi initializat GPIO");
    process.exit(1);
  }
});
