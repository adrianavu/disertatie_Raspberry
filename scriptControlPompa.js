const { Gpio } = require('pigpio');

const PIN_RELEU = 17;
const PIN_SENZOR = 22;

const DURATA_UDARE = 30000;
const INTERVAL_VERIFICARE = 1800000;

const pompa = new Gpio(PIN_RELEU, { mode: Gpio.OUTPUT });
const senzor = new Gpio(PIN_SENZOR, { mode: Gpio.INPUT });

let pompaPornita = false;
let timerOprire;

pompa.digitalWrite(0);

function pornestePompa() {
  pompa.digitalWrite(1);
  pompaPornita = true;
  console.log('Pompa PORNITĂ (30 secunde)');

  timerOprire = setTimeout(() => {
    oprestePompa();
    console.log('Pompa oprită automat după 30 secunde');
  }, DURATA_UDARE);
}

function oprestePompa() {
  pompa.digitalWrite(0);
  pompaPornita = false;
  clearTimeout(timerOprire);
  console.log('Pompa OPRITĂ');
}

function verificaSol() {
  const valoare = senzor.digitalRead();

  if (valoare === 1) {
    console.log('Sol USCAT detectat');

    if (!pompaPornita) {
      pornestePompa();
    }
  } else {
    console.log('Sol UMED detectat');

    if (pompaPornita) {
      console.log('Solul a devenit umed. Oprire imediată a pompei.');
      oprestePompa();
    }
  }
}

setInterval(verificaSol, INTERVAL_VERIFICARE);

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
  if (key === '\u0003') {
    oprestePompa();
    console.log('\nIeșire program');
    process.exit();
  }

  if (key === 'p' || key === 'P') {
    if (!pompaPornita) {
      console.log('Comandă manuală: PORNIRE');
      udareFacuta = true;
      pornestePompa();
    }
  }

  if (key === 'o' || key === 'O') {
    console.log('Comandă manuală: OPRIRE');
    oprestePompa();
  }
});
