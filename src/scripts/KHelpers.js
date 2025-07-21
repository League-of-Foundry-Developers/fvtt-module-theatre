/**
 * ============================================================
 * KHelpers Module
 *
 * Encapsulates a few handy helpers
 * ============================================================
 */
const KHelpers = {
    hasClass(el, className) {
        return el.classList
            ? el.classList.contains(className)
            : new RegExp("\\b" + className + "\\b").test(el.className);
    },

    addClass(el, className) {
        if (el.classList) el.classList.add(className);
        else if (!KHelpers.hasClass(el, className)) el.className += " " + className;
    },

    addClasses(el, classNames) {
        if (el.classList) {
            classNames.split(" ").forEach((className) => el.classList.add(className));
        } else {
            classNames.split(" ").forEach((className) => {
                if (!KHelpers.hasClass(el, className)) el.className += " " + className;
            });
        }
    },

    removeClass(el, className) {
        if (el.classList) el.classList.remove(className);
        else el.className = el.className.replace(new RegExp("\\b" + className + "\\b", "g"), "");
    },

    offset(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
    },

    style(el) {
        return el.currentStyle || window.getComputedStyle(el);
    },

    insertAfter(el, referenceNode) {
        referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
    },

    insertBefore(el, referenceNode) {
        referenceNode.parentNode.insertBefore(el, referenceNode);
    },

    /**
     * Helper to grab a parent class via CSS ClassName
     *
     * @param elem (HTMLElement) : the element to start from.
     * @param cls (String) : The class name to search for.
     * @param depth (Number) : The maximum height/depth to look up.
     * @returns (HTMLElement) : the parent class if found, or null if
     *                          no such parent exists within the specified
     *                          depth.
     */
    seekParentClass(elem, cls, depth) {
        depth = depth || 5;
        let el = elem;
        let targ = null;
        for (let i = 0; i < depth; ++i) {
            if (!el) break;
            if (KHelpers.hasClass(el, cls)) {
                targ = el;
                break;
            } else el = el.parentNode;
        }
        return targ;
    },
};

export default KHelpers;
