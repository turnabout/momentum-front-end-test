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
		var loginField = document.getElementById('login-field');
		var loginAlert = document.getElementById('login-alert');
		var loginBox = document.getElementById('login-box');
		var loginBtn = document.getElementById('login-btn');
		var username = loginField.value;

		if(username) {

			// Disable the form
			loginField.setAttribute('disabled', 'disabled');
			loginBtn.setAttribute('disabled', 'disabled');
			
			getJSON(`http://jsonplaceholder.typicode.com/users?username=${username}`, function (result) {
				if(result.length > 0) {
					// Username exists, clear any previous error and log in
					user = result[0];
				} else {
					// Username does not exist, display error message
					loginAlert.innerHTML = `Username "${username}" does not exist.`;
					loginAlert.classList.add('active');
					loginBox.classList.add('error');

					// Enable form and focus back on field
					loginField.removeAttribute('disabled', 'disabled');
					loginBtn.removeAttribute('disabled', 'disabled');
					loginField.focus();

				}
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