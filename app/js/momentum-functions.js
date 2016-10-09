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

		// Make current page inactive
		currentContentElem.classList.remove('active');
		currentContentElem.dataset.currentcontent = false;

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

			// Set the title
			elems.dashboardContentTitle.innerHTML = newPage.dataset.title;
			document.title = `${pageTitleBase} - ${newPage.dataset.title}`;
			callback();
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
		'getActiveContentPage': getActiveContentPage,
		'getAppElems': getAppElems,
		'requests': requests
	}
	
})(momentumHelperModule);