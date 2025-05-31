import { UIWrappedText, UIContainer, CenterConstraint } from "../../Elementa"
import BaseElement from "./base"

export default class TextParagraphElement extends BaseElement {
    constructor(description = "", centered = true) {
        super(0, 0, 0, 0, description, centered, 'textparagraph')
        this.description = description
        this.centered = centered
    }

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