import BaseElement from "./base"
import { UIRoundedRectangle, UITextInput, UIText, CenterConstraint } from "../../Elementa"

/**
 * Text input field element for string input
 * @class TextInputElement
 * @extends BaseElement
 * @fires change - When input text changes, passes current text
 */
export default class TextInputElement extends BaseElement {
    /**
     * Creates a new TextInputElement
     * @param {string} [value=""] - Initial input value
     * @param {string} [placeholder=""] - Placeholder text when empty
     */
    constructor(value = "", placeholder = "") {
        super(0, 0, 0, 0, value, null, "textInput")
        this.placeholder = placeholder
        this.text = value
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

        const input = new UITextInput(this.text ?? "", true)
            .setX((10).percent())
            .setY(new CenterConstraint())
            .setWidth((90).percent())
            .setHeight((10).pixels())
            .setColor(this._getColor('textInput.normal.text'))
            .setChildOf(bg)

        bg.onMouseClick(() => {
            input.setText(this.text)
            input.grabWindowFocus()
        })

        if (this.placeholder) {
            const placeholderText = new UIText(this.placeholder)
                .setX(new CenterConstraint())
                .setY(new CenterConstraint())
                .setColor(this._getColor('textInput.placeholder'))
                .setChildOf(bg)
            
            this.text === "" ? placeholderText.unhide(true) : placeholderText.hide()
        }
        
        input
            .onKeyType(() => {
                this.text = input.getText()
                const placeholder = bg.getChildren().find(child => child instanceof UIText && child.getText() === this.placeholder)
                placeholder && (this.text.length > 0 ? placeholder.hide() : placeholder.unhide(true))
                this._trigger('change', this.text)
            })
            .onFocusLost(() => {
                this.text = input.getText()
                this._trigger('change', this.text)
            })
        return bg
    }
}