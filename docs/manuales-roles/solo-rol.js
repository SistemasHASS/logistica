/* Modo "solo mi rol" — propagado por portal-usuario.html via sessionStorage.
   Cuando el flag 'docSoloRol' existe, los enlaces que apuntan al portal
   tecnico (index.html / anexo.html) se reescriben para volver a
   portal-usuario.html?rol=<ROL>&solo=1, manteniendo al usuario dentro
   del alcance de su rol. */
(function () {
  var rol;
  try { rol = sessionStorage.getItem('docSoloRol'); } catch (e) { return; }
  if (!rol) return;
  function ajustar() {
    var dest = 'portal-usuario.html?rol=' + encodeURIComponent(rol) + '&solo=1';
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || /^(https?:|mailto:)/i.test(h)) return;
      if (/(^|\/)anexo\.html/.test(h)) {
        a.style.display = 'none';           // el anexo tecnico queda oculto en modo solo
      } else if (/(^|\/)index\.html/.test(h)) {
        a.setAttribute('href', h.replace(/index\.html.*$/, dest));
        if (/portal/i.test(a.textContent)) a.textContent = '\u2190 Mi rol';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ajustar);
  } else { ajustar(); }
})();
