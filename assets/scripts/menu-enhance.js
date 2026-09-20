function normalizeText(value) {
  return (value || '').toString().replace(/\s+/g, ' ').trim().toLowerCase();
}

function initTheme() {
  document.body.classList.add('theme-modern');
}

function initNav() {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  links.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

function initStickyHeader() {
  const topBar = document.querySelector('.top-bar');
  if (!topBar) return;
  const onScroll = () => topBar.classList.toggle('scrolled', window.scrollY > 6);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initHeroSlides() {
  const slidesWrap = document.querySelector('.hero-slides');
  window.addEventListener('load', () => slidesWrap?.classList.remove('init'));
}

function getPriceHeaderType(text) {
  const label = normalizeText(text);
  if (label.includes('half tray') || label === 'half' || /\b50(\s*pcs|\b)/.test(label)) return 'half';
  if (label.includes('full tray') || label === 'full' || /\b100(\s*pcs|\b)/.test(label)) return 'full';
  if (label.includes('32oz') || label.includes('1 plate') || label.includes('plate')) return 'portion';
  if (label.includes('50 pcs') || label.includes('50 pieces') || label === '50') return '50';
  if (label.includes('100 pcs') || label.includes('100 pieces') || label === '100') return '100';
  return null;
}

function keepOnlyHalfFull(table) {
  const ths = Array.from(table.querySelectorAll('thead th'));
  if (!ths.length) return;
  const foundDishIdx = ths.findIndex(th => {
    const text = normalizeText(th.textContent);
    return ['dish','item','items','menu item','name'].includes(text);
  });
  const dishIdx = foundDishIdx >= 0 ? foundDishIdx : 0;
  const halfIdx = ths.findIndex(th => ['half tray','half','50 pcs','50 pieces','50'].some(token => normalizeText(th.textContent).includes(token)));
  const fullIdx = ths.findIndex(th => ['full tray','full','100 pcs','100 pieces','100'].some(token => normalizeText(th.textContent).includes(token)));
  if (halfIdx === -1 && fullIdx === -1) return;
  if (halfIdx >= 0) {
    const h = normalizeText(ths[halfIdx].textContent);
    if (/\b50(\s*pcs|\b)/.test(h) || h === 'half') ths[halfIdx].textContent = 'Half Tray';
  }
  if (fullIdx >= 0) {
    const h = normalizeText(ths[fullIdx].textContent);
    if (/\b100(\s*pcs|\b)/.test(h) || h === 'full') ths[fullIdx].textContent = 'Full Tray';
  }
  ths.forEach((th, index) => {
    const hide = index !== dishIdx && index !== halfIdx && index !== fullIdx;
    th.classList.toggle('hf-hide', hide);
  });
  table.querySelectorAll('tbody tr').forEach(tr => {
    Array.from(tr.children).forEach((td, index) => {
      const hide = index !== dishIdx && index !== halfIdx && index !== fullIdx;
      td.classList.toggle('hf-hide', hide);
    });
  });
}

function enhanceTable(table) {
  const ths = Array.from(table.querySelectorAll('thead th'));
  if (!ths.length) return;
  const types = ths.map(th => getPriceHeaderType(th.textContent));
  if (!types.some(Boolean)) return;
  table.classList.add('price-align');
  const colGroup = document.createElement('colgroup');
  colGroup.dataset.gen = 'align';
  ths.forEach((th, index) => {
    const type = types[index];
    const col = document.createElement('col');
    if (type) col.dataset.col = type;
    colGroup.appendChild(col);
  });
  table.insertBefore(colGroup, table.firstChild);
  ths.forEach((th, index) => {
    const type = types[index];
    if (type) th.dataset.col = type;
  });
  table.querySelectorAll('tbody tr').forEach(tr => {
    Array.from(tr.children).forEach((td, index) => {
      const type = types[index];
      if (!type) return;
      td.classList.add('num');
      td.dataset.col = type;
      if (!td.querySelector('.price')) {
        const text = td.textContent.trim();
        if (text && text.length < 16 && /^[0-9\s\$\.,]+$/.test(text)) {
          td.innerHTML = `<span class="price">${text}</span>`;
        }
      }
    });
  });
}

function keepOnlyDishColumn(table) {
  table.querySelectorAll('tr').forEach(row => {
    Array.from(row.children).slice(1).forEach(cell => cell.remove());
  });
  table.querySelectorAll('colgroup').forEach(group => group.remove());
}

function initTables() {
  document.querySelectorAll('.table-wrap > table, section .table-wrap table').forEach(table => {
    keepOnlyHalfFull(table);
    enhanceTable(table);
    table.querySelectorAll('tbody tr').forEach(row => {
      const button = row.querySelector('.dish-btn');
      if (!button) return;
      row.tabIndex = 0;
      row.setAttribute('aria-label', `View ${button.textContent.trim()}`);
    });
  });
}

function initFavoriteRotation() {
  const collection = document.querySelector('.featured-collection');
  if (!collection) return;
  const cards = Array.from(collection.querySelectorAll('.favorite-card'));
  if (cards.length < 2) return;
  const cycle = Math.floor(Date.now() / (48 * 60 * 60 * 1000));
  const offset = cycle % cards.length;
  cards.slice(offset).concat(cards.slice(0, offset)).forEach(card => collection.appendChild(card));
  collection.dataset.rotationCycle = String(cycle);
}

function getDishImageSource(name) {
  const info = window.DISH_INFO && window.DISH_INFO[name];
  if (info && info.img) return info.img;
  const raw = (name || '').trim();
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const candidates = [
    `assets/dishes/${raw}.png`,
    `assets/dishes/${raw}.jpg`,
    `assets/dishes/${normalized}.png`,
    `assets/dishes/${normalized}.jpg`,
    'assets/hero_kadhaipaneer-1280.jpg'
  ];
  return candidates[0];
}

function getDishDescription(name) {
  const info = window.DISH_INFO && window.DISH_INFO[name];
  return (info && info.desc) || 'Home-cooked vegetarian preparation made fresh in small batches.';
}

function syncMenuImageViewState() {
  const active = document.body.classList.contains('menu-image-view');
  const toggle = document.querySelector('.menu-view-toggle');
  if (toggle) {
    toggle.textContent = active ? 'List view' : 'Details view';
    toggle.setAttribute('aria-pressed', String(active));
  }

  document.querySelectorAll('.table-wrap tbody tr').forEach(row => {
    const cell = row.querySelector('td:first-child');
    if (!cell) return;
    const button = cell.querySelector('.dish-btn');
    if (!button) return;

    const existingThumb = cell.querySelector('.dish-thumb');
    const dishName = button.dataset.dish || button.textContent.trim();

    if (active) {
      if (!existingThumb) {
        const img = document.createElement('img');
        img.className = 'dish-thumb';
        img.src = getDishImageSource(dishName);
        img.alt = dishName;
        img.loading = 'lazy';
        img.onerror = function() {
          this.onerror = null;
          this.src = 'assets/hero_kadhaipaneer-1280.jpg';
        };
        cell.insertBefore(img, button);
      } else {
        existingThumb.src = getDishImageSource(dishName);
        existingThumb.alt = dishName;
      }
      let description = cell.querySelector('.dish-description');
      if (!description) {
        description = document.createElement('p');
        description.className = 'dish-description';
        cell.appendChild(description);
      }
      description.textContent = getDishDescription(dishName);
      cell.classList.add('dish-cell-image');
    } else {
      if (existingThumb) existingThumb.remove();
      const description = cell.querySelector('.dish-description');
      if (description) description.remove();
      cell.classList.remove('dish-cell-image');
    }
  });
}

function initMenuViewToggle() {
  const toggle = document.querySelector('.menu-view-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('menu-image-view');
    syncMenuImageViewState();
  });
  syncMenuImageViewState();
}

function initGoToTop() {
  const button = document.querySelector('.go-top');
  if (!button) return;
  const footer = document.querySelector('footer');
  const updateButton = () => {
    button.classList.toggle('visible', window.scrollY > 300);
    const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
    const bottom = Math.max(22, window.innerHeight - footerTop + 16);
    button.style.bottom = `${bottom}px`;
  };
  window.addEventListener('scroll', updateButton, { passive: true });
  window.addEventListener('resize', updateButton);
  updateButton();
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function init() {
  initTheme();
  initNav();
  initStickyHeader();
  initHeroSlides();
  initTables();
  initFavoriteRotation();
  initMenuViewToggle();
  initGoToTop();
}

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', event => {
  const disabled = event.target.closest('[aria-disabled="true"]');
  if (disabled) {
    event.preventDefault();
    event.stopPropagation();
  }
});
