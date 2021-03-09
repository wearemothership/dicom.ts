// Based on: http://stackoverflow.com/questions/3549894/javascript-data-structure-for-fast-lookup-and-ordered-looping
import OrderedMapIterator from "./iterator";

class OrderedMap {
	constructor() {
		this.map = {};
		this.orderedKeys = [];
	}

	put(key, value) {
		if (key in this.map) {
			// key already exists, replace value
			this.map[key] = value;
		}
		else {
			// insert new key and value
			this.orderedKeys.push(key);
			this.orderedKeys.sort((a, b) => (parseFloat(a) - parseFloat(b)));
			this.map[key] = value;
		}
	}

	remove(key) {
		const index = this.orderedKeys.indexOf(key);
		if (index === -1) {
			throw new Error("key does not exist");
		}

		this.orderedKeys.splice(index, 1);
		delete this.map[key];
	}

	get(key) {
		if (key in this.map) {
			return this.map[key];
		}

		return null;
	}

	iterator() {
		return new OrderedMapIterator(this);
	}

	getOrderedValues() {
		const orderedValues = [];
		const it = this.iterator();

		while (it.hasNext()) {
			orderedValues.push(it.next());
		}

		return orderedValues;
	}
}

export default OrderedMap;
