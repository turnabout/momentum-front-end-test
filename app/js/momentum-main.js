/**
 * Main module containing the code for the Momentum Front End app.
 * @param {Object} helper - Helper functions module.
 * @param {Object} app - App related functions.
 * @param {Object} dbp - Module to render dashboard pages.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumModule = (function momentumModule(helper, app, dbp) {

	'use strict'

	var elems = helper.getAppElems(); // Static, reused DOM elements

	/**
	 * Initialize all the things!
	 * @param {String} url - Base URL from which the API data is fetched.
	 */
	 function init(url) {

	 	// Set the api url
	 	helper.setApiUrl(url);

	 	// Give 'momentum-templates' module reference to 'momentum-functions'
	 	app.getDbpDependency(dbp);

	 	// Add events to each dashboard menu items which request appropriate content and renders a page with it
	 	for (var i = 0; i < elems.dashboardMenuItems.length; i++) {
	 		helper.addEvent(elems.dashboardMenuItems[i], 'click', app.handleDashboardMenuClick);
	 	}
	 	
	 	// Add login/out events
	 	helper.addEvent(document.getElementById('login'), 'submit', app.authenticate);
	 	helper.addEvent(document.getElementById('logout'), 'click', app.logout);

	 	// Secondary dbp previous/next buttons
	 	helper.addEvent(elems.contentBack, 'click', app.dbpPreviousClick);
	 	helper.addEvent(elems.contentNext, 'click', app.dbpNextClick);
	 }

	return {
		'init' : init
	};

})(momentumHelperModule, momentumAppModule, momentumTemplatesModule);