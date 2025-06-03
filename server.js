const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');

console.log('🌱 Server cu GPIO 529 pornit...');

const app = express();
let isPumpRunning = false;
let pumpTimer = null;
const GPIO_PIN = 529; // GPIO 17 fizic = 529 în sistemul nou

app.use(express.static('public'));

function writeLog(message) {
  const timestamp = new Date().toLocaleString('ro-RO');
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFile('./udare.log', logLine, () => {});
  console.log('📝', message);
}

// Inițializează GPIO 529 o singură dată
function initGPIO() {
  return new Promise((resolve) => {
    const commands = [
      `echo ${GPIO_PIN} | sudo tee /sys/class/gpio/export 2>/dev/null || true`,
      `echo out | sudo tee /sys/class/gpio/gpio${GPIO_PIN}/direction`,
      `echo 0 | sudo tee /sys/class/gpio/gpio${GPIO_PIN}/value` // Oprită inițial (fix)
    ];
    
    exec(commands.join(' && '), (err) => {
      if (err) {
        console.log('❌ Eroare inițializare GPIO:', err.message);
        resolve(false);
      } else {
        console.log(`✅ GPIO ${GPIO_PIN} inițializat și oprit`);
        resolve(true);
      }
    });
  });
}

function controlGPIO(value) {
  return new Promise((resolve) => {
    exec(`echo ${value} | sudo tee /sys/class/gpio/gpio${GPIO_PIN}/value`, (err) => {
      if (err) {
        console.log('❌ Eroare control GPIO:', err.message);
        resolve(false);
      } else {
                console.log(`✅ GPIO ${GPIO_PIN} = ${value} (${value === 1 ? 'PORNIT' : 'OPRIT'})`); // Fix mesaj
        resolve(true);
      }
    });
  });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/start', async (req, res) => {
  console.log('🟢 START de pe WEB...');
  
  if (isPumpRunning) {
    return res.json({ status: 'Pompa este deja pornită' });
  }
  
  const success = await controlGPIO(1); // 1 = pornit (fix invers)
  if (success) {
    isPumpRunning = true;
    writeLog('🌐 POMPĂ PORNITĂ de pe interfața WEB');
    
    if (pumpTimer) clearTimeout(pumpTimer);
    pumpTimer = setTimeout(async () => {
      await controlGPIO(0); // 0 = oprit (fix invers)
      isPumpRunning = false;
      writeLog('⏰ POMPĂ OPRITĂ automat după 30 secunde');
      console.log('🔴 POMPĂ OPRITĂ automat');
    }, 30000);
    
    res.json({ status: 'POMPĂ PORNITĂ! (oprire automată în 30 sec)' });
  } else {
    res.status(500).json({ error: 'Eroare la controlul pompei' });
  }
});

app.get('/api/stop', async (req, res) => {
  console.log('🔴 STOP de pe WEB...');
  
  const success = await controlGPIO(0); // 0 = oprit (fix invers)
  if (success) {
    isPumpRunning = false;
    
    if (pumpTimer) {
      clearTimeout(pumpTimer);
      pumpTimer = null;
    }
    
    writeLog('🌐 POMPĂ OPRITĂ manual de pe interfața WEB');
    res.json({ status: 'POMPĂ OPRITĂ!' });
  } else {
    res.status(500).json({ error: 'Eroare la controlul pompei' });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const data = fs.readFileSync('./udare.log', 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    const logs = lines.map(line => {
      const match = line.match(/^\[([^\]]+)\] (.+)$/);
      if (match) {
        const date = new Date(match[1]);
        return {
          message: match[2],
          date: date.toLocaleDateString('ro-RO'),
          time: date.toLocaleTimeString('ro-RO')
        };
      }
      return { message: line, date: '', time: '' };
    });
    res.json({ logs: logs.reverse() });
  } catch (err) {
    res.json({ logs: [] });
  }
});

app.post('/api/clear-logs', (req, res) => {
  try {
    fs.writeFileSync('./udare.log', '');
    writeLog('🗑️ ISTORIC ȘTERS de pe interfața WEB');
    res.json({ status: 'Istoric șters!' });
  } catch (err) {
    res.status(500).json({ error: 'Eroare' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ 
    isPumpRunning,
    gpioPin: GPIO_PIN,
    timestamp: new Date().toLocaleString('ro-RO')
  });
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Opresc server...');
  await controlGPIO(0); // Asigură că pompa e oprită (fix)
  writeLog('🔄 SERVER oprit');
  process.exit(0);
});

// Pornire cu inițializare GPIO
initGPIO().then((success) => {
  if (success) {
    app.listen(3000, '0.0.0.0', () => {
      writeLog('🚀 SERVER cu GPIO 529 pornit pe portul 3000');
      console.log('🌐 Server: http://localhost:3000');
      console.log(`🔌 Folosesc GPIO ${GPIO_PIN} (GPIO 17 fizic)`);
      console.log('⏰ Timer: 30 secunde');
      console.log('✅ Sistem gata!');
    });
  } else {
    console.log('❌ Nu pot inițializa GPIO - server nu pornește');
    process.exit(1);
  }
});
