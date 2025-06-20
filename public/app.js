const elementStare = document.getElementById('status');
const containerJurnal = document.getElementById('logsContainer');
const statisticiJurnal = document.getElementById('logsStats');

function afiseazaStarea(mesaj, tip) {
  elementStare.innerHTML = mesaj;
  elementStare.className = 'status';
  
  if (tip === 'succes') {
    elementStare.classList.add('status-success');
  } else if (tip === 'eroare') {
    elementStare.classList.add('status-error');
  } else {
    elementStare.classList.add('status-info');
  }
}

function incarcaJurnalul() {
  fetch('/api/jurnal')
    .then(function(raspuns) {
      return raspuns.json();
    })
    .then(function(date) {
      const jurnal = date.jurnal ? date.jurnal : [];
      statisticiJurnal.textContent = jurnal.length + ' evenimente';
      
      let htmlJurnal = '';
      for (let i = 0; i < jurnal.length; i++) {
        htmlJurnal += `<p>${jurnal[i].mesaj} - ${jurnal[i].data} ${jurnal[i].ora}</p>`;
      }
      
      containerJurnal.innerHTML = htmlJurnal;
    })
    .catch(function() {
      containerJurnal.innerHTML = '';
    });
}

function pornestePompa() {
  afiseazaStarea('Se porneste pompa...', 'info');
  
  fetch('/api/porneste')
    .then(function(raspuns) {
      return raspuns.json();
    })
    .then(function(date) {
      if (date.eroare) {
        afiseazaStarea('Eroare: ' + date.eroare, 'eroare');
      } else {
        afiseazaStarea('Succes: ' + date.stare, 'succes');
      }
      setTimeout(incarcaJurnalul, 1000);
    })
    .catch(function(eroare) {
      afiseazaStarea('Nu ma pot conecta la server', 'eroare');
    });
}

function oprestePompa() {
  afiseazaStarea('Se opreste pompa...', 'info');
  
  fetch('/api/opreste')
    .then(function(raspuns) {
      return raspuns.json();
    })
    .then(function(date) {
      if (date.eroare) {
        afiseazaStarea('Eroare: ' + date.eroare, 'eroare');
      } else {
        afiseazaStarea('Succes: ' + date.stare, 'succes');
      }
      setTimeout(incarcaJurnalul, 1000);
    })
    .catch(function(eroare) {
      afiseazaStarea('Nu ma pot conecta la server', 'eroare');
    });
}

function stergeJurnalul() {
  const confirmare = confirm('Sigur vrei sa stergi tot istoricul?');
  
  if (confirmare) {
    fetch('/api/sterge-jurnal', { method: 'POST' })
      .then(function(raspuns) {
        return raspuns.json();
      })
      .then(function(date) {
        afiseazaStarea('Istoric sters!', 'succes');
        incarcaJurnalul();
      })
      .catch(function(eroare) {
        afiseazaStarea('Eroare la stergere', 'eroare');
      });
  }
}

document.getElementById('startBtn').onclick = pornestePompa;
document.getElementById('stopBtn').onclick = oprestePompa;
document.getElementById('clearBtn').onclick = stergeJurnalul;
incarcaJurnalul();
setInterval(incarcaJurnalul, 30000);
