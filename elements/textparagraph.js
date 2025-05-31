import { UIWrappedText, UIContainer, CenterConstraint } from "../../Elementa"
import BaseElement from "./base"

/**
 * Text paragraph element for displaying text
 * @class TextParagraphElement
 * @extends BaseElement
 */
export default class TextParagraphElement extends BaseElement {
    /**
     * Creates a new TextParagraphElement
     * @param {string} description The text to display
     * @param {boolean} centered Whether to center the text
     */
    constructor(description = "", centered = true) {
        super(0, 0, 0, 0, description, centered, 'textparagraph')
        this.description = description
        this.centered = centered
    }

    /**
     * Creates and returns the UI component for this text paragraph
     * @returns {UIContainer} The main text paragraph container
     */
    create() {
        this.bg = new UIContainer()
            .setWidth((100).percent())
            .setHeight((100).percent())
        this.text = new UIWrappedText(this.description, true, null, this.centered, false)
            .setX((0).percent())
            .setY(new CenterConstraint())
            .setWidth((95).percent())
            .setColor(this._getColor('textParagraph.text'))
            .setChildOf(this.bg)
        return this.bg
    }
}