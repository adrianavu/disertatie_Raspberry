const statusEl = document.getElementById('status');
const logsContainer = document.getElementById('logsContainer');
const logsStats = document.getElementById('logsStats');

function showStatus(message, tip) {
  statusEl.innerHTML = message;
  statusEl.className = 'status';
  
  if (tip === 'success') {
    statusEl.classList.add('status-success');
  } else if (tip === 'error') {
    statusEl.classList.add('status-error');
  } else {
    statusEl.classList.add('status-info');
  }
}

function loadLogs() {
  fetch('/api/logs')
    .then(res => res.json())
    .then(data => {
      if (data.logs && data.logs.length > 0) {
        logsStats.textContent = data.logs.length + ' evenimente';
        
        let logsHtml = '';
        
        for (let i = 0; i < data.logs.length; i++) {
          const log = data.logs[i];
          
          let icon = '📝';
          if (log.message.includes('PORNITĂ')) icon = '🟢';
          if (log.message.includes('OPRITĂ')) icon = '🔴';
          if (log.message.includes('WEB')) icon = '🌐';
          if (log.message.includes('USCAT')) icon = '🌵';
          if (log.message.includes('UMED')) icon = '💧';
          if (log.message.includes('EROARE')) icon = '❌';
          
          let mesajCurat = log.message
            .replace('POMPĂ', 'Pompa')
            .replace('PORNITĂ', 'pornită')
            .replace('OPRITĂ', 'oprită');
          
          logsHtml += `
            <div class="log-entry">
              <div class="log-icon">${icon}</div>
              <div class="log-content">
                <div class="log-message">${mesajCurat}</div>
                <div class="log-timestamp">
                  <span class="log-date">📅 ${log.date}</span>
                  <span class="log-time">🕐 ${log.time}</span>
                </div>
              </div>
            </div>
          `;
        }
        
        logsContainer.innerHTML = logsHtml;
        
      } else {
        logsStats.textContent = '0 evenimente';
        logsContainer.innerHTML = `
          <div class="no-logs">
            Niciun eveniment înregistrat încă<br>
            Apasă un buton pentru a începe!
          </div>
        `;
      }
    })
    .catch(err => {
      logsContainer.innerHTML = `
        <div class="no-logs">
          Eroare la încărcarea istoricului
        </div>
      `;
    });
}

function startPump() {
  showStatus('Se pornește pompa...', 'info');
  
  fetch('/api/start')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showStatus('❌ ' + data.error, 'error');
      } else {
        showStatus('🟢 ' + data.status, 'success');
      }
      setTimeout(loadLogs, 1000);
    })
    .catch(err => {
      showStatus('❌ Nu ma pot conecta la server', 'error');
    });
}

function stopPump() {
  showStatus('Se oprește pompa...', 'info');
  
  fetch('/api/stop')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        showStatus('❌ ' + data.error, 'error');
      } else {
        showStatus('🔴 ' + data.status, 'success');
      }
      setTimeout(loadLogs, 1000);
    })
    .catch(err => {
      showStatus('❌ Nu ma pot conecta la server', 'error');
    });
}

function refreshLogs() {
  showStatus('Se actualizează...', 'info');
  loadLogs();
  setTimeout(function() {
    showStatus('✅ Actualizat!', 'success');
  }, 500);
}

function clearLogs() {
  const confirma = confirm('Sigur vrei să ștergi tot istoricul?');
  
  if (confirma) {
    fetch('/api/clear-logs', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        showStatus('🗑️ Istoric șters!', 'success');
        loadLogs();
      })
      .catch(err => {
        showStatus('❌ Eroare la ștergere', 'error');
      });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('startBtn').onclick = startPump;
  document.getElementById('stopBtn').onclick = stopPump;
  document.getElementById('refreshBtn').onclick = refreshLogs;
  document.getElementById('clearBtn').onclick = clearLogs;

  loadLogs();
  setInterval(loadLogs, 30000);
});

