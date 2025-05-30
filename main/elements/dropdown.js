import BaseElement from "./base"
import { UIRoundedRectangle, UIText, ScrollComponent, CenterConstraint, PixelConstraint } from "../../../Elementa"

/**
 * Dropdown selection element for choosing from multiple options
 * @class DropdownElement
 * @extends BaseElement
 * @fires change - When selection changes, passes selected index
 */
export default class DropdownElement extends BaseElement {
    /**
     * Creates a new DropdownElement
     * @param {string[]} [options=[]] - Array of option strings to display
     * @param {number} [selected=0] - Index of initially selected option
     */
    constructor(options = [], selected = 0) {
        super(0, 0, 0, 0, selected, null, 'Dropdown')
        Object.assign(this, { options, isOpen: false, optionComponents: [] })
    }

    /**
     * Creates and returns the UI component for this dropdown
     * @returns {UIRoundedRectangle} The main dropdown background component
     */
    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent()).setY(this.y.percent()).setWidth(this.width.percent()).setHeight(this.height.pixel())
            .setColor(this._getColor('dropdown.background'))

        this.selectedText = new UIText(this.options[this.value] || '')
            .setX((5).percent())
            .setY(new CenterConstraint())
            .setColor(this._getColor('dropdown.text'))
            .setChildOf(bg)

        this.dropdownBg = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((100).percent())
            .setWidth((100).percent())
            .setHeight(new PixelConstraint(Math.min(this.options.length * 25, 150)))
            .setColor(this._getColor('dropdown.background'))
            .setChildOf(bg)

        this.scrollComponent = new ScrollComponent()
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setChildOf(this.dropdownBg)

        this._createOptions()
        this.dropdownBg.hide(true)
        
        bg.onMouseClick((comp, event) => {
            event.stopPropagation()
            this.isOpen = !this.isOpen
            this._updateDropdownState()
        })

        this.scrollComponent.onMouseScroll((comp, event) => event.stopPropagation())
        return bg
    }

    /**
     * Creates option components for the dropdown list
     * @private
     */
    _createOptions() {
        this.optionComponents = []
        this.options.forEach((opt, i) => {
            const option = new UIRoundedRectangle(this._getValue('base.roundness'))
                .setX((2).percent())
                .setY(new PixelConstraint(i * 25))
                .setWidth((96).percent())
                .setHeight((20).pixel())
                .setColor(i === this.value ? this._getColor('dropdown.selected') : this._getColor('dropdown.background'))
                .setChildOf(this.scrollComponent)
                .onMouseClick((comp, event) => { 
                    event.stopPropagation()
                    this._select(i) 
                })
                .onMouseEnter(() => i !== this.value && option.setColor(this._getColor('dropdown.itemHover') || this._getColor('dropdown.selected')))
                .onMouseLeave(() => i !== this.value && option.setColor(this._getColor('dropdown.background')))

            this.optionComponents.push(option)
            new UIText(opt)
                .setX((5).percent())
                .setY(new CenterConstraint())
                .setColor(this._getColor('dropdown.text'))
                .setChildOf(option)
        })
    }

    /**
     * Updates the dropdown visibility state
     * @private
     */
    _updateDropdownState() {
        this.dropdownBg[this.isOpen ? 'unhide' : 'hide'](true)
        this.dropdownBg.setFloating(this.isOpen)
    }

    /**
     * Selects an option by index
     * @param {number} index - Index of option to select
     * @private
     */
    _select(index) {
        this.optionComponents.forEach((option, i) => 
            option.setColor(i === index ? this._getColor('dropdown.selected') : this._getColor('dropdown.background'))
        )
        this.value = index
        this.selectedText?.setText(this.options[index])
        this._trigger('change', index)
        this.isOpen = false
        this._updateDropdownState()
    }

    /**
     * Updates the dropdown options and selected value
     * @param {string[]} newOptions - New array of option strings
     * @param {number} [newSelected=0] - Index of newly selected option
     */
    updateOptions(newOptions, newSelected = 0) {
        Object.assign(this, { options: newOptions, value: Math.min(newSelected, newOptions.length - 1) })
        this.selectedText?.setText(this.options[this.value] || '')
        if (this.scrollComponent) {
            this.scrollComponent.clearChildren()
            this.dropdownBg.setHeight(new PixelConstraint(Math.min(this.options.length * 25, 150)))
            this._createOptions()
        }
    }

    /**
     * Closes the dropdown if it's open
     */
    closeDropdown() { 
        this.isOpen = false
        this._updateDropdownState() 
    }
}