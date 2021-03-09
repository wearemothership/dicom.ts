class OrderedMapIterator {
	constructor(orderedMap) {
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
}

export default OrderedMapIterator;
