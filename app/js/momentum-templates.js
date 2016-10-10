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
	elems = helper.getAppElems();
	requests = helper.getRequests();
	pageTitleBase = document.title;

	/**
	 * Render a dashboard page with some passed-in content.
	 * @param {Array} content - Content to render in the page.
	 * @param {Object} request - Info on the request, including the type, used to select the correct render.
	 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 * @param {Function} callback - Function to call once page is finished rendering.
	*/
	function render(content, request, parent, callback) {
		var renderTemplates;	// The different templates that can be rendered
		
		renderTemplates = {
			'posts' : renderPosts,
			'userAlbums' : renderUserAlbums,
			'album' : renderAlbum,
			'photo' : renderPhoto,
			'post'  : renderPost,
			'user'  : renderUser
		};

		callback = callback || function () {};

		// Empty the parent
		helper.emptyElem(parent);

		elems.dashboardContentPage.dataset.processing = false;

		// Use the correct rendering template function
		renderTemplates[request.type](content, request, parent, callback);

		/**
		 * Render a list of multiple posts.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
		 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderPosts(content, request, parent, callback) {
			var href;			// The href attribute on the post element
			var post;			// Every post element being created
			var postContent;	// Every post content element
			var postTitle;		// Every post title element

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
			for (var entry of content) {

				// Post
				post = helper.createAnchor();
				post.classList.add('list-group-item', 'list-group-item-action');
				post.dataset.id = entry.id;
				post.dataset.req = 'post';

				// Title
				postTitle = document.createElement('h5');
				postTitle.classList.add('list-group-item-heading');
				postTitle.appendChild( document.createTextNode(entry.title) );
				post.appendChild(postTitle);

				// Content
				postContent = document.createElement('p');
				postContent.classList.add('list-group-item-text');
				postContent.appendChild( document.createTextNode(entry.body) );
				post.appendChild(postContent);

				// Handle click on post event
				helper.addEvent(post, 'click', renderNewPage);

				// Append the final post
				parent.appendChild(post);
			}

			afterRender(content, request, parent, callback);
		}

		/**
		 * Render a page containing all the albums belonging to a user.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 	 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderUserAlbums(content, request, parent, callback) {
			var album;				// Element containing an album. Element is clonable
			var albumContentBlock;	// An album overlay, containing the title text
			var albumLink;			// Link leading to the album page
			var albums;				// All of the album thumbnails
			var albumThumb;			// An album's thumbnail
			var albumTitle;			// An album's title
			var newAlbum;			// Album element. Created from cloning the base one, 'album'

			// Set page title
			helper.getApiData(`users/${request.userId}`, function (result) {
				setTitle(`Albums by: ${result.username}`);
			});

			// Albums
			albums = document.createElement('div');
			albums.classList.add('albums');

			// Add albums element to parent, keep reference to it
			parent.appendChild(albums);
			albums = parent.lastChild;

			// Album
			album = helper.createAnchor();
			album.classList.add('card', 'list-group-item-action');

			// Thumbnail
			albumThumb = document.createElement('img');
			albumThumb.classList.add('card', 'album-thumbnail');

			// Title
			albumTitle = document.createElement('h3');
			albumTitle.classList.add('card-title');

			// Overlay
			albumContentBlock = document.createElement('div');
			albumContentBlock.classList.add('card-block');
			albumContentBlock.appendChild(albumTitle);

			// Make up clonable album element
			album.appendChild(albumContentBlock);
			album.appendChild(albumThumb);

			// Loop through every album and append
			for (var entry of content) {
				(function processEntry() {
					var currentEntry = entry;	// Keep reference to the currently looped entry

					helper.getApiData(`albums/${currentEntry.id}/photos`, function (result) {
						albums.appendChild( getAlbumElem(currentEntry.id, result[0].thumbnailUrl, currentEntry.title, album) );
					});
				})();
			}

			afterRender(content, request, parent, callback);

			/**
			 * Clone album element, place content inside and return it.
			 * @param {String} albumId - The album's ID.
			 * @param {String} src - The album's first image's source.
			 * @param {String} title - The album's title.
			 * @param {Object} base - The base dom element object to clone.
			 * @return {Object} elem - The album element.
			 */
			function getAlbumElem(albumId, src, title, base) {
				var album;	// The album element

				album = base.cloneNode(true);
				album.dataset.id = albumId;
				album.dataset.req = 'album';

				// Handle click on album event
				helper.addEvent(album, 'click', renderNewPage);

				// Set src to thumbnail
				album.lastChild.setAttribute('src', src);

				// Set title to heading
				album.firstChild.firstChild.appendChild( document.createTextNode(title) );

				return album;
			}

		}

		/**
		 * Render an album page.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 	 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderAlbum(content, request, parent, callback) {
			var albumText;		// Element containing all text pertaining to the album
			var albumTitle;		// The album's title
			var photo;			// Photo element (anchor)
			var photoImg;		// Photo image element
			var photos;			// Element containing all photos

			// Set the title
			setTitle(content.title);

			// Photos
			photos = document.createElement('div');
			photos.classList.add('photos', 'card', 'card-block', 'post');

			// Append photos to parent, but keep reference to it
			parent.appendChild(photos);
			photos = parent.lastChild;

			// Photo image
			photoImg = document.createElement('img');

			// Photo
			photo = helper.createAnchor();
			photo.appendChild(photoImg);
			photo.classList.add('photo');

			// Text elem
			albumText = document.createElement('div');
			albumText.classList.add('album-text');

			// Title elem
			albumTitle = document.createElement('h3');
			albumTitle.classList.add('card-title', 'title');
			albumTitle.appendChild( document.createTextNode(content.title) );
			albumText.appendChild(albumTitle);

			// Add the user element
			addUser(function () {
				photos.appendChild(albumText);
				
				// Loop through album photos
				helper.getApiData(`albums/${content.id}/photos`, function (result) {
					for (var entry of result) {
						photos.appendChild( getPhotoElem(entry.id, entry.thumbnailUrl, photo) );
					}
					afterRender(content, request, parent, callback);
				});
			});

			/**
			 * Clone photo element, place content inside and return it.
			 * @param {String} photoId - The photo's ID.
			 * @param {String} src - The photo's image's source.
			 * @param {Object} base - The base dom element object to clone.
			 * @return {Object} elem - The album element.
			 */
			function getPhotoElem(photoId, src, base) {
				var photo;	// Photo element

				photo = base.cloneNode(true);

				photo.dataset.id = photoId;
				photo.dataset.req = 'photo';

				// Handle click on photo
				helper.addEvent(photo, 'click', renderNewPage);

				photo.firstChild.setAttribute('src', src);

				return photo;
			}

			/**
			 * Add the user to the album element.
			 * @param {Function} callback - Function to call after user is added.
			 */
			function addUser(callback) {
				var userElem;		// The user's element
				var userAround;		// Element wrapping around user element

				helper.getApiData(`users/${content.userId}`, function (result) {

					// User
					userElem = helper.createAnchor(result.username);
					userElem.classList.add('post-user');
					userElem.dataset.id = content.userId;
					userElem.dataset.req = 'user';

					// User click event handler
					helper.addEvent(userElem, 'click', renderNewPage);

					// User wrapper
					userAround = document.createElement('div');
					userAround.classList.add('user-around');
					userAround.appendChild( document.createTextNode('Posted by: ') );
					userAround.appendChild(userElem);
					
					albumText.appendChild(userAround);

					callback();
				});
			}
		}

		/**
		 * Render a single photo page.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
	 	 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderPhoto(content, request, parent, callback) {
			var photoImg;	// The photo page image
			var photo;		// Element containing the whole photo page
			var title;		// The photo page title

			setTitle(content.title);

			// Photo page container
			photo = document.createElement('div');
			photo.classList.add('card', 'card-block', 'post', 'single-photo');

			// Title
			title = document.createElement('h3');
			title.classList.add('card-title', 'title');
			title.appendChild( document.createTextNode(content.title) );

			// Image
			photoImg = document.createElement('img');
			photoImg.setAttribute('src', content.url);

			photo.appendChild(title);
			photo.appendChild(photoImg);

			// Append
			parent.appendChild(photo);
			afterRender(content, request, parent, callback);
		}

		/**
		 * Render a single post.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
		 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderPost(content, request, parent, callback) {
			var postElem;			// The post's main element
			var postContentElem;	// The post's content element
			var postTitleElem;		// The post's title element

			setTitle(content.title);

			// Post
			postElem = document.createElement('div');
			postElem.classList.add('card', 'card-block', 'post');

			// Title
			postTitleElem = document.createElement('h3');
			postTitleElem.innerHTML = content.title;
			postTitleElem.classList.add('card-title', 'title');

			// Content
			postContentElem = document.createElement('p');
			postContentElem.innerHTML = content.body;
			postContentElem.classList.add('card-text', 'content');

			// Add all the elements
			postElem.appendChild(postTitleElem);

			addUser(function () {
				parent.appendChild(postElem);

				addComments(function () {
					afterRender(content, request, parent, callback);
				});
			});
			
			/**
			 * Add the user to the post element.
			 * @param {Function} callback - Function to call after user is added.
			 */
			function addUser(callback) {
				var userElem;		// The user's element
				var userAround;		// Element wrapping around user element

				helper.getApiData(`users/${content.userId}`, function (result) {

					// User
					userElem = helper.createAnchor(result.username);
					userElem.classList.add('post-user');
					userElem.dataset.id = content.userId;
					userElem.dataset.req = 'user';

					// User click event handler
					helper.addEvent(userElem, 'click', renderNewPage);

					// User wrapper
					userAround = document.createElement('div');
					userAround.classList.add('user-around');
					userAround.appendChild( document.createTextNode('Posted by: ') );
					userAround.appendChild(userElem);
					
					postElem.appendChild(userAround);
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
					commentsElemTitle.appendChild( document.createTextNode( getCommentsTitleText(result.length) ) );
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
				});

				/**
				 * Get the appropriate title for the comments amount title.
				 * @param {Integer} commentsAmount - The amount of comments.
				 * @return {Object} title - The title text.
				 */
				function getCommentsTitleText(commentsAmount) {
					if (commentsAmount === 1) {
						return '1 comment';
					} else if (commentsAmount > 1) {
						return `${commentsAmount} comments`;
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
			}
		}

		/**
		 * Render a user profile page.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
		 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function renderUser(content, request, parent, callback) {
			var userEmailElem;		// Anchor containing the user's email
			var userElem;			// The main element wrapping around the user info
			var userInfo;			// Element containing all the user info
			var userTitle;			// The user profile page title
			var userWebsiteElem;	// Anchor containing the user's website

			setTitle(`User: ${content.username}`);

			// User
			userElem = document.createElement('div');
			userElem.classList.add('card', 'card-block', 'user');

			// Title
			userTitle = document.createElement('h3');
			userTitle.classList.add('card-title', 'title');
			userTitle.appendChild( document.createTextNode(content.username) );

			// Email
			userEmailElem = helper.createAnchor(content.email, `mailto:${content.email}`);

			// Website
			userWebsiteElem = helper.createAnchor(content.website, `http://${content.website}`);
			userWebsiteElem.setAttribute('target', '_blank');

			// Info
			userInfo = document.createElement('ul');
			userInfo.classList.add('user-info');

			userInfo.appendChild( createUserInfoPair('Name', content.name) );
			userInfo.appendChild( createUserInfoPair('Email', userEmailElem) );
			userInfo.appendChild( createUserInfoPair('Phone', content.phone) );
			userInfo.appendChild( createUserInfoPair('Website', userWebsiteElem) );
			userInfo.appendChild( createUserInfoPair('City', content.address.city) );
			userInfo.appendChild( createUserInfoPair('Company', content.company.name) );

			// Append everything
			userElem.appendChild(userTitle);
			userElem.appendChild(userInfo);
			parent.appendChild(userElem);

			afterRender(content, request, parent, callback);

			/**
			 * Create an element containing a name/info pair of the user info.
			 * @param {String} name - The name of the info.
			 * @param {String|Object} value - The value of the info. Can be a string or a DOM element object.
			 * @return {Object} infoElem - Element containing the infos.
			 */
			function createUserInfoPair(name, value) {
				var infoElem;	// Element containing the info
				var infoName;	// Element containing info name
				var infoValue;	// Element containing info value

				infoElem = document.createElement('li');

				infoName = document.createElement('span');
				infoName.classList.add('name');
				infoName.appendChild( document.createTextNode(name) );

				infoValue = document.createElement('span');
				infoValue.classList.add('value');


				if (typeof value === 'string') {
					infoValue.appendChild( document.createTextNode(value) );
				} else {
					infoValue.appendChild(value);
				}

				infoElem.appendChild(infoName);
				infoElem.appendChild(infoValue);

				return infoElem;
			}
		}

		/**
		 * Function executed at the end of the main render function.
		 * @param {Array} content - Content to render in the page.
		 * @param {Object} request - Info on the request, including the type, used to select the correct render.
		 * @param {Object} parent - The dashboard page in which the content should be rendered.
		 * @param {Function} callback - Function to call once page is finished rendering.
		 */
		function afterRender(content, request, parent, callback) {
			parent.classList.add('active');

			// Set the dashboard page to non-busy state
			app.setDbpBusyState(false);

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
	 * @param {Event} event - The event.
	 */
	function renderNewPage(event) {
		var currentContentPage; // The currently active content page
		var nextContentPage; 	// The content page after the current one
		var request;			// The request object to use to render the page

		event.preventDefault();

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

		// Set the content page state to "processing"
		app.setDbpBusyState(true);

		// Request the content and render page with it
		helper.getApiData(request.query, function(result) {
			render(result, request, nextContentPage, function () {
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