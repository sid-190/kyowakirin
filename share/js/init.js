/**
 * @description Initialize JavaScript management.
**/
(function (doc) {
    'use strict';

    var docElement = doc.documentElement;

    if (docElement && docElement.nodeType === 1) {
        docElement.classList.add('js-enable');
    }

    docElement = null;
})(window.document);