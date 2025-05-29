import ElementUtils from "../../DocGuiLib/core/Element"
import HandleGui from "../../DocGuiLib/core/Gui"
import HandleRegisters from "../../DocGuiLib/listeners/Registers"
import { UIRoundedRectangle, Window, UIText, UIWrappedText, CenterConstraint, CramSiblingConstraint, ChildBasedSizeConstraint, PixelConstraint, ScrollComponent, animate, Animations, ConstantColorConstraint, SVGParser, SVGComponent, AdditiveConstraint } from "../../Elementa"
import { CustomGui } from "../../DocGuiLib/core/CustomGui"
import { SwitchElement, TextInputElement, SliderElement, DropdownElement, KeybindElement, ButtonElement, ColorPickerElement } from "./elements"

const SAXReader = Java.type("gg.essential.elementa.impl.dom4j.io.SAXReader")
const Document = Java.type("gg.essential.elementa.impl.dom4j.Document").class
const FileInputStream = Java.type("java.io.FileInputStream")
const parseDocument = SVGParser.getClass().getDeclaredMethod("parseDocument", Document)
parseDocument.setAccessible(true)

const parseFromResource = (path) => {
    let reader = new SAXReader()
    let stream = new FileInputStream(path)
    let document = reader.read(stream)
    return parseDocument.invoke(SVGParser, document)
}

let defaultSVG = parseFromResource("./config/ChatTriggers/modules/sin/assets/box.svg")

