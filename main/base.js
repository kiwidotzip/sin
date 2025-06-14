import HandleGui from "../utils/HandleGui"
import CustomGui from "../utils/customGUI"
import HandleRegisters from "../utils/registers"
import GUI from './element'
import { Window } from "../utils/elementa"

const ResourceLocation = Java.type('net.minecraft.util.ResourceLocation')
const blur = new ResourceLocation("shaders/post/blur.json")

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
        this.blur = false
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
        this.handler.ctGui.registerInit(() => Keyboard.enableRepeatEvents(true))
        this.handler.registers.onOpen(() => {
            this._onOpenGui.forEach(fn => fn())
            this.blur && Client.getMinecraft().field_71460_t.func_181022_b()
            this.blur && Client.getMinecraft().field_71460_t.func_175069_a(blur)
            if (Client.getMinecraft().field_71474_y.field_74335_Z === 2) return
            this.GuiScale = Client.getMinecraft().field_71474_y.field_74335_Z
            Client.getMinecraft().field_71474_y.field_74335_Z = 2
        })
        this.handler.registers.onClose(() => {
            this._onCloseGui.forEach(fn => fn())
            Keyboard.enableRepeatEvents(false)
            this.blur && Client.getMinecraft().field_71460_t.func_181022_b()
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
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {function} [config.onClick]
     * @param {function} [config.shouldShow]
     * @returns {Config} The config instance
     */
    addButton(config) {
        return this._addElement('button', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {boolean} [config.value = false]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
     */
    addSwitch(config) {
        return this._addElement('switch', config)
    }
    
    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {string} [config.value]
     * @param {string} [config.placeHolder]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
     */
    addTextInput(config) {
        return this._addElement('textinput', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {Array} [config.options]
     * @param {number} [config.value = 50]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
     */
    addSlider(config) {
        return this._addElement('slider', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {Array<string>} config.options
     * @param {number} [config.value]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
     */
    addDropDown(config) {
        return this._addElement('dropdown', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {string} [config.value]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
     */
    addColorPicker(config) {
        return this._addElement('colorpicker', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} config.description
     * @param {boolean} [config.centered=true]
     * @param {function} [config.shouldShow]
     * @returns {Config} The config instance
     */
    addTextParagraph(config) {
        return this._addElement('textparagraph', config)
    }

    /**
     * @param {Object} config
     * @param {string} config.category
     * @param {string} config.subcategory
     * @param {string} config.configName
     * @param {string} [config.title]
     * @param {string} [config.description]
     * @param {number} [config.value]
     * @param {function} [config.shouldShow]
     * @param {function} [config.registerListener]
     * @returns {Config} The config instance
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
     * Returns a settings object with all config keys,
     * a .getConfig() method, a .settings property, and all instance methods attached.
     * @typedef {Object} Settings
     * @property {function(): Config} getConfig - Returns the config instance
     * @property {Object<string, any>} settings - Returns all config keys and their values
     * @returns {Settings & Config} Settings object for this config
     */
    get settings() {
        const settingsObj = [].concat(...this.categories.map(c => [].concat(...c.elements.map(s => s.subElements))))
        .filter(e => e.configName)
        .reduce((acc, e) => (acc[e.configName] = this.config[e.configName] ?? e.value ?? e.placeHolder ?? null, acc), {})
        
        return /** @type {Settings & Config} */ ({ 
            ...settingsObj,
            getConfig: () => this,
            settings: settingsObj
        })
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
        return this.handler.ctGui.close(), this
    }

    /**
     * Runs the given func on GUI open
     * @param {Function} fn 
     * @returns this for chaining
     */
    onOpenGui(fn) {
        return this._onOpenGui.push(fn), this
    }

    /**
     * Runs the given func on GUI close
     * @param {Function} fn
     * @returns this for chaining
     */
    onCloseGui(fn) {
        return this._onCloseGui.push(fn), this
    }

    /**
     * Sets the GUI size
     * @param {number} [width]
     * @param {number} [height]
     * @returns this for chaining
     */
    setSize(width, height) {
        return width && (this.SinGUI.background.width = width), height && (this.SinGUI.background.height = height), this
    }

    /**
     * Sets the GUI ratio
     * @param {number} [left]
     * @param {number} [right]
     * @returns this for chaining
     */
    setRatio(left, right) {
        return left && (this.SinGUI.background.leftRatio = left), right && (this.SinGUI.background.rightRatio = right), this
    }

    /**
     * Sets a SinGUI setting value
     * @param {string} valueName
     * @param {value} newvalue
     * @returns this for chaining
     */
    setValue(valueName, newvalue) {
        return valueName && newvalue && (this.SinGUI[valueName] = newvalue), this
    }

    /**
     * Sets a config value and triggers updates
     * @param {string} key Config key to update
     * @param {any} newVal New value to set
     * @returns this for chaining
     */
    setConfigValue(key, newVal) {
        return this._updateConfig(key, newVal), this
    }

    /**
     * Enables or disables the blur effect
     * @param {boolean} blur
     * @returns this for chaining
     */
    setBlur(blur) {
        return this.blur = blur, this
    }
}

GUI.applyTo(Config.prototype)