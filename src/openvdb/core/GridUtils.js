
export class GridUtils {
  static tagValueType(target, valueType, useHalf) {
    target.valueType = valueType;
    target.useHalf = useHalf;

    return target;
  }

  static getValueType(target) {
    return {
      valueType: target.valueType,
      useHalf: target.useHalf
    };
  }
}
