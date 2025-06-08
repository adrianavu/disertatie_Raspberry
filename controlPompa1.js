const fs = require('fs');
const { exec } = require('child_process');
const pinulGPIO = 529;
let pompaPornita = false;
let timer = null;

function scriuJurnalul(mesaj) {
  const timpul = new Date().toLocaleString('ro-RO');
  const linie = `[${timpul}] ${mesaj}\n`;
  fs.appendFile('./udare.log', linie, () => {});
  console.log(mesaj);
}

function citesteLogs() {
  try {
    const continut = fs.readFileSync('./udare.log', 'utf8');
    const linii = continut.split('\n').filter(l => l.trim());
    
    return linii.map(linie => {
      const gasit = linie.match(/^\[([^\]]+)\] (.+)$/);
      if (gasit) {
        const data = new Date(gasit[1]);
        return {
          mesaj: gasit[2],
          data: data.toLocaleDateString('ro-RO'),
          ora: data.toLocaleTimeString('ro-RO')
        };
      }
      return { mesaj: linie, data: '', ora: '' };
    }).reverse();
  } catch {
    return [];
  }
}

function stergeJurnalul(sursa) {
  try {
    fs.writeFileSync('./udare.log', '');
    scriuJurnalul(`ISTORIC STERS de pe ${sursa}`);
    return { succes: true, mesaj: 'Istoric sters!' };
  } catch {
    return { succes: false, mesaj: 'Eroare la stergere' };
  }
}

async function initializeazaGPIO() {
  const comenzi = [
    `echo ${pinulGPIO} | sudo tee /sys/class/gpio/export 2>/dev/null || true`,
    `echo out | sudo tee /sys/class/gpio/gpio${pinulGPIO}/direction`,
    `echo 0 | sudo tee /sys/class/gpio/gpio${pinulGPIO}/value`
  ];
  
  return new Promise(resolve => {
    exec(comenzi.join(' && '), (eroare) => {
      if (eroare) {
        console.log('Eroare GPIO:', eroare.message);
        resolve(false);
      } else {
        console.log(`GPIO ${pinulGPIO} initializat`);
        resolve(true);
      }
    });
  });
}

async function controleazaPompa(porneste, durata = 30000, sursa = 'sistem') {
  if (porneste && pompaPornita) {
    return { succes: false, mesaj: 'Pompa deja pornita' };
  }
  
  const valoare = porneste ? 1 : 0;
  const ok = await new Promise(resolve => {
    exec(`echo ${valoare} | sudo tee /sys/class/gpio/gpio${pinulGPIO}/value`, (eroare) => {
      if (eroare) {
        console.log('Eroare control:', eroare.message);
        resolve(false);
      } else {
        console.log(`GPIO ${pinulGPIO} = ${porneste ? 'PORNIT' : 'OPRIT'}`);
        resolve(true);
      }
    });
  });
  
  if (!ok) {
    return { succes: false, mesaj: 'Eroare GPIO' };
  }
  
  pompaPornita = porneste;
  
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  
  if (porneste) {
    scriuJurnalul(`POMPA PORNITA de pe ${sursa}`);
    timer = setTimeout(() => {
      controleazaPompa(false, 0, 'timer automat');
    }, durata);
    return { succes: true, mesaj: `POMPA PORNITA! (${durata / 1000}s)` };
  } else {
    scriuJurnalul(`POMPA OPRITA de pe ${sursa}`);
    return { succes: true, mesaj: 'POMPA OPRITA!' };
  }
}

async function pornestePompa(durata = 30000, sursa = 'sistem') {
  return await controleazaPompa(true, durata, sursa);
}

async function oprestePompa(sursa = 'sistem') {
  return await controleazaPompa(false, 0, sursa);
}

function obtineStarea() {
  return {
    pompaPornita: pompaPornita,
    pinulGPIO: pinulGPIO,
    timpul: new Date().toLocaleString('ro-RO')
  };
}

async function oprireDeUrgenta() {
  await controleazaPompa(false, 0, 'urgenta');
  scriuJurnalul('SERVER oprit');
}

module.exports = {
  scriuJurnalul,
  citesteLogs,
  stergeJurnalul,
  initializeazaGPIO,
  pornestePompa,
  oprestePompa,
  obtineStarea,
  oprireDeUrgenta,
  pinulGPIO
};
