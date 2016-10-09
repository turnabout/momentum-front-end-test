/**
 * Module containing functions pertaining to the app specifically, to be used in the other modules.
 * @param {Object} helper - Helper functions module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumFunctionsModule = (function (helper) {

	// Object containing references to static, reused DOM elements
	var elems = helper.getAppElems();

	var pageTitleBase = document.title;

	/**
	 * Get the currently active and displayed content page.
	 * @return {Object||Boolean} element - The element if one is shown, or false.
	 */
	function getActiveContentPage() {
		for (var elem of helper.getElemsWithAttr('data-currentcontent')) {
			if (helper.isElem(elem, 'currentcontent')) {
				return elem;
			}
		}
		return false;
	}

	/**
	 * Change the content page.
	 * @param {String} direction - 'prev' or 'next'.
	 * @param {Function} callback - Functions to call after page is changed.
	 */
	function dbpChangePage(direction, callback) {
		var currentContentElem = getActiveContentPage();
		callback = callback || function(){};

		// Make current page inactive
		currentContentElem.classList.remove('active');
		currentContentElem.dataset.currentcontent = false;

		switch (direction) {
		case 'previous':
			var newPage = helper.getElemPreviousOf(currentContentElem);
			newPage.classList.add('active');
			newPage.dataset.currentcontent = true;

			// Set next btn to active
			elems.contentNext.removeAttribute('disabled');
			afterChange();
			break;

		case 'next':
			var newPage = helper.getElemNextOf(currentContentElem);

			newPage.classList.add('active');
			newPage.dataset.currentcontent = true;

			// If reached the end, make btn disabled
			if (helper.getElemNextOf(newPage) == null) {
				elems.contentNext.setAttribute('disabled', true);
			}

			afterChange();
			break;

		default:
			break;
		}

		/**
		 * Function executed after the page change.
		 */
		function afterChange() {

			// Set the title
			elems.dashboardContentTitle.innerHTML = newPage.dataset.title;
			document.title = `${pageTitleBase} - ${newPage.dataset.title}`;
			callback();
		}
	}

	return {
		'getActiveContentPage': getActiveContentPage,
		'dbpChangePage': dbpChangePage
	}
	
})(momentumHelperModule);