import { Animations, CenterConstraint, CramSiblingConstraint, PixelConstraint, GradientComponent, UIBlock, AdditiveConstraint, RelativeConstraint, SubtractiveConstraint, ScrollComponent, UIRoundedRectangle, UIText, UITextInput, animate, AspectConstraint, ConstantColorConstraint } from "../../Elementa"
import ElementUtils from "../../DocGuiLib/core/Element"
const Color = java.awt.Color

// Color picker dependencies
const UMatrixStack = Java.type("gg.essential.universal.UMatrixStack")
const UGraphics = Java.type("gg.essential.universal.UGraphics")
const hueColors = new Array(50).fill(null).map((_, idx) => new Color(Color.HSBtoRGB(idx / 50, 1, 0.7)))

/**
 * Base class for all UI elements providing common functionality
 * @class BaseElement
 */
class BaseElement {
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
     * @param {Object} scheme - Color scheme object containing Sin property
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
     * @private
     */
    _trigger(event, ...args) {
        return this.eventHandlers[event]?.(...args) 
    }
    
    /**
     * Gets a Java Color object from color scheme path
     * @param {string} path - Dot-separated path to color in scheme
     * @returns {java.awt.Color} Java Color object
     * @private
     */
    _getColor(path) { 
        return ElementUtils.getJavaColor(path.split('.').reduce((acc, curr) => acc[curr], this.colorScheme.element))
    }
    
    /**
     * Gets a value from color scheme path
     * @param {string} path - Dot-separated path to value in scheme
     * @returns {*} Value from color scheme
     * @private
     */
    _getValue(path) {
        return path.split('.').reduce((acc, curr) => acc[curr], this.colorScheme)
    }
}

/**
 * Toggle switch element for boolean input
 * @class SwitchElement
 * @extends BaseElement
 * @fires change - When switch state changes
 */
export class SwitchElement extends BaseElement {
    /**
     * Creates a new SwitchElement
     * @param {boolean} [value=false] - Initial switch state
     */
    constructor(value = false) {
        super(0, 0, 0, 0, value, null, 'Switch')
        this.isOn = value
    }

    /**
     * Creates and returns the UI component for this switch
     * @returns {UIRoundedRectangle} The main switch background component
     */
    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness')).setColor(this._getColor('switch.handle'))
        const handle = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.isOn ? (70).percent() : (3).percent())
            .setY(new CenterConstraint())
            .setWidth(new AspectConstraint(1))
            .setHeight((80).percent())
            .setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
            .setChildOf(bg)
        
        bg.onMouseClick(() => {
            this.isOn = !this.isOn
            handle.setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
            this._trigger('change', this.isOn)
            animate(handle, animation => animation.setXAnimation(Animations.OUT_EXP, 0.5, this.isOn ? (70).percent() : (3).percent()))
        })
        return bg
    }
}

/**
 * Dropdown selection element for choosing from multiple options
 * @class DropdownElement
 * @extends BaseElement
 * @fires change - When selection changes, passes selected index
 */
export class DropdownElement extends BaseElement {
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
            .setX((5).percent()).setY(new CenterConstraint()).setColor(this._getColor('dropdown.text')).setChildOf(bg)

        this.dropdownBg = new UIRoundedRectangle(0)
            .setX((0).percent()).setY((100).percent()).setWidth((100).percent())
            .setHeight(new PixelConstraint(Math.min(this.options.length * 25, 150)))
            .setColor(this._getColor('dropdown.background')).setChildOf(bg)

        this.scrollComponent = new ScrollComponent()
            .setX((0).percent()).setY((0).percent()).setWidth((100).percent()).setHeight((100).percent())
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
                .setX((2).percent()).setY(new PixelConstraint(i * 25)).setWidth((96).percent()).setHeight((20).pixel())
                .setColor(i === this.value ? this._getColor('dropdown.selected') : this._getColor('dropdown.background'))
                .setChildOf(this.scrollComponent)
                .onMouseClick((comp, event) => { event.stopPropagation(); this._select(i) })
                .onMouseEnter(() => i !== this.value && option.setColor(this._getColor('dropdown.itemHover') || this._getColor('dropdown.selected')))
                .onMouseLeave(() => i !== this.value && option.setColor(this._getColor('dropdown.background')))

