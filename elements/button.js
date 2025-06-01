import BaseElement from "./base"
import { UIRoundedRectangle, ConstantColorConstraint, CenterConstraint, UIText, Animations, animate } from "../utils/elementa"

/**
 * Button element for triggering actions
 * @class ButtonElement
 * @extends BaseElement
 * @fires click - When button is clicked
 */
export default class ButtonElement extends BaseElement {
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
            .setX((this.x).percent())
            .setY((this.y).percent())
            .setWidth((this.width).percent())
            .setHeight((this.height).percent())
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
                    .setX(new CenterConstraint())
                    .setY(new CenterConstraint())
                    .setColor(this._getColor('button.normal.text'))
                    .setTextScale((btn.textScale).pixel())
            )
        return this.bg
    }
}