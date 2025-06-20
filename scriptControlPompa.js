const { Gpio } = require('pigpio');
const fs = require('fs');
const path = require('path');

const PIN_RELEU = 17;
const PIN_SENZOR = 22;
const DURATA_UDARE = 30000;

const pompa = new Gpio(PIN_RELEU, { mode: Gpio.OUTPUT });
const senzor = new Gpio(PIN_SENZOR, { mode: Gpio.INPUT });

pompa.digitalWrite(0);
const FISIER_LOG = path.join(__dirname, 'cron_udare.log');

let timerOprire;

function scriuLog(mesaj) {
  const timpul = new Date().toLocaleString('ro-RO');
  const linie = `[${timpul}] ${mesaj}\n`;
  try {
    fs.appendFileSync(FISIER_LOG, linie);
  } catch (error) {
    console.log('Eroare scriere log:', error.message);
  }
}

function pornestePompa() {
  pompa.digitalWrite(1);
  console.log('Pompa PORNITĂ timp de 30 secunde');
  scriuLog('UDARE PORNITĂ');

  timerOprire = setTimeout(() => {
    pompa.digitalWrite(0);
    console.log('Pompa oprită automat după 30 secunde');
    scriuLog('UDARE FINALIZATĂ - 30 secunde complete');
    process.exit(0);
  }, DURATA_UDARE);

  const intervalVerificare = setInterval(() => {
    const valoare = senzor.digitalRead();
    if (valoare === 0) {
      console.log('Sol UMED detectat în timpul udării - opresc pompa');
      pompa.digitalWrite(0);
      clearTimeout(timerOprire);
      clearInterval(intervalVerificare);
      scriuLog('UDARE OPRITĂ - sol umed detectat în timpul udării');
      process.exit(0);
    }
  }, 2000);
}

function verificaSol() {
  const valoare = senzor.digitalRead();
  if (valoare === 1) {
    console.log('Sol USCAT detectat - pornesc pompa');
    scriuLog('VERIFICARE - sol uscat detectat');
    pornestePompa();
  } else {
    console.log('Sol UMED detectat - nu e nevoie de udare');
    scriuLog('VERIFICARE - sol umed, nu e nevoie de udare');
    process.exit(0);
  }
}

process.on('SIGINT', () => {
  pompa.digitalWrite(0);
  process.exit();
});

process.on('SIGTERM', () => {
  pompa.digitalWrite(0);
  process.exit();
});

const esteModManual = process.stdin.isTTY;

if (esteModManual) {
  console.log('Script pornit MANUAL - verificare pompa și sol...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (key) => {
    if (key === '\u0003') {  // Ctrl+C
      pompa.digitalWrite(0);
      process.exit();
    }
    if (key === 'p' || key === 'P') {
      const starePompa = pompa.digitalRead();
      if (starePompa === 0) {
        console.log('Comandă manuală: PORNIRE');
        scriuLog('COMANDĂ MANUALĂ - pornire pompa');
        pornestePompa();
      } else {
        console.log('Pompa deja pornită');
      }
    }
    if (key === 'o' || key === 'O') {
      console.log('Comandă manuală: OPRIRE');
      scriuLog('COMANDĂ MANUALĂ - oprire pompa');
      pompa.digitalWrite(0);
      process.exit(0);
    }
  });
  console.log('Mod manual: P=pornire, O=oprire');
} else {
  console.log('Script CRON - verificare pompa și sol...');
}

verificaSol();

