import ElementUtils from "../utils/color"

/**
 * Base class for all UI elements providing common functionality
 * @class BaseElement
 */
export default class BaseElement {
    /**
     * Creates a new BaseElement instance
     * @param {number} x - X position as percentage
     * @param {number} y - Y position as percentage  
     * @param {number} width - Width as percentage
     * @param {number} height - Height as percentage
     * @param {*} value - Initial value of the element
     * @param {BaseElement|null} parent - Parent element
     * @param {string} type - Element type identifier
     */
    constructor(x, y, width, height, value, parent, type) {
        Object.assign(this, { x, y, width, height, value, parent, type, colorScheme: null, eventHandlers: {} })
    }

    /**
     * Sets the color scheme for this element
     * @param {Object} scheme - Color scheme object
     * @returns {BaseElement} This element for chaining
     */
    setColorScheme(scheme) {
        return this.colorScheme = scheme.Sin, this
    }
    
    /**
     * Registers an event handler for the specified event
     * @param {string} event - Event name to listen for
     * @param {Function} handler - Handler function to execute
     * @returns {BaseElement} This element for chaining
     */
    on(event, handler) {
        return this.eventHandlers[event] = handler, this
    }
    
    /**
     * Triggers an event with optional arguments
     * @param {string} event - Event name to trigger
     * @param {...*} args - Arguments to pass to the event handler
     * @returns {*} Return value from event handler
     */
    _trigger(event, ...args) {
        return this.eventHandlers[event]?.(...args) 
    }
    
    /**
     * Gets a Java Color object from color scheme path
     * @param {string} path - Dot-separated path to color in scheme
     * @returns {java.awt.Color} Java Color object
     */
    _getColor(path) { 
        return ElementUtils.getJavaColor(path.split('.').reduce((acc, curr) => acc[curr], this.colorScheme.element))
    }
    
    /**
     * Gets a value from color scheme path
     * @param {string} path - Dot-separated path to value in scheme
     * @returns {*} Value from color scheme
     */
    _getValue(path) {
        return path.split('.').reduce((acc, curr) => acc[curr], this.colorScheme)
    }
}