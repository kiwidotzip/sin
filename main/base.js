import HandleGui from "../../DocGuiLib/core/Gui"
import HandleRegisters from "../../DocGuiLib/listeners/Registers"
import GUI from './element'
import { Window } from "../utils/elementa"
import { CustomGui } from "../../DocGuiLib/core/CustomGui"

/** @typedef {import('./elements').ElementConfig} ElementConfig */
/** @typedef {'button'|'switch'|'textinput'|'slider'|'dropdown'|'colorpicker'|'textparagraph'|'keybind'} ElementType */
export default class Config extends GUI {
    /**
     * @param {string} moduleName The name of the module
     * @param {string} schemePath The color scheme path
     * @param {string} title The title of the GUI
     * @param {string} [confPath] The config path
     */
    constructor(moduleName, schemePath, title, confPath) {
        super()
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
                height: 60
            },
            element: {
                width: 92,
                subelem: {
                    width: 60,
                    height: 20,
                    description: {
                        padding: 20,
                        textScale: 1.0,
                        color: this.scheme.Sin.accent2
                    },
                    title: {
                        textScale: 1.2,
                        yOffset: 2,
                        color: this.scheme.Sin.accent
                    }
                }
            }
        }
        this.activeCategory = null
        this.currentContent = null
        this.activeElement = null
        this.activePopupElement = null
        this.GuiScale = null
        this.isInitialized = false
        this._subElements = new Map()
        this._originalHeights = new Map()
        this.listeners = new Map()
        this._onOpenGui = []
        this._onCloseGui = []
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
            for (const ev of regs.eventsList) (ev && typeof ev.unregister === "function") && ev.unregister()
            regs.eventsList.clear()
        }
        this.handler.ctGui.registerInit(() => Keyboard.enableRepeatEvents(true))
        this.handler.registers.onOpen(() => {
            this._onOpenGui.forEach(fn => fn())
            if (Client.getMinecraft().field_71474_y.field_74335_Z === 2) return
            this.GuiScale = Client.getMinecraft().field_71474_y.field_74335_Z
            Client.getMinecraft().field_71474_y.field_74335_Z = 2
        })
        this.handler.registers.onClose(() => {
            this._onCloseGui.forEach(fn => fn())
            Keyboard.enableRepeatEvents(false)
            if (Client.getMinecraft().field_71474_y.field_74335_Z !== 2 || !this.GuiScale || this.GuiScale === 2) return
            Client.getMinecraft().field_71474_y.field_74335_Z = this.GuiScale
            this.GuiScale = null
        })
    }

        /** @private */
    _loadConfig() {
        if (!this.configPath) return

        try {
            const saved = FileLib.read(this.moduleName, this.configPath)
            if (!saved) return
            const data = JSON.parse(saved)
            this.config = {}
            data.forEach(category => category.settings.forEach(setting =>this.config[setting.name] = setting.value))
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
     * @private
     * @param {string} key 
     * @param {any} value 
     */
    _updateConfig(key, newVal) {
        const oldVal = this.config[key]
        this.config[key] = newVal
        this.categories.forEach(category => 
            category.elements.forEach(subcategory => 
                subcategory.subElements.forEach(element => 
                    (element.configName === key && element.registerListener) && element.registerListener(oldVal, newVal)))
        )
        this._subElements.forEach((_, configName) => 
            this._subElements.get(configName).shouldShow?.toString()?.includes(key) && 
            this._updateElementVisibility(configName)
        )
        this.listeners.forEach((meta, handler) => meta.any ? handler(oldVal, newVal, key) : handler(key, oldVal, newVal))
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
    addTextParagraph(config) {
        return this._addElement('textparagraph', config)
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
        elements.forEach(e => settings[e.configName] = this.config[e.configName] ?? e.value ?? e.placeHolder ?? null)
        
        settings.getConfig = () => this
        settings.settings = settings
        
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(k => typeof this[k] === "function" && k !== "constructor")
            .forEach(k => settings[k] = this[k].bind(this))
        
        return settings
    }

    /**
     * Returns the custom GUI instance
     * @returns {CustomGui}
     */
    getGui() {
        return this.handler.ctGui
    }

    /**
     * Returns the handler instance
     * @returns {HandleGui}
     */
    getHandler() {
        return this.handler
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
    onOpenGui(fn) {
        this._onOpenGui.push(fn)
        return this
    }

    /**
     * Runs the given func on GUI close
     * @param {Function} fn
     * @returns this for chaining
     */
    onCloseGui(fn) {
        this._onCloseGui.push(fn)
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
     * Sets a SinGUI setting value
     * @param {string} valueName
     * @param {value} newvalue
     * @returns this for chaining
     */
    setValue(valueName, newvalue) {
        valueName && newvalue && (this.SinGUI[valueName] = newvalue)
    }

    /**
     * Sets a config value and triggers updates
     * @param {string} key Config key to update
     * @param {any} newVal New value to set
     * @returns this for chaining
     */
    setConfigValue(key, newVal) {
        this._updateConfig(key, newVal)
        return this
    }
}

GUI.applyTo(Config.prototype)