            this.optionComponents.push(option)
            new UIText(opt).setX((5).percent()).setY(new CenterConstraint()).setColor(this._getColor('dropdown.text')).setChildOf(option)
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
    closeDropdown() { this.isOpen = false; this._updateDropdownState() }
}

/**
 * Slider input element for numeric value selection within a range
 * @class SliderElement
 * @extends BaseElement
 * @fires change - When slider value changes, passes current value
 */
export class SliderElement extends BaseElement {
    /**
     * Creates a new SliderElement
     * @param {number} [min=0] - Minimum slider value
     * @param {number} [max=100] - Maximum slider value
     * @param {number} [value=50] - Initial slider value
     */
    constructor(min = 0, max = 100, value = 50) {
        super(0, 0, 0, 0, Math.max(min, Math.min(max, value)), null, 'Slider')
        Object.assign(this, { min, max, isDragging: false, offset: 0, thumbWidth: 10 })
    }

    /**
     * Creates and returns the UI component for this slider
     * @returns {UIRoundedRectangle} The main slider track component
     */
    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('slider.track'))

        const initialPercent = (this.value - this.min) / (this.max - this.min)
        const thumb = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this._getThumbConstraint(initialPercent))
            .setY(new CenterConstraint())
            .setWidth((this.thumbWidth).pixel())
            .setHeight((80).percent())
            .setColor(this._getColor('slider.thumb')).setChildOf(bg)

        const valueText = new UIText(this.value.toString())
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setTextScale((this._getValue('text.scale') || 1).pixels())
            .setColor(this._getColor('slider.valueText') || this._getColor('text.color'))
            .setChildOf(thumb)

        Object.assign(this, { bg, thumb, valueText })

        const handlers = {
            click: () => { this.isDragging = true; this.offset = 1 },
            release: () => { this.isDragging = false; this.offset = 0 },
            drag: (component, x) => {
                if (!this.isDragging || !this.offset) return
                const padding = 2.5
                const minX = this.bg.getLeft() + padding
                const maxX = this.bg.getRight() - this.thumbWidth - padding
                const clampedX = Math.max(minX, Math.min(maxX, (x + component.getLeft()) - this.offset))
                const percent = Math.max(0, Math.min(1, (clampedX - minX) / (maxX - minX)))
                
                this.value = Math.round(this.min + percent * (this.max - this.min))
                this.valueText.setText(this.value.toString())
                animate(this.thumb, animation => animation.setXAnimation(Animations.OUT_EXP, 0.15, this._getThumbConstraint(percent)))
                this._trigger('change', this.value)
            }
        }

        ;[bg, thumb].forEach(el => el.onMouseClick(handlers.click).onMouseRelease(handlers.release).onMouseDrag(handlers.drag))
        return bg
    }

    /**
     * Calculates the constraint for thumb position based on percentage
     * @param {number} percent - Position as percentage (0-1)
     * @returns {Constraint} Elementa constraint for thumb position
     * @private
     */
    _getThumbConstraint(percent) {
        const padding = 2.5
        return percent === 0 ? (padding).pixels() 
             : percent === 1 ? new SubtractiveConstraint((100).percent(), (this.thumbWidth + padding).pixels())
             : (padding + percent * (100 - (this.thumbWidth + padding) * 2)).percent()
    }

    /**
     * Gets the current slider value
     * @returns {number} Current slider value
     */
    getValue() { 
        return this.value 
    }

    /**
     * Sets the slider value programmatically
     * @param {number} newValue - New value to set (will be clamped to min/max)
     */
    setValue(newValue) {
        this.value = Math.max(this.min, Math.min(this.max, newValue))
        const percent = (this.value - this.min) / (this.max - this.min)
        this.valueText?.setText(this.value.toString())
        this.thumb && animate(this.thumb, animation => 
            animation.setXAnimation(Animations.OUT_EXP, 0.15, this._getThumbConstraint(percent))
        )
        this._trigger('change', this.value)
    }
}

/**
 * Text input field element for string input
 * @class TextInputElement
 * @extends BaseElement
 * @fires change - When input text changes, passes current text
 */
export class TextInputElement extends BaseElement {
    /**
     * Creates a new TextInputElement
     * @param {string} [value=""] - Initial input value
     * @param {string} [placeholder=""] - Placeholder text when empty
     */
    constructor(value = "", placeholder = "") {
        super(0, 0, 0, 0, value, null, "textInput")
        this.placeholder = placeholder
    }

