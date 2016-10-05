/**
 * Module containing the code for the Momentum Front End app.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule() {
	
	var user = {};


	/**
	 * Initialize everything.
	 */
	 function init() {
	 	// Attach login function to login form
	 	document.getElementById('login').addEventListener('submit', login);


	 }

	/**
	 * Get JSON data.
	 * @param {String} url - The URL to fetch the JSON from.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function getJSON(url, callback) {

		/**
		 * Parses the JSON file and passes it to a callback function.
		 */
		function returnParsedJSON() {
			var data = JSON.parse(this.responseText);
			callback(data);
		}

		var oReq = new XMLHttpRequest();
		oReq.addEventListener('load', returnParsedJSON);
		oReq.open('GET', url);
		oReq.send();
	}

	/**
	 * Attempt to log user in on form submit.
	 * @param {Event} event - The event.
	 */
	function login(event) {
		var username = document.getElementById('login-field').value;

		if(username) {
			getJSON(`http://jsonplaceholder.typicode.com/users?username=${username}`, function (result) {
				console.log(result);
			});
		}

		event.preventDefault();
	}

	return {
		'getJSON' : getJSON,
		'init' : init,
		'login' : login
	};

})();

momentumModule.init();