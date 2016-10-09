/**
 * Module containing the dashboard pages templates to be rendered.
 * @param {Object} helper - Helper functions module.
 * @param {Object} app - App related functions.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumTemplatesModule = (function (helper, app) {

	// Object containing references to static, reused DOM elements
	var elems = app.getAppElems();

	// Different requests info, used to render pages
	var requests = app.requests();

	var pageTitleBase = document.title;

	/**
	 * Render a dashboard page with some passed-in content.
	 * @param {Array} content - Content to render in the page.
	 * @param {Object} request - Info on the request, including the type, used to select the correct render.
	 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 * @param {Function} callback - Function to call once page is finished rendering.
	*/
	function render(content, request, parent, callback) {

		// Different templates to render
		var renderTemplates = {
			'posts' : renderPosts,
			'album' : renderAlbum,
			'post'  : renderPost,
			'user'  : renderUser
		};

		callback = callback || function () {};

		// Empty the parent
		helper.emptyElem(parent);

		elems.dashboardContentPage.dataset.processing = false;

		// Use the correct rendering template function
		renderTemplates[request.type]();

		/**
		 * Render a list of multiple posts.
		 */
		function renderPosts() {

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
		 */
		function renderAlbum() {
			console.log(content);
			console.log(request);
			afterRender();
		}

		/**
		 * Render a single post.
		 */
		function renderPost() {

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
		 * Render a user page.
		 */
		function renderUser() {
			setTitle(`User: ${content.username}`);
			console.log('rendering user');
			console.log(content);
			console.log(request);
			console.log('rendering user');

			afterRender();
		}

		/**
		 * Function executed at the end of the main render function.
		 */
		function afterRender() {
			parent.classList.add('active');

			// Remove any dbp that come after the new, current dashboard page. To avoid having the 'next' option available to irrelevent pages.
			while (helper.getElemAfter(parent) != null) {
				let nextElem = helper.getElemAfter(parent);
				nextElem.parentElement.removeChild(nextElem);
			}

			callback();
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
		var currentContentElem = app.getActiveContentPage(),
			nextContentElem = helper.getElemAfter(currentContentElem),
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
			nextContentElem = helper.getElemAfter(currentContentElem);
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function(result) {
			render(result, request, nextContentElem, function () {
				app.dbpChangePage('next');
			});
		});
	}

	return {
		'render': render,
		'renderNewPage': renderNewPage,
		'requests': requests
	}
	
})(momentumHelperModule, momentumFunctionsModule);