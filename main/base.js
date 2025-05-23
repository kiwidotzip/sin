import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import HandleRegisters from "../../DocGuiLib/listeners/Registers"
import { UIRoundedRectangle, Window, UIText, CenterConstraint, CramSiblingConstraint, PixelConstraint, ScrollComponent } from "../../Elementa"
import { CustomGui } from "../../DocGuiLib/core/CustomGui"

export default class GUIBase {
    /** 
     * @param {string} moduleName - The module's name
     * @param {string} schemePath - The color scheme path
     * @param {string} title - The title that'll render in the GUI
     */
    constructor(moduleName, schemePath, title) {
        this.title = title
        this.colorscheme = FileLib.read(moduleName, schemePath) || FileLib.read("sin", "data/_defaultScheme.json")
        this.handler = new HandleGui()._setColorScheme(this.colorscheme)
        this.handler.ctGui = new CustomGui()
        this.handler.window = new Window()
        this.handler.registers = new HandleRegisters(this.handler.ctGui, this.handler.window)
        this.scheme = JSON.parse(this.handler.getColorScheme())
        this.onOpenGui = []
        this.onCloseGui = []
        this.categories = []
        this.activeCategory = null
        this.currentContent = null
        this.isInitialized = false
        this.SinGUI = {
            background: {
                width: 55,
                leftRatio: 1,
                rightRatio: 3,
                height: 50,
                margins: {
                    x: 0,
                    y: 15
                }
            }
        }
        this.handler.ctGui.registerInit(() => Keyboard.enableRepeatEvents(true))
        const regs = this.handler.registers
        regs._stop = () => {
            if (regs.isCustom) return
            for (const ev of regs.eventsList) {
                if (ev && typeof ev.unregister === "function") ev.unregister()
            }
            regs.eventsList.clear()
        }
        this._createGUI()
        this.handler.registers.onOpen(() => this.onOpenGui.forEach(it => it()))
        this.handler.registers.onClose(() => {
            this.onCloseGui.forEach(it => it())
            Keyboard.enableRepeatEvents(false)
        })
    }
    /** @private */
    _createGUI() {
        if (this.isInitialized) return
        this.isInitialized = true
        const totalRatio = this.SinGUI.background.leftRatio + this.SinGUI.background.rightRatio
        const leftWidthPercent = (this.SinGUI.background.leftRatio / totalRatio) * 100
        const rightWidthPercent = (this.SinGUI.background.rightRatio / totalRatio) * 100
        
        this.mainBlock = new UIRoundedRectangle(0)
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setWidth(this.SinGUI.background.width.percent())
            .setHeight(this.SinGUI.background.height.percent())
            .setColor(ElementUtils.getJavaColor([255, 255, 255, 0]))
            
        this.leftBlock = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth(leftWidthPercent.percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.background.panel.leftColor))
            .setChildOf(this.mainBlock)
            
        new UIText(this.title)
            .setX(new CenterConstraint())
            .setY((3).percent())
            .setTextScale(new PixelConstraint(this.SinGUI.background.height * 0.04, true))
            .setChildOf(this.leftBlock)
            
        this.categoryScroll = new ScrollComponent()
            .setX((5).percent())
            .setY((10).percent())
            .setWidth((90).percent())
            .setHeight((85).percent())
            .setChildOf(this.leftBlock)
            
