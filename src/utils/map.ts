/**
 * @description 合并两个map,清理值为undefined的项
 * @description_en Merge two maps
 */
export function mergeMap<T, U>(map1: Map<T, U>, map2: Map<T, U>) {
  const map = new Map<T, U>()
  map1.forEach((value, key) => {
    if (value === undefined) {
      return
    }
    map.set(key, value)
  })
  map2.forEach((value, key) => {
    if (value === undefined) {
      return
    }
    map.set(key, value)
  })
  return map
}
