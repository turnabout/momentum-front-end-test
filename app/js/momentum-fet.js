/**
 * Module containing the code for the Momentum Front End app.
 * @param {Object} helper - The 'momentumHelperModule' helper module public api.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule(helper) {

	// Store references to frequently reused dom elements
	var elems = {
		loginField: document.getElementById('login-field'),
		loginAlert: document.getElementById('login-alert'),
		loginBox: document.getElementById('login-box'),
		loginBtn: document.getElementById('login-btn'),
		loginPage: document.getElementById('login-page'),
		dashboard: document.getElementById('dashboard'),
		dashboardSecPage: document.getElementById('secondary-dbp'),
		dashboardMenuItems:document.querySelectorAll('.dashboard-menu-item')
	};

	// Store all different requests to use to different pages
	var requests = {
		'userPosts': function (userId) { return `posts?userId=${userId}`; },
		'userAlbums': function (userId) { return `albums?userId=${userId}`; },
		'allPosts': function () { return `posts`; },
		'postComments': function (postId) { return `comments?postId=${postId}`; },
	};

	var user = {};

	/**
	 * Initialize all the things!
	 * @param {String} url - Base URL from which the API data is fetched.
	 */
	 function init(url) {
	 	// Set the api url
	 	helper.setApiUrl(url);

	 	// Add events to each dashboard menu items which request appropriate content and renders a page with it
	 	for (var i = 0; i < elems.dashboardMenuItems.length; i++) {
	 		helper.addEvent(elems.dashboardMenuItems[i], 'click', handleDashboardMenuClick);
	 	}

	 	// Add login/out events
	 	helper.addEvent(document.getElementById('login'), 'submit', login);
	 	helper.addEvent(document.getElementById('logout'), 'click', logout);
	 }

	/**
	 * Function fired when a dashboard menu item is clicked.
	 * @param {Event} event
	 */
	function handleDashboardMenuClick (event) {

		// If page is already busy being processed/animated or request doesn't exist, don't do anything
		if (helper.isElement(elems.dashboardSecPage, ['processing', 'animating']) || !(this.dataset.req in requests)) {
			return;
		}

		// Get request attached to this menu item
		var request = requests[this.dataset.req](user.id);


		// Slide the second page in
		elems.dashboardSecPage.dataset.processing = true;
		elems.dashboardSecPage.dataset.animating = true;
		elems.dashboardSecPage.classList.add('active');

		if (elems.dashboardSecPage.dataset.active) {
			helper.animateElem(elems.dashboardSecPage, ['slideOutLeft', 'fast'], function () {
				helper.animateElem(elems.dashboardSecPage, ['slideInLeft'], function () {
					elems.dashboardSecPage.dataset.animating = false;
				});
			});
		} else {
			helper.animateElem(elems.dashboardSecPage, ['fadeInLeft'], function () {
				elems.dashboardSecPage.dataset.animating = false;
			});
		}

		// For knowing which animation to use
		elems.dashboardSecPage.dataset.active = true;

		// Request the content and render page with it
		helper.getApiData(request, function (result) {
			renderDashboardPage(result, request);
		});
	}

	/**
	 * Attempt to log in user on form submit.
	 * @param {Event} event - The event.
	 */
	function login(event) {

		var username = elems.loginField.value;

		if(username) {
			// Disable the form
			elems.loginField.setAttribute('disabled', 'disabled');
			elems.loginBtn.setAttribute('disabled', 'disabled');

			helper.getApiData(`users?username=${username}`, function processResult(result) {

				if(result.length > 0) {
					// Username exists, clear any previous error and show the "dashboard"
					user = result[0];
					elems.loginAlert.classList.remove('active');
					elems.loginBox.classList.remove('error');
					
					// Fade dashboard in
					elems.dashboard.classList.add('active');
					helper.animateElem(elems.dashboard, ['fadeInLeft']);

					// Fade login page out
					helper.animateElem(elems.loginPage, ['fadeOut'], function () {
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
		user = {};

		// Prepare login page to be shown again
		elems.loginBtn.removeAttribute('disabled', 'disabled');
		elems.loginField.removeAttribute('disabled', 'disabled');
		elems.loginField.value = '';

		// Fade dashboard out
		helper.animateElem(elems.dashboard, ['fadeOutLeft'], function () {
			elems.dashboard.classList.remove('active');
		});

		// Fade login page in
		elems.loginPage.classList.add('active');

		helper.animateElem(elems.loginPage, ['fadeIn'], function () {
			elems.loginField.focus();				
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


		elems.dashboardSecPage.dataset.processing = false;
	}

	return {
		'init' : init,
		'login' : login
	};

})(momentumHelperModule);