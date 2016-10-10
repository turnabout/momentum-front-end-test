/**
 * Module containing functions pertaining to the app specifically, to be used in the other modules.
 * @param {Object} helper - Helper functions module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumFunctionsModule = (function (helper) {

	var elems;				// Object containing references to static, reused DOM elements
	var pageTitleBase;		// The starting document title base
	var user;				// The current user
	var requests;			// The different requests to use to render content pages
	var dbp;				// The templates module. Stands for "Dashboard pages"

	elems = helper.getAppElems();
	pageTitleBase = document.title;
	requests = helper.getRequests();

	/**
	 * Get the currently active and displayed content page.
	 * @return {Object||Boolean} element - The element if one is shown, or false.
	 */
	function getActiveContentPage() {
		for (var elem of helper.getElemsWithAttr('data-currentcontent')) {
			if (helper.isElem(elem, 'currentcontent')) {
				return elem;
			}
		}
		return false;
	}

	/**
	 * Change the content page.
	 * @param {String} direction - 'prev' or 'next'.
	 * @param {Function} callback - Functions to call after page is changed.
	 */
	function dbpChangePage(direction, callback) {
		var currentContentPage; // The currently active content page
		var newPage;			// The new page being switched to

		currentContentPage = getActiveContentPage();
		callback = callback || function(){};

		switch (direction) {
		case 'previous':
			newPage = helper.getElemBefore(currentContentPage);

			newPage.classList.add('active');
			newPage.dataset.currentcontent = true;

			// Set next btn to active
			elems.contentNext.removeAttribute('disabled');
			afterChange();
			break;

		case 'next':
			newPage = helper.getElemAfter(currentContentPage);
			
			// Make sure next page is scrolled to top
			newPage.scrollTop = 0;

			newPage.classList.add('active');
			newPage.dataset.currentcontent = true;

			// If reached the end, make btn disabled
			if (helper.getElemAfter(newPage) == null) {
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

			// Make current page inactive
			currentContentPage.classList.remove('active');
			currentContentPage.dataset.currentcontent = false;

			// Set the title
			elems.dashboardContentTitle.innerHTML = newPage.dataset.title;
			document.title = `${pageTitleBase} - ${newPage.dataset.title}`;
			callback();
		}
	}

	/**
	 * Handle click on content navigation back button.
	 * @param {Event} event - The event.
	 */
	function dbpPreviousClick(event) {
		var currentContentPage; // The currently active content page

		currentContentPage = getActiveContentPage();

		// If first page is current, slide dbp back in
		if (currentContentPage.dataset.pagenum === '1') {
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
	 * Handle click on content navigation next button.
	 * @param {Event} event - The event.
	 */
	function dbpNextClick(event) {

		// If next page exists, change to it
		if (helper.getElemAfter(getActiveContentPage()) != null) {
			dbpChangePage('next');
		}
	}

	/**
	 * Handle post comment form submit.
	 * @param {Event} event - The event.
	 */
	function submitPostComment(event) {
		var body;			// The body value of the posted comment
		var commentsAmount; // The amount of comments already posted
		var commentsTitle; 	// Element containing title for comments section
		var currentPage 	// Currently active page
		var form; 			// The form
		var name;			// The 'name' or title value of the posted comment
		var params;			// The parameters to send to the POST request
		var postId;			// The ID of the post attached to the comment

		form = this;
		currentPage = getActiveContentPage();

		helper.disableForm(form);
		event.preventDefault();

		if (!currentPage) {
			helper.enableForm(form);
			return;
		}

		commentsTitle = currentPage.querySelectorAll('[data-comments]')[0];

		// Cancel if can't get comments title
		if (!commentsTitle) {
			helper.enableForm(form);
			return;
		}

		// Get comment data
		name = form.elements['name'].value;
		body = form.elements['body'].value;

		// Cancel if either field is empty
		if (!name || !body) {
			helper.enableForm(form);
			return;
		}

		// Set page to "busy"
		setDbpBusyState(true);

		// Prepare POST request
		commentsAmount = parseInt(commentsTitle.dataset.comments);
		postId = this.dataset.postid;
		params = `postId=${postId}&name=${name}&body=${body}&email=${user.email}`;

		// Post the comment
		helper.postApiData('comments', params, `posts/${postId}/comments`, function (result) {
			helper.enableForm(form);

			if (result) {
				helper.clearForm(form);
				result.newCommentsAmount = commentsAmount + 1;
				addComment(currentPage, result);
			}
		});

		/**
		 * Add the comment.
		 * @param {Object} page - The page in which the comments reside.
		 * @param {Object} commentData - All data on the comment.
		 */
		function addComment(page, commentData) {
			var aroundAnchor;		// Element wrapping around the userAnchor element
			var body;				// The comment's body
			var comment;			// The comment element
			var commentsElem; 		// Element containing all comments
			var commentsTitleText;	// Text to be inserted in the comments section title
			var title;				// The comment's title
			var userAnchor;			// The anchor element used to email the user

			if (page) {

				// Comments
				commentsElem = page.querySelectorAll('.comments')[0];

				// Comment
				comment = document.createElement('div');
				comment.classList.add('list-group-item');

				// Comment title
				title = document.createElement('h4');
				title.classList.add('list-group-item-heading');
				title.appendChild( document.createTextNode(commentData.name) );

				// User email anchor
				userAnchor = helper.createAnchor('Email this user', `mailto:${commentData.email}`);
				userAnchor.classList.add('user-email');

				// Around user email anchor
				aroundAnchor = document.createElement('div');
				aroundAnchor.classList.add('around-anchor');
				aroundAnchor.appendChild(userAnchor);

				// Body
				body = document.createElement('p');
				body.classList.add('list-group-item-text');
				body.appendChild( document.createTextNode(commentData.body) );

				// Append all
				comment.appendChild(title);
				comment.appendChild(aroundAnchor);
				comment.appendChild(body);
				commentsElem.insertBefore(comment, commentsElem.firstChild);

				// Update comments count
				commentsTitleText = `${commentData.newCommentsAmount} comment`;

				if (commentData.newCommentsAmount > 1) {
					commentsTitleText += 's';
				}

				commentsTitle.dataset.comments = commentData.newCommentsAmount;
				commentsTitle.removeChild(commentsTitle.firstChild);
				commentsTitle.appendChild( document.createTextNode(commentsTitleText) );

				// Page no longer busy
				setDbpBusyState(false);
			}
		}
	}

	/**
	 * Authenticate user on form submit.
	 * @param {Event} event - The event.
	 */
	function authenticate(event) {
		var username = elems.loginField.value;

		if (username) {

			helper.disableForm(elems.loginForm);

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
			helper.enableForm(elems.loginForm);
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
		helper.enableForm(elems.loginForm);
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
		while (helper.getElemAfter(elems.dbpContentPageOne) != null) {
			let nextElem = helper.getElemAfter(elems.dbpContentPageOne);
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

	/**
	 * Function fired when a dashboard menu item is clicked.
	 * @param {Event} event
	 */
	function handleDashboardMenuClick(event) {

		event.preventDefault();

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
			elems.dashboardContentPage.classList.add('sliding');
			transitionDashboardPage('slideInOut');
		} else {
			transitionDashboardPage('slideOut');
		}

		// Set the content page state to "processing"
		setDbpBusyState(true);

		// Request the content and render page with it
		helper.getApiData(request.query, function (result) {
			dbp.render(result, request, elems.dbpContentPageOne);
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
					elems.dashboardContentPage.classList.remove('sliding');
					callback();
				});
			});
			break;

		default:
			break;
		}
	}

	/**
	 * Manually grab and set a reference to the 'momentum-templates' module functions from outside.
	 * @param {Object} module - The momentum-templates module's public API object.
	 */
	function getDbpDependency(module) {
		dbp = module;
	}

	/**
	 * Return the current user.
	 * @return {Object} user - The currently logged-in user.
	 */
	function getCurrentUser() {
		return user;
	}

	/**
	 * Set the dashboard page processing state on/off.
	 * @param {Boolean} set - Whether to set it on or off. 'true' is on.
	 */
	function setDbpBusyState(state) {
		elems.dashboardContentPage.dataset.busy = state;

		if (state) {
			elems.dashboardContentPage.classList.add('busy');
		} else {
			elems.dashboardContentPage.classList.remove('busy');
		}
	}

	/**
	 * Get whether the dashboard page is currently processing.
	 * @return {Boolean} processing - Whether it's processing or not.
	 */
	function dbpIsBusy() {
		return isElem(elems.dashboardContentPage, 'processing');
	}

	return {
		'authenticate': authenticate,
		'dbpChangePage': dbpChangePage,
		'dbpNextClick': dbpNextClick,
		'dbpPreviousClick': dbpPreviousClick,
		'getCurrentUser': getCurrentUser,
		'getActiveContentPage': getActiveContentPage,
		'getDbpDependency': getDbpDependency,
		'handleDashboardMenuClick': handleDashboardMenuClick,
		'dbpIsBusy': dbpIsBusy,
		'logout': logout,
		'resetDbpState': resetDbpState,
		'resetDashboardState': resetDashboardState,
		'setDbpBusyState': setDbpBusyState,
		'submitPostComment': submitPostComment,
		'transitionDashboardPage': transitionDashboardPage
	}
	
})(momentumHelperModule);