    /**
     * Creates and returns the UI component for this text input
     * @returns {UIRoundedRectangle} The main input background component
     */
    create() {
        const tx = this.colorScheme.element.textInput
        const bg = new UIRoundedRectangle(tx.roundness)
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('textInput.normal.background'))

        const input = new UITextInput(this.value ?? "", true)
            .setX((10).percent())
            .setY(new CenterConstraint())
            .setWidth((100).percent())
            .setHeight((10).pixels())
            .setColor(this._getColor('textInput.normal.text'))
            .setChildOf(bg)

        bg.onMouseClick(() => input.grabWindowFocus())

        if (this.placeholder) {
            const placeholderText = new UIText(this.placeholder)
                .setX(new CenterConstraint())
                .setY(new CenterConstraint())
                .setColor(this._getColor('textInput.placeholder'))
                .setChildOf(bg)
            
            this.value === "" ? placeholderText.unhide(true) : placeholderText.hide()

            input.onKeyType(() => {
                const placeholder = bg.getChildren().find(child => child instanceof UIText && child.getText() === this.placeholder)
                placeholder && (input.getText().length > 0 ? placeholder.hide() : placeholder.show())
                this._trigger('change', input.getText())
            })
        }
        return bg
    }
}

/**
 * Button element for triggering actions
 * @class ButtonElement
 * @extends BaseElement
 * @fires click - When button is clicked
 */
export class ButtonElement extends BaseElement {
    /**
     * Creates a new ButtonElement
     * @param {string} [value=""] - Button text/label
     */
    constructor(value = "") {
        super(0, 0, 0, 0, value, null, 'button')
    }
    
    /**
     * Creates and returns the UI component for this button
     * @returns {UIRoundedRectangle} The main button background component
     */
    create() {
        const btn = this.colorScheme.element.button
        
        this.bg = new UIRoundedRectangle(btn.roundness)
            .setX((this.x).percent()).setY((this.y).percent())
            .setWidth((this.width).percent()).setHeight((this.height).percent())
            .setColor(this._getColor('button.normal.background'))
            .onMouseClick(() => {
                this._trigger('click')
                animate(this.bg, animation => {
                    animation.setColorAnimation(Animations.OUT_EXP, 0.2, new ConstantColorConstraint(this._getColor('button.pressed.background')), 0)
                    animation.onComplete(() => this.bg.setColor(this._getColor('button.normal.background')))
                })
            })
            .addChildren(
                new UIText(this.value)
                    .setX(new CenterConstraint()).setY(new CenterConstraint())
                    .setColor(this._getColor('button.normal.text'))
                    .setTextScale((btn.textScale).pixel())
            )
        return this.bg
    }
}


/**
 * Color picker element for selecting colors with HSB and alpha support
 * @class ColorPickerElement
 * @extends BaseElement
 * @fires change - When color changes, passes [r, g, b, a] array
 */
export class ColorPickerElement extends BaseElement {
    constructor(x, y, width, height, color = [255, 255, 255, 255]) {
        super(0, 0, 0, 0, color, null, 'ColorPicker', null)
        this.selectedColor = color
        this.isOpen = false
        this._initColorState(color)
    }

    /** @private */
    _initColorState(color) {
        const [r, g, b, a] = color
        this.currentColor = new Color(r/255, g/255, b/255, (a ?? 255)/255)
        this.hsb = Color.RGBtoHSB(r, g, b, null)
        this.hue = this.hsb[0]
        this.saturation = this.hsb[1]
        this.brightness = this.hsb[2]
        this.alpha = this.currentColor.getAlpha()/255
    }

    create() {
        this.previewBtn = this._createPreviewButton()
        return this.previewBtn
    }

    /** @private */
    _createPreviewButton() {
        const btn = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('button.background'))
            .onMouseClick(() => this._togglePicker())

        this.preview = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setWidth((80).percent())
            .setHeight((70).percent())
            .setColor(this.currentColor)
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setChildOf(btn)

        new UIText("Pick")
            .setX(new CenterConstraint())
            .setY(new AdditiveConstraint(new CenterConstraint(), (5).pixels()))
            .setColor(this._getColor('button.text'))
            .setChildOf(btn)

