const events = ['Open', 'Close', 'Draw', 'MouseClick', 'MouseRelease', 'MouseScroll', 'MouseDrag', 'KeyType']

export default class HandleRegisters {
    constructor(ctGui, window) {
        this.ctGui = ctGui
        this.window = window
        this.eventsList = new Set()
        this.customEvents = new Map(events.map(e => [e, []]))
        this.init()
    }

    init() {
        const reg = (method, action, event) => 
            this.eventsList.add(this.ctGui[method]((...args) => {
                args = args ?? []
                action(...args)
                this.customEvents.get(event)?.forEach(fn => fn(...args))
            }))

        reg('registerOpened', () => null, 'Open')
        reg('registerClosed', () => this._stop(), 'Close')
        reg('registerDraw', () => this.window.draw(), 'Draw')
        reg('registerClicked', (mx, my, btn) => this.window.mouseClick(mx, my, btn), 'MouseClick')
        reg('registerMouseReleased', () => this.window.mouseRelease(), 'MouseRelease')
        reg('registerScrolled', (mx, my, s) => this.window.mouseScroll(s), 'MouseScroll')
        reg('registerMouseDragged', (mx, my, btn) => this.window.mouseDrag(mx, my, btn), 'MouseDrag')
        reg('registerKeyTyped', (c, k) => this.window.keyType(c, k), 'KeyType')
    }

    _stop() {
        this.eventsList.forEach(ev => ev.unregister?.())
        this.eventsList.clear()
    }
}

events.forEach(event =>
    HandleRegisters.prototype[`on${event}`] = function(fn) {
        return this.customEvents.get(event)?.push(fn), this
    })