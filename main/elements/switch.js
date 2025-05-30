import BaseElement from "./base"
import { UIRoundedRectangle, CenterConstraint, AspectConstraint, Animations, animate } from "../../../Elementa"

/**
 * Toggle switch element for boolean input
 * @class SwitchElement
 * @extends BaseElement
 * @fires change - When switch state changes
 */
export default class SwitchElement extends BaseElement {
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
        const bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setColor(this._getColor('switch.handle'))
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