        this.categoryContent = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight(new PixelConstraint(this.categories.length * 40))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.categoryScroll)
            
        this.rightBlock = new UIRoundedRectangle(0)
            .setX(leftWidthPercent.percent())
            .setY((0).percent())
            .setWidth(rightWidthPercent.percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.background.panel.rightColor))
            .setChildOf(this.mainBlock)
            
        this.elementBox = new ScrollComponent()
            .setX((5).percent())
            .setY((5).percent())
            .setWidth((90).percent())
            .setHeight((90).percent())
            .setChildOf(this.rightBlock)

        this._updateLeftPanel()
        if (this.categories.length > 0) {
            this.activeCategory = this.categories[0].name
            this._updateRightPanel(this.activeCategory)
        }

        this.handler.draw(this.mainBlock, false)
    }
    /** @private */
    _updateLeftPanel() {
        this.categoryContent.clearChildren()
        this.categoryContent.setHeight(new PixelConstraint(this.categories.length * 40))

        this.categories.forEach((category, index) => {
            const isActive = category.name === this.activeCategory
            const bgColor = isActive ? this.scheme.Sin.background.panel.activeCategoryColor : this.scheme.Sin.background.panel.leftColor

            new UIRoundedRectangle(5)
                .setX((5).percent())
                .setY(new PixelConstraint(index * 40))
                .setWidth((90).percent())
                .setHeight((35).pixels())
                .setColor(ElementUtils.getJavaColor(bgColor))
                .setChildOf(this.categoryContent)
                .onMouseClick(() => this._switchCategory(category.name))
                .addChildren(
                    category.icon && new UIText(category.icon)
                        .setX((5).percent())
                        .setY(new CenterConstraint())
                        .setTextScale(new PixelConstraint(1.8, false)),
                    new UIText(category.name)
                        .setX(category.icon ? (15).percent() : (10).percent())
                        .setY(new CenterConstraint())
                        .setTextScale(new PixelConstraint(1.5, false))
                        .setColor(ElementUtils.getJavaColor(isActive ? this.scheme.Sin.accent : this.scheme.Sin.text))
                )
        })
    }
    /** @private */
    _updateRightPanel(categoryName) {
        if (this.currentContent) {
            const parent = this.currentContent.getParent()
            if (parent) parent.removeChild(this.currentContent)
            this.currentContent = null
        }
        const category = this.categories.find(c => c.name === categoryName)
        if (!category) return
        const scrollContent = this.elementBox || new UIRoundedRectangle(0)
            .setWidth((100).percent())
            .setHeight((100).percent())

        this.currentContent = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight(new PixelConstraint(Math.ceil(category.elements.length / 3) * 92))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(scrollContent)
        if (!this.elementBox) this.elementBox.setContent(scrollContent)

        category.elements.forEach(element => {
            new UIRoundedRectangle(5)
                .setX(new CramSiblingConstraint(15))
                .setY(new CramSiblingConstraint(15))
                .setWidth((30).percent())
                .setHeight((80).pixels())
                .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.color))
                .setChildOf(this.currentContent)
                .onMouseClick(() => this._createElementPopup(element))
                .addChildren(
                    new UIRoundedRectangle(0)
                        .setX((0).percent())
                        .setY((70).percent())
                        .setWidth((100).percent())
                        .setHeight((5).percent())
                        .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.divider)),
                    new UIText(element.icon)
                        .setX(new CenterConstraint())
                        .setY((25).percent())
                        .setTextScale(new PixelConstraint(3.0, false)),
                    new UIText(element.text)
                        .setX(new CenterConstraint())
                        .setY((80).percent())
                        .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
                )
        })
    }
    /** @private */
    _createElementPopup(element) {
        const overlay = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 150]))
            .setChildOf(this.rightBlock)

        const popupMain = new UIRoundedRectangle(5)
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setWidth((90).percent())
            .setHeight((90).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.popUp.menu))
            .setChildOf(overlay)
            .addChildren(
                new UIRoundedRectangle(5)
                    .setX(new CenterConstraint())
                    .setY((0).percent())
                    .setWidth((100).percent())
                    .setHeight((13).percent())
                    .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.divider)),
                new UIRoundedRectangle(0)
                    .setX(new CenterConstraint())
                    .setY((12).percent())
                    .setWidth((100).percent())
                    .setHeight((2.5).percent())
                    .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.divider)),
                new UIText(element.text)
                    .setX(new CenterConstraint())
                    .setY((4).percent())
                    .setTextScale(new PixelConstraint(2.0, false)),
                new ScrollComponent()
                    .setX((5).percent())
                    .setY((15).percent())
                    .setWidth((90).percent())
                    .setHeight((80).percent())
                    .addChildren(
                        new UIRoundedRectangle(0)
                            .setWidth((100).percent())
                            .setHeight(new PixelConstraint(element.subElements.length * 35))
                            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                            .addChildren(
                                ...element.subElements.map((subElem, index) =>
                                    new UIRoundedRectangle(3)
                                        .setX((5).percent())
                                        .setY(new PixelConstraint(index * 35))
                                        .setWidth((90).percent())
                                        .setHeight((30).pixels())
                                        .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                                        .addChildren(
                                            new UIText(subElem.icon)
                                                .setX((2).percent())
                                                .setY(new CenterConstraint()),
                                            new UIText(subElem.text)
                                                .setX((12).percent())
                                                .setY(new CenterConstraint())
                                        )
                                )
                            )
                    ),
                new UIText("[✕]")
                    .setX((90).percent())
                    .setY((12).pixels())
                    .setTextScale((1.5).pixels())
                    .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
                    .onMouseClick(() => {
                        if (overlay.getParent()) {
                            overlay.getParent().removeChild(overlay)
                        }
                    })
            )

        return overlay
    }
    /** @private */
    _switchCategory(categoryName) {
        const popups = this.rightBlock.getChildren().filter(child => child instanceof UIRoundedRectangle)
        popups.forEach(popup => popup.getParent()?.removeChild(popup))
        
        this.activeCategory = categoryName
        this._updateLeftPanel()
        this._updateRightPanel(categoryName)
    }
    /**
     * Adds a category
     * @param {string} name - The category name
     * @param {string} icon - The icon of the category
     * @returns this for chaining 
     */
    addCategory(name, icon = "") {
        this.categories.push({ name, icon, elements: [] })
        if (!this.activeCategory) this.activeCategory = name
        if (this.isInitialized) {
            this._updateLeftPanel()
            this._updateRightPanel(this.activeCategory)
        }
        
        return this
    }
    /**
     * Adds an element to the category
     * @param {string} categoryName - The category to add the element to
     * @param {string} element - The element
     * @returns this for chaining
     */
    pushElement(categoryName, element) {
        const category = this.categories.find(c => c.name === categoryName)
        if (!category) {
            console.warn(`Category "${categoryName}" not found!`)
            return this
        }
        category.elements.push(element)
        if (this.activeCategory === categoryName && this.isInitialized) this._updateRightPanel(categoryName)
        return this
    }
    /**
     * Opens the GUI
     * @returns this for chaining
     */
    openGui() {
        if (!this.isInitialized) this._createGUI()
        this.handler.ctGui.open()
        return this
    }
    /**
     * Closes the GUI
     * @returns this for chaining
     */
    closeGui() {
        this.handler.ctGui.close()
        return this
    }
    /**
     * @param {*} function to call on GUI Open
     * @returns this for chaining
     */
    onOpen(fn) {
        this.onOpenGui.push(fn)
        return this
    }
    /**
     * @param {*} function to call on GUI Close 
     * @returns this for chaining
     */
    onClose(fn) {
        this.onCloseGui.push(fn)
        return this
    }
    /**
     * Sets the size of the GUI
     * @param {number} width 
     * @param {number} height 
     * @returns this for chaining
     */
    setSize(width, height) {
        if (width) this.SinGUI.background.width = width
        if (height) this.SinGUI.background.height = height
        return this
    }
    /**
     * Sets the position of the GUI
     * @param {number} x 
     * @param {number} y 
     * @returns this for chaining
     */
    setPos(x, y) {
        if (x) this.SinGUI.background.margins.x = x
        if (y) this.SinGUI.background.margins.y = y
        return this
    }
    /**
     * Sets the ratio of the GUI
     * @param {number} leftRatio
     * @param {number} rightRatio
     * @returns this for chaining
     */
    setRatio(left, right) {
        if (left) this.SinGUI.background.leftRatio = left
        if (right) this.SinGUI.background.rightRatio = right
        return this
    }
}
