Sistem de Irigare Automatizată cu Raspberry Pi
Descriere
Proiectul implementează două moduri de control:

Control manual prin interfață web
Control automat prin script programat cu senzor de umiditate

# Structura Proiectului

├── server.js # Server web Express (port 3000)
├── controlPompa.js # Logica GPIO pentru interfața web
├── scriptControlPompa.js # Script pentru automatizare
├── udare.log # Istoric operațiuni manuale
├── cron_udare.log # Istoric operațiuni automatizate
└── public/
├── index.html # Interfața web
├── style.css # Stiluri CSS
└── app.js # JavaScript client
Hardware

Raspberry Pi cu GPIO
Releu 5V pentru control pompă
Senzor de umiditate
Pompă de apă 220V

# Conexiuni GPIO

GPIO 17 - Control releu
GPIO 22 - Senzor umiditate

# Instalare

sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm

# Dependențe proiect

npm install express pigpio

Utilizare

# Control Manual

sudo node server.js
Accesează: http://raspberry-pi-ip:3000
Control Automat
bash# Test manual
sudo node scriptControlPompa.js

# Programare cron (la 30 minute)

sudo crontab -e
_/30 _ \* \* \* cd /path/to/project && sudo node scriptControlPompa.js
Fișiere Principale
Partea Web

server.js - Server HTTP cu API REST
controlPompa.js - Funcții GPIO, logging, gestionare stare
public/index.html - Interfață cu butoane control
public/app.js - Componenta care controlează interacțiunea utilizatorului, comunică cu serverul și oferă feedback în timp real
udare.log - Istoric operațiuni manuale

# Partea Automatizată

scriptControlPompa.js - Script Node.js independent cu senzor
cron_udare.log - Istoric automatizare

# Siguranță

Timeout automat 30 secunde
Oprire la SIGINT/SIGTERM
Verificări stare pentru prevenirea conflictelor
Logging complet pentru audit
