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
					setTitle(`Posts by: ${user.username}`);
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
				postContentElem = document.createElement('p');

			// Main element
			postElem.classList.add('card', 'card-block', 'post');

			// Title
			postTitleElem.innerHTML = content.title;
			postTitleElem.classList.add('card-title', 'title');

			// Content
			postContentElem.innerHTML = content.body;
			postContentElem.classList.add('card-text', 'content');

			// Add the elements
			postElem.appendChild(postTitleElem);

			addUser(function () {
				parent.appendChild(postElem);

				addComments(function () {
					afterRender();
				});
			});

			/**
			 * Add the user to the post element.
			 * @param {Function} callback - Function to call after user is added.
			 */
			function addUser(callback) {
				helper.getApiData(`users/${content.userId}`, function (result) {
					var userElem = helper.createAnchor(result.username);

					var dataId = document.createAttribute('data-id');
					dataId.value = content.userId;
					userElem.setAttributeNode(dataId);

					var dataReq = document.createAttribute('data-req');
					dataReq.value = 'user';
					userElem.setAttributeNode(dataReq);

					userElem.classList.add('post-user');
					helper.addEvent(userElem, 'click', renderNewPage);

					var userAround = document.createElement('div');
					userAround.classList.add('user-around');
					userAround.appendChild(document.createTextNode('Posted by: '));
					userAround.appendChild(userElem);

					// Add user
					postElem.appendChild(userAround);

					// Add post content
					postElem.appendChild(postContentElem);

					callback();
				});
			}

			/**
			 * Get the new comment form.
			 * @return {Object} form - The form to enter a new comment.
			 */
			function getCommentForm() {

				// Form
				var form = document.createElement('form');
				form.setAttribute('method','post');
				form.classList.add('comment-form');

				helper.addEvent(form, 'submit', app.submitPostComment);

				// Input
				var input = document.createElement('input');
				input.setAttribute('placeholder', 'Enter a title...');
				input.setAttribute('type', 'text');
				input.classList.add('field', 'title-field');

				// Textarea
				var textArea = document.createElement('textarea');
				textArea.setAttribute('placeholder', 'Enter a comment...');
				textArea.classList.add('field', 'comment-field');

				// Button
				var button = document.createElement('input');
				button.setAttribute('type', 'submit');
				button.setAttribute('value', 'Send');
				button.classList.add('btn', 'btn-primary', 'btn-block');

				form.appendChild(input);
				form.appendChild(textArea);
				form.appendChild(button);

				return form;
			}

			/**
			 * Get and add comments to the post element.
			 * @param {Function} callback - Function to call after comments are added.
			 */
			function addComments(callback) {
				helper.getApiData(`posts/${content.id}/comments`, function (result) {

					// Add the amount of comments & the comment form before the comments
					var beforeComments = document.createElement('div');
					beforeComments.classList.add('before-comments', 'card', 'card-block');

					var commentsSectionHeading = document.createElement('h3');
					commentsSectionHeading.classList.add('title', 'card-title');
					commentsSectionHeading.appendChild(document.createTextNode('Add a comment'));

					beforeComments.appendChild(commentsSectionHeading);
					beforeComments.appendChild(getCommentForm());

					// Add the 'before commments' sections
					parent.appendChild(beforeComments);

					// Add comments title section
					var commentsElemTitleAround = document.createElement('div');
					commentsElemTitleAround.classList.add('card', 'card-block', 'before-comments-title');

					var commentsElemTitle = document.createElement('h3');
					commentsElemTitle.classList.add('card-title');
					commentsElemTitle.appendChild(document.createTextNode(getCommentsTitle()));

					var dataComs = document.createAttribute('data-comments');
					dataComs.value = result.length;
					commentsElemTitle.setAttributeNode(dataComs);

					// Append it all
					commentsElemTitleAround.appendChild(commentsElemTitle);
					parent.appendChild(commentsElemTitleAround);

					// Add the main comments element
					var commentsElem = document.createElement('div');
					commentsElem.classList.add('comments', 'list-group');

					// Output all comments
					for (var comment of result) {

						// Main comment elem
						let commentElem = document.createElement('div');
						commentElem.classList.add('list-group-item', 'list-group-item-action');

						// User/title
						let userElem = document.createElement('h4');
						let name = document.createTextNode(comment.name);
						userElem.appendChild(name);
						userElem.classList.add('list-group-item-heading');

						// "Mail user" tag
						let aroundAncor = document.createElement('div');
						let userAnchor = helper.createAnchor('Email this user', `mailto:${comment.email}`);
						userAnchor.classList.add('user-email');
						aroundAncor.appendChild(userAnchor);
						userElem.appendChild(aroundAncor);

						// Body
						let bodyElem = document.createElement('p');
						bodyElem.classList.add('list-group-item-text');
						bodyElem.appendChild(document.createTextNode(comment.body));

						// Add to main comment elem
						commentElem.appendChild(userElem);
						commentElem.appendChild(bodyElem);

						if (commentsElem.firstChild) {
							commentsElem.insertBefore(commentElem, commentsElem.firstChild);
						} else {
							commentsElem.appendChild(commentElem);
						}
					}

					parent.appendChild(commentsElem);
					callback();


					/**
					 * Get the appropriate title for the comments amount title.
					 * @return {Object} title - The title text.
					 */
					function getCommentsTitle() {
						if (result.length === 1) {
							return '1 comment';
						} else if (result.length > 1) {
							return `${result.length} comments`;
						} else {
							return 'No comments';
						}
					}
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