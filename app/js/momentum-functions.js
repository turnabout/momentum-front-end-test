/**
 * Module containing functions pertaining to the app specifically, to be used in the other modules.
 * @param {Object} helper - Helper functions module.
 * @return {Object} publicApi - Api containing references to the module functions.
 */
var momentumFunctionsModule = (function (helper) {
	
	// Object containing references to static, reused DOM elements
	var elems = helper.getAppElems();

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

	return {
		'getActiveContentPage': getActiveContentPage
	}
	
})(momentumHelperModule);