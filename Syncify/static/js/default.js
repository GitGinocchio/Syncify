function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';

    if (currentTheme === 'dark') {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      themeIcon.src = 'https://img.icons8.com/material-outlined/24/ffffff/sun--v1.png'; // Icona Light Mode
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
      themeIcon.src = 'https://img.icons8.com/material-outlined/24/ffffff/moon--v1.png'; // Icona Dark Mode
      localStorage.setItem('theme', 'dark');
    }
  }

  // Imposta il tema all'avvio in base alla preferenza salvata
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.add(savedTheme + '-mode');
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.src = savedTheme === 'dark'
        ? 'https://img.icons8.com/material-outlined/24/ffffff/moon--v1.png' // Icona Dark Mode
        : 'https://img.icons8.com/material-outlined/24/ffffff/sun--v1.png'; // Icona Light Mode
  }

  // Aggiungi l'evento di click per l'icona del tema
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }