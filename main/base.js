import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import HandleRegisters from "../../DocGuiLib/listeners/Registers"
import { UIRoundedRectangle, Window, UIText, UIWrappedText, CenterConstraint, CramSiblingConstraint, PixelConstraint, ScrollComponent, animate, Animations, ConstantColorConstraint } from "../../Elementa"
import { CustomGui } from "../../DocGuiLib/core/CustomGui"
import { SwitchElement, TextInputElement, SliderElement, DropdownElement, ColorPickerElement, KeybindElement, ButtonElement } from "./elements"

/** @typedef {import('./elements').ElementConfig} ElementConfig */
/** @typedef {'button'|'switch'|'textinput'|'slider'|'dropdown'|'colorpicker'|'keybind'} ElementType */
export default class GUIBase {
    /**
     * @param {string} moduleName 
     * @param {string} schemePath 
     * @param {string} title 
     */
    constructor(moduleName, schemePath, title) {
        this.title = title
        this.colorscheme = FileLib.read(moduleName, schemePath) || FileLib.read("sin", "data/_defaultScheme.json")
        this.handler = new HandleGui()._setColorScheme(this.colorscheme)
        this.scheme = JSON.parse(this.handler.getColorScheme())
        this.categories = []
        this.config = {}
        this._initHandler()
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
        this.activeCategory = null
        this.currentContent = null
        this.activeElement = null
        this.activePopupElement = null
        this.isInitialized = false
        this.onOpenGui = []
        this.onCloseGui = []
    }

    /** @private */
    _initHandler() {
        this.handler.ctGui = new CustomGui()
        this.handler.window = new Window()
        this.handler.registers = new HandleRegisters(this.handler.ctGui, this.handler.window)
        const regs = this.handler.registers
        regs._stop = () => {
            if (regs.isCustom) return
            for (const ev of regs.eventsList) {
                if (ev && typeof ev.unregister === "function") ev.unregister()
            }
            regs.eventsList.clear()
        }
        this.handler.ctGui.registerInit(() => Keyboard.enableRepeatEvents(true))
        this.handler.registers.onOpen(() => this.onOpenGui.forEach(fn => fn()))
        this.handler.registers.onClose(() => {
            this.onCloseGui.forEach(fn => fn())
            Keyboard.enableRepeatEvents(false)
        })
    }

    /** @private */
    _createGUI() {
        if (this.isInitialized) return
        this.isInitialized = true
        
        const totalRatio = this.SinGUI.background.leftRatio + this.SinGUI.background.rightRatio
        const leftWidth = (this.SinGUI.background.leftRatio / totalRatio) * 100
        const rightWidth = (this.SinGUI.background.rightRatio / totalRatio) * 100

        this.mainBlock = new UIRoundedRectangle(0)
            .setX(new CenterConstraint()).setY(new CenterConstraint())
            .setWidth(this.SinGUI.background.width.percent())
            .setHeight(this.SinGUI.background.height.percent())
            .setColor(ElementUtils.getJavaColor([255, 255, 255, 0]))
            
        this._createLeftPanel(leftWidth)
        this._createRightPanel(leftWidth, rightWidth)
        this._updateLeftPanel()
        if (this.categories.length) this._switchCategory(this.categories[0].name)

        this.handler.draw(this.mainBlock, false)
    }

    /**
     * @private
     * @param {number} leftWidth 
     */
    _createLeftPanel(leftWidth) {
        this.leftBlock = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth(leftWidth.percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.background.panel.leftColor))
            .setChildOf(this.mainBlock)
            
