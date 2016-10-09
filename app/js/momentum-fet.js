/**
 * Module containing the code for the Momentum Front End app.
 * @param {Object} helper - Helper functions module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule(helper) {

	// Store references to static, reused dom elements
	var elems = {
		loginField: document.getElementById('login-field'),
		loginAlert: document.getElementById('login-alert'),
		loginBox: document.getElementById('login-box'),
		loginBtn: document.getElementById('login-btn'),
		loginPage: document.getElementById('login-page'),
		dashboard: document.getElementById('dashboard'),
		dashboardMenuPage: document.getElementById('main-dbp'),
		dashboardMenuItems:document.querySelectorAll('.dashboard-menu-item'),
		dashboardContentPage: document.getElementById('content-dbp'),
		dashboardContentTitle: document.getElementById('dbp-content-title'),
		dbpContentContainer: document.getElementById('dbp-content-container'),
		dbpContentPageOne: document.getElementById('dbp-content-page-1'),
		contentBack: document.getElementById('content-back'),
		contentNext: document.getElementById('content-next')
	};

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
		if (helper.isElement(elems.dashboardContentPage, ['processing', 'animating']) || !(this.dataset.req in requests)) {
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
		var currentContentElem = getCurrentlyShownDbpContent();

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

		dbpChangePage('previous');
	}

	/**
	 * Handle click on secondary DBP next button.
	 * @param {Event} event - The event.
	 */
	function dbpNextClick(event) {
		// Only change to next page if it exists
		if (helper.getElementNextOf(getCurrentlyShownDbpContent()) != null) {
			dbpChangePage('next');
		}
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
		while (helper.getElementNextOf(elems.dbpContentPageOne) != null) {
			let nextElem = helper.getElementNextOf(elems.dbpContentPageOne);
			nextElem.parentElement.removeChild(nextElem);
		}

		// Make first content page active
		elems.dbpContentPageOne.dataset.currentcontent = true;

		// Reset bottom buttons states
		elems.contentNext.disabled = true;
		
		// Empty the first content page
		elems.dashboardContentTitle.innerHTML = '';

		while (elems.dbpContentPageOne.firstChild) {
			elems.dbpContentPageOne.removeChild(elems.dbpContentPageOne.firstChild);
		}
	}

	/**
	 * Render a dashboard page with some passed-in content.
	 * @param {Array} content - Content to render in the page.
	 * @param {Object} request - Info on the request, including the type, used to select the correct render.
	 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 * @param {Function} callback - Function to call once page is finished rendering.
	 */
	function renderDashboardPage(content, request, parent, callback) {

		var render = {
			'posts' : renderPosts,
			'album' : renderAlbum,
			'post' : renderPost,
			'user' : renderUser
		};

		callback = callback || function () {};

		// Empty the parent
		while (parent.firstChild) {
			parent.removeChild(parent.firstChild);
		}

		elems.dashboardContentPage.dataset.processing = false;

		// Use the correct rendering function
		render[request.type](content, request);

		/**
		 * Render a list of multiple posts.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 */
		function renderPosts(content, request) {

			// Set the page title
			if ('titleQuery' in request) {
				helper.getApiData(request.titleQuery, function (user) {
					setTitle(`Posts by ${user.username}`);
				});
			} else if ('title' in request) {
				setTitle(request.title);
			} else {
				setTitle('Page');
			}

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

		/**
		 * Render an album page.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 */
		function renderAlbum(content, request) {
			console.log(content);
			console.log(request);
			afterRender();
		}

		/**
		 * Render a single post.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 */
		function renderPost(content, request) {

			// Set title
			setTitle(content.title);

			// Render post content
			var postElem = document.createElement('div'),
				postTitleElem = document.createElement('h3'),
				postContentElem = document.createElement('p'),
				userElem = document.createElement('a');

			// Title
			postTitleElem.innerHTML = content.title;

			// Author
			var dataId = document.createAttribute('data-id');
			dataId.value = content.userId;
			userElem.setAttributeNode(dataId);

			var href = document.createAttribute('href');
			href.value = '#';
			userElem.setAttributeNode(href);

			var dataReq = document.createAttribute('data-req');
			dataReq.value = 'user';
			userElem.setAttributeNode(dataReq);

			helper.addEvent(userElem, 'click', renderNewPage);

			// Content
			postContentElem.innerHTML = content.body;

			// Add the elements
			postElem.appendChild(postTitleElem);

			addUser(function () {
				addComments(function () {
					parent.appendChild(postElem);
					afterRender();
				});
			});

			/**
			 * Add the user to the post element.
			 * @param {Function} callback - Function to call after user is added.
			 */
			function addUser(callback) {
				helper.getApiData(`users/${content.userId}`, function (result) {

					// Add user
					userElem.innerHTML = result.username;
					postElem.appendChild(userElem);

					// Add post content
					postElem.appendChild(postContentElem);

					callback();
				});
			}

			/**
			 * Get and add comments to the post element.
			 * @param {Function} callback - Function to call after comments are added.
			 */
			function addComments(callback) {
				helper.getApiData(`posts/${content.id}/comments`, function (result) {
					// Add comments here (TODO)

					callback();
				});

			}
		}

		/**
		 * Function executed at the end of the main render function.
		 */
		function afterRender() {
			parent.classList.add('active');

			// Remove any dbp that come after the new, current dashboard page. To avoid having the 'next' option available to irrelevent pages.
			while (helper.getElementNextOf(parent) != null) {
				let nextElem = helper.getElementNextOf(parent);
				nextElem.parentElement.removeChild(nextElem);
			}

			callback();
		}

		/**
		 * Render a user page.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 */
		function renderUser(content, request) {
			setTitle(`User: ${content.username}`);
			console.log('rendering user');
			console.log(content);
			console.log(request);
			console.log('rendering user');

			afterRender();
		}

		/**
		 * Set the title, both in the data-attribute of the page and the title element.
		 * @param {String} title - The title.
		 */
		function setTitle(title) {
			parent.dataset.title = title;
			elems.dashboardContentTitle.innerHTML = title;
			document.title = `${pageTitleBase} - ${title}`;
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
		if (typeof(nextContentElem) === 'undefined' || nextContentElem === null) {
			let nextElem = document.createElement('div');
			nextElem.classList.add('inner-content', 'list-group-active');

			let dataId = document.createAttribute('data-currentcontent');
			dataId.value = true;

			let dataPagenum = document.createAttribute('data-pagenum');
			dataPagenum.value = parseInt(currentContentElem.dataset.pagenum) + 1;

			nextElem.setAttributeNode(dataId);
			nextElem.setAttributeNode(dataPagenum);

			elems.dbpContentContainer.appendChild(nextElem);
			nextContentElem = helper.getElementNextOf(currentContentElem);
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function(result) {
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
				var newPage = helper.getElementPreviousOf(currentContentElem);
				newPage.classList.add('active');
				newPage.dataset.currentcontent = true;

				// Set next btn to active
				elems.contentNext.removeAttribute('disabled');
				afterChange();
				break;

			case 'next':
				var newPage = helper.getElementNextOf(currentContentElem);

				newPage.classList.add('active');
				newPage.dataset.currentcontent = true;

				// If reached the end, make btn disabled
				if (helper.getElementNextOf(newPage) == null) {
					elems.contentNext.setAttribute('disabled', true);
				}

				afterChange();
				break;

			default:

				break;
		}

		/**
		 * Function executed after the page change.
		 */
		function afterChange() {

			// Set the title
			elems.dashboardContentTitle.innerHTML = newPage.dataset.title;
			document.title = `${pageTitleBase} - ${newPage.dataset.title}`;
			callback();
		}
	}

	return {
		'init' : init
	};

})(momentumHelperModule);