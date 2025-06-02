import SwitchElement from "../elements/switch"
import TextInputElement from "../elements/textinput"
import SliderElement from "../elements/slider"
import DropdownElement from "../elements/dropdown"
import KeybindElement from "../elements/keybind"
import ButtonElement from "../elements/button"
import ColorPickerElement from "../elements/colorpicker"
import TextParagraphElement from "../elements/textparagraph"
import { UIRoundedRectangle, UIText, UIWrappedText, CenterConstraint, CramSiblingConstraint, ChildBasedSizeConstraint, PixelConstraint, ScrollComponent, animate, Animations, ConstantColorConstraint } from "../utils/elementa"
import ElementUtils from "../utils/color"

export default class GUI {
    /**
     * @private
     * @param {Object} proto 
     */
    static applyTo(proto) {
        Object.getOwnPropertyNames(GUI.prototype).forEach(name => {
            if (name !== 'constructor' && name !== 'applyTo') proto[name] = GUI.prototype[name]
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
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
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

            this._setupButtonHover(bgComponent, bgColor)
            new UIWrappedText(category.name, true, null, true, true)
                .setX(new CenterConstraint())
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
            .onMouseEnter(() => this._animateColor(card, this.scheme.Sin.element.hoverColor))
            .onMouseLeave(() => this._animateColor(card, this.scheme.Sin.element.color))

        new UIWrappedText(element.name, true, null, true, true)
            .setX(new CenterConstraint())
            .setY(new CenterConstraint())
            .setWidth((90).percent())
            .setTextScale(1.5.pixels())
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
        this.activeDropdowns = []
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
            this.activeDropdowns.forEach(d => d.closeDropdown())
            this.activeDropdowns = []
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
            
            if (subElem.description && subElem.type !== 'colorpicker' && subElem.type !== 'textparagraph')
                new UIWrappedText(subElem.description, true, null, false, false, 10)
                    .setX((this.SinGUI.element.subelem.description.padding).percent())
                    .setY(new CenterConstraint())
                    .setWidth((75).percent())
                    .setTextScale((this.SinGUI.element.subelem.description.textScale).pixels())
                    .setColor(ElementUtils.getJavaColor(this.SinGUI.element.subelem.description.color))
                    .setChildOf(card)

            const component = this._createComponent(subElem)
            subElem.type === 'colorpicker' || subElem.type === 'textparagraph'
                ? component.create() 
                    .setX((3).percent())
                    .setY(new CenterConstraint())
                    .setChildOf(card)
                : component.create()
                    .setX((3).percent())
                    .setY(new CenterConstraint())
                    .setWidth((this.SinGUI.element.subelem.width).pixels())
                    .setHeight((this.SinGUI.element.subelem.height).pixels())
                    .setChildOf(card)
            this._subElements.set(subElem.configName, { container: outerContainer, shouldShow: subElem.shouldShow, subElem: subElem, component: component })
            this._updateElementVisibility(subElem.configName)
            this._originalHeights.set(outerContainer, outerContainer.getHeight())
            previousElement = outerContainer
        })
    }

    /**
     * @private
     * @param {string} configName
     */
    _updateElementVisibility(configName) {
        const { container, shouldShow, subElem, component } = this._subElements.get(configName) || {}
        if (!container) return
        const visible = !shouldShow || shouldShow(this.config)
        const originalHeight = this._originalHeights.get(container) || 50
        const newVal = subElem.value ?? this._getDefaultValue(subElem)
        if (!visible && (subElem.type === 'switch' || subElem.type === 'dropdown')) 
            this._silly(configName, newVal)
        !visible && subElem.type === 'switch' && component.setValue(newVal, true)
        visible
            ? container.setHeight(originalHeight.pixels()).unhide(true)
            : container.setHeight((0).pixels()).hide(true)
        this.currentContent?.getParent()?.onWindowResize()
    }

    /**
     * @private
     * @param {string} key 
     * @param {any} val 
     */
    _silly(key, val) {
        if (this.config[key] === val) return
        const oldV = this.config[key]
        this.config[key] = val
        this.listeners.forEach((meta, handler) => meta.any ? handler(oldV, val, key) : handler(key, oldV, val))
    }
    
    /**
     * Returns the default value for a config element based on its type.
     * @private
     * @param {object} element
     */
    _getDefaultValue(element) {
        switch (element.type) {
            case "switch": return false
            case "textinput": return element.placeHolder ?? ""
            case "slider": return element.options[0]
            case "dropdown": return 0
            case "colorpicker": return [255, 255, 255, 255]
            case "keybind": return "NONE"
            case "textparagraph":
            case "button": 
            default: return null 
        }
    }

    /**
     * @private
     * @param {object} subElem 
     * @returns {SwitchElement|TextInputElement|SliderElement|DropdownElement|ColorPickerElement|TextParagraphElement|KeybindElement|ButtonElement}
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
            colorpicker: () => new ColorPickerElement(currentValue, this.rightBlock)
                .setColorScheme(this.scheme),
            dropdown: () => {
                const dropdown = new DropdownElement(subElem.options, currentValue)
                    .setColorScheme(this.scheme)
                    .on('change', val => this._updateConfig(subElem.configName, val))
                this.activeDropdowns.push(dropdown)
                return dropdown
            },
            textparagraph: () => new TextParagraphElement(subElem.description, subElem.centered ?? true)
                .setColorScheme(this.scheme),
            keybind: () => new KeybindElement(currentValue)
                .setColorScheme(this.scheme)
                .on('change', val => this.config[subElem.configName] = val)
        }
        return componentMap[subElem.type]()
    }

    /**
     * @private
     * @param {UIRoundedRectangle} parent 
     * @param {UIRoundedRectangle} overlay 
     */
    _createCloseButton(parent, overlay) {
        const closeBtn = new UIText("[✕]")
            .setX((90).percent())
            .setY((12).pixels())
            .setTextScale(1.5.pixels())
            .setColor(ElementUtils.getJavaColor(this.scheme.Sin.element.closeButton.normal))
            .setChildOf(parent)
            .onMouseClick(() => {
                this.activeDropdowns.forEach(d => d.closeDropdown())
                this.activeDropdowns = []
                overlay.getParent().removeChild(overlay)
            })
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
}