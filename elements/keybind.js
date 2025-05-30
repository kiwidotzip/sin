import BaseElement from "./base"
import { UIRoundedRectangle, UIText, CenterConstraint } from "../../Elementa"

/**
 * Keybind input element for capturing keyboard input
 * @class KeybindElement
 * @extends BaseElement
 * @fires change - When keybind changes, passes key code
 */
export default class KeybindElement extends BaseElement {
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
            .setX(this.x.percent())
            .setY(this.y.percent())
            .setWidth(this.width.percent())
            .setHeight(this.height.percent())
            .setColor(this._getColor('keybind.background'))

        const text = new UIText(Keyboard.getKeyName(this.value))
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setColor(this._getColor('keybind.text')).setChildOf(bg)

        bg.onMouseClick(() => {
            this.listening = true
            text.setText("...")
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