        return btn
    }

    /** @private */
    _togglePicker() {
        if (this.isOpen) return this._closePicker()
        this._openPicker()
    }

    /** @private */
    _openPicker() {
        this.overlay = new UIBlock(new Color(0/255, 0/255, 0/255, 150/255))
            .setWidth((100).percent())
            .setHeight((100).percent())

        this.popup = new UIRoundedRectangle(5)
            .setWidth((300).pixels())
            .setHeight((250).pixels())
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setColor(this._getColor('colorPicker.background'))
            .setChildOf(this.overlay)

        this._createPickerComponents()
        this._setupPickerEvents()
        this.overlay.setChildOf(this.container.getWindow().getChildren()[0])
        this.isOpen = true
    }

    /** @private */
    _createPickerComponents() {
        this.gradient = this._createHueGradient()
            .setX((5).percent())
            .setY((5).percent())
            .setWidth((70).percent())
            .setHeight((70).percent())
            .setChildOf(this.popup)

        this.svArea = new UIRoundedRectangle(5)
            .setX((5).percent())
            .setY((5).percent())
            .setWidth((70).percent())
            .setHeight((70).percent())
            .setColor(Color.WHITE)
            .setChildOf(this.popup)

        this.pointer = new UIRoundedRectangle(2)
            .setWidth((3).pixels())
            .setHeight((3).pixels())
            .setColor(Color.BLACK)
            .setChildOf(this.svArea)

        this.hueStrip = new UIBlock()
            .setX(new CramSiblingConstraint(5))
            .setY((5).percent())
            .setWidth((15).pixels())
            .setHeight((70).percent())
            .setChildOf(this.popup)

        hueColors.forEach((color, i) => {
            new UIBlock(color)
                .setY(new RelativeConstraint(i / hueColors.length))
                .setWidth((100).percent())
                .setHeight((2).pixels())
                .setChildOf(this.hueStrip)
        })
        
        this.alphaBg = new UIBlock()
            .setX((5).percent())
            .setY((80).percent())
            .setWidth((70).percent())
            .setHeight((8).pixels())
            .setColor(this._getColor('colorPicker.alphaSlider.track'))
            .setChildOf(this.popup)

        this.alphaGradient = new GradientComponent()
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setStartColor(new Color(255/255, 255/255, 255/255, 0/255))
            .setEndColor(Color.WHITE)
            .setChildOf(this.alphaBg)

        this.alphaThumb = new UIRoundedRectangle(2)
            .setWidth((6).pixels())
            .setHeight((10).pixels())
            .setColor(this._getColor('colorPicker.alphaSlider.thumb'))
            .setChildOf(this.alphaBg)

        this.pickerPreview = new UIRoundedRectangle(5)
            .setX((80).percent())
            .setY((5).percent())
            .setWidth((15).percent())
            .setHeight((15).percent())
            .setColor(this.currentColor)
            .setChildOf(this.popup)

        new UIText("×")
            .setX(new SubtractiveConstraint((100).percent(), (15).pixels()))
            .setY((5).pixels())
            .setTextScale((1.5).pixels())
            .setColor(this._getColor('button.text'))
            .onMouseClick(() => this._closePicker())
            .setChildOf(this.popup)
    }

    /** @private */
    _setupPickerEvents() {
        // SV Area interactions
        this.svArea.onMouseClick((_, e) => this._updateSV(e.relativeX, e.relativeY))
            .onMouseDrag((_, x, y) => this._updateSV(x, y))

        // Hue Strip interactions
        this.hueStrip.onMouseClick((_, e) => this._updateHue(e.relativeY))
            .onMouseDrag((_, x, y) => this._updateHue(y))

        // Alpha interactions
        this.alphaBg.onMouseClick((_, e) => this._updateAlpha(e.relativeX))
            .onMouseDrag((_, x, y) => this._updateAlpha(x))

        // Keyboard listener
        register('guiKey', (char, key) => {
            if (key === 1) this._closePicker() // ESC key
        })
    }

    /** @private */
    _updateSV(x, y) {
        this.saturation = Math.max(0, Math.min(1, x / this.svArea.getWidth()))
        this.brightness = Math.max(0, Math.min(1, 1 - (y / this.svArea.getHeight())))
        this.pointer.setX(new RelativeConstraint(this.saturation))
            .setY(new RelativeConstraint(1 - this.brightness))
        this._updateColor()
    }

    /** @private */
    _updateHue(y) {
        this.hue = Math.max(0, Math.min(1, y / this.hueStrip.getHeight()))
        this.gradient.setStartColor(new Color(Color.HSBtoRGB(this.hue, 1, 1)))
        this._updateColor()
    }

    /** @private */
    _updateAlpha(x) {
        this.alpha = Math.max(0, Math.min(1, x / this.alphaBg.getWidth()))
        this.alphaThumb.setX(new RelativeConstraint(this.alpha))
        this._updateColor()
    }

    /** @private */
    _updateColor() {
        const rgb = Color.HSBtoRGB(this.hue, this.saturation, this.brightness)
        this.currentColor = new Color(
            (rgb >> 16) & 0xFF,
            (rgb >> 8) & 0xFF,
            rgb & 0xFF,
            Math.round(this.alpha * 255)
        )
        
        this.preview.setColor(this.currentColor)
        this.pickerPreview.setColor(this.currentColor)
        this._trigger('change', [
            this.currentColor.getRed(),
            this.currentColor.getGreen(),
            this.currentColor.getBlue(),
            this.currentColor.getAlpha()
        ])
    }

    /** @private */
    _createHueGradient() {
        return new JavaAdapter(GradientComponent, {
            draw() {
                UGraphics.enableBlend()
                UGraphics.disableAlpha()
                UGraphics.tryBlendFuncSeparate(770, 771, 1, 0)
                UGraphics.shadeModel(7425)

                const tess = UGraphics.getFromTessellator()
                const stack = UMatrixStack.UNIT
                const [l, t, r, b] = [this.getLeft(), this.getTop(), this.getRight(), this.getBottom()]

                tess.beginWithDefaultShader(UGraphics.DrawMode.QUADS, UGraphics.CommonVertexFormats.POSITION_COLOR)
                tess.pos(stack, l, b, 0).color(Color.BLACK).endVertex()
                tess.pos(stack, r, b, 0).color(Color.BLACK).endVertex()
                tess.pos(stack, l, t, 0).color(Color.WHITE).endVertex()
                tess.pos(stack, r, t, 0).color(Color.WHITE).endVertex()
                tess.draw()

                UGraphics.shadeModel(7424)
                UGraphics.disableBlend()
                UGraphics.enableAlpha()
            }
        })
    }

    /** @private */
    _closePicker() {
        this.overlay.hide()
        this.isOpen = false
    }

    getValue() {
        return [
            this.currentColor.getRed(),
            this.currentColor.getGreen(),
            this.currentColor.getBlue(),
            this.currentColor.getAlpha()
        ]
    }

    setValue(color) {
        this._initColorState(color)
        this.preview?.setColor(this.currentColor)
    }
}

