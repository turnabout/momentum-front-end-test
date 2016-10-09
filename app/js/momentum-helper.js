/**
 * Module containing helper functions to be imported and used in main module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumHelperModule = (function momentumHelperModule() {

	// Variable holding previously fetched data. Used to avoid doing a GET request more than once
	var data = {};
	var apiUrl = '';

	/**
	 * Get data from API.
	 * @param {String} request - The API request.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function getApiData(request, callback) {

		// If data already stored, skip sending GET request and just execute the callback with it directly
		if (request in data) {
			callback(data[request]);
			return;
		}

		// Data does not already exist, launch GET request to API
		var http = new XMLHttpRequest();

		addEvent(http, 'load', function returnParsedJSON() {
			var result = JSON.parse(http.responseText);

			// Store data in global data object to more easily fetch again later
			if (result.length > 0 && !(request in data)) {
				data[request] = result;
			}
			
			callback(result);
		});

		http.open('GET', `${apiUrl}/${request}`);
		http.send();
	}

	/**
	 * Post data to the API.
	 * @param {String} request - The API request.
	 * @param {String} params - The parameters to send.
	 * @param {String|Boolean} dataKey - The data key the results should be appended to (if it exists).
	 * @param {Function} callback - The function to call once the data is posted.
	 */
	function postApiData(request, params, dataKey = false, callback) {
		var http = new XMLHttpRequest();
		callback = callback || function() {};

		http.open("POST", `${apiUrl}/${request}`, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

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

		element.dataset.animating = true;
		animationNames.push('animated');
		DOMTokenList.prototype.add.apply(element.classList, animationNames);

		addAnimEventOnce(element, 'animationend', function afterAnimationEnd(e) {
			DOMTokenList.prototype.remove.apply(element.classList, animationNames);
			element.dataset.animating = false;
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
			element.attachEvent(`on${type}`, callback);
		} else {
			element["on" + type] = callback;
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
			element["on" + type] = null;
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
			for (var d of data) {
				if (element.dataset[d] === 'true') {
					return true;
				}
			}
			return false;
		}
		return (element.dataset[data] === 'true');
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
		var matchingElements = [];
		var allElements = document.getElementsByTagName('*');
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
		var nextSibling = element.nextSibling;

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
		var previousSibling = element.previousSibling;

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
		var anchor = document.createElement('a');
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
		var children = form.children;
		for (var elem of form) {
			elem.setAttribute('disabled', 'true');
		}
	}

	/**
	 * Enable a form and all its inputs/buttons.
	 * @param {Object} form - The form element.
	 */
	function enableForm(form) {
		var children = form.children;
		for (var elem of form) {
			elem.removeAttribute('disabled');
		}
	}

	/**
	 * Clear a form of all its previously entered data.
	 * @param {Object} form - The form element.
	 */
	function clearForm(form) {
		var children = form.children;
		for (var elem of form) {
			if (elem.getAttribute('type') !== 'submit') {
				elem.value = '';
			}
		}
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
		'getElemAfter' : getElemAfter,
		'getElemBefore' : getElemBefore,
		'getElemsWithAttr' : getElemsWithAttr,
		'isElem' : isElem,
		'postApiData' : postApiData,
		'removeEvent' : removeEvent,
		'setApiUrl' : setApiUrl
	};
	
})();