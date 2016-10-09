/**
 * Module containing the main code for the Momentum Front End app.
 * @param {Object} helper - Helper functions module.
 * @param {Object} app - App related functions.
 * @param {Object} dbp - Module to render dashboard pages.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule(helper, app, dbp) {

	// Object containing references to static, reused DOM elements
	var elems = helper.getAppElems();

	// Store all different requests to use to different pages
	var requests = {
		'userPosts': function (userId) { 
			return {
				'query' : `posts?userId=${userId}`,
				'titleQuery' : `users/${userId}`,
				'type' : 'posts',
			};
		},
		'userAlbums': function (userId) { 
			return {
				'query' : `albums?userId=${userId}`,
				'titleQuery' : `users/${userId}`,
				'type' : 'album',
			};
		},
		'allPosts': function (userId) { 
			return {
				'query' : `posts`,
				'title' : 'All Posts',
				'type' : 'posts',
			};
		},
		'post': function (postId) { 
			return {
				'query' : `posts/${postId}`,
				'type' : 'post',
			};
		},
		'user': function (userId) { 
			return {
				'query' : `users/${userId}`,
				'type' : 'user',
			};
		},
	};

	// The current user
	var user = {};

	var pageTitleBase = document.title;

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
	 	helper.addEvent(document.getElementById('login'), 'submit', authenticate);
	 	helper.addEvent(document.getElementById('logout'), 'click', logout);

	 	// Secondary dbp previous/next buttons
	 	helper.addEvent(elems.contentBack, 'click', dbpPreviousClick);
	 	helper.addEvent(elems.contentNext, 'click', dbpNextClick);
	 }

	/**
	 * Function fired when a dashboard menu item is clicked.
	 * @param {Event} event
	 */
	function handleDashboardMenuClick(event) {

		// If already busy being processed/animated or request doesn't exist, don't do anything
		if (helper.isElem(elems.dashboardContentPage, ['processing', 'animating']) || !(this.dataset.req in requests)) {
			return;
		}

		// Reset dbps to their initial state
		resetDbpState();

		// If button clicked already active, slide page back in
		if (this.getAttribute('id') === 'active-dbp-btn') {
			transitionDashboardPage('slideIn');
			elems.dashboardContentPage.dataset.active = false;
			this.classList.remove('active');
			this.setAttribute('id', '');
			this.blur();
			return;
		}

		// Set any other active button as inactive
		if (document.getElementById('active-dbp-btn')) {
			let alreadyActive = document.getElementById('active-dbp-btn');
			alreadyActive.setAttribute('id', '');
			alreadyActive.classList.remove('active');
		}

		this.setAttribute('id', 'active-dbp-btn');
		this.classList.add('active');

		// Get request attached to this menu item
		var request = requests[this.dataset.req](user.id);

		// Slide the second page in
		elems.dashboardContentPage.dataset.processing = true;

		if (elems.dashboardContentPage.dataset.active === 'true') {
			transitionDashboardPage('slideInOut');
		} else {
			transitionDashboardPage('slideOut');
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function (result) {
			renderDashboardPage(result, request, elems.dbpContentPageOne);
		});
	}

	/**
	 * Transition the dashboard page.
	 * @param {String} type - The type of transition.
	 * @param {Function} callback - Function to call after transition is over.
	 */
	function transitionDashboardPage(type, callback) {
		elems.dashboardContentPage.dataset.animating = true;
		elems.dashboardContentPage.classList.add('active');
		callback = callback || function(){};

		switch (type) {
		case 'slideIn':
			helper.animateElem(elems.dashboardContentPage, ['slideOutLeft'], function () {
				elems.dashboardContentPage.dataset.animating = false;
				elems.dashboardContentPage.dataset.active = false;
				elems.dashboardContentPage.classList.remove('active');

				// Sliding back in, so reset head title
				document.title = pageTitleBase;
				callback();
			});
			break;

		case 'slideOut':
			helper.animateElem(elems.dashboardContentPage, ['fadeInLeft'], function () {
				elems.dashboardContentPage.dataset.animating = false;
				elems.dashboardContentPage.dataset.active = true;
				callback();
			});
			break;

		case 'slideInOut':
			helper.animateElem(elems.dashboardContentPage, ['slideOutLeft', 'fast'], function () {
				helper.animateElem(elems.dashboardContentPage, ['slideInLeft'], function () {
					elems.dashboardContentPage.dataset.animating = false;
					callback();
				});
			});
			break;

		default:
			break;
		}
	}

	/**
	 * Handle click on secondary DBP back button.
	 * @param {Event} event - The event.
	 */
	function dbpPreviousClick(event) {
		var currentContentElem = app.getActiveContentPage();

		// First page, so slide dbp back in
		if (currentContentElem.dataset.pagenum === '1') {
			transitionDashboardPage('slideIn');
			elems.dashboardContentPage.dataset.active = false;

			if (document.getElementById('active-dbp-btn')) {
				var activeMenuBtn = document.getElementById('active-dbp-btn');
				activeMenuBtn.classList.remove('active');
				activeMenuBtn.setAttribute('id', '');
				activeMenuBtn.blur();
			}
			return;
		}

		app.dbpChangePage('previous');
	}

	/**
	 * Handle click on secondary DBP next button.
	 * @param {Event} event - The event.
	 */
	function dbpNextClick(event) {
		// Only change to next page if it exists
		if (helper.getElemNextOf(app.getActiveContentPage()) != null) {
			app.dbpChangePage('next');
		}
	}

	/**
	 * Authenticate user on form submit.
	 * @param {Event} event - The event.
	 */
	function authenticate(event) {
		var username = elems.loginField.value;

		if (username) {
			// Disable the form
			elems.loginField.setAttribute('disabled', 'disabled');
			elems.loginBtn.setAttribute('disabled', 'disabled');

			helper.getApiData(`users?username=${username}`, function processResult(result) {

				if (result.length > 0) {
					user = result[0];
					login();
				} else {
					displayError(`Username "${username}" does not exist.`);
				}
				
			});
		}
		event.preventDefault();

		/**
		 * Log user in.
		 */
		function login() {
			// Username exists, clear any previous error and show the "dashboard"
			elems.loginAlert.classList.remove('active');
			elems.loginBox.classList.remove('error');

			elems.dashboardContentPage.dataset.active = false;
			elems.dashboardContentPage.classList.remove('active');

			// Fade dashboard in
			elems.dashboard.classList.add('active');
			helper.animateElem(elems.dashboard, ['fadeInLeft']);

			// Fade login page out
			helper.animateElem(elems.loginPage, ['fadeOut'], function () {
				elems.loginPage.classList.remove('active');
				elems.dashboard.classList.add('active');
			});
		}

		/**
		 * Display an error message on the login page after trying to authenticate the user.
		 * @param {String} message - The message to display.
		 */
		 function displayError(message) {
			elems.loginAlert.innerHTML = `Username "${username}" does not exist.`;
			elems.loginAlert.classList.add('active');
			elems.loginBox.classList.add('error');

			// Enable form and focus back on field
			elems.loginField.removeAttribute('disabled', 'disabled');
			elems.loginBtn.removeAttribute('disabled', 'disabled');
			elems.loginField.focus();
		 }
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

		// Reset the dashboard state
		resetDashboardState();

		helper.animateElem(elems.loginPage, ['fadeIn'], function () {
			elems.loginField.focus();				
		});
		event.preventDefault();
	}

	/**
	 * Reset the entire dashboard state and remove all content from it.
	 */
	function resetDashboardState() {

		// Reset active db button
		if (document.getElementById('active-dbp-btn')) {
			document.getElementById('active-dbp-btn').classList.remove('active');
			document.getElementById('active-dbp-btn').setAttribute('id', '');
		}

		// Reset head title
		document.title = pageTitleBase;

		// Reset dbps to their initial state
		resetDbpState();
	}

	/**
	 * Reset the state of dbp to the original default one. Launch on tab change.
	 */
	function resetDbpState() {

		// Remove all additional content pages
		while (helper.getElemNextOf(elems.dbpContentPageOne) != null) {
			let nextElem = helper.getElemNextOf(elems.dbpContentPageOne);
			nextElem.parentElement.removeChild(nextElem);
		}

		// Make first content page active
		elems.dbpContentPageOne.dataset.currentcontent = true;

		// Reset bottom buttons states
		elems.contentNext.disabled = true;
		
		// Empty the first content page
		elems.dashboardContentTitle.innerHTML = '';
		helper.emptyElem(elems.dbpContentPageOne);
	}

	return {
		'init' : init
	};

})(momentumHelperModule, momentumFunctionsModule, momentumTemplatesModule);