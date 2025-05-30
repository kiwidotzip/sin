import BaseElement from "./base"
import { UIRoundedRectangle, UIContainer, UIText, UITextInput, CenterConstraint } from "../../../Elementa"
import ElementUtils from "../../../DocGuiLib/core/Element"

export default class ColorPickerElement extends BaseElement {
    constructor(value = [255, 255, 255, 255]) {
        super(0, 0, 0, 0, value, null, 'colorpicker')
        this.color = value
    }

    create() {
        const scheme = this.colorScheme.element.colorPicker
        const textInputScheme = scheme.textInput?.normal || { background: [40,40,40,255], text: [220,220,220,255] }
        const container = new UIContainer()
        const preview = new UIRoundedRectangle(scheme.roundness)
            .setX((0).pixels())
            .setY(new CenterConstraint())
            .setWidth((60).pixels())
            .setHeight((18).pixels())
            .setColor(ElementUtils.getJavaColor(this.color))
            .setChildOf(container)
        const row = new UIContainer()
            .setX((64).pixels())
            .setY(new CenterConstraint())
            .setWidth((180).pixels())
            .setHeight((18).pixels())
            .setChildOf(container)
        const labels = ['r', 'g', 'b', 'a']
        const labelColors = {
            r: [255, 80, 80, 255],
            g: [80, 255, 80, 255],
            b: [80, 80, 255, 255],
            a: [200, 200, 200, 255]
        }
        labels.forEach((type, i) => {
            new UIText(type.toUpperCase())
                .setX((i * 36 + 4).pixels())
                .setY((5).pixels())
                .setTextScale((1.0).pixels())
                .setColor(ElementUtils.getJavaColor(labelColors[type]))
                .setChildOf(row)
            const inputBg = new UIRoundedRectangle(scheme.roundness)
                .setX((i * 36 + 12).pixels())
                .setY((0).pixels())
                .setWidth((24).pixels())
                .setHeight((18).pixels())
                .setColor(ElementUtils.getJavaColor(textInputScheme.background))
                .setChildOf(row)
            const inputText = new UITextInput(String(this.color[i]), true)
                .setX(new CenterConstraint())
                .setY(new CenterConstraint())
                .setWidth((18).pixels())
                .setTextScale((1.0).pixels())
                .setColor(ElementUtils.getJavaColor(textInputScheme.text))
                .setChildOf(inputBg)
            inputBg.onMouseClick(() => inputText.grabWindowFocus())
            inputText.onKeyType(() => {
                let val = inputText.getText().replace(/\D/g, '')
                val = Math.max(0, Math.min(255, parseInt(val) || 0))
                inputText.setText(String(val))
                this.color[i] = val
                preview.setColor(ElementUtils.getJavaColor(this.color))
                this._trigger('change', this.color)
            })
        })
        container.setWidth((row.getWidth() + 24 + 18).pixels())
        container.setHeight((24).pixels())
        return container
    }
}