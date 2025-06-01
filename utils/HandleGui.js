import HandleRegisters from "./registers"
import { Window } from "./elementa"

export default class HandleGui {
    constructor() {
        this.ctGui = new Gui()
        this.window = new Window()
        this.registers = new HandleRegisters(this.ctGui, this.window)
        this.colorScheme = null
    }

    getColorScheme() {
        return this.colorScheme
    }
    
    getWindow() {
        return this.window
    }

    draw(components, isComponent = true) {
        return isComponent 
            ? this._drawComponents(components)
            : this._drawNormal(components)
    }

    _drawNormal(components) {
        return Array.isArray(components)
            ? components.forEach(e => e.setChildOf(this.window))
            : components.setChildOf(this.window)
    }

    _setColorScheme(json) {
        return (this.colorScheme = json, this)
    }

    _drawComponents(components) {
        const create = c => c._create(this.colorScheme).setChildOf(this.window)
        return Array.isArray(components) ? components.forEach(create) : create(components)
    }
}