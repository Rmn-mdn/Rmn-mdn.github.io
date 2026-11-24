/* Section « Veille » : lit veille.json et affiche les actualités les plus récentes.
   Le texte est inséré avec textContent (jamais en HTML brut), donc un contenu mal formé ne peut pas casser la page.
   Pour ajouter une actualité : ajouter un objet au début de veille.json (champs : date, titre, source, url, rubrique, langue, retenu, commentaire). */
(function () {
  'use strict';
  var MAX = 6;                                   /* nombre d'actualités affichées */
  var list = document.getElementById('veille-list');
  if (!list) return;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function render(items) {
    list.textContent = '';
    items.slice(0, MAX).forEach(function (it) {
      var li = el('article', 'veille-item');
      li.setAttribute('data-rubrique', it.rubrique || '');

      var meta = el('div', 'veille-meta');
      meta.appendChild(el('span', '', formatDate(it.date)));
      meta.appendChild(el('span', 'veille-tag', it.rubrique || ''));
      meta.appendChild(el('span', '', (it.source || '') + (it.langue ? ' · ' + it.langue : '')));

      var body = el('div', 'veille-body');
      var h3 = el('h3');
      var a = el('a', '', it.titre || '');
      if (/^https:\/\//.test(it.url || '')) {    /* n'accepte que des liens https */
        a.href = it.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      }
      h3.appendChild(a);
      body.appendChild(h3);
      /* Deux blocs : ce que j'en retiens (le fait), puis mon commentaire (mon avis). */
      function block(cls, label, text) {
        var p = el('p', 'veille-block ' + cls);
        p.appendChild(el('b', '', label));
        p.appendChild(document.createTextNode(text));
        body.appendChild(p);
      }
      if (it.retenu) block('veille-retenu', 'Ce que je retiens', it.retenu);
      if (it.commentaire) block('veille-regard', 'Mon commentaire', it.commentaire);
      li.appendChild(meta);
      li.appendChild(body);
      list.appendChild(li);
    });
    if (!list.children.length) list.appendChild(el('p', 'veille-empty', 'Les premières actualités arrivent bientôt.'));
  }

  fetch('veille.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () { list.appendChild(el('p', 'veille-empty', 'Les actualités sont momentanément indisponibles.')); });
})();