/** @typedef {import('./elements').ElementConfig} ElementConfig */
/** @typedef {'button'|'switch'|'textinput'|'slider'|'dropdown'|'colorpicker'|'keybind'} ElementType */
export default class GUIBase {
    /**
     * @param {string} moduleName
     * @param {string} schemePath
     * @param {string} title
     * @param {string} confPath
     */
    constructor(moduleName, schemePath, title, confPath) {
        this.title = title
        this.colorscheme = FileLib.read(moduleName, schemePath) || FileLib.read("sin", "data/_defaultScheme.json")
        this.moduleName = moduleName
        this.configPath = confPath || "data/SINsettings.json"
        this.handler = new HandleGui()._setColorScheme(this.colorscheme)
        this.scheme = JSON.parse(this.handler.getColorScheme())
        this.categories = []
        this.config = confPath ? JSON.parse(FileLib.read(moduleName, confPath) || "{}") : {}
        this._initHandler()
        this.SinGUI = {
            background: {
                width: 65,
                leftRatio: 0.85,
                rightRatio: 3.15,
                height: 60,
                margins: { 
                    x: 0, 
                    y: 15 
                }
            },
            element: {
                width: 92,
                subelem: {
                    width: 60,
                    height: 20,
                    description: {
                        padding: 20, // in percent
                        textScale: 1.0, // in pixels
                        color: this.scheme.Sin.accent2
                    },
                    title: {
                        textScale: 1.2, // in pixels
                        yOffset: 2, // in percent
                        color: this.scheme.Sin.accent
                    }
                }
            }
        }
        this.activeCategory = null
        this.currentContent = null
        this.activeElement = null
        this.activePopupElement = null
        this.isInitialized = false
        this._subElements = new Map()
        this._originalHeights = new Map()
        this.listeners = new Map()
        this.onOpenGui = []
        this.onCloseGui = []
        this._loadConfig()
        register("gameUnload", () => this._saveConfig())
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
            this.listeners.clear()
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
            .setTextScale(new PixelConstraint(this.SinGUI.background.height * 0.0285, true))
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
            .setX((5).percent())
            .setY((5).percent())
            .setWidth((this.SinGUI.element.width).percent())
            .setHeight((90).percent())
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
            const svgCont = new UIRoundedRectangle(0)
                .setX((0).percent())
                .setY((0).percent())
                .setWidth((25).percent())
                .setHeight((100).percent())
                .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                .setChildOf(categoryButton)
            new SVGComponent(category.svg ? parseFromResource(category.svg) : defaultSVG)
                .setX(new CenterConstraint())
                .setY(new CenterConstraint())
                .setWidth((100).percent())
                .setHeight((80).percent())
                .setChildOf(svgCont)
            this._setupButtonHover(bgComponent, bgColor)
            new UIWrappedText(category.name, true, null, false, true)
                .setX((25).percent())
                .setY(new CenterConstraint())
                .setWidth((100).percent())
                .setTextScale((1.3).pixels())
                .setColor(ElementUtils.getJavaColor(isActive ? this.scheme.Sin.accent : this.scheme.Sin.element.text))
                .setChildOf(categoryButton)
        })
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
            .setHeight(new PixelConstraint(Math.ceil(category.elements.length / 4) * 94))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(this.elementBox)

        category.elements.forEach(element => this._createElementCard(element).setChildOf(this.currentContent))
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
     * @param {object} element 
     * @returns {UIRoundedRectangle}
     */
    _createElementCard(element) {
        const card = new UIRoundedRectangle(5)
            .setX(new CramSiblingConstraint(15))
            .setY(new CramSiblingConstraint(15))
            .setWidth((22).percent())
            .setHeight((80).pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.color))
            .onMouseClick(() => this._createElementPopup(element))
            .onMouseEnter(() => { 
                this._animateColor(card, this.scheme.Sin.element.hoverColor)
                this._animateColor(CardTitle, this.scheme.Sin.element.titleHover)
            })
            .onMouseLeave(() => {
                this._animateColor(card, this.scheme.Sin.element.color)
                this._animateColor(CardTitle, this.scheme.Sin.element.titleColor)
            })

        new SVGComponent(element.svg ? parseFromResource(element.svg) : defaultSVG)
            .setX(new CenterConstraint())
            .setY(new CramSiblingConstraint())
            .setWidth((60).percent())
            .setHeight((80).percent())
            .setChildOf(card)

        const CardTitle = new UIRoundedRectangle(3)
            .setX((0).percent())
            .setY((80).percent())
            .setWidth((100).percent())
            .setHeight(new AdditiveConstraint(new ChildBasedSizeConstraint(), new PixelConstraint(10)))
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.titleColor))
            .setChildOf(card)
        let displayName = element.name
        if (displayName.length > 18) displayName = displayName.slice(0, 18 - 1) + "…"
        new UIWrappedText(displayName, true, null, true, true, 9.0, "")
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setWidth((100).percent())
            .setTextScale((1.2).pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
            .setChildOf(CardTitle)

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
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setWidth((90).percent()).setHeight((90).percent())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.popUp.menu))
            .setChildOf(overlay)
            
        this._createPopupHeader(popupMain, element)
        this._createPopupContent(popupMain, element)
        this._createCloseButton(popupMain, overlay)

        this.activePopupElement = overlay
        if (this._popGuiKeyHandler) return
        this._popGuiKeyHandler = register("guiKey", (char, keyc, gui, evn) => {
            if (!this.activePopupElement || keyc !== 1 || !this.activePopupElement.getParent()) return
            this.activePopupElement.getParent().removeChild(this.activePopupElement)
            this.activePopupElement = null
            cancel(evn)
        })
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
            .setY((18).percent())
            .setWidth((90).percent())
            .setHeight((77).percent())
            .setChildOf(parent)

        this.currentContent = new UIRoundedRectangle(0)
            .setWidth((100).percent())
            .setHeight(new ChildBasedSizeConstraint(5))
            .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
            .setChildOf(scroll)

        let previousElement = null
        element.subElements.forEach((subElem, index) => {
            const outerContainer = new UIRoundedRectangle(3)
                .setX((0).percent())
                .setY(previousElement ? new CramSiblingConstraint(18) : (0).percent())
                .setWidth((100).percent())
                .setHeight((62).pixels())
                .setColor(ElementUtils.getJavaColor([0, 0, 0, 0]))
                .setChildOf(this.currentContent)

            const card = new UIRoundedRectangle(this.scheme.Sin.base.roundness)
                .setX((0).percent())
                .setY((12).pixels())
                .setWidth((100).percent())
                .setHeight((50).pixels())
                .setColor(ElementUtils.getJavaColor(this.scheme.Sin.accent))
                .setChildOf(outerContainer)
            new UIRoundedRectangle(this.scheme.Sin.base.roundness)
                .setX(new CenterConstraint())
                .setY(new CenterConstraint())
                .setWidth((99.75).percent())
                .setHeight((98.5).percent())
                .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.popUp.menu))
                .setChildOf(card)

            if (subElem.title) {
                const TitleText = new UIText(subElem.title)
                    .setX((4).pixels())
                    .setY((0).pixels())
                    .setTextScale((this.SinGUI.element.subelem.title.textScale + 0.2).pixels())
                    .setColor(ElementUtils.getJavaColor(this.SinGUI.element.subelem.title.color))
                    .setChildOf(outerContainer)
                new UIRoundedRectangle(0)
                    .setX(new CenterConstraint())
                    .setY(new CenterConstraint())
                    .setWidth((105).percent())
                    .setHeight((105).percent())
                    .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.popUp.menu))
                    .setChildOf(TitleText)
                new UIText(subElem.title)
                    .setX((0).pixels())
                    .setY((4).pixels())
                    .setTextScale((this.SinGUI.element.subelem.title.textScale + 0.2).pixels())
                    .setColor(ElementUtils.getJavaColor(this.SinGUI.element.subelem.title.color))
                    .setChildOf(TitleText)
            }
            
            if (subElem.description)
                new UIWrappedText(subElem.description, true, null, false, false, 10)
                    .setX((this.SinGUI.element.subelem.description.padding).percent())
                    .setY(new CenterConstraint())
                    .setWidth((75).percent())
                    .setTextScale((this.SinGUI.element.subelem.description.textScale).pixels())
                    .setColor(ElementUtils.getJavaColor(this.SinGUI.element.subelem.description.color))
                    .setChildOf(card)

            this._subElements.set(subElem.configName, { container: outerContainer, shouldShow: subElem.shouldShow })
            this._updateElementVisibility(subElem.configName)
            this._originalHeights.set(outerContainer, outerContainer.getHeight())

            const component = this._createComponent(subElem)
            component.create()
                .setX((3).percent())
                .setY(new CenterConstraint())
                .setWidth((this.SinGUI.element.subelem.width).pixels())
                .setHeight((this.SinGUI.element.subelem.height).pixels())
                .setChildOf(card)

            previousElement = outerContainer
        })
    }

    /**
     * @private
     * @param {string} configName
     */
    _updateElementVisibility(configName) {
        const { container, shouldShow } = this._subElements.get(configName) || {}
        if (!container) return
        const visible = !shouldShow || shouldShow(this.config)
        const originalHeight = this._originalHeights.get(container) || 50

        visible
            ? container && container.setHeight(originalHeight.pixels()).unhide(true)
            : container && container.setHeight((0).pixels()).hide(true)
        this.currentContent?.getParent()?.onWindowResize()
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
                .on('click', () => subElem.onClick(this.config, this)),
            switch: () => new SwitchElement(currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this._updateConfig(subElem.configName, val)),
            textinput: () => new TextInputElement(currentValue, subElem.placeHolder)
                .setColorScheme(this.scheme)
                .on('change', val => this._updateConfig(subElem.configName, val)),
            slider: () => new SliderElement(subElem.options[0], subElem.options[1], currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this._updateConfig(subElem.configName, val)),
            dropdown: () => new DropdownElement(subElem.options, currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this._updateConfig(subElem.configName, val)),
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
    _updateConfig(key, newVal) {
        const oldVal = this.config[key]
        this.config[key] = newVal
        this._subElements.forEach((_, configName) => 
            this._subElements.get(configName).shouldShow?.toString()?.includes(key) && 
            this._updateElementVisibility(configName)
        )
        this.listeners.forEach((meta, handler) => meta.any ? handler(oldVal, newVal, key) : handler(key, oldVal, newVal))
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

    /**
     * @private
     * @param {string} categoryName 
     */
    _switchCategory(categoryName) {
        this.activeCategory = categoryName
        this.rightBlock.getChildren().filter(c => c instanceof UIRoundedRectangle).forEach(p => p.getParent().removeChild(p))
        this.elementBox.clearChildren()
        this.currentContent = null
            
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
     * Returns the default value for a config element based on its type.
     * @private
     * @param {object} element
     */
    _getDefaultValue(element) {
        switch (element.type) {
            case "switch":
                return false
            case "textinput":
                return element.placeHolder ?? ""
            case "slider":
                return element.options[0]
            case "dropdown":
                return element.options[0]
            case "colorpicker":
                return [255, 255, 255, 255]
            case "keybind":
                return "NONE"
            case "button":
            default:
                return null
        }
    }
    /** @private */
    _loadConfig() {
        if (!this.configPath) return

        try {
            const saved = FileLib.read(this.moduleName, this.configPath)
            if (!saved) return
            const data = JSON.parse(saved)
            this.config = {}
            data.forEach(category =>
                category.settings.forEach(setting => {
                    this.config[setting.name] = setting.value
                })
            )
        } catch(e) {
            ChatLib.chat(`&b[SIN] &fFailed to load config for &c${this.moduleName}&f: &c${e}`)
        }
    }

    /** @private */
    _saveConfig() {
        if (!this.configPath) return
        
        try {
            const data = this.categories.map(cat => ({
                category: cat.name,
                settings: [].concat(...cat.elements.map(sub => 
                    sub.subElements
                        .filter(e => e.configName)
                        .map(e => ({
                            name: e.configName,
                            value: this.config[e.configName] ?? e.value ?? e.placeHolder ?? this._getDefaultValue(e)
                        }))
                ))
            }))
            
            FileLib.write(this.moduleName, this.configPath, JSON.stringify(data, null, 4))
        } catch(e) {
            ChatLib.chat(`&b[SIN] &fFailed to save config for &c${this.moduleName}&f: &c${e}`)
        }
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
     * @param {string} [key] Config key to watch, or callback for global
     * @param {function} cb The callback for key-specific listeners
     * @returns this for chaining
     * @example
     * registerListener((oldV, newV, key) => { ... }) // Listen for any config change
     * registerListener("partycmd", (oldV, newV) => { ... }) // Listen for a specific config
     */
    registerListener(key, cb) {
        if (typeof key === "function") {
            this.listeners.set(key, { any: true })
            return this
        }
        const handler = (changed, oldVal, newVal) => changed === key && cb(oldVal, newVal, key)
        this.listeners.set(handler, { any: false })
        return this
    }

    /**
     * Returns a settings object with all config keys (using defaults/placeholders if unset),
     * a .getConfig() method, a .settings property, and all instance methods attached.
     * @returns {object} Settings object for this config
     */
    getSettings() {
        const elements = [].concat(...this.categories.map(cat => 
            [].concat(...cat.elements.map(sub => sub.subElements))
        )).filter(e => e.configName)
        
        const settings = {}
        elements.forEach(e => {
            settings[e.configName] = this.config[e.configName] ?? e.value ?? e.placeHolder ?? null
        })
        
        settings.getConfig = () => this
        settings.settings = settings
        
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(k => typeof this[k] === "function" && k !== "constructor")
            .forEach(k => settings[k] = this[k].bind(this))
        
        return settings
    }

    /**
     * Adds a custom SVG to a category by name.
     * @param {string} categoryName
     * @param {string} svgPath
     * @example
     * "./config/ChatTriggers/modules/sin/assets/box.svg" // Path example
     * @returns this for chaining
     */
    addCatSVG(categoryName, svgPath) {
        const category = this.categories.find(c => c.name === categoryName)
        if (category) category.svg = svgPath
        return this
    }

    /**
     * Adds a custom SVG to a subcategory by name.
     * @param {string} categoryName
     * @param {string} subcategoryName
     * @param {string} svgPath
     * @returns this for chaining
     */
    addSubCatSVG(categoryName, subcategoryName, svgPath) {
        const category = this.categories.find(c => c.name === categoryName)
        if (!category) return
        const subcategory = category.elements.find(e => e.name === subcategoryName)
        if (subcategory) subcategory.svg = svgPath
        return this
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

    /**
     * Sets a setting value
     * @param {string} valueName
     * @param {value} newvalue
     * @returns this for chaining
     */
    setValue(valueName, newvalue) {
        valueName && newvalue && (this.SinGUI[valueName] = newvalue)
    }
}