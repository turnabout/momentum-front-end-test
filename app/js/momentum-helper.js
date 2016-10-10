/**
 * Module containing helper functions to be imported and used in main module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumHelperModule = (function momentumHelperModule() {

	// Variable holding previously fetched data. Used to avoid doing a GET request more than once
	var data = {};
	var apiUrl = '';

	/**
	 * Do a GET request.
	 * @param {String} request - The API request.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function doRequest(request, callback) {
		var url;	// Where to send GET request
		var xhr;	// XHR object

		url = `${apiUrl}/${request}`;
		xhr = new XMLHttpRequest();

		// Support for multiple browsers
		if ('withCredentials' in xhr) {

			// XHR for Chrome/Firefox/Opera/Safari.
			xhr.open('GET', url, true);
		} else if (typeof XDomainRequest != 'undefined') {

			// XDomainRequest for IE.
			xhr = new XDomainRequest();
			xhr.open('GET', url);
		} else {

			// CORS not supported.
			xhr = null;
		}

		if (!xhr) {
			return;
		}

		// Response handlers
		xhr.onload = function() {
			callback(xhr.responseText);
		}

		xhr.onerror = function() {};

		// These blank handlers need to be set to fix ie9 http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
		xhr.onprogress = function () {};
		xhr.ontimeout = function () {};

		// Send request wrapped in timeout to fix ie9
		setTimeout(function () {
			xhr.send();
		}, 0);
	}


	/**
	 * Get data from API.
	 * @param {String} request - The API request.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function getApiData(request, callback) {
		var http;		// Http request
		var result;		// Http request result

		// If data already stored, skip sending GET request and just execute the callback with it directly
		if (request in data) {
			callback(data[request]);
			return;
		}

		// Data does not already exist, launch GET request to API
		doRequest(request, function handleParsedJSON(result) {
			result = JSON.parse(result);

			// Store data in global data object to more easily fetch again later
			if (result.length > 0 && !(request in data)) {
				data[request] = result;
			}
			
			callback(result);
		});










/*		http = new XMLHttpRequest();

		addEvent(http, 'load', function returnParsedJSON() {
			result = JSON.parse(http.responseText);

			// Store data in global data object to more easily fetch again later
			if (result.length > 0 && !(request in data)) {
				data[request] = result;
			}
			
			callback(result);
		});

		http.open('GET', `${apiUrl}/${request}`);
		http.send();*/
	}

