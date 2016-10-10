/**
 * Module containing the dashboard pages templates to be rendered.
 * @param {Object} helper - Helper functions module.
 * @param {Object} app - App related functions.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumTemplatesModule = (function (helper, app) {

	var commentsForm; 		// Form to add new comments to a post
	var elems;				// Object containing references to static, reused DOM elements
	var requests;			// Different requests info, used to render pages
	var pageTitleBase;		// The starting document title base
	
	commentsForm = setNewCommentForm();
	elems = app.getAppElems();
	requests = app.requests(); 
	pageTitleBase = document.title;

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

				var button;		// The form's button
				var form;		// The form
				var input;		// The form's title input
				var textArea;	// The form's body input

				// Form
				form = document.createElement('form');
				form.setAttribute('method', 'post');
				form.setAttribute('action', '');
				form.classList.add('comment-form');
				form.dataset.postid = content.id;

				// Add submit event handler on the form
				helper.addEvent(form, 'submit', app.submitPostComment);

				// Input
				var input = document.createElement('input');
				input.setAttribute('placeholder', 'Enter a title...');
				input.setAttribute('type', 'text');
				input.classList.add('field', 'title-field');
				input.setAttribute('name', 'name');

				// Textarea
				var textArea = document.createElement('textarea');
				textArea.setAttribute('placeholder', 'Enter a comment...');
				textArea.classList.add('field', 'comment-field');
				textArea.setAttribute('name', 'body');

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
					var addCommentForm;				// Section including the "Add a comment" form
					var comment;					// Element to contain a comment. Cloned to create new comment elements.
					var commentBody;				// Main body element inside of a comment
					var comments;					// Contains all comments
					var commentTitle;				// Title element inside of a comment
					var commentUser;				// User element inside of a comment
					var commentEmail;				// The user's email
					var commentsElemTitle;			// Title before comments
					var commentsElemTitleAround;	// Section before comments, contains title
					var newComment;					// Every new comment element

					// "Add a comment" form
					addCommentForm = getNewCommentForm(content.id);

					// Comments title section
					commentsElemTitleAround = document.createElement('div');
					commentsElemTitleAround.classList.add('card', 'card-block', 'before-comments-title');

					commentsElemTitle = document.createElement('h3');
					commentsElemTitle.classList.add('card-title');
					commentsElemTitle.appendChild( document.createTextNode( getCommentsTitleText() ) );
					commentsElemTitle.dataset.comments = result.length;
					commentsElemTitleAround.appendChild(commentsElemTitle);

					parent.appendChild(addCommentForm);
					parent.appendChild(commentsElemTitleAround);

					// Comments
					comments = document.createElement('div');
					comments.classList.add('comments', 'list-group');
					
					// Comment
					comment = document.createElement('div');
					comment.classList.add('list-group-item');

					commentTitle = document.createElement('h4');
					commentTitle.classList.add('list-group-item-heading');

					commentEmail = helper.createAnchor('Email this user');
					commentEmail.classList.add('user-email');

					commentUser = document.createElement('div');
					commentUser.classList.add('user');
					commentUser.appendChild(commentEmail);

					commentBody = document.createElement('p');
					commentBody.classList.add('list-group-item-text');

					comment.appendChild(commentTitle);
					comment.appendChild(commentUser);
					comment.appendChild(commentBody);

					// Output all comments
					for (var entry of result) {
						newComment = getNewComment(entry.name, entry.email, entry.body, comment);

						if (comments.firstChild) {
							comments.insertBefore(newComment, comments.firstChild);
						} else {
							comments.appendChild(newComment);
						}
					}

					parent.appendChild(comments);
					callback();

					/**
					 * Get the appropriate title for the comments amount title.
					 * @return {Object} title - The title text.
					 */
					function getCommentsTitleText() {
						if (result.length === 1) {
							return '1 comment';
						} else if (result.length > 1) {
							return `${result.length} comments`;
						} else {
							return 'No comments';
						}
					}

					/**
					 * Get a new comment.
					 * @param {String} title - The title of the comment.
					 * @param {String} email - The user email.
					 * @param {String} body - The body text.
					 * @param {String} base - The base to use as a starting element.
					 * @return {Object} comment - The new comment element.
					 */
					function getNewComment(title, email, body, base) {
						var newComment;		// New comment to return.

						newComment = base.cloneNode(true);

						newComment.childNodes[0].appendChild( document.createTextNode(title) );
						newComment.childNodes[1].firstChild.setAttribute('href', `mailto:${email}`);
						newComment.childNodes[2].appendChild( document.createTextNode(body) );

						return newComment;
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
		var currentContentPage; // The currently active content page
		var nextContentPage; 	// The content page after the current one
		var request;			// The request object to use to render the page

		currentContentPage = app.getActiveContentPage();
		nextContentPage = helper.getElemAfter(currentContentPage);
		request = requests[this.dataset.req](this.dataset.id);

		// If next page doesn't exist, create it
		if (typeof(nextContentPage) === 'undefined' || nextContentPage === null) {
			let next;		// The next content page

			// Create the next content page
			next = document.createElement('div');
			next.dataset.currentcontent = 'true';
			next.dataset.pagenum = parseInt(currentContentPage.dataset.pagenum) + 1;
			next.classList.add('inner-content', 'list-group-active');

			// Append it
			elems.dbpContentContainer.appendChild(next);
			nextContentPage = helper.getElemAfter(currentContentPage);
		}

		// Request the content and render page with it
		helper.getApiData(request.query, function(result) {
			render(result, request, nextContentPage, function () {
				console.log(nextContentPage);
				app.dbpChangePage('next');
			});
		});
	}

	/**
	 * Create the form to add new elements and set inside this module. To be cloned inside of the renderPosts function.
	 */
	function setNewCommentForm() {
		var button;		// The form's button
		var form;		// The form
		var heading;	// The heading above the form
		var input;		// The form's title input
		var outerDiv;	// Div wrapping around the entire form
		var textArea;	// The form's body input

		// Form outer div
		outerDiv = document.createElement('div');
		outerDiv.classList.add('before-comments', 'card', 'card-block');

		// Form heading
		heading = document.createElement('h3');
		heading.classList.add('title', 'card-title');
		heading.appendChild(document.createTextNode('Add a comment'));

		// Form
		form = document.createElement('form');
		form.setAttribute('method', 'post');
		form.setAttribute('action', '');
		form.classList.add('comment-form');
		
		// Input
		var input = document.createElement('input');
		input.setAttribute('placeholder', 'Enter a title...');
		input.setAttribute('type', 'text');
		input.classList.add('field', 'title-field');
		input.setAttribute('name', 'name');

		// Textarea
		var textArea = document.createElement('textarea');
		textArea.setAttribute('placeholder', 'Enter a comment...');
		textArea.classList.add('field', 'comment-field');
		textArea.setAttribute('name', 'body');

		// Button
		var button = document.createElement('input');
		button.setAttribute('type', 'submit');
		button.setAttribute('value', 'Send');
		button.classList.add('btn', 'btn-primary', 'btn-block');

		form.appendChild(input);
		form.appendChild(textArea);
		form.appendChild(button);

		outerDiv.appendChild(heading);
		outerDiv.appendChild(form);

		return outerDiv;
	}

	/**
	 * Fetch a copy of the module commentsForm, used to post new comments.
	 * @param {String} dataPostId - The value of the form's data-postid attribute.
	 * @return {Object} form - The form wrapper element containing the form and heading.
	 */
	function getNewCommentForm(dataPostId) {
		var formWrapper; // The element wrapped around the form
		var form; 		 // The form element itself

		formWrapper = commentsForm.cloneNode(true);
		form = formWrapper.lastChild;

		helper.addEvent(form, 'submit', app.submitPostComment);
		form.dataset.postid = dataPostId;

		return formWrapper;
	}

	return {
		'render': render,
		'renderNewPage': renderNewPage,
		'requests': requests
	}
	
})(momentumHelperModule, momentumFunctionsModule);