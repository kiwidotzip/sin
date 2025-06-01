import BaseElement from "./base"
import { UIRoundedRectangle, UIText, CenterConstraint, SubtractiveConstraint, animate, Animations } from "../utils/elementa"

/**
 * Slider input element for numeric value selection within a range
 * @class SliderElement
 * @extends BaseElement
 * @fires change - When slider value changes, passes current value
 */
export default class SliderElement extends BaseElement {
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
            click: () => {
                this.isDragging = true
                this.offset = 1 
            },
            release: () => {
                this.isDragging = false
                this.offset = 0 
            },
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