/**
 * Keybind input element for capturing keyboard input
 * @class KeybindElement
 * @extends BaseElement
 * @fires change - When keybind changes, passes key code
 */
export class KeybindElement extends BaseElement {
    /**
     * Creates a new KeybindElement
     * @param {number} [key=0] - Initial key code (0 = no key bound)
     */
    constructor(key = 0) {
        super(0, 0, 0, 0, key, null, 'Keybind')
        this.listening = false
    }

    /**
     * Creates and returns the UI component for this keybind input
     * @returns {UIRoundedRectangle} The main keybind background component
     */
    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent()).setY(this.y.percent()).setWidth(this.width.percent()).setHeight(this.height.percent())
            .setColor(this._getColor('keybind.background'))

        const text = new UIText(Keyboard.getKeyName(this.value))
            .setX(new CenterConstraint()).setY(new CenterConstraint())
            .setColor(this._getColor('keybind.text')).setChildOf(bg)

        bg.onMouseClick(() => {
            this.listening = true
            text.setText("Listening...")
            bg.setColor(this._getColor('keybind.active'))
        })

        register('guiKey', (char, keyCode) => {
            if (!this.listening) return
            Object.assign(this, { value: keyCode, listening: false })
            bg.setColor(this._getColor('keybind.background'))
            text.setText(Keyboard.getKeyName(keyCode))
            this._trigger('change', keyCode)
        })

        return bg
    }
}