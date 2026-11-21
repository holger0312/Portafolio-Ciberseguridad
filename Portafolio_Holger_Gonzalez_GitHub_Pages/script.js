/* HG // CYBERSPACE — client-side enhancements. All commands are local, informational only. */
(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollOptions = { behavior: prefersReducedMotion ? 'instant' : 'smooth' };

  // Progressive reveal: show content even if IntersectionObserver is missing.
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // Navigation and appearance.
  const menuToggle = $('#menu-toggle');
  const nav = $('#primary-nav');
  const themeToggle = $('#theme-toggle');
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
  }
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#primary-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  let preferredTheme = 'dark';
  try {
    const savedTheme = localStorage.getItem('hg-cyberspace-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') preferredTheme = savedTheme;
  } catch (_) { /* Private browsing can disable storage. */ }
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro');
    themeToggle.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#07101c' : '#f5f9fb');
  }
  applyTheme(preferredTheme);
  themeToggle.addEventListener('click', () => {
    preferredTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(preferredTheme);
    try { localStorage.setItem('hg-cyberspace-theme', preferredTheme); } catch (_) {}
  });

  const progress = $('#reading-progress-bar');
  let scrollScheduled = false;
  function updateScrollState() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    progress.style.transform = `scaleX(${Math.max(0, Math.min(1, scrollY / maxScroll))})`;
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(updateScrollState);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollState);
  updateScrollState();

  if ('IntersectionObserver' in window) {
    const navLinks = $$('#primary-nav a[href^="#"]');
    const targetSections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-18% 0px -66% 0px', threshold: 0 });
    targetSections.forEach(el => sectionObserver.observe(el));
  }

  // Filter by academic project area, keeping all visible without JS.
  const projectCards = $$('.project-card');
  const projectFilters = $$('.filter');
  const projectCount = $('#project-count');
  projectFilters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    let visibleCount = 0;
    projectFilters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    projectCards.forEach(card => {
      const match = selected === 'todos' || card.dataset.category.split(',').includes(selected);
      card.hidden = !match;
      if (match) visibleCount++;
    });
    projectCount.textContent = String(visibleCount).padStart(2, '0') + (visibleCount === 1 ? ' resultado' : ' resultados');
    $('#no-projects').hidden = visibleCount !== 0;
  }));

  // Expanded cards include only documented CV project information.
  const projectDetails = {
    web: {
      type: 'PROYECTO 001 / INFRAESTRUCTURA',
      title: 'Infraestructura web segura y de alta disponibilidad',
      description: 'Proyecto académico de despliegue de infraestructura web utilizando Docker Compose sobre Ubuntu/WSL 2. El entorno incluye WordPress, MariaDB, Redis y NGINX, con TLS/HTTPS como parte de la configuración de seguridad.',
      tags: ['Docker Compose', 'Ubuntu', 'WSL 2', 'WordPress', 'MariaDB', 'Redis', 'NGINX', 'TLS/HTTPS']
    },
    server: {
      type: 'PROYECTO 002 / SISTEMAS',
      title: 'Administración de Windows Server 2022',
      description: 'Laboratorio académico virtualizado con VirtualBox y Windows Server 2022. Incluye Active Directory Domain Services (AD DS), configuración de controlador de dominio, usuarios, grupos y unidades organizativas (OU), directivas de grupo (GPO), DHCP e IIS.',
      tags: ['Windows Server 2022', 'VirtualBox', 'AD DS', 'Controlador de dominio', 'Usuarios y grupos', 'OU', 'GPO', 'DHCP', 'IIS']
    },
    network: {
      type: 'PROYECTO 003 / REDES',
      title: 'Diseño de red universitaria',
      description: 'Diseño de una red universitaria simulada en Cisco Packet Tracer. Se trabaja con segmentación por VLAN, direccionamiento IPv4 con VLSM, enlaces 802.1Q, enrutamiento Inter-VLAN y RIPv2, listas de control de acceso (ACL) y pruebas de conectividad.',
      tags: ['Cisco Packet Tracer', 'VLAN', 'IPv4', 'VLSM', '802.1Q', 'Inter-VLAN', 'RIPv2', 'ACL']
    },
    python: {
      type: 'PROYECTO 004 / SEGURIDAD',
      title: 'Protección de documentos digitales con Python',
      description: 'Proyecto académico enfocado en la verificación y protección de archivos PDF mediante Python. Utiliza SHA-256 para la verificación, así como códigos QR, marcas de agua y cifrado con contraseña como mecanismos de protección documental.',
      tags: ['Python', 'PDF', 'SHA-256', 'Código QR', 'Marca de agua', 'Cifrado con contraseña']
    }
  };
  const dialog = $('#project-dialog');
  const dialogClose = $('#dialog-close');
  const dialogDone = $('#dialog-done');
  let priorFocus = null;
  function openProject(key) {
    const data = projectDetails[key];
    if (!data) return;
    priorFocus = document.activeElement;
    $('#dialog-type').textContent = data.type;
    $('#dialog-title').textContent = data.title;
    $('#dialog-description').textContent = data.description;
    const tagsContainer = $('#dialog-tags');
    tagsContainer.replaceChildren();
    data.tags.forEach(label => {
      const span = document.createElement('span');
      span.textContent = label;
      tagsContainer.appendChild(span);
    });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialogClose.focus();
  }
  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }
  $$('[data-open-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.openProject)));
  dialogClose.addEventListener('click', closeDialog);
  dialogDone.addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    if (priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus();
  });

  // Interactive terminal: informational, whitelisted commands; nothing is evaluated.
  const terminalForm = $('#terminal-form');
  const terminalInput = $('#terminal-input');
  const terminalBody = $('#terminal-body');
  const terminalResponses = {
    help: [
      ['Comandos disponibles:', 'term-cyan'],
      ['  whoami    → Conóceme', ''],
      ['  stack     → Tecnologías y herramientas', ''],
      ['  projects  → Proyectos destacados', ''],
      ['  education → Formación académica', ''],
      ['  contact   → Datos de contacto', ''],
      ['  cv        → Enlace al currículum', ''],
      ['  clear     → Limpiar consola', '']
    ],
    whoami: [
      ['USER       Holger Raúl González Villarreal', 'term-cyan'],
      ['ROLE       Estudiante de Licenciatura en Ciberseguridad', ''],
      ['UNIVERSITY Universidad Tecnológica de Panamá', ''],
      ['FOCUS      Redes · sistemas · programación · nube · seguridad', '']
    ],
    stack: [
      ['SEGURIDAD  Análisis de vulnerabilidades · SHA-256 · TLS/HTTPS', 'term-cyan'],
      ['NETWORK   Cisco · VLAN · VLSM · RIPv2 · ACL', ''],
      ['SYSTEMS   Linux · Windows Server · AD DS · Docker · NGINX', ''],
      ['DEV/DATA  Python · Java · PHP · HTML/CSS · SQL · MariaDB', ''],
      ['CLOUD     AWS · Redis', '']
    ],
    projects: [
      ['[01] Infraestructura web segura y de alta disponibilidad', 'term-cyan'],
      ['[02] Administración de Windows Server 2022', ''],
      ['[03] Diseño de red universitaria', ''],
      ['[04] Protección de documentos digitales con Python', ''],
      ['Tip: visita la sección «Proyectos» para abrir sus fichas.', 'term-muted']
    ],
    education: [
      ['2025 - Actualidad | Lic. en Ciberseguridad, UTP', 'term-cyan'],
      ['2022 - 2024      | Bachiller en Tecnología, Instituto Fermín Naudeau', ''],
      ['Formación complementaria: AWS · Udacity · TEC', '']
    ],
    contact: [
      ['EMAIL    holgergonzalez03@gmail.com', 'term-cyan'],
      ['PHONE    +507 6539-6660', ''],
      ['LOCATION Panamá, Panamá', ''],
      ['Usa los botones de la sección Contacto para escribir.', 'term-muted']
    ],
    cv: [
      ['CV disponible para descargar:', 'term-cyan'],
      ['assets/CV_Holger_Raul_Gonzalez_Villarreal.pdf', ''],
      ['Utiliza «Descargar CV» en el encabezado o menú.', 'term-muted']
    ]
  };
  function addTerminalMessage(text, className = 'term-output') {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    terminalBody.appendChild(el);
    terminalBody.scrollTop = terminalBody.scrollHeight;
    return el;
  }
  function runCommand(rawCommand) {
    const command = String(rawCommand).trim().toLowerCase();
    if (!command) return;
    if (command === 'clear') {
      terminalBody.replaceChildren();
      return;
    }
    const history = addTerminalMessage('', 'term-history');
    const prefix = document.createElement('span');
    prefix.textContent = 'holger@portfolio:~$ ';
    history.appendChild(prefix);
    history.append(document.createTextNode(command));
    const answer = terminalResponses[command];
    if (!answer) {
      addTerminalMessage(`Comando no reconocido: ${command}\nEscribe «help» para conocer los comandos.`, 'term-output term-muted');
    } else {
      const output = document.createElement('div');
      output.className = 'term-output';
      answer.forEach(([line, cls], index) => {
        if (index) output.append(document.createTextNode('\n'));
        const span = document.createElement('span');
        if (cls) span.className = cls;
        span.textContent = line;
        output.appendChild(span);
      });
      terminalBody.appendChild(output);
    }
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
  terminalForm.addEventListener('submit', event => {
    event.preventDefault();
    runCommand(terminalInput.value);
    terminalInput.value = '';
    terminalInput.focus();
  });
  $$('[data-command]').forEach(button => button.addEventListener('click', () => {
    runCommand(button.dataset.command);
    if (innerWidth > 680) {
      terminalInput.focus({ preventScroll: true });
    }
  }));

  // Email clipboard with fallback and honest feedback.
  const toast = $('#toast');
  let toastTimer;
  function announce(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }
  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const temp = document.createElement('textarea');
    temp.value = value;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    const success = document.execCommand('copy');
    temp.remove();
    if (!success) throw new Error('Copy command not available');
  }
  $('#copy-email').addEventListener('click', async event => {
    const button = event.currentTarget;
    try {
      await copyText(button.dataset.copy);
      announce('Correo copiado al portapapeles');
    } catch (_) {
      announce('No se pudo copiar. Puedes seleccionar el correo de contacto.');
    }
  });
})();
