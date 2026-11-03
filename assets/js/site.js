/* Jakub Gruda Fotografia – skrypty strony (bez bibliotek): menu, lightbox, przycisk pływający, formularz, cookies + GA po zgodzie. */
(function () {
	'use strict';

	var $ = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	// Menu na telefonie.
	var mb = $('.menu-btn'), mm = $('#mobile-menu');
	if (mb && mm) {
		mb.addEventListener('click', function () {
			var open = mm.classList.toggle('open');
			mb.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
	}

	// Przycisk pływający (komputer): po przewinięciu ok. jednego ekranu, ukryty przy sekcjach z data-hide-float.
	var fl = $('#float');
	if (fl) {
		var hidden = false;
		var upd = function () { fl.classList.toggle('show', window.scrollY > window.innerHeight * 0.9 && !hidden); };
		window.addEventListener('scroll', upd, { passive: true });
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (es) {
				hidden = es.some(function (e) { return e.isIntersecting; });
				upd();
			});
			$$('[data-hide-float]').forEach(function (el) { io.observe(el); });
		}
		upd();
	}

	// Lightbox na elemencie <dialog>.
	var links = $$('a[data-lb]');
	if (links.length && typeof HTMLDialogElement === 'function') {
		var dlg = document.createElement('dialog');
		dlg.className = 'lb';
		dlg.setAttribute('aria-label', 'Powiększone zdjęcie');
		dlg.innerHTML = '<div class="lb-in"><img alt=""><button class="x" type="button" aria-label="Zamknij">×</button><button class="p" type="button" aria-label="Poprzednie zdjęcie">‹</button><button class="n" type="button" aria-label="Następne zdjęcie">›</button></div>';
		document.body.appendChild(dlg);
		var im = $('img', dlg), cur = 0, list = [], x0 = null;
		var show = function (i) {
			cur = (i + list.length) % list.length;
			var a = list[cur], t = $('img', a);
			im.src = a.getAttribute('href');
			im.alt = t ? t.alt : '';
		};
		links.forEach(function (a) {
			a.addEventListener('click', function (e) {
				e.preventDefault();
				list = $$('a[data-lb]', a.closest('[data-gallery]') || document);
				show(list.indexOf(a));
				dlg.showModal();
			});
		});
		$('.x', dlg).addEventListener('click', function () { dlg.close(); });
		$('.p', dlg).addEventListener('click', function () { show(cur - 1); });
		$('.n', dlg).addEventListener('click', function () { show(cur + 1); });
		dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.className === 'lb-in') dlg.close(); });
		dlg.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') show(cur - 1);
			if (e.key === 'ArrowRight') show(cur + 1);
		});
		dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
		dlg.addEventListener('touchend', function (e) {
			if (x0 === null) return;
			var d = e.changedTouches[0].clientX - x0;
			if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1));
			x0 = null;
		});
	}

	// Formularz kontaktowy (FormSubmit) – po wysłaniu przenosi na stronę z podziękowaniem.
	var form = $('#contact-form'), box = $('#form-status');
	function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
	function status(type, text) {
		if (!box) return;
		box.className = 'form-status' + (type ? ' ' + type : '');
		box.setAttribute('role', type === 'error' ? 'alert' : 'status');
		box.textContent = text;
	}
	if (form) {
		var THANKS = form.getAttribute('data-thanks');
		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var name = val('f-name'), email = val('f-email'), message = val('f-message'),
				consent = document.getElementById('f-consent'), btn = form.querySelector('button[type="submit"]');
			status('', '');
			if (val('f-hp') !== '') { window.location.href = THANKS; return; }
			if (!name || !email || !message) { status('error', 'Uzupełnij imię, e-mail i wiadomość.'); return; }
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status('error', 'Podaj poprawny adres e-mail.'); return; }
			if (!consent || !consent.checked) { status('error', 'Zaznacz zgodę na przetwarzanie danych, aby wysłać wiadomość.'); return; }
			var payload = { name: name, email: email, message: message, _subject: 'Zapytanie ze strony - ' + name, _template: 'table', _captcha: 'false' };
			[['f-phone', 'telefon'], ['f-type', 'rodzaj uroczystości'], ['f-date', 'termin'], ['f-place', 'miejsce'], ['f-source', 'skąd o mnie wiesz']].forEach(function (p) {
				var v = val(p[0]); if (v) payload[p[1]] = v;
			});
			btn.disabled = true; btn.textContent = 'Wysyłanie...';
			status('pending', 'Wysyłanie wiadomości...');
			fetch('https://formsubmit.co/ajax/kontakt@jakubgruda.pl', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify(payload)
			}).then(function (r) {
				return r.json().catch(function () { return {}; }).then(function (d) {
					if (!r.ok || d.success === false || d.success === 'false') throw new Error('send failed');
				});
			}).then(function () {
				if (window.gtag) window.gtag('event', 'generate_lead', { form_name: 'zapytanie' });
				window.location.href = THANKS;
			}).catch(function () {
				status('error', 'Nie udało się wysłać wiadomości. Napisz na Messengerze, na kontakt@jakubgruda.pl albo zadzwoń: +48 510 231 146.');
				btn.disabled = false; btn.textContent = 'Wyślij wiadomość';
			});
		});
	}

	// Zgoda na cookies i Google Analytics (ładowany dopiero po zgodzie; nie ładuje się przy testach lokalnych).
	var KEY = 'cookie-consent', gaId = document.body.getAttribute('data-ga'), banner = null, gaOn = false;
	var testing = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
	function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
	function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
	function loadGA() {
		if (gaOn || !gaId || testing) return;
		gaOn = true;
		var s = document.createElement('script');
		s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('js', new Date());
		window.gtag('config', gaId);
	}
	function dropGA() {
		var hosts = [location.hostname, '.' + location.hostname, '.' + location.hostname.replace(/^www\./, '')];
		document.cookie.split(';').forEach(function (c) {
			var n = c.split('=')[0].trim();
			if (n === '_ga' || n.indexOf('_ga_') === 0 || n === '_gid') {
				hosts.forEach(function (h) { document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + h; });
				document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
			}
		});
	}
	function decide(v) {
		save(v);
		if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
		banner = null;
		if (v === 'granted') loadGA(); else dropGA();
	}
	function showBanner() {
		if (banner) return;
		banner = document.createElement('div');
		banner.className = 'cookie-banner';
		banner.setAttribute('role', 'dialog');
		banner.setAttribute('aria-label', 'Zgoda na pliki cookies');
		banner.innerHTML = '<p>Ta strona używa plików cookies Google Analytics do zbierania anonimowych statystyk odwiedzin. Włączę je tylko za Twoją zgodą. Szczegóły: <a href="' + (document.body.getAttribute('data-privacy') || '#') + '">Polityka prywatności</a>.</p><div class="cookie-actions"><button type="button" class="btn sm primary" data-a="y">Akceptuję</button><button type="button" class="btn sm" data-a="n">Odrzucam</button></div>';
		$('[data-a="y"]', banner).addEventListener('click', function () { decide('granted'); });
		$('[data-a="n"]', banner).addEventListener('click', function () { decide('denied'); });
		document.body.appendChild(banner);
	}
	var st = read();
	if (st === 'granted') loadGA(); else if (st !== 'denied') showBanner();
	var cs = $('#cookie-settings');
	if (cs) cs.addEventListener('click', showBanner);

	// Pomiar kliknięć w kontakt (tylko gdy Analytics jest włączone po zgodzie).
	document.addEventListener('click', function (e) {
		var a = e.target.closest ? e.target.closest('[data-track]') : null;
		if (a && window.gtag) window.gtag('event', 'contact_click', { method: a.getAttribute('data-track'), page_path: location.pathname });
	});
})();
