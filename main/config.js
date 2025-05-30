export default class ConfigMethods {
    /**
     * @private
     * @param {Object} proto 
     */
    static applyTo(proto) {
        Object.getOwnPropertyNames(ConfigMethods.prototype).forEach(name => {
            if (name !== 'constructor' && name !== 'applyTo') proto[name] = ConfigMethods.prototype[name]
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
}