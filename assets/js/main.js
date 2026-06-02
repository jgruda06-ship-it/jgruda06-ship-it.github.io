/*
	Paradigm Shift by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			default:   ['1681px',   null       ],
			xlarge:    ['1281px',   '1680px'   ],
			large:     ['981px',    '1280px'   ],
			medium:    ['737px',    '980px'    ],
			small:     ['481px',    '736px'    ],
			xsmall:    ['361px',    '480px'    ],
			xxsmall:   [null,       '360px'    ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Hack: Enable IE workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Mobile?
		if (browser.mobile)
			$body.addClass('is-mobile');

	// Scrolly.
		$('.scrolly')
			.scrolly({
				offset: 100
			});

	// Top nav menu toggle.
		var $menuToggle = $('#menu-toggle'),
			$siteMenu = $('#site-menu'),
			$topNav = $('#top-nav');

		if ($menuToggle.length > 0 && $siteMenu.length > 0) {

			$menuToggle.on('click', function(event) {
				event.preventDefault();
				event.stopPropagation();

				var isOpen = $topNav.toggleClass('menu-visible').hasClass('menu-visible');

				$menuToggle.attr('aria-expanded', isOpen ? 'true' : 'false');
			});

			$siteMenu.find('a').on('click', function() {
				$topNav.removeClass('menu-visible');
				$menuToggle.attr('aria-expanded', 'false');
			});

			$window.on('click', function(event) {
				if (!$(event.target).closest('#top-nav').length) {
					$topNav.removeClass('menu-visible');
					$menuToggle.attr('aria-expanded', 'false');
				}
			});

			$window.on('keydown', function(event) {
				if (event.keyCode == 27) {
					$topNav.removeClass('menu-visible');
					$menuToggle.attr('aria-expanded', 'false');
				}
			});
		}

	// Contact form validation and sending.
		var $contactForm = $('#contact-form'),
			$status = $('#contact-form-status'),
			formStatusTimer = null;

		if ($contactForm.length > 0) {
			$contactForm.on('submit', function(event) {
				event.preventDefault();

				var name = $.trim($('#contact-name').val()),
					email = $.trim($('#contact-email').val()),
					message = $.trim($('#contact-message').val()),
					emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

				$status.removeClass('error success');

				if (!name || !email || !message) {
					$status.addClass('error').text('Uzupełnij wszystkie pola formularza.');
					return;
				}

				if (!emailRegex.test(email)) {
					$status.addClass('error').text('Podaj poprawny adres e-mail.');
					return;
				}

				var $submitButton = $contactForm.find('button[type="submit"]');

				if (formStatusTimer) {
					clearTimeout(formStatusTimer);
					formStatusTimer = null;
				}

				$submitButton.prop('disabled', true).text('Wysyłanie...');
				$status.text('Wysyłanie wiadomości...');

				fetch('https://formsubmit.co/ajax/kontakt@jakubgruda.pl', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					},
					body: JSON.stringify({
						name: name,
						email: email,
						message: message,
						_subject: 'Zapytanie ze strony - ' + name,
						_template: 'table',
						_captcha: 'false'
					})
				})
					.then(function(response) {
						if (!response.ok)
							throw new Error('HTTP ' + response.status);

						return response.json();
					})
					.then(function() {
						$contactForm[0].reset();
						$status
							.removeClass('error')
							.addClass('success')
							.text('Dziękuję! Wiadomość została wysłana. Odpowiem najszybciej, jak to możliwe.');

						formStatusTimer = setTimeout(function() {
							$status.removeClass('success error').text('');
							formStatusTimer = null;
						}, 9000);
					})
					.catch(function() {
						$status
							.removeClass('success')
							.addClass('error')
							.text('Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na kontakt@jakubgruda.pl.');
					})
					.finally(function() {
						$submitButton.prop('disabled', false).text('Wyślij wiadomość');
					});
			});
		}

	// Google reviews: show top 3 best rated.
		var $googleReviews = $('#google-reviews');

		function escapeHtml(value) {
			return String(value)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		}

		function renderReviewsStatus(message) {
			if ($googleReviews.length === 0)
				return;

			$googleReviews.html('<p class="reviews-status">' + escapeHtml(message) + '</p>');
		}

		async function loadGoogleReviews() {
			if ($googleReviews.length === 0)
				return;

		var siteConfig = window.SITE_CONFIG || {},
				reviewsConfig = siteConfig.googleReviews || {},
				apiKey = $.trim(reviewsConfig.apiKey || ''),
			placeId = $.trim(reviewsConfig.placeId || ''),
			query = $.trim(reviewsConfig.query || '');

		if (!apiKey) {
			renderReviewsStatus('Ustaw SITE_CONFIG.googleReviews.apiKey, aby pobierać opinie z Google.');
				return;
			}

			renderReviewsStatus('Ładowanie opinii Google...');

			try {
			if (!placeId && query) {
				var searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Goog-Api-Key': apiKey,
						'X-Goog-FieldMask': 'places.id'
					},
					body: JSON.stringify({
						textQuery: query,
						languageCode: 'pl'
					})
				});

				if (!searchResponse.ok)
					throw new Error('SEARCH_HTTP ' + searchResponse.status);

				var searchData = await searchResponse.json();

				if (searchData.places && searchData.places.length > 0 && searchData.places[0].id)
					placeId = searchData.places[0].id;
			}

			if (!placeId) {
				renderReviewsStatus('Nie znaleziono Place ID. Uzupełnij placeId ręcznie lub doprecyzuj query w SITE_CONFIG.');
				return;
			}

			var endpoint = 'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId) + '?languageCode=pl',
					response = await fetch(endpoint, {
						headers: {
							'X-Goog-Api-Key': apiKey,
							'X-Goog-FieldMask': 'displayName,reviews'
						}
					});

				if (!response.ok)
					throw new Error('HTTP ' + response.status);

				var data = await response.json(),
					reviews = Array.isArray(data.reviews) ? data.reviews : [];

				reviews = reviews
					.filter(function(review) {
						return review && typeof review.rating === 'number' && review.text && review.text.text;
					})
					.sort(function(a, b) {
						var ratingDiff = b.rating - a.rating;

						if (ratingDiff !== 0)
							return ratingDiff;

						var dateA = Date.parse(a.publishTime || '') || 0,
							dateB = Date.parse(b.publishTime || '') || 0;

						return dateB - dateA;
					})
					.slice(0, 3);

				if (reviews.length === 0) {
					renderReviewsStatus('Brak dostępnych opinii do wyświetlenia.');
					return;
				}

				var reviewsHtml = reviews.map(function(review) {
					var author = review.authorAttribution && review.authorAttribution.displayName ? review.authorAttribution.displayName : 'Klient',
						ratingStars = '★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating))));

					return (
						'<blockquote>' +
							'<p>"' + escapeHtml(review.text.text) + '"</p>' +
							'<footer>- ' + escapeHtml(author) + ', ocena: ' + ratingStars + '</footer>' +
						'</blockquote>'
					);
				}).join('');

				$googleReviews.html(reviewsHtml);
			}
			catch (error) {
				renderReviewsStatus('Nie udało się pobrać opinii Google. Sprawdź API key, Place ID i ustawienia domeny klucza.');
			}
		}

		loadGoogleReviews();

	// Polyfill: Object fit.
		if (!browser.canUse('object-fit')) {

			$('.image[data-position]').each(function() {

				var $this = $(this),
					$img = $this.children('img');

				// Apply img as background.
					$this
						.css('background-image', 'url("' + $img.attr('src') + '")')
						.css('background-position', $this.data('position'))
						.css('background-size', 'cover')
						.css('background-repeat', 'no-repeat');

				// Hide img.
					$img
						.css('opacity', '0');

			});

			$('.gallery > a').each(function() {

				var $this = $(this),
					$img = $this.children('img');

				// Apply img as background.
					$this
						.css('background-image', 'url("' + $img.attr('src') + '")')
						.css('background-position', 'center')
						.css('background-size', 'cover')
						.css('background-repeat', 'no-repeat');

				// Hide img.
					$img
						.css('opacity', '0');

			});

		}

	// Gallery.
		$('.gallery')
			.on('click', 'a', function(event) {

				var $a = $(this),
					$gallery = $a.parents('.gallery'),
					$modal = $gallery.children('.modal'),
					$modalImg = $modal.find('img'),
					href = $a.attr('href');

				// Not an image? Bail.
					if (!href.match(/\.(jpg|gif|png|mp4)$/))
						return;

				// Prevent default.
					event.preventDefault();
					event.stopPropagation();

				// Locked? Bail.
					if ($modal[0]._locked)
						return;

				// Lock.
					$modal[0]._locked = true;

				// Set src.
					$modalImg.attr('src', href);

				// Set visible.
					$modal.addClass('visible');

				// Focus.
					$modal.focus();

				// Delay.
					setTimeout(function() {

						// Unlock.
							$modal[0]._locked = false;

					}, 600);

			})
			.on('click', '.modal', function(event) {

				var $modal = $(this),
					$modalImg = $modal.find('img');

				// Locked? Bail.
					if ($modal[0]._locked)
						return;

				// Already hidden? Bail.
					if (!$modal.hasClass('visible'))
						return;

				// Stop propagation.
					event.stopPropagation();

				// Lock.
					$modal[0]._locked = true;

				// Clear visible, loaded.
					$modal
						.removeClass('loaded')

				// Delay.
					setTimeout(function() {

						$modal
							.removeClass('visible')

						setTimeout(function() {

							// Clear src.
								$modalImg.attr('src', '');

							// Unlock.
								$modal[0]._locked = false;

							// Focus.
								$body.focus();

						}, 475);

					}, 125);

			})
			.on('keypress', '.modal', function(event) {

				var $modal = $(this);

				// Escape? Hide modal.
					if (event.keyCode == 27)
						$modal.trigger('click');

			})
			.on('mouseup mousedown mousemove', '.modal', function(event) {

				// Stop propagation.
					event.stopPropagation();

			})
			.prepend('<div class="modal" tabIndex="-1"><div class="inner"><img src="" /></div></div>')
				.find('img')
					.on('load', function(event) {

						var $modalImg = $(this),
							$modal = $modalImg.parents('.modal');

						setTimeout(function() {

							// No longer visible? Bail.
								if (!$modal.hasClass('visible'))
									return;

							// Set loaded.
								$modal.addClass('loaded');

						}, 275);

					});

})(jQuery);