var momentumModule = (function () {
	
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
	* Attempt to log user in.
	* @param {String} username - The user's name.
	* @return {Boolean} - Whether the login is successful.
	*/
	function login(username) {
		getJSON(`http://jsonplaceholder.typicode.com/users?username=${username}`, function (result) {
			console.log(result);
		});
	}

	return {
		'getJSON' : getJSON,
		'login' : login
	};

})();

momentumModule.login('Bret');