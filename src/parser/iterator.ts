export interface IOrderedMap<K, T> {
	orderedKeys: K[]
	get(key: K): T | undefined
}

class OrderedMapIterator<K, T> {
	orderedMap: IOrderedMap<K, T>;

	index: number;

	constructor(orderedMap: IOrderedMap<K, T>) {
		this.orderedMap = orderedMap;
		this.index = 0;
	}

	hasNext() {
		return (this.index < this.orderedMap.orderedKeys.length);
	}

	next() {
		const item = this.orderedMap.get(this.orderedMap.orderedKeys[this.index]);
		this.index += 1;
		return item;
	}

	length() {
		return this.orderedMap.orderedKeys.length;
	}
}

export default OrderedMapIterator;
