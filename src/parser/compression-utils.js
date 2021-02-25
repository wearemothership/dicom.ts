const JPEG_MAGIC_NUMBER = [0xFF, 0xD8];
const JPEG2000_MAGIC_NUMBER = [0xFF, 0x4F, 0xFF, 0x51];

const isHeaderJPEG = (data) => {
	if (data) {
		if (data.getUint8(0) !== JPEG_MAGIC_NUMBER[0]) {
			return false;
		}

		if (data.getUint8(1) !== JPEG_MAGIC_NUMBER[1]) {
			return false;
		}

		return true;
	}

	return false;
};

const isHeaderJPEG2000 = (data) => {
	if (data) {
		for (let ctr = 0; ctr < JPEG2000_MAGIC_NUMBER.length; ctr += 1) {
			if (data.getUint8(ctr) !== JPEG2000_MAGIC_NUMBER[ctr]) {
				return false;
			}
		}

		return true;
	}

	return false;
};

export default { isHeaderJPEG, isHeaderJPEG2000 };
