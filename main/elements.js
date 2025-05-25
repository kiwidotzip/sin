import { Animations, CenterConstraint, AdditiveConstraint, PixelConstraint, GradientComponent, OutlineEffect, RelativeConstraint, SubtractiveConstraint, ScrollComponent, UIRoundedRectangle, UIText, UITextInput, animate, AspectConstraint, ConstantColorConstraint } from "../../Elementa"
import ElementUtils from "../../DocGuiLib/core/Element"
const Color = java.awt.Color

class BaseElement {
    constructor(x, y, width, height, value, parent, type) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.value = value
        this.parent = parent
        this.type = type
        this.colorScheme = null
        this.eventHandlers = {}
    }

    setColorScheme(scheme) {
        this.colorScheme = scheme.Sin
        return this
    }

    on(event, handler) {
        this.eventHandlers[event] = handler
        return this
    }

    _trigger(event, ...args) {
        if (this.eventHandlers[event]) return this.eventHandlers[event](...args)
    }

    _getColor(path) {
        const parts = path.split('.')
        return ElementUtils.getJavaColor(parts.reduce((acc, curr) => acc[curr], this.colorScheme.element))
    }

    _getValue(path) {
        const parts = path.split('.')
        return parts.reduce((acc, curr) => acc[curr], this.colorScheme)
    }
}

export class SwitchElement extends BaseElement {
    constructor(value = false) {
        super(0, 0, 0, 0, value, null, 'Switch')
        this.isOn = value
    }

    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setColor(this._getColor('switch.handle'))
        const handle = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.isOn ? (70).percent() : (3).percent())
            .setY(new CenterConstraint())
            .setWidth(new AspectConstraint(1))
            .setHeight((80).percent())
            .setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
            .setChildOf(bg)
        bg.onMouseClick((comp) => {
            this.isOn = !this.isOn
            handle.setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
            this._trigger('change', this.isOn)
                animate(handle, (animation) => {
                    animation.setXAnimation(
                        Animations.OUT_EXP,
                        0.5,
                        this.isOn ? (70).percent() : (2).percent()
                    )
                })
        })
        return bg
    }
}

export class DropdownElement extends BaseElement {
    constructor(options = [], selected = 0) {
        super(0, 0, 0, 0, selected, null, 'Dropdown')
        this.options = options
        this.isOpen = false
        this.optionComponents = []
    }

    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.pixel())
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

            this.optionComponents.push(option)

            new UIText(opt)
                .setX((5).percent())
                .setY(new CenterConstraint())
                .setColor(this._getColor('dropdown.text'))
                .setChildOf(option)

            option
                .onMouseEnter(() => {
                    if (i !== this.value) option.setColor(this._getColor('dropdown.itemHover') || this._getColor('dropdown.selected'))
                })
                .onMouseLeave(() => {
                    if (i !== this.value) option.setColor(this._getColor('dropdown.background'))
                })
        })
    }

    _updateDropdownState() {
        if (this.isOpen) {
            this.dropdownBg.unhide(true)
            this.dropdownBg.setFloating(true)
        } else {
            this.dropdownBg.hide(true)
            this.dropdownBg.setFloating(false)
        }
    }

    _select(index) {
        this.optionComponents.forEach((option, i) => {
            option.setColor(i === index ? this._getColor('dropdown.selected') : this._getColor('dropdown.background'))
        })

        this.value = index
        this.selectedText?.setText(this.options[index])

        if (this._trigger) this._trigger('change', index)

        this.isOpen = false
        this._updateDropdownState()
    }

    updateOptions(newOptions, newSelected = 0) {
        this.options = newOptions
        this.value = Math.min(newSelected, newOptions.length - 1)

        this.selectedText?.setText(this.options[this.value] || '')

        if (this.scrollComponent) {
            this.scrollComponent.clearChildren()
            this.dropdownBg.setHeight(new PixelConstraint(Math.min(this.options.length * 25, 150)))
            this._createOptions()
        }
    }
    closeDropdown() {
        this.isOpen = false
        this._updateDropdownState()
    }
}

