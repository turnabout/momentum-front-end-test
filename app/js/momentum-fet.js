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
		dashboardMenuItems:document.querySelectorAll('.dashboard-menu-item'),
		dashboardSecPage: document.getElementById('secondary-dbp'),
		dashboardSecPageTitle: document.getElementById('dbp-2-title'),
		dbp2Content: document.getElementById('dbp2-content-1'),
		dbp2ContentInner: document.getElementById('dbp2-content-1-inner'),
		dbp2Previous: document.getElementById('dbp2-previous'),
		dbp2Next: document.getElementById('dbp2-next')
	};

	// Store all different requests to use to different pages
	var requests = {
		'userPosts': function (userId) { 
			return {
				'query' : `posts?userId=${userId}`,
				'name' : 'Your Posts',
				'type' : 'posts',
			};
		},
		'userAlbums': function (userId) { 
			return {
				'query' : `albums?userId=${userId}`,
				'name' : 'Your Album',
				'type' : 'album',
			};
		},
		'allPosts': function (userId) { 
			return {
				'query' : `posts`,
				'name' : 'All Posts',
				'type' : 'posts',
			};
		},
		'post': function (postId) { 
			return {
				'query' : `posts?id=${postId}`,
				'name' : 'Post',
				'type' : 'post',
			};
		},
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
	 	helper.addEvent(document.getElementById('login'), 'submit', authenticate);
	 	helper.addEvent(document.getElementById('logout'), 'click', logout);

	 	// Secondary dbp previous/next buttons
	 	helper.addEvent(elems.dbp2Previous, 'click', dbpPreviousClick);
	 	helper.addEvent(elems.dbp2Next, 'click', dbpNextClick);
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

		// If button clicked already active, slide page back in
		if (this.getAttribute('id') === 'active-dbp-btn') {
			transitionDashboardPage('slideIn');
			elems.dashboardSecPage.dataset.active = false;
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
		elems.dashboardSecPage.dataset.processing = true;

		if (elems.dashboardSecPage.dataset.active === 'true') {
			transitionDashboardPage('slideInOut');
		} else {
			transitionDashboardPage('slideOut');
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function (result) {
			renderDashboardPage(result, request, elems.dbp2ContentInner);
		});
	}

	/**
	 * Transition the dashboard page.
	 * @param {String} type - The type of transition.
	 * @param {Function} callback - Function to call after transition is over.
	 */
	function transitionDashboardPage(type, callback) {
		elems.dashboardSecPage.dataset.animating = true;
		elems.dashboardSecPage.classList.add('active');
		callback = callback || function(){};

		switch (type) {
			case 'slideIn':
				helper.animateElem(elems.dashboardSecPage, ['slideOutLeft'], function () {
					elems.dashboardSecPage.dataset.animating = false;
					elems.dashboardSecPage.dataset.active = false;
					elems.dashboardSecPage.classList.remove('active');
					callback();
				});
				break;

			case 'slideOut':
				helper.animateElem(elems.dashboardSecPage, ['fadeInLeft'], function () {
					elems.dashboardSecPage.dataset.animating = false;
					elems.dashboardSecPage.dataset.active = true;
					callback();
				});
				break;

			case 'slideInOut':
				helper.animateElem(elems.dashboardSecPage, ['slideOutLeft', 'fast'], function () {
					helper.animateElem(elems.dashboardSecPage, ['slideInLeft'], function () {
						elems.dashboardSecPage.dataset.animating = false;
						callback();
					});
				});
				break;
		}
	}

	/**
	 * Handle click on secondary DBP back button.
	 * @param {Event} event - The event.
	 */
	function dbpPreviousClick(event) {
		var currentContentElem = getCurrentlyShownDbpContent();

		// First page, so slide dbp back in
		if (currentContentElem.dataset.pagenum === '1') {
			transitionDashboardPage('slideIn');
			elems.dashboardSecPage.dataset.active = false;

			if (document.getElementById('active-dbp-btn')) {
				var activeMenuBtn = document.getElementById('active-dbp-btn');
				activeMenuBtn.classList.remove('active');
				activeMenuBtn.setAttribute('id', '');
				activeMenuBtn.blur();
			}
			return;
		}

		dbpChangePage('previous');
	}

	/**
	 * Handle click on secondary DBP next button.
	 * @param {Event} event - The event.
	 */
	function dbpNextClick(event) {
		console.log('we in there');
	}

	/**
	 * Get the element of the currently displayed dbp content.
	 * @return {Object||Boolean} element - The element if one is shown, or false.
	 */
	function getCurrentlyShownDbpContent() {
		for (var elem of helper.getElemsWithAttr('data-currentcontent')) {
			if (helper.isElement(elem, 'currentcontent')) {
				return elem;
			}
		}
		return false;
	}

	/**
	 * Authenticate user on form submit.
	 * @param {Event} event - The event.
	 */
	function authenticate(event) {

		var username = elems.loginField.value;

		if(username) {
			// Disable the form
			elems.loginField.setAttribute('disabled', 'disabled');
			elems.loginBtn.setAttribute('disabled', 'disabled');

			helper.getApiData(`users?username=${username}`, function processResult(result) {

				if(result.length > 0) {
					user = result[0];
					login();
				} else {
					// Username does not exist, display error message
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
			
			// Make sure db is set to default state
			if(document.getElementById('active-dbp-btn')) {
				document.getElementById('active-dbp-btn').classList.remove('active');
				document.getElementById('active-dbp-btn').setAttribute('id', '');
			}

			elems.dashboardSecPage.dataset.active = false;
			elems.dashboardSecPage.classList.remove('active');

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

		helper.animateElem(elems.loginPage, ['fadeIn'], function () {
			elems.loginField.focus();				
		});
		event.preventDefault();
	}

	/**
	* Render a dashboard page with some passed-in content.
	* @param {Array} content - Content to render in the page.
	* @param {String} request - Info on the request, including the type, used to select the correct render.
	* @param {Object} parent - The parent element in which the dashboard page should be rendered.
	* @param {Function} callback - Function to call once page is finished rendering.
	*/
	function renderDashboardPage(content, request, parent, callback) {

		var render = {
			'posts' : renderPosts,
			'album' : renderAlbum,
			'post' : renderPost
		};

		callback = callback || function(){};

		// Empty the parent
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}

		// Place the title
		elems.dashboardSecPageTitle.innerHTML = request.name;
		elems.dashboardSecPage.dataset.processing = false;

		// Use the correct rendering function
		render[request.type](content, request);

		function renderPosts(content, request) {
			// Create all new elements and append to page
			for (var post of content) {
				var newElem = document.createElement('a');
				newElem.classList.add('list-group-item', 'list-group-item-action');

				var href = document.createAttribute('href');
				href.value = '#';
				newElem.setAttributeNode(href);

				var dataId = document.createAttribute('data-id');
				dataId.value = post.id;
				newElem.setAttributeNode(dataId);

				var dataReq = document.createAttribute('data-req');
				dataReq.value = 'post';
				newElem.setAttributeNode(dataReq);

				var newElemTitle = document.createElement('h5');
				newElemTitle.classList.add('list-group-item-heading');
				newElemTitle.innerHTML = post.title;

				var newElemP = document.createElement('p');
				newElemP.classList.add('list-group-item-text');
				newElemP.innerHTML = post.body;

				newElem.appendChild(newElemTitle);
				newElem.appendChild(newElemP);

				helper.addEvent(newElem, 'click', renderNewPage);

				parent.appendChild(newElem);
			}
			afterRender();
		}

		function renderAlbum(content, request) {
			console.log(content);
			console.log(request);

			afterRender();
		}

		function renderPost(content, request) {
			console.log('rendering single post');
			console.log(content);
			console.log(request);

			afterRender();
		}

		function afterRender() {
			parent.classList.add('active');
			callback();
		}
	}

	/**
	 * Render a new page. Attached to every clickable navigation links in DBP inner content.
	 */
	function renderNewPage() {
		var currentContentElem = getCurrentlyShownDbpContent(),
			nextContentElem = helper.getElementNextOf(currentContentElem),
			request = requests[this.dataset.req](this.dataset.id);

		// Next page doesn't exist, create it
		if (nextContentElem == null) {
			let nextElem = document.createElement('div');
			nextElem.classList.add('inner-content', 'list-group-active');

			let dataId = document.createAttribute('data-currentcontent');
			dataId.value = true;

			let dataPagenum = document.createAttribute('data-pagenum');
			dataPagenum.value = parseInt(currentContentElem.dataset.pagenum) + 1;

			nextElem.setAttributeNode(dataId);
			nextElem.setAttributeNode(dataPagenum);

			elems.dbp2Content.appendChild(nextElem);
			nextContentElem = helper.getElementNextOf(currentContentElem);
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function (result) {
			renderDashboardPage(result, request, nextContentElem, function () {
				dbpChangePage('next');
			});
		});
	}

	/**
	 * Change the content page.
	 * @param {String} direction - 'prev' or 'next'.
	 * @param {Function} callback - Functions to call after page is changed.
	 */
	function dbpChangePage(direction, callback) {
		var currentContentElem = getCurrentlyShownDbpContent();
		callback = callback || function(){};

		// Make current page inactive
		currentContentElem.classList.remove('active');
		currentContentElem.dataset.currentcontent = false;

		switch (direction) {
			case 'previous':
				var previousPage = helper.getElementPreviousOf(currentContentElem);
				previousPage.classList.add('active');
				previousPage.dataset.currentcontent = true;
				callback();
				break;

			case 'next':
				var nextPage = helper.getElementNextOf(currentContentElem);
				nextPage.classList.add('active');
				nextPage.dataset.currentcontent = true;
				callback();
				break;

			default:
				break;
		}
	}

	return {
		'init' : init
	};

})(momentumHelperModule);