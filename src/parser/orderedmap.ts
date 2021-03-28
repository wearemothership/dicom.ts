// Based on: http://stackoverflow.com/questions/3549894/javascript-data-structure-for-fast-lookup-and-ordered-looping
import OrderedMapIterator, { IOrderedMap } from "./iterator";

export interface TWithIndex {
	index: number
}
class OrderedMap<K extends keyof any, T> implements IOrderedMap<K, T>, TWithIndex {
	orderedKeys: K[] = [];

	map: Map<K, T> = new Map<K, T>();

	index = 0; // bit of a hack - necessary for Series

	put(key: K, value: T) {
		if (!this.map.get(key)) {
			// insert new key and value
			this.orderedKeys.push(key);
			this.orderedKeys.sort((a, b) => (parseFloat(a as string) - parseFloat(b as string)));
		}
		this.map.set(key, value);
	}

	remove(key: K) {
		const index = this.orderedKeys.indexOf(key);
		if (index === -1) {
			throw new Error("key does not exist");
		}

		this.orderedKeys.splice(index, 1);
		this.map.delete(key);
	}

	get(key: K): T | undefined {
		return this.map.get(key);
	}

	iterator(): OrderedMapIterator<K, T> {
		return new OrderedMapIterator(this);
	}

	getOrderedValues(): T[] {
		const it = this.iterator();
		const orderedValues: T[] = Array(it.length());

		while (it.hasNext()) {
			orderedValues.push(it.next()!);
		}

		return orderedValues;
	}
}

export default OrderedMap;