export class SliderElement extends BaseElement {
    constructor(min = 0, max = 100, value = 50) {
        super(0, 0, 0, 0, value, null, 'Slider')
        this.min = min
        this.max = max
        this.isDragging = false
        this.offset = 0
        this.thumbWidth = 10
        
        this.value = Math.max(this.min, Math.min(this.max, value))
    }

    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('slider.track'))

        const initialPercent = (this.value - this.min) / (this.max - this.min)
        const thumbX = this._getThumbConstraint(initialPercent)
        
        const thumb = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(thumbX)
            .setY(new CenterConstraint())
            .setWidth((this.thumbWidth).pixel())
            .setHeight((80).percent())
            .setColor(this._getColor('slider.thumb'))
            .setChildOf(bg)

        const valueText = new UIText(this.value.toString())
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setTextScale((this._getValue('text.scale') || 1).pixels())
            .setColor(this._getColor('slider.valueText') || this._getColor('text.color'))
            .setChildOf(thumb)

        this.bg = bg
        this.thumb = thumb
        this.valueText = valueText

        bg.onMouseClick(this._onMouseClick.bind(this))
          .onMouseRelease(this._onMouseRelease.bind(this))
          .onMouseDrag(this._onMouseDrag.bind(this))

        thumb.onMouseClick(this._onMouseClick.bind(this))
             .onMouseRelease(this._onMouseRelease.bind(this))
             .onMouseDrag(this._onMouseDrag.bind(this))

        return bg
    }

    _getThumbConstraint(percent) {
        const padding = 2.5
        return percent === 0 ? (padding).pixels() 
             : percent === 1 ? new SubtractiveConstraint((100).percent(), (this.thumbWidth + padding).pixels())
             : (padding + percent * (100 - (this.thumbWidth + padding) * 2)).percent()
    }

    _onMouseClick(component, event) {
        if (this._triggerEvent && this._triggerEvent(this.onMouseClick, component, event) === 1) return

        this.isDragging = true
        this.offset = 1
    }

    _onMouseRelease() {
        if (this._triggerEvent && this._triggerEvent(this.onMouseRelease, this.value) === 1) return

        this.isDragging = false
        this.offset = 0
    }

    _onMouseDrag(component, x, y, button) {
        if (!this.isDragging || !this.offset) return
        if (this._triggerEvent && this._triggerEvent(this.onMouseDrag, x, y, button, component, this.value) === 1) return
        
        const padding = 2.5
        const clamped = (x + component.getLeft()) - this.offset
        const minX = this.bg.getLeft() + padding
        const maxX = this.bg.getRight() - this.thumbWidth - padding
        const clampedX = Math.max(minX, Math.min(maxX, clamped))
        const percent = Math.max(0, Math.min(1, (clampedX - minX) / (maxX - minX)))
        
        this.value = Math.round(this.min + percent * (this.max - this.min))
        this.valueText.setText(this.value.toString())
        
        animate(this.thumb, animation => {
            animation.setXAnimation(Animations.OUT_EXP, 0.15, this._getThumbConstraint(percent))
        })
        if (this._trigger) this._trigger('change', this.value)
    }

    getValue() {
        return this.value
    }

    setValue(newValue) {
        this.value = Math.max(this.min, Math.min(this.max, newValue))
        const percent = (this.value - this.min) / (this.max - this.min)
        if (this.valueText) this.valueText.setText(this.value.toString())
        if (this.thumb) {
            animate(this.thumb, animation => {
                animation.setXAnimation(
                    Animations.OUT_EXP,
                    0.15,
                    this._getThumbConstraint(percent)
                )
            })
        }
        
        if (this._trigger) this._trigger('change', this.value)
    }
}

export class TextInputElement extends BaseElement {
    constructor(value = "", placeholder = "") {
        super(0, 0, 0, 0, value, null, "textInput");
        this.placeholder = placeholder;
    }

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
            this.value === "" 
                ? placeholderText.unhide()
                : placeholderText.hide()
        }

        input.onKeyType(() => {
            if (this.placeholder) {
                const placeholder = bg.getChildren().find(child => child instanceof UIText && child.getText() === this.placeholder)
                if (placeholder) {
                    input.getText().length > 0 
                        ? placeholder.hide()
                        : placeholder.show()
                }
            }
            this._trigger('change', input.getText())
        })
        return bg
    }
}

