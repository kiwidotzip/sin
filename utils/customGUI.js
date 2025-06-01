const GuiScreen = net.minecraft.client.gui.GuiScreen
const MouseListener = com.chattriggers.ctjs.minecraft.listeners.MouseListener.INSTANCE

export default class CustomGui {
    constructor() {
        const gui = this
        this.listeners = {
            onDraw: null,
            onClick: null,
            onScroll: null,
            onKeyTyped: null,
            onReleased: null,
            onDragged: null,
            onOpen: null,
            onClose: null,
            onInit: null,
            onResize: null
        }
        this.guiScreen = new JavaAdapter(GuiScreen, {
            func_73863_a(mx, my, pt) {
                this.super$func_73863_a(mx, my, pt)
                Tessellator.pushMatrix()
                gui.listeners.onDraw?.(mx, my, pt)
                Tessellator.popMatrix()
            },
            func_73864_a(mx, my, mb) {
                this.super$func_73864_a(mx, my, mb)
                gui.listeners.onClick?.(mx, my, mb)
            },
            func_146286_b(mx, my, st) {
                this.super$func_146286_b(mx, my, st)
                gui.listeners.onReleased?.(mx, my, st)
            },
            func_146273_a(mx, my, mbt, t) {
                this.super$func_146273_a(mx, my, mbt, t)
                gui.listeners.onDragged?.(mx, my, mbt, t)
            },
            func_73866_w_() {
                this.super$func_73866_w_()
                gui.listeners.onInit?.()
            },
            func_73869_a(c, k) {
                this.super$func_73869_a(c, k)
                gui.listeners.onKeyTyped?.(c, k)
            },
            func_146281_b() {
                this.super$func_146281_b()
                gui.listeners.onClose?.(this)
            },
            func_175273_b(mcIn, w, h) {
                this.super$func_175273_b(mcIn, w, h)
                gui.listeners.onResize?.(mcIn, w, h)
            },
            func_73868_f: () => false,
            field_146297_k: Client.getMinecraft()
        })
        MouseListener.registerScrollListener((x, y, delta) => this.isOpen() && this.listeners.onScroll?.(x, y, delta))
    }

    open() {
        GuiHandler.openGui(this.guiScreen)
        this.listeners?.onOpen?.()
        return this
    }
    close() {
        return Player.getPlayer()?.func_71053_j(), this
    }
    isOpen() {
        return Client.currentGui.get()?.equals(this.guiScreen)
    }
    registerDraw(cb) {
        return this.listeners.onDraw = cb, this
    }
    registerClicked(cb) {
        return this.listeners.onClick = cb, this
    }
    registerScrolled(cb) {
        return this.listeners.onScroll = cb, this
    }
    registerKeyTyped(cb) {
        return this.listeners.onKeyTyped = cb, this
    }
    registerMouseDragged(cb) {
        return this.listeners.onDragged = cb, this
    }
    registerMouseReleased(cb) {
        return this.listeners.onReleased = cb, this
    }
    registerOpened(cb) {
        return this.listeners.onOpen = cb, this
    }
    registerClosed(cb) {
        return this.listeners.onClose = cb, this
    }
    registerInit(cb) {
        return this.listeners.onInit = cb, this
    }
    registerResize(cb) {
        return this.listeners.onResize = cb, this
    }
}