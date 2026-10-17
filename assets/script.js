'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const header = document.querySelector('.header');
const groups = [...document.querySelectorAll('.nav-group')];
const desktopNavigation = window.matchMedia('(min-width: 901px)');
function setGroup(group, open) {
  group.classList.toggle('open', open);
  group.querySelector('.submenu-toggle').setAttribute('aria-expanded', String(open));
}
function closeGroups() { groups.forEach(group => setGroup(group, false)); }
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('open');
  closeGroups();
}
menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', opening);
  if (!opening) closeGroups();
});
groups.forEach(group => {
  group.querySelector('button').addEventListener('click', () => {
    const open = !group.classList.contains('open');
    closeGroups();
    setGroup(group, open);
  });
  group.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && desktopNavigation.matches) {
      closeGroups(); setGroup(group, true);
    }
  });
  group.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !group.contains(document.activeElement)) setGroup(group, false);
  });
  group.addEventListener('focusout', () => {
    setTimeout(() => { if (!group.contains(document.activeElement)) setGroup(group, false); }, 0);
  });
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const openGroup = groups.find(group => group.classList.contains('open'));
  if (openGroup) {
    setGroup(openGroup, false);
    openGroup.querySelector('button').focus();
  } else if (navigation.classList.contains('open')) {
    closeMenu(); menuButton.focus();
  }
});
desktopNavigation.addEventListener('change', closeMenu);
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 15), { passive: true });
document.querySelector('#year').textContent = new Date().getFullYear();

// All content remains visible without scripting or when reduced motion is preferred.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.06 });
  document.documentElement.classList.add('motion-ready');
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
const currentPath = (document.body.dataset.pagePath || location.pathname).split('/').pop() || 'index.html';
navigation.querySelectorAll('a').forEach(link => {
  const href = link.getAttribute('href') || '';
  const linkPage = href.split('#')[0].split('?')[0].split('/').pop();
  if (linkPage === currentPath && !href.includes('#')) {
    link.setAttribute('aria-current', 'page'); link.classList.add('active');
  }
});

// Feature tabs support pointer, keyboard, Home and End navigation.
document.querySelectorAll('[role="tablist"]').forEach(tablist => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  function activate(tab, focus) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, false));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activate(tabs[next], true); }
    });
  });
});

const form = document.querySelector('#inquiry-form');
const phoneInput = document.querySelector('#phone');
const nameInput = document.querySelector('#name');
const serviceInput = document.querySelector('#service');
const requestedService = new URLSearchParams(location.search).get('service');
if (requestedService && [...serviceInput.options].some(option => option.value === requestedService)) serviceInput.value = requestedService;
function validatePhone() {
  const digits = phoneInput.value.replace(/\D/g, '');
  phoneInput.setCustomValidity(digits.length >= 7 && digits.length <= 15 ? '' : 'Please enter a phone number with 7–15 digits.');
}
function validateName() {
  nameInput.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your name.');
}
phoneInput.addEventListener('input', validatePhone);
nameInput.addEventListener('input', validateName);
form.addEventListener('reset', () => {
  phoneInput.setCustomValidity(''); nameInput.setCustomValidity('');
  document.querySelector('#form-status').hidden = true;
});
form.addEventListener('submit', event => {
  event.preventDefault(); validateName(); validatePhone();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const inquiry = `Hello Sumair Innovations!\n\nName: ${String(data.get('name')).trim()}\nPhone: ${String(data.get('phone')).trim()}\nInterested in: ${data.get('service')}\n\n${String(data.get('message')).trim() || 'I would like to discuss my requirements.'}`;
  const url = `https://wa.me/917048544134?text=${encodeURIComponent(inquiry)}`;
  const status = document.querySelector('#form-status');
  status.replaceChildren(document.createTextNode('Your inquiry is ready. If WhatsApp didn’t open, '));
  const fallback = document.createElement('a');
  fallback.href = url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = 'open your message here';
  status.append(fallback, document.createTextNode('. You’ll review and send it from WhatsApp.'));
  status.hidden = false;
  window.open(url, '_blank', 'noopener,noreferrer');
});