export class ButtonElement extends BaseElement {
    constructor(value = "") {
        super(0, 0, 0, 0, value, null, 'button');
    }
    create() {
        const btn = this.colorScheme.element.button
        ChatLib.chat(JSON.stringify(this, null, 4))
        this.bg = new UIRoundedRectangle(btn.roundness)
            .setX((this.x).percent())
            .setY((this.y).percent())
            .setWidth((this.width).percent())
            .setHeight((this.height).percent())
            .setColor(this._getColor('button.normal.background'))
            .onMouseClick(() => this._trigger('click'))
            .addChildren(
                new UIText(this.value)
                    .setX(new CenterConstraint())
                    .setY(new CenterConstraint())
                    .setColor(this._getColor('button.normal.text'))
                    .setTextScale((btn.textScale).pixel())
            )
        this.bg.onMouseClick(() => {
            animate(this.bg, animation => {
                animation.setColorAnimation(
                    Animations.OUT_EXP,
                    0.2,
                    new ConstantColorConstraint(this._getColor('button.pressed.background')),
                    0
                )
                animation.onComplete(() => this.bg.setColor(this._getColor('button.normal.background')))
            })
        })
        return this.bg
    }
}

export class ColorPickerElement extends BaseElement {
    constructor(color = [255, 255, 255]) {
        super(0, 0, 0, 0, color, null, 'ColorPicker')
        this.hue = 0
        this.saturation = 1
        this.brightness = 1
    }

    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('colorPicker.background'))

        const hueBar = new GradientComponent()
            .setX((5).percent())
            .setY((5).percent())
            .setWidth((90).percent())
            .setHeight((15).percent())
            .setStartColor(this._getColor('colorPicker.hueBackground'))
            .setEndColor(Color.WHITE)
            .setChildOf(bg)

        const svArea = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX((5).percent())
            .setY((25).percent())
            .setWidth((90).percent())
            .setHeight((65).percent())
            .setColor(this._getColor('colorPicker.svBackground'))
            .setChildOf(bg)

        const preview = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX((80).percent())
            .setY((5).percent())
            .setWidth((15).percent())
            .setHeight((15).percent())
            .setColor(ElementUtils.getJavaColor(this.value))
            .setChildOf(bg)

        hueBar.onMouseDrag((comp, mx) => {
            this.hue = (mx - comp.getLeft()) / comp.getWidth()
            this._updateColor(preview)
        })

        svArea.onMouseDrag((comp, mx, my) => {
            this.saturation = (mx - comp.getLeft()) / comp.getWidth()
            this.brightness = 1 - ((my - comp.getTop()) / comp.getHeight())
            this._updateColor(preview)
        })

        return bg
    }

    _updateColor(preview) {
        const j = Color.HSBtoRGB(this.hue, this.saturation, this.brightness)
        const rgb = ElementUtils.getJavaColor(...j, 255)
        this.value = [rgb.getRed(), rgb.getGreen(), rgb.getBlue(), rgb.getAlpha()]
        preview.setColor(ElementUtils.getJavaColor(this.value))
        this._trigger('change', this.value)
    }
}

export class KeybindElement extends BaseElement {
    constructor(key = 0) {
        super(0, 0, 0, 0, key, null, 'Keybind')
        this.listening = false
    }

    create() {
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('keybind.background'))

        const text = new UIText(Keyboard.getKeyName(this.value))
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setColor(this._getColor('keybind.text'))
            .setChildOf(bg)

        bg.onMouseClick(() => {
            this.listening = true
            text.setText("Listening...")
            bg.setColor(this._getColor('keybind.active'))
        })

        register('guiKey', (char, keyCode) => {
            if (!this.listening) return
            this.value = keyCode
            bg.setColor(this._getColor('keybind.background'))
            text.setText(Keyboard.getKeyName(keyCode))
            this.listening = false
            this._trigger('change', keyCode)
        })

        return bg
    }
}