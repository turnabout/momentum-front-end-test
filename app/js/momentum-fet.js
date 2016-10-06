/**
 * Module containing the code for the Momentum Front End app.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule() {
	
	var user = {};
	var apiUrl = '';

	// Store all different requests to use to different pages
	var requests = {
		'userPosts': function (userId) { return `posts?userId=${userId}`; },
		'userAlbums': function (userId) { return `albums?userId=${userId}`; },
		'allPosts': function () { return `posts`; },
		'postComments': function (postId) { return `comments?postId=${postId}`; },
	};


	/**
	 * Initialize everything.
	 * @param {String} url - Base URL from which the API info is fetched.
	 */
	 function init(url) {
	 	var dashboardMenuItems = document.querySelectorAll('.dashboard-menu-item');
	 	apiUrl = url;

	 	// Add events to each dashboard menu items which request appropriate content and renders a page with it
	 	for (var i = 0; i < dashboardMenuItems.length; i++) {

	 		addEvent(dashboardMenuItems[i], 'click', function () {
				// Get request attached to this menu item
				var request = requests[this.dataset.req](user.id);

				// Request the content and render page with it
				getJSON(request, function (result) {
					renderDashboardPage(result, request);
				});
	 		});

	 	}

	 	// Add login/out events
	 	addEvent(document.getElementById('login'), 'submit', login);
	 	addEvent(document.getElementById('logout'), 'click', logout);
	 }

	/**
	 * Get JSON data from the API.
	 * @param {String} request - The request.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function getJSON(request, callback) {
		var oReq = new XMLHttpRequest();

		addEvent(oReq, 'load', function returnParsedJSON() {
			callback( JSON.parse(this.responseText) );
		});

		oReq.open('GET', `${apiUrl}/${request}`);
		oReq.send();
	}

	/**
	 * Attempt to log in user on form submit.
	 * @param {Event} event - The event.
	 */
	function login(event) {

		// Store references to used elements
		var elems = {
			loginField: document.getElementById('login-field'),
			loginAlert: document.getElementById('login-alert'),
			loginBox: document.getElementById('login-box'),
			loginBtn: document.getElementById('login-btn'),
			loginPage: document.getElementById('login-page'),
			dashboard: document.getElementById('dashboard')
		};

		var username = elems.loginField.value;

		if(username) {
			// Disable the form
			elems.loginField.setAttribute('disabled', 'disabled');
			elems.loginBtn.setAttribute('disabled', 'disabled');

			getJSON(`users?username=${username}`, function processResult(result) {

				if(result.length > 0) {
					// Username exists, clear any previous error and show the "dashboard"
					user = result[0];
					elems.loginAlert.classList.remove('active');
					elems.loginBox.classList.remove('error');
					
					// Fade dashboard in
					elems.dashboard.classList.add('active');
					animateElem(elems.dashboard, 'fadeInLeft');

					// Fade login page out
					animateElem(elems.loginPage, 'fadeOut', function () {
						elems.loginPage.classList.remove('active');
						elems.dashboard.classList.add('active');
					});

				} else {
					// Username does not exist, display error message
					elems.loginAlert.innerHTML = `Username "${username}" does not exist.`;
					elems.loginAlert.classList.add('active');
					elems.loginBox.classList.add('error');

					// Enable form and focus back on field
					elems.loginField.removeAttribute('disabled', 'disabled');
					elems.loginBtn.removeAttribute('disabled', 'disabled');
					elems.loginField.focus();
				}
				
			});
		}
		event.preventDefault();
	}

	/**
	* Log the user out and return to login page.
	* @param {Event} event - The event.
	*/
	function logout(event) {
		var dashboard = document.getElementById('dashboard'),
			loginPage = document.getElementById('login-page'),
			loginField = document.getElementById('login-field'),
			loginBtn = document.getElementById('login-btn');

		user = {};

		// Prepare login page to be shown again
		loginBtn.removeAttribute('disabled', 'disabled');
		loginField.removeAttribute('disabled', 'disabled');
		loginField.value = '';

		// Fade dashboard out
		animateElem(dashboard, 'fadeOutLeft', function () {
			dashboard.classList.remove('active');
		});

		// Fade login page in
		loginPage.classList.add('active');

		animateElem(loginPage, 'fadeIn', function () {
			loginField.focus();				
		});

		event.preventDefault();
	}

	/**
	* Render a dashboard page with some passed-in content.
	* @param {Array} content - Content to render in the page.
	* @param {String} request - The type of request, so we know what content should be rendered, how.
	*/
	function renderDashboardPage(content, request) {
		console.log(content);
		console.log(request);
	}

	/**
	 * Animate an element.
	 * @param {Object} element - The element to fade.
	 * @param {String} animationName - The name of the animation. Translates to a css class.
	 * @param {Function} callback - Function to call once fade is done.
	 */
	function animateElem(element, transitionName, callback) {
		callback = callback || function() {};
		element.classList.add(transitionName, 'animated');

		addEventOnce(element, 'animationend', function afterAnimationEnd(e) {
			element.classList.remove(transitionName, 'animated');
			callback();
		});

		/**
		 * Add a one-time event listener.
		 * @param {Object} target - The target element.
		 * @param {String} type - The type of the event.
		 * @param {Function} listener - The listener to attach to the event.
		 */
		function addEventOnce(target, type, listener) {
			addEvent(target, type, function fn(event) {
				target.removeEventListener(type, fn);
				listener(event);
			});
		}
	}

	/**
	 * 'addEventListener' polyfill.
	 * @param {Object} element - The element to add the event listener to.
	 * @param {Event} event - The event type.
	 * @param {Function} callback - The event listener function callback.
	 */
	function addEvent(element, event, callback) {
		if (element.addEventListener) {
			element.addEventListener(event, callback, false);
		} else {
			element.attachEvent('on'+event, callback);
		}
	}

	return {
		'getJSON' : getJSON,
		'init' : init,
		'login' : login
	};

})();