const elementaPath = Java.type("gg.essential.elementa")

/** @typedef {new (text: string|"", shadow: boolean|true, shadowColor?: Color|null) => UIText} UIText */
/** @type {UIText} */
export const UIText = elementaPath.components.UIText

/** @typedef {new (text: string|"", shadow: boolean|true, shadowColor?: Color|null, centered: boolean|false, trimText: boolean|false, lineSpacing: Float|9, trimmedTextSuffix: string|"...") => UIWrappedText} UIWrappedText */
/** @type {UIWrappedText} */
export const UIWrappedText = elementaPath.components.UIWrappedText

/** @typedef {new (placeholder: string|"", shadow: boolean|true, selectionBackgroundColor: Color|Color.WHITE, selectionForegroundColor: Color|Color(64, 139, 229), allowInactiveSelection: boolean|false, inactiveSelectionBackgroundColor: Color|Color(176, 176, 176), inactiveSelectionForegroundColor: Color|Color.WHITE, cursorColor: Color|Color.WHITE) => UITextInput} UITextInput */
/** @type {UITextInput} */
export const UITextInput = elementaPath.components.input.UITextInput

/** @typedef {new () => Window} Window */
/** @type {Window} */
export const Window = elementaPath.components.Window

/** @typedef {new (radius: Float) => UIRoundedRectangle} UIRoundedRectangle */
/** @type {UIRoundedRectangle} */
export const UIRoundedRectangle = elementaPath.components.UIRoundedRectangle

/** @typedef {new (innerPadding: Float|0, scrollIconColor: Color|Color.WHITE, horizontalScrollEnabled: Boolean|false, verticalScrollEnabled: Boolean|true, horizontalScrollOpposite: Boolean|false, verticalScrollOpposite: Boolean|false, pixelsPerScroll: Float|15, scrollAcceleration: Float|1.0, customScissorBounding: UIComponent|null) => ScrollComponent} ScrollComponent */
/** @type {ScrollComponent} */
export const ScrollComponent = elementaPath.components.ScrollComponent

/** @typedef {new () => UIContainer} UIContainer */
/** @type {UIContainer} */
export const UIContainer = elementaPath.components.UIContainer

/** @typedef {new (padding: Float|0) => CramSiblingConstraint} CramSiblingConstraint */
/** @type {CramSiblingConstraint} */
export const CramSiblingConstraint = elementaPath.constraints.CramSiblingConstraint

/** @typedef {new (value: Float, alignOpposite: Boolean|false, alignOutside: Boolean|false) => PixelConstraint} PixelConstraint */
/** @type {PixelConstraint} */
export const PixelConstraint = elementaPath.constraints.PixelConstraint

/** @typedef {new (value: Float|1) => AspectConstraint} AspectConstraint */
/** @type {AspectConstraint} */
export const AspectConstraint = elementaPath.constraints.AspectConstraint

/** @typedef {new (padding: Float|0) => ChildBasedSizeConstraint} ChildBasedSizeConstraint */
/** @type {ChildBasedSizeConstraint} */
export const ChildBasedSizeConstraint = elementaPath.constraints.ChildBasedSizeConstraint

/** @typedef {new (color: Color) => ConstantColorConstraint} ConstantColorConstraint */
/** @type {ConstantColorConstraint} */
export const ConstantColorConstraint = elementaPath.constraints.ConstantColorConstraint

/** @typedef {new () => CenterConstraint} CenterConstraint */
/** @type {CenterConstraint} */
export const CenterConstraint = elementaPath.constraints.CenterConstraint

/** @typedef {new (constraint1: Constraint, constraint2: Constraint) => SubtractiveConstraint} SubtractiveConstraint */
/** @type {SubtractiveConstraint} */
export const SubtractiveConstraint = elementaPath.constraints.SubtractiveConstraint


/** @typedef {new () => Animations} Animations */
/** @type {Animations} */
export const Animations = elementaPath.constraints.animation.Animations

/**
 * @param {UIComponent} component 
 * @param {Function} callback 
 * @returns {UIComponent}
 */
export const animate = (component, callback) => {
    const anim = component.makeAnimation()
    callback(anim)
    component.animateTo(anim)
    return component
}