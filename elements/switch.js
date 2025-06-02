import BaseElement from "./base"
import { UIRoundedRectangle, CenterConstraint, ConstantColorConstraint, AspectConstraint, Animations, animate } from "../utils/elementa"

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
        this.bg = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setColor(this._getColor('switch.handle'))
        
        this.handle = new UIRoundedRectangle(this._getValue('base.roundness'))
            .setX(this.isOn ? (70).percent() : (3).percent())
            .setY(new CenterConstraint())
            .setWidth(new AspectConstraint(1))
            .setHeight((80).percent())
            .setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
            .setChildOf(this.bg)
        
        this.bg.onMouseClick(() => this.toggle())
        return this.bg
    }

    setValue(value, skipAni = false) {
        this.isOn = value
        if (skipAni) return this.handle.setX(this.isOn ? (70).percent() : (3).percent()).setColor(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor'))
        animate(this.handle, animation => {
            animation.setXAnimation(Animations.OUT_EXP, 0.5, this.isOn ? (70).percent() : (3).percent())
            animation.setColorAnimation(Animations.OUT_EXP, 0.5, new ConstantColorConstraint(this.isOn ? this._getColor('switch.onColor') : this._getColor('switch.offColor')))
        })
    }

    toggle() {
        this.setValue(!this.isOn)
        this._trigger('change', this.isOn)
    }
}