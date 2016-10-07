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
		if(request in data) {
			callback(data[request]);
			return;
		}

		// Data does not already exist, launch GET request to API
		var oReq = new XMLHttpRequest();

		addEvent(oReq, 'load', function returnParsedJSON() {
			var result = JSON.parse(this.responseText);

			// Store data in global data object to more easily fetch again later
			if(result.length > 0 && !(request in data)) {
				data[request] = result;
			}
			
			callback(result);
		});

		oReq.open('GET', `${apiUrl}/${request}`);
		oReq.send();
	}

	/**
	 * Animate an element.
	 * @param {Object} element - The element to fade.
	 * @param {String} animationName - The name of the animation. Translates to a css class.
	 * @param {Function} callback - Function to call once fade is done.
	 */
	function animateElem(element, transitionName, callback) {
		callback = callback || function() {};
		element.classList.add(transitionName, 'animated');

		addEventOnce(element, 'animationend', function afterAnimationEnd(e) {
			element.classList.remove(transitionName, 'animated');
			callback();
		});

		/**
		 * Add a one-time event listener.
		 * @param {Object} element - The target element.
		 * @param {String} type - The type of the event.
		 * @param {Function} callback - The callback to attach to the event.
		 */
		function addEventOnce(element, type, callback) {
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
			element.attachEvent("on" + type, callback);
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
			element.detachEvent("on" + type, callback);
		} else {
			element["on" + type] = null;
		}
	}

	/**
	 * Set the module's apiUrl variable.
	 * @param {String} url - The base api url.
	 */
	 function setApiUrl(url) {
	 	apiUrl = (apiUrl) ? apiUrl : url;
	 }


	return {
		'getApiData' : getApiData,
		'animateElem' : animateElem,
		'addEvent' : addEvent,
		'removeEvent' : removeEvent,
		'setApiUrl' : setApiUrl
	};
	
})();