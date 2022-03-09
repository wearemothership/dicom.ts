import fs from "fs";
import util from "util";
import { parseImage } from ".";

// eslint-disable-next-line no-undef
if (globalThis.window && !window.TextDecoder) {
	window.TextDecoder = util.TextDecoder;
}

describe("parser tests", () => {
	const path = "./node_modules/dicom-test-files/medical.nema.org/";

	const file = [
		"compsamples_j2k/IMAGES/J2KI/CT1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/CT2_J2KI",
		"compsamples_j2k/IMAGES/J2KI/MG1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/MR1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/MR2_J2KI",
		"compsamples_j2k/IMAGES/J2KI/MR3_J2KI",
		"compsamples_j2k/IMAGES/J2KI/MR4_J2KI",
		"compsamples_j2k/IMAGES/J2KI/NM1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/RG1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/RG2_J2KI",
		"compsamples_j2k/IMAGES/J2KI/RG3_J2KI",
		"compsamples_j2k/IMAGES/J2KI/SC1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/US1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/VL1_J2KI",
		"compsamples_j2k/IMAGES/J2KI/VL2_J2KI",
		"compsamples_j2k/IMAGES/J2KI/VL3_J2KI",
		"compsamples_j2k/IMAGES/J2KI/VL4_J2KI",
		"compsamples_j2k/IMAGES/J2KI/VL5_J2KI",
		"compsamples_j2k/IMAGES/J2KI/XA1_J2KI",
		"compsamples_j2k/IMAGES/J2KR/CT1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/CT2_J2KR",
		"compsamples_j2k/IMAGES/J2KR/MG1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/MR1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/MR2_J2KR",
		"compsamples_j2k/IMAGES/J2KR/MR3_J2KR",
		"compsamples_j2k/IMAGES/J2KR/MR4_J2KR",
		"compsamples_j2k/IMAGES/J2KR/NM1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/RG1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/RG2_J2KR",
		"compsamples_j2k/IMAGES/J2KR/RG3_J2KR",
		"compsamples_j2k/IMAGES/J2KR/SC1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/US1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL1_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL2_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL3_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL4_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL5_J2KR",
		"compsamples_j2k/IMAGES/J2KR/VL6_J2KR",
		"compsamples_j2k/IMAGES/J2KR/XA1_J2KR",
		"compsamples_jpeg/IMAGES/JPLL/CT1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/CT2_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/MG1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/MR1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/MR2_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/MR3_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/MR4_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/NM1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/RG1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/RG2_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/RG3_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/SC1_JPLL",
		"compsamples_jpeg/IMAGES/JPLL/XA1_JPLL",
		"compsamples_jpeg/IMAGES/JPLY/MG1_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/MR1_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/MR2_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/MR3_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/MR4_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/NM1_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/RG2_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/RG3_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/SC1_JPLY",
		"compsamples_jpeg/IMAGES/JPLY/XA1_JPLY",
		"compsamples_jpegls/IMAGES/JLSL/CT1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/CT2_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/MG1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/MR1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/MR2_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/MR3_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/MR4_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/NM1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/RG1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/RG2_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/RG3_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/SC1_JLSL",
		"compsamples_jpegls/IMAGES/JLSL/XA1_JLSL",
		"compsamples_jpegls/IMAGES/JLSN/CT1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/CT2_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/MG1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/MR1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/MR2_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/MR3_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/MR4_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/NM1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/RG1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/RG2_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/RG3_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/SC1_JLSN",
		"compsamples_jpegls/IMAGES/JLSN/XA1_JLSN",
		"compsamples_refanddir/IMAGES/REF/CT1_UNC",
		"compsamples_refanddir/IMAGES/REF/CT2_UNC",
		"compsamples_refanddir/IMAGES/REF/MG1_UNC",
		"compsamples_refanddir/IMAGES/REF/MR1_UNC",
		"compsamples_refanddir/IMAGES/REF/MR2_UNC",
		"compsamples_refanddir/IMAGES/REF/MR3_UNC",
		"compsamples_refanddir/IMAGES/REF/MR4_UNC",
		"compsamples_refanddir/IMAGES/REF/NM1_UNC",
		"compsamples_refanddir/IMAGES/REF/RG1_UNC",
		"compsamples_refanddir/IMAGES/REF/RG2_UNC",
		"compsamples_refanddir/IMAGES/REF/RG3_UNC",
		"compsamples_refanddir/IMAGES/REF/SC1_UNC",
		"compsamples_refanddir/IMAGES/REF/US1_UNC",
		"compsamples_refanddir/IMAGES/REF/VL1_UNC",
		"compsamples_refanddir/IMAGES/REF/VL2_UNC",
		"compsamples_refanddir/IMAGES/REF/VL3_UNC",
		"compsamples_refanddir/IMAGES/REF/VL4_UNC",
		"compsamples_refanddir/IMAGES/REF/VL5_UNC",
		"compsamples_refanddir/IMAGES/REF/VL6_UNC",
		"compsamples_refanddir/IMAGES/REF/XA1_UNC",
		"compsamples_rle_20040210/IMAGES/RLE/CT1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/CT2_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/MG1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/MR1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/MR2_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/MR3_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/MR4_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/NM1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/RG1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/RG2_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/RG3_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/SC1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/US1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL1_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL2_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL3_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL4_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL5_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/VL6_RLE",
		"compsamples_rle_20040210/IMAGES/RLE/XA1_RLE",
		"multiframe/DISCIMG/IMAGES/BRMULTI"
	];

	test.each(file)("Parses file %s OK", (filePath) => {
		const data = fs.readFileSync(`${path}${filePath}`);
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = parseImage(dataView);
		expect(image).toBeTruthy();
		expect(image.tags).toBeTruthy();
		expect(image.tags).toMatchSnapshot();
	});
	const specificKey = "multiframe/DISCIMG/IMAGES/BRMULTI"; // fileKeys[1];
	it("Parses specific file OK", () => {
		const data = fs.readFileSync(`${path}${specificKey}`);
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = parseImage(dataView);
		expect(image).toBeTruthy();
		expect(image.tags).toBeTruthy();
		expect(image.tags).toMatchSnapshot();
	});

	it("Parses issue #19 OK", () => {
		const data = fs.readFileSync("./node_modules/dicom-test-files/dicom-ts-issues/parse-issue-19.dcm");
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = parseImage(dataView);
		expect(image).toBeTruthy();
		expect(image.tags).toBeTruthy();
		expect(image.tags).toMatchSnapshot();
	});
});