/*

*/




	/**
	 * Post data to the API.
	 * @param {String} request - The API request.
	 * @param {String} params - The parameters to send.
	 * @param {String|Boolean} dataKey - The data key the results should be appended to (if it exists).
	 * @param {Function} callback - The function to call once the data is posted.
	 */
	function postApiData(request, params, dataKey = false, callback) {
		var http;		// Http request

		http = new XMLHttpRequest();
		callback = callback || function() {};

		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 201) {
				var result = JSON.parse(http.responseText);

				// Append the result to data if needed
				if (dataKey && dataKey in data) {
					data[dataKey].push(result);
				}
				callback(result);
			}
		}

		http.open('POST', `${apiUrl}/${request}`, true);
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		http.send(params);
	}

	/**
	 * Animate an element.
	 * @param {Object} element - The element to fade.
	 * @param {Array} animationNames - Array containing the class(es) to add for the animation.
	 * @param {Function} callback - Function to call once fade is done.
	 */
	function animateElem(element, animationNames, callback) {
		callback = callback || function() {};

		setData(element, 'animating', true);

		animationNames.push('animated');
		
		for (var i = 0; i < animationNames.length; i++) {
			element.classList.add(animationNames[i]);
		}

		addAnimEventOnce(element, 'animationend', function afterAnimationEnd(e) {
			for (var j = 0; j < animationNames.length; j++) {
				element.classList.remove(animationNames[j]);
			}

			setData(element, 'animating', false);

			callback();
		});

		/**
		 * Add a one-time event for the duration of an animation.
		 * @param {Object} element - The target element.
		 * @param {String} type - The type of the event.
		 * @param {Function} callback - The callback exeto attach to the event.
		 */
		function addAnimEventOnce(element, type, callback) {
			addEvent(element, type, function fn(event) {
				removeEvent(element, type, fn);
				callback(event);
			});
		}
	}

	/**
	 * 'addEventListener' polyfill.
	 * @param {Object} element - The element to add the event listener to.
	 * @param {Event} type - The event type.
	 * @param {Function} callback - The event listener function callback.
	 */
	function addEvent(element, type, callback) {
		if (element.addEventListener) {
			element.addEventListener(type, callback, false);
		} else if (element.attachEvent) {
			element.attachEvent(`on${type}`, function(){
				return callback.apply(element, arguments);
			});
		} else {
			element['on' + type] = callback;
		}
	}

	/**
	 * 'removeEventListener' polyfill.
	 * @param {Object} element - The element to add the event listener to.
	 * @param {Event} type - The event type.
	 * @param {Function} callback - The event listener function callback.
	 */
	function removeEvent(element, type, callback) {
		if (element.removeEventListener) {
			element.removeEventListener(type, callback, false);
		} else if (element.detachEvent) {
			element.detachEvent(`on${type}`, callback);
		} else {
			element['on' + type] = null;
		}
	}

	/**
	 * Returns the boolean value of an element's data attribute(s).
	 * @param {Object} element - The element.
	 * @param {String|Array} data - String of data attribute, or array of all data attributes to check.
	 * @param {Boolean} dataTruth - Whether the data attribute evaluates to true.
	 */
	function isElem(element, data) {
		if (data.constructor === Array) {
			for (var i = 0; i < data.length; i++) {
				if (getData(element, [data[i]]) === 'true') {
					return true;
				}
			}
			
			return false;
		}
		return (getData(element, [data]) === 'true');
	}
	
	/**
	 * Set the module's apiUrl variable.
	 * @param {String} url - The base api url.
	 */
	function setApiUrl(url) {
		apiUrl = (apiUrl) ? apiUrl : url;
	}

	/**
	 * Get all elements that have an attribute.
	 * @param {String} attribute - The attribute to filter elements by.
	 * @return {Array} elements - All elements with that attribute.
	 */
	function getElemsWithAttr(attribute) {
		var matchingElements;		// Elements that are matching
		var allElements;			// Every element

		matchingElements  = [];
		allElements = document.getElementsByTagName('*');

		for (var i = 0, n = allElements.length; i < n; i++) {
			if (allElements[i].getAttribute(attribute) !== null) {
				matchingElements.push(allElements[i]); // Element exists with attribute. Add to array.
			}
		}

		return matchingElements;
	}

	/**
	 * Get next non-text element.
	 * @param {Object} element - The element from which to start.
	 * @return {Object} next - The element next of the starting one.
	 */
	 function getElemAfter(element) {
		var nextSibling;	// The next element

		nextSibling = element.nextSibling;

		// Skip text nodes
		while (nextSibling != null && nextSibling.nodeType == 3) {
			nextSibling = nextSibling.nextSibling;
		}

		return nextSibling;
	}

	/**
	 * Get previous non-text element.
	 * @param {Object} element - The element from which to start.
	 * @return {Object} next - The element next of the starting one.
	 */
	 function getElemBefore(element) {
	 	var previousSibling;	// The previous element

		previousSibling = element.previousSibling;

		// Skip text nodes
		while (previousSibling != null && previousSibling.nodeType == 3) {
			previousSibling = previousSibling.previousSibling;
		}

		return previousSibling;
	}

	/**
	 * Empty a DOM element of all its children.
	 * @param {Object} element - The element to empty.
	 */
	function emptyElem(element) {
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
	}

	/**
	 * Create an anchor tag element and return it.
	 * @param {String} text - Text to place inside the anchor.
	 * @param {String} href - Text to place inside href attribute.
	 * @return {Object} elem - The anchor tag element.
	*/
	function createAnchor(text, href) {
		var anchor;	// Anchor element

		anchor = document.createElement('a');
		anchor.href = href || '#';
		
		if (text) {
			anchor.appendChild(document.createTextNode(text));
		}

		return anchor;
	}

	/**
	 * Disable a form and all its inputs/buttons.
	 * @param {Object} form - The form element.
	 */
	function disableForm(form) {
		var children;	// The form children

		children = form.children;

		for (var i = 0; i < children.length; i++) {
			children[i].setAttribute('disabled', 'true');
		}
	}

	/**
	 * Enable a form and all its inputs/buttons.
	 * @param {Object} form - The form element.
	 */
	function enableForm(form) {
		var children;	// The form children

		children = form.children;

		for (var i = 0; i < children.length; i++) {
			children[i].setAttribute('disabled', 'true');
			children[i].removeAttribute('disabled');
		}
	}

	/**
	 * Clear a form of all its previously entered data.
	 * @param {Object} form - The form element.
	 */
	function clearForm(form) {
		var children;	// The form children

		children = form.children;

		for (var i = 0; i < children.length; i++) {
			if (children[i].getAttribute('type') !== 'submit') {
				children[i].value = '';
			}
		}
	}

	/**
	 * Set an element's data attribute. Polyfill for IE8.
	 * @param {Object} elem - The element.
	 * @param {String} data - The data attribute to set a value to.
	 * @param {String} value - The value.
	 */
	function setData(elem, data, value) {
/*		console.log('setting data');
		console.log(elem);
		console.log(data);
		console.log(value);
		console.log('setting data');*/
		elem.setAttribute(`data-${data}`, value);
	}

	/**
	 * Get an element's data attribute. Polyfill for IE8.
	 * @param {Object} elem - The element.
	 * @param {String} data - The data attribute to get the value from.
	 * @return {String} value - The data attribute's value.
	 */
	function getData(elem, data) {
/*		console.log('getting data');
		console.log(elem);
		console.log(data);
		console.log('getting data');*/
		return elem.getAttribute(`data-${data}`);
	}

	/**
	* Get the different requests to use to render content pages.
	* @return {Object} reqs - The requests.
	*/
	function getRequests() {
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
					'type' 			: 'userAlbums',
					'userId'		: userId
				};
			},
			'album': function (albumId) { 
				return {
					'query' 		: `albums/${albumId}`,
					'type' 			: 'album'
				};
			},
			'photo': function (photoId) { 
				return {
					'query' 		: `photos/${photoId}`,
					'type' 			: 'photo'
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
		'addEvent' : addEvent,
		'animateElem' : animateElem,
		'clearForm' : clearForm,
		'createAnchor' : createAnchor,
		'disableForm' : disableForm,
		'emptyElem' : emptyElem,
		'enableForm' : enableForm,
		'getApiData' : getApiData,
		'getAppElems' : getAppElems,
		'getData' : getData,
		'getElemAfter' : getElemAfter,
		'getElemBefore' : getElemBefore,
		'getElemsWithAttr' : getElemsWithAttr,
		'getRequests' : getRequests,
		'isElem' : isElem,
		'postApiData' : postApiData,
		'removeEvent' : removeEvent,
		'setApiUrl' : setApiUrl,
		'setData' : setData
	};
	
})();