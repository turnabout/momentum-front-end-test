/**
 * Module containing functions pertaining to the app specifically, to be used in the other modules.
 * @param {Object} helper - Helper functions module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumFunctionsModule = (function (helper) {

	// Object containing references to static, reused DOM elements
	var elems = getAppElems();

	var pageTitleBase = document.title;

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
		var currentContentElem = getActiveContentPage();
		callback = callback || function(){};

		switch (direction) {
		case 'previous':
			var newPage = helper.getElemBefore(currentContentElem);

			newPage.classList.add('active');
			newPage.dataset.currentcontent = true;

			// Set next btn to active
			elems.contentNext.removeAttribute('disabled');
			afterChange();
			break;

		case 'next':
			var newPage = helper.getElemAfter(currentContentElem);

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
			currentContentElem.classList.remove('active');
			currentContentElem.dataset.currentcontent = false;

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
		var currentContentElem =getActiveContentPage();

		// If first page is current, slide dbp back in
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

		helper.disableForm(this);
		form = this;
		currentPage = getActiveContentPage();

		event.preventDefault();

		if (!currentPage) {
			helper.enableForm(this);
			return;
		}

		commentsTitle = currentPage.querySelectorAll('[data-comments]')[0];

		if (!commentsTitle) {
			helper.enableForm(this);
			return;
		}

		// Get comment data and prepare POST request
		commentsAmount = parseInt(commentsTitle.dataset.comments);
		postId = this.dataset.postid;
		name = form.elements['name'].value;
		body = form.elements['body'].value;
		params = `postId=${postId}&name=${name}&body=${body}&email=${body}`;

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
		 * Add the comment to both the DOM and app data.
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
					commentsText += 's';
				}
				
				commentsTitle.removeChild(commentsTitle.firstChild);
				commentsTitle.appendChild( document.createTextNode(commentsText) );
			}
		}
	}

	/**
	* Get the different requests to use to render content pages.
	* @return {Object} reqs - The requests.
	*/
	function requests() {
		return {
			'userPosts': function (userId) { 
				return {
					'query' 		: `posts?userId=${userId}`,
					'titleQuery' 	: `users/${userId}`,
					'type' 			: 'posts',
				};
			},
			'userAlbums': function (userId) { 
				return {
					'query' 		: `albums?userId=${userId}`,
					'titleQuery' 	: `users/${userId}`,
					'type' 			: 'album',
				};
			},
			'allPosts': function (userId) { 
				return {
					'query' 		: `posts`,
					'title' 		: 'All Posts',
					'type' 			: 'posts',
				};
			},
			'post': function (postId) { 
				return {
					'query' 		: `posts/${postId}`,
					'type' 			: 'post',
				};
			},
			'user': function (userId) { 
				return {
					'query' 		: `users/${userId}`,
					'type' 			: 'user',
				};
			},
		};
	}

	/**
	 * Get references to app elements.
	 * @return {Object} els - Object containing references to many static app elements.
	 */
	function getAppElems() {
		return {
			contentBack: 			document.getElementById('content-back'),
			contentNext: 			document.getElementById('content-next'),
			dashboard: 				document.getElementById('dashboard'),
			dashboardContentPage: 	document.getElementById('content-dbp'),
			dashboardContentTitle: 	document.getElementById('dbp-content-title'),
			dashboardMenuPage: 		document.getElementById('main-dbp'),
			dbpContentContainer: 	document.getElementById('dbp-content-container'),
			dbpContentPageOne: 		document.getElementById('dbp-content-page-1'),
			loginForm:				document.getElementById('login'),
			loginAlert: 			document.getElementById('login-alert'),
			loginBox: 				document.getElementById('login-box'),
			loginBtn: 				document.getElementById('login-btn'),
			loginField: 			document.getElementById('login-field'),
			loginPage: 				document.getElementById('login-page'),
			dashboardMenuItems: 	document.querySelectorAll('.dashboard-menu-item')
		};
	}

	return {
		'dbpChangePage': dbpChangePage,
		'dbpNextClick': dbpNextClick,
		'dbpPreviousClick': dbpPreviousClick,
		'getActiveContentPage': getActiveContentPage,
		'getAppElems': getAppElems,
		'requests': requests,
		'submitPostComment': submitPostComment,
		'transitionDashboardPage': transitionDashboardPage
	}
	
})(momentumHelperModule);