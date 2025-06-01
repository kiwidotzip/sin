export default class ColorUtils {
    static getJavaColor(arr) {
        return new java.awt.Color(arr[0] / 255, arr[1] / 255, arr[2] / 255, arr[3] / 255)
    }
}