        new UIText(this.title)
            .setX(new CenterConstraint())
            .setY((3).percent())
            .setTextScale(new PixelConstraint(this.SinGUI.background.height * 0.03, true))
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
    }

    /**
     * @private
     * @param {number} leftWidth 
     * @param {number} rightWidth 
     */
    _createRightPanel(leftWidth, rightWidth) {
        this.rightBlock = new UIRoundedRectangle(0)
            .setX(leftWidth.percent())
            .setY((0).percent())
            .setWidth(rightWidth.percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.background.panel.rightColor))
            .setChildOf(this.mainBlock)
            
        this.elementBox = new ScrollComponent()
            .setX((5).percent()).setY((5).percent())
            .setWidth((90).percent()).setHeight((90).percent())
            .setChildOf(this.rightBlock)
    }

    /** @private */
    _updateLeftPanel() {
        this.categoryContent.clearChildren()
        this.categoryContent.setHeight(new PixelConstraint(this.categories.length * 40))

        this.categories.forEach((category, index) => {
            const isActive = category.name === this.activeCategory
            const bgColor = isActive ? this.scheme.Sin.background.panel.activeCategoryColor : this.scheme.Sin.background.panel.leftColor

            const categoryButton = new UIRoundedRectangle(5)
                .setX((5).percent())
                .setY(new PixelConstraint(index * 40 + 5))
                .setWidth((90).percent())
                .setHeight((35).pixels())
                .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                .setChildOf(this.categoryContent)
                .onMouseClick(() => this._switchCategory(category.name))
                
            const bgComponent = new UIRoundedRectangle(5)
                .setX((0).percent())
                .setY((0).percent())
                .setWidth((100).percent())
                .setHeight((100).percent())
                .setColor(ElementUtils.getJavaColor(bgColor))
                .setChildOf(categoryButton)
                
            this._setupButtonHover(bgComponent, bgColor)
            this._createCategoryText(categoryButton, category.name, isActive)
        })
    }

    /**
     * @private
     * @param {UIRoundedRectangle} bgComponent 
     * @param {number[]} originalColor 
     */
    _setupButtonHover(bgComponent, originalColor) {
        const hoverColor = this.scheme.Sin.accent2
        bgComponent.onMouseEnter(() => this._animateColor(bgComponent, hoverColor))
                .onMouseLeave(() => this._animateColor(bgComponent, originalColor))
    }

    /**
     * @private
     * @param {UIRoundedRectangle} element 
     * @param {number[]} targetColor 
     */
    _animateColor(element, targetColor) {
        animate(element, animation => 
            animation.setColorAnimation(Animations.OUT_EXP, 0.2, new ConstantColorConstraint(ElementUtils.getJavaColor(targetColor)))
        )
    }

    /**
     * @private
     * @param {UIRoundedRectangle} parent 
     * @param {string} text 
     * @param {boolean} isActive 
     */
    _createCategoryText(parent, text, isActive) {
        new UIWrappedText(text, true, null, true, true)
            .setX((0).percent())
            .setY(new CenterConstraint())
            .setWidth((100).percent())
            .setTextScale((1.3).pixels())
            .setColor(ElementUtils.getJavaColor(isActive ? this.scheme.Sin.accent : this.scheme.Sin.element.text))
            .setChildOf(parent)
    }

    /**
     * @private
     * @param {string} categoryName 
     */
    _updateRightPanel(categoryName) {
        this.currentContent?.getParent()?.removeChild(this.currentContent)
        this.currentContent = null
        
        const category = this.categories.find(c => c.name === categoryName)
        if (!category) return
        
        this.currentContent = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight(new PixelConstraint(Math.ceil(category.elements.length / 3) * 92))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.elementBox)

        category.elements.forEach(element => 
            this._createElementCard(element).setChildOf(this.currentContent)
        )
    }

    /**
     * @private
     * @param {object} element 
     * @returns {UIRoundedRectangle}
     */
    _createElementCard(element) {
        const card = new UIRoundedRectangle(5)
            .setX(new CramSiblingConstraint(15))
            .setY(new CramSiblingConstraint(15))
            .setWidth((30).percent())
            .setHeight((80).pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.color))
            .onMouseClick(() => this._createElementPopup(element))
            .onMouseEnter(() => this._animateColor(card, this.scheme.Sin.element.hoverColor))
            .onMouseLeave(() => this._animateColor(card, this.scheme.Sin.element.color))

        new UIWrappedText(element.name, true, null, true, true)
            .setX(new CenterConstraint()).setY(new CenterConstraint())
            .setWidth((90).percent()).setTextScale(1.5.pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
            .setChildOf(card)

        return card
    }

    /**
     * @private
     * @param {object} element 
     */
    _createElementPopup(element) {
        this.activeElement = element
        const overlay = new UIRoundedRectangle(0)
            .setX((0).percent())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight((100).percent())
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 150]))
            .setChildOf(this.rightBlock)

        const popupMain = new UIRoundedRectangle(5)
            .setX(new CenterConstraint()).setY(new CenterConstraint())
            .setWidth((90).percent()).setHeight((90).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.popUp.menu))
            .setChildOf(overlay)
            
        this._createPopupHeader(popupMain, element)
        this._createPopupContent(popupMain, element)
        this._createCloseButton(popupMain, overlay)

        this.activePopupElement = overlay
    }

    /**
     * @private
     * @param {UIRoundedRectangle} parent 
     * @param {object} element 
     */
    _createPopupHeader(parent, element) {
        new UIRoundedRectangle(5)
            .setX(new CenterConstraint())
            .setY((0).percent())
            .setWidth((100).percent())
            .setHeight((13).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.color))
            .setChildOf(parent)

        new UIWrappedText(element.name, true, null, true, false)
            .setX(new CenterConstraint())
            .setY((4).percent())
            .setWidth((100).percent())
            .setTextScale((2.0).pixels())
            .setChildOf(parent)
    }

    /**
     * @private
     * @param {UIRoundedRectangle} parent 
     * @param {object} element 
     */
    _createPopupContent(parent, element) {
        const scroll = new ScrollComponent()
            .setX((5).percent())
            .setY((15).percent())
            .setWidth((90).percent())
            .setHeight((80).percent())
            .setChildOf(parent)

        const content = new UIRoundedRectangle(0)
            .setWidth((100).percent())
            .setHeight(new PixelConstraint(element.subElements.filter(e => !e.shouldShow || e.shouldShow(this.config)).length * 35))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(scroll)

        element.subElements.forEach((subElem, index) => {
            if (subElem.shouldShow && !subElem.shouldShow(this.config)) return
            
            const container = new UIRoundedRectangle(3)
                .setX((0).percent())
                .setY(new PixelConstraint(index * 45))
                .setWidth((100).percent())
                .setHeight((50).pixels())
                .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                .setChildOf(content)

            this._createSubElement(subElem, container)
        })
    }

    /**
     * @private
     * @param {object} subElem 
     * @param {UIRoundedRectangle} container 
     */
    _createSubElement(subElem, container) {
        if (subElem.title) this._createSubElementTitle(subElem, container)
        if (subElem.description) this._createSubElementDescription(subElem, container)
        
        const component = this._createComponent(subElem)
        component.create()
            .setX((0).percent())
            .setY(new CenterConstraint())
            .setWidth((20).percent())
            .setHeight((20).pixels())
            .setChildOf(container)
    }

    /**
     * @private
     * @param {object} subElem 
     * @param {UIRoundedRectangle} container 
     */
    _createSubElementTitle(subElem, container) {
        new UIText(subElem.title)
            .setX(new CenterConstraint())
            .setY((2).percent())
            .setTextScale(1.2.pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
            .setChildOf(container)
    }

    /**
     * @private
     * @param {object} subElem 
     * @param {UIRoundedRectangle} container 
     */
    _createSubElementDescription(subElem, container) {
        new UIWrappedText(subElem.description, true, null, false, false, 10)
            .setX((25).percent())
            .setY(new CenterConstraint())
            .setWidth((75).percent())
            .setTextScale((1.0).pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent2))
            .setChildOf(container)
    }

    /**
     * @private
     * @param {object} subElem 
     * @returns {SwitchElement|TextInputElement|SliderElement|DropdownElement|ColorPickerElement|KeybindElement|ButtonElement}
     */
    _createComponent(subElem) {
        const currentValue = this.config[subElem.configName] ?? subElem.value
        const componentMap = {
            button: () => new ButtonElement(subElem.title)
                .setColorScheme(this.scheme)
                .on('click', () => this._triggerEvent(subElem.onClick)),
            switch: () => new SwitchElement(currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this._updateConfig(subElem.configName, val)),
            textinput: () => new TextInputElement(currentValue, subElem.placeHolder)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val),
            slider: () => new SliderElement(subElem.options[0], subElem.options[1], currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val),
            dropdown: () => new DropdownElement(subElem.options, currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val),
            colorpicker: () => new ColorPickerElement(currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val),
            keybind: () => new KeybindElement(currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val)
        }

        return componentMap[subElem.type]()
    }

    /**
     * @private
     * @param {string} key 
     * @param {any} value 
     */
    _updateConfig(key, value) {
        this.config[key] = value
        this._refreshPopup()
    }

    /**
     * @private
     * @param {UIRoundedRectangle} parent 
     * @param {UIRoundedRectangle} overlay 
     */
    _createCloseButton(parent, overlay) {
        const closeBtn = new UIText("[✕]")
            .setX((90).percent()).setY((12).pixels())
            .setTextScale(1.5.pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.closeButton.normal))
            .setChildOf(parent)
            .onMouseClick(() => overlay.getParent().removeChild(overlay))
            .onMouseEnter(() => this._animateColor(closeBtn, this.scheme.Sin.element.closeButton.hover))
            .onMouseLeave(() => this._animateColor(closeBtn, this.scheme.Sin.element.closeButton.normal))
    }

    /** @private */
    _refreshPopup() {
        this.activePopupElement?.getParent()?.removeChild(this.activePopupElement)
        this._createElementPopup(this.activeElement)
    }
    
    /**
     * @private
     * @param {Function} event 
     */
    _triggerEvent(event) {
        typeof event === "function" && event(this.config, this)
    }

    /**
     * @private
     * @param {string} categoryName 
     */
    _switchCategory(categoryName) {
        this.activeCategory = categoryName
        this.rightBlock.getChildren()
            .filter(child => child instanceof UIRoundedRectangle)
            .forEach(popup => popup.getParent()?.removeChild(popup))
            
        this._updateLeftPanel()
        this._updateRightPanel(categoryName)
    }

    /**
     * @private
     * @param {ElementType} type 
     * @param {ElementConfig} config 
     * @returns {this}
     */
    _addElement(type, config) {
        const { category, subcategory } = config
        let categoryObj = this.categories.find(c => c.name === category) || this._createCategory(category)
        let subcategoryObj = categoryObj.elements.find(e => e.name === subcategory) || this._createSubcategory(categoryObj, subcategory)
        
        subcategoryObj.subElements.push({ type, ...config })
        if (this.activeCategory === category && this.isInitialized) this._updateRightPanel(category)
        return this
    }

    /**
     * @private
     * @param {string} name 
     * @returns {object}
     */
    _createCategory(name) {
        const newCategory = { name, elements: [] }
        this.categories.push(newCategory)
        return newCategory
    }

    /**
     * @private
     * @param {object} category 
     * @param {string} name 
     * @returns {object}
     */
    _createSubcategory(category, name) {
        const newSubcategory = { name, elements: [], subElements: [] }
        category.elements.push(newSubcategory)
        return newSubcategory
    }

    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addButton(config) {
        return this._addElement('button', config)
    }

    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addSwitch(config) {
        return this._addElement('switch', config)
    }
    
    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addTextInput(config) {
        return this._addElement('textinput', config)
    }

    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addSlider(config) {
        return this._addElement('slider', config)
    }

    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addDropDown(config) {
        return this._addElement('dropdown', config)
    }

    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addColorPicker(config) {
        return this._addElement('colorpicker', config)
    }
    
    /** 
     * @param {ElementConfig} config 
     * @returns this for chaining
     */ 
    addKeybind(config) {
        return this._addElement('keybind', config)
    }

    /**
     * Opens the GUI
     * @returns this for chaining
     */
    openGui() {
        !this.isInitialized && this._createGUI()
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
     * Runs the given func on GUI open
     * @param {Function} fn 
     * @returns this for chaining
     */
    onOpen(fn) {
        this.onOpenGui.push(fn)
        return this
    }

    /**
     * Runs the given func on GUI close
     * @param {Function} fn 
     * @returns this for chaining
     */
    onClose(fn) {
        this.onCloseGui.push(fn)
        return this
    }

    /**
     * Sets the GUI size
     * @param {number} [width]
     * @param {number} [height]
     * @returns this for chaining
     */
    setSize(width, height) {
        width && (this.SinGUI.background.width = width)
        height && (this.SinGUI.background.height = height)
        return this
    }

    /**
     * Sets the GUI pos
     * @param {number} [x]
     * @param {number} [y]
     * @returns this for chaining
     */
    setPos(x, y) {
        x && (this.SinGUI.background.margins.x = x)
        y && (this.SinGUI.background.margins.y = y)
        return this
    }

    /**
     * Sets the GUI ratio
     * @param {number} [left]
     * @param {number} [right]
     * @returns this for chaining
     */
    setRatio(left, right) {
        left && (this.SinGUI.background.leftRatio = left)
        right && (this.SinGUI.background.rightRatio = right)
        return this
    }
}