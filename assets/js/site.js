/*
	Jakub Gruda Fotografia – skrypty strony (filtry portfolio, zgoda na cookies).
	Bez zależności od jQuery.
*/

(function() {

	'use strict';

	// Filtry portfolio.
		var filterButtons = document.querySelectorAll('.filter-btn'),
			galleryItems = document.querySelectorAll('.gallery > a[data-cat]');

		Array.prototype.forEach.call(filterButtons, function(button) {
			button.addEventListener('click', function() {
				var filter = button.getAttribute('data-filter');

				Array.prototype.forEach.call(filterButtons, function(other) {
					var active = (other === button);
					other.classList.toggle('is-active', active);
					other.setAttribute('aria-pressed', active ? 'true' : 'false');
				});

				Array.prototype.forEach.call(galleryItems, function(item) {
					var show = (filter === 'all' || item.getAttribute('data-cat') === filter);
					if (show)
						item.removeAttribute('hidden');
					else
						item.setAttribute('hidden', '');
				});
			});
		});

	// Zgoda na cookies i Google Analytics (ładowany dopiero po zgodzie).
		var STORAGE_KEY = 'cookie-consent',
			gaId = document.body.getAttribute('data-ga'),
			banner = null,
			gaLoaded = false;

		function readConsent() {
			try {
				return window.localStorage.getItem(STORAGE_KEY);
			}
			catch (e) {
				return null;
			}
		}

		function saveConsent(value) {
			try {
				window.localStorage.setItem(STORAGE_KEY, value);
			}
			catch (e) {}
		}

		function loadAnalytics() {
			if (gaLoaded || !gaId)
				return;

			gaLoaded = true;

			var script = document.createElement('script');
			script.async = true;
			script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
			document.head.appendChild(script);

			window.dataLayer = window.dataLayer || [];
			window.gtag = function() { window.dataLayer.push(arguments); };
			window.gtag('js', new Date());
			window.gtag('config', gaId);
		}

		function removeAnalyticsCookies() {
			var names = document.cookie.split(';'),
				hosts = [location.hostname, '.' + location.hostname, '.' + location.hostname.replace(/^www\./, '')];

			names.forEach(function(cookie) {
				var name = cookie.split('=')[0].trim();

				if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
					hosts.forEach(function(host) {
						document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + host;
					});
					document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
				}
			});
		}

		function closeBanner() {
			if (banner && banner.parentNode)
				banner.parentNode.removeChild(banner);

			banner = null;
		}

		function decide(value) {
			saveConsent(value);
			closeBanner();

			if (value === 'granted')
				loadAnalytics();
			else
				removeAnalyticsCookies();
		}

		function showBanner() {
			if (banner)
				return;

			banner = document.createElement('div');
			banner.className = 'cookie-banner';
			banner.setAttribute('role', 'dialog');
			banner.setAttribute('aria-label', 'Zgoda na pliki cookies');
			banner.innerHTML =
				'<p>Ta strona używa plików cookies Google Analytics do zbierania anonimowych statystyk odwiedzin. ' +
				'Włączę je tylko za Twoją zgodą. Szczegóły: <a href="polityka-prywatnosci.html">Polityka prywatności</a>.</p>' +
				'<div class="cookie-actions">' +
					'<button type="button" class="cookie-accept primary">Akceptuję</button>' +
					'<button type="button" class="cookie-reject">Odrzucam</button>' +
				'</div>';

			banner.querySelector('.cookie-accept').addEventListener('click', function() { decide('granted'); });
			banner.querySelector('.cookie-reject').addEventListener('click', function() { decide('denied'); });

			document.body.appendChild(banner);
		}

		var stored = readConsent();

		if (stored === 'granted')
			loadAnalytics();
		else if (stored !== 'denied')
			showBanner();

		var settings = document.getElementById('cookie-settings');

		if (settings)
			settings.addEventListener('click', showBanner);

})();
