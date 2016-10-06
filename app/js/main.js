/**
 * Module containing the code for the Momentum Front End app.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule() {
	
	var user = {};
	var content = {};
	var apiUrl = '';


	/**
	 * Initialize everything.
	 * @param {String} url - Base URL from which the API info is fetched.
	 */
	 function init(url) {
	 	apiUrl = url;

	 	document.getElementById('login').addEventListener('submit', login);
	 	document.getElementById('logout').addEventListener('click', logout);
	 }

	/**
	 * Get JSON data from the API.
	 * @param {String} request - The request.
	 * @param {Function} callback - The function to call once the JSON data is fetched.
	 */
	function getJSON(request, callback) {
		var oReq = new XMLHttpRequest();

		oReq.addEventListener('load', function returnParsedJSON() {
			callback( JSON.parse(this.responseText) );
		});

		oReq.open('GET', `${apiUrl}/${request}`);
		oReq.send();
	}

	/**
	 * Attempt to log in user on form submit.
	 * @param {Event} event - The event.
	 */
	function login(event) {

		// Store references to used elements
		var elems = {
			loginField: document.getElementById('login-field'),
			loginAlert: document.getElementById('login-alert'),
			loginBox: document.getElementById('login-box'),
			loginBtn: document.getElementById('login-btn'),
			loginPage: document.getElementById('login-page')
		};

		var username = elems.loginField.value;

		if(username) {
			// Disable the form
			elems.loginField.setAttribute('disabled', 'disabled');
			elems.loginBtn.setAttribute('disabled', 'disabled');

			getJSON(`users?username=${username}`, function processResult(result) {

				if(result.length > 0) {
					// Username exists, clear any previous error and show the "dashboard"
					user = result[0];
					elems.loginAlert.classList.remove('active');
					elems.loginBox.classList.remove('error');
					
					// Fade login page out and load dashboard
					animateElem(elems.loginPage, 'fadeOut', function switchToDashboard() {
						elems.loginPage.classList.remove('active');
						prepareDashboard(user);
					});

				} else {
					// Username does not exist, display error message
					elems.loginAlert.innerHTML = `Username "${username}" does not exist.`;
					elems.loginAlert.classList.add('active');
					elems.loginBox.classList.add('error');

					// Enable form and focus back on field
					elems.loginField.removeAttribute('disabled', 'disabled');
					elems.loginBtn.removeAttribute('disabled', 'disabled');
					elems.loginField.focus();
				}
				
			});
		}
		event.preventDefault();
	}

	/**
	* Log the user out and return to login page.
	* @param {Event} event - The event.
	*/
	function logout(event) {
		var dashboard = document.getElementById('dashboard'),
			loginPage = document.getElementById('login-page'),
			loginField = document.getElementById('login-field'),
			loginBtn = document.getElementById('login-btn');

		user = {};

		// Fade dashboard out, login back in
		animateElem(dashboard, 'fadeOut', function () {
			dashboard.classList.remove('active');
			loginField.removeAttribute('disabled', 'disabled');
			loginField.value = '';
			loginBtn.removeAttribute('disabled', 'disabled');
			loginPage.classList.add('active');
			loginField.focus();
		});

		event.preventDefault();
	}

	/**
	 * Prepare the "dashboard" for the logged-in user.
	 * @param {Object} user - The current user.
	 */
	function prepareDashboard(user) {

		// Display dashboard
		document.getElementById('dashboard').classList.add('active');
	}

	/**
	 * Animate an element.
	 * @param {Object} element - The element to fade.
	 * @param {String} animationName - The name of the animation. Translates to a css class.
	 * @param {Function} callback - Function to call once fade is done.
	 */
	function animateElem(element, transitionName, callback) {
		element.classList.add(transitionName, 'animated');

		element.addEventListener('animationend', function afterAnimationEnd(e) {
			element.classList.remove(transitionName, 'animated');
			callback();
		});
	}

	return {
		'getJSON' : getJSON,
		'init' : init,
		'login' : login
	};

})();

momentumModule.init('http://jsonplaceholder.typicode.com');