import fs from "fs";
import { parseImage } from ".";
import { shaFromJSON /* , toJSONString */ } from "../testUtils";

describe("parser tests", () => {
	const path = "./test/medical.nema.org/";

	const fileNameToTagHash = {
		"compsamples_j2k/IMAGES/J2KI/CT1_J2KI": "0a0d150bcbf708fb9f4995eba501a1d14c8eb7bf",
		"compsamples_j2k/IMAGES/J2KI/CT2_J2KI": "bb4e262c4791616949a3ee85622ad931611b23ac",
		"compsamples_j2k/IMAGES/J2KI/MG1_J2KI": "6b57887be248fac12fcf2bc49dd0f66ecb9a95c4",
		"compsamples_j2k/IMAGES/J2KI/MR1_J2KI": "ce6d0c7ffef03d6972ba3e75625d2576c6461bc1",
		"compsamples_j2k/IMAGES/J2KI/MR2_J2KI": "ba958ef6d79c0896ac95b5aa93910461190b7305",
		"compsamples_j2k/IMAGES/J2KI/MR3_J2KI": "cf740d56af970f6071038bc58dc6ba8cbf8c7376",
		"compsamples_j2k/IMAGES/J2KI/MR4_J2KI": "d65cb53590b32f777cec1452557b727641d70a21",
		"compsamples_j2k/IMAGES/J2KI/NM1_J2KI": "1ac8b942bd8db35d18e670d6fb7e08e2507beac1",
		"compsamples_j2k/IMAGES/J2KI/RG1_J2KI": "ceb13eaf38e93f0514cc977fb8821cc8f45d626d",
		"compsamples_j2k/IMAGES/J2KI/RG2_J2KI": "09b044a607fcb7f272c140790720ffad8d16dfc9",
		"compsamples_j2k/IMAGES/J2KI/RG3_J2KI": "f9675070e9d93c5ca6b8274296d3901552560ef5",
		"compsamples_j2k/IMAGES/J2KI/SC1_J2KI": "cf645e0658cea464ca6e59e17758815a988a7248",
		"compsamples_j2k/IMAGES/J2KI/US1_J2KI": "6e190d5fe85dbc54e49073b98fd254297caac9d9",
		"compsamples_j2k/IMAGES/J2KI/VL1_J2KI": "01c95959299155ed72dff6332a6cc2367e95fbaa",
		"compsamples_j2k/IMAGES/J2KI/VL2_J2KI": "65d9ec3aff365772ae3bbd8957d5880e22f2af7b",
		"compsamples_j2k/IMAGES/J2KI/VL3_J2KI": "4897b0f9693ae996981ade02253a7974ee0f0f89",
		"compsamples_j2k/IMAGES/J2KI/VL4_J2KI": "bc33b73900f8f190b552dce1bbb35edd1184bf25",
		"compsamples_j2k/IMAGES/J2KI/VL5_J2KI": "84faf202621732111ec8d3442e2b194291024e5b",
		"compsamples_j2k/IMAGES/J2KI/VL6_J2KI": "c5deeb408de74b908b01daa7f5ca553237bba778",
		"compsamples_j2k/IMAGES/J2KI/XA1_J2KI": "901a91ee168473597650c58e51bbc01d3910e964",
		"compsamples_j2k/IMAGES/J2KR/CT1_J2KR": "fc4c756c28188078fc6911537315da1b97515ce7",
		"compsamples_j2k/IMAGES/J2KR/CT2_J2KR": "31fed5ebac630087c2302dabac8af3a956b39a1b",
		"compsamples_j2k/IMAGES/J2KR/MG1_J2KR": "aaf39ca9851ce6ba5b186cea2e0a800a25ebb9bf",
		"compsamples_j2k/IMAGES/J2KR/MR1_J2KR": "5338d37281c9252288b75f07b6f43d9ba5847c58",
		"compsamples_j2k/IMAGES/J2KR/MR2_J2KR": "a6155634d230d234f9d7f562790a68d34c5d8d27",
		"compsamples_j2k/IMAGES/J2KR/MR3_J2KR": "b88b9d8f97a7cb2e38b4bb504326856453b58052",
		"compsamples_j2k/IMAGES/J2KR/MR4_J2KR": "8461264232dd868f2a4e499748ab54918efef546",
		"compsamples_j2k/IMAGES/J2KR/NM1_J2KR": "01130de39d88ae5df905a4a1ee1b5617e5218afd",
		"compsamples_j2k/IMAGES/J2KR/RG1_J2KR": "ddf2b26999f7ed4101d4230305a10f4b4041e857",
		"compsamples_j2k/IMAGES/J2KR/RG2_J2KR": "0d8eb35081c2b365fed8ef6e2c73e9cbb315d360",
		"compsamples_j2k/IMAGES/J2KR/RG3_J2KR": "203b3350d0afcf986acf2cb3883b80f67dfb5e84",
		"compsamples_j2k/IMAGES/J2KR/SC1_J2KR": "410fc313b6f4ea14061bb7efa8ac779381d5c6e1",
		"compsamples_j2k/IMAGES/J2KR/US1_J2KR": "9d5309ef104fd63c3db557e7643c3656d8c65a96",
		"compsamples_j2k/IMAGES/J2KR/VL1_J2KR": "8011eede7300f9f0180cf301357a37ec3f8e853c",
		"compsamples_j2k/IMAGES/J2KR/VL2_J2KR": "57ecb283eeab1a072d241858f09cf24c263bfd2e",
		"compsamples_j2k/IMAGES/J2KR/VL3_J2KR": "5888ec7bef85ef7f26b8c9a45ef89b9a7e3d6488",
		"compsamples_j2k/IMAGES/J2KR/VL4_J2KR": "8b524e7849c1b62aa5fb01d1b775a5ebcca3268a",
		"compsamples_j2k/IMAGES/J2KR/VL5_J2KR": "30f4f850e599637b0a9af4af04477ca90d0ce0d4",
		"compsamples_j2k/IMAGES/J2KR/VL6_J2KR": "b49f0c2aebaccd5a8b2c38c3d03cde179a341712",
		"compsamples_j2k/IMAGES/J2KR/XA1_J2KR": "b2e3602b6729e684eede29c9cbf9a83f88d595f1",
		"compsamples_jpeg/IMAGES/JPLL/CT1_JPLL": "650d05de3f562d0b93ff1497b0d707bcae670f7c",
		"compsamples_jpeg/IMAGES/JPLL/CT2_JPLL": "19ba967964e3323337202dfb3770d876173ff5ba",
		"compsamples_jpeg/IMAGES/JPLL/MG1_JPLL": "ecac9528d451424ec64a57fce8f5882f242a05b4",
		"compsamples_jpeg/IMAGES/JPLL/MR1_JPLL": "e0504a0fed437e412800b6ee0c23530cf430e8c7",
		"compsamples_jpeg/IMAGES/JPLL/MR2_JPLL": "af8328afc5b3c47a113018197ad49a66c8ab3510",
		"compsamples_jpeg/IMAGES/JPLL/MR3_JPLL": "b320602f19d83ba5aa6ad1e60f724ccccf9a5cdd",
		"compsamples_jpeg/IMAGES/JPLL/MR4_JPLL": "70abcdfa58f1189435a410a057fd62dd38d7cf2e",
		"compsamples_jpeg/IMAGES/JPLL/NM1_JPLL": "77001b5f78647c653e3a9e7f6be380d2e1f66433",
		"compsamples_jpeg/IMAGES/JPLL/RG1_JPLL": "47998749c39cb1e17a92f10c6bf3e13591d35f43",
		"compsamples_jpeg/IMAGES/JPLL/RG2_JPLL": "78bcbd348e7c2d7d18ab4129eead8ee68db6837e",
		"compsamples_jpeg/IMAGES/JPLL/RG3_JPLL": "53db7b864372fa7bf33ed26a2e3ecccca8ac3027",
		"compsamples_jpeg/IMAGES/JPLL/SC1_JPLL": "0c08b0d0aa48ab0d93b77b04f3e6d1ceae5235eb",
		"compsamples_jpeg/IMAGES/JPLL/XA1_JPLL": "be1857b949b5ccc103d86f7a9cf654da7676e5b4",
		"compsamples_jpeg/IMAGES/JPLY/MG1_JPLY": "e9285e42600415a02663ed506f87b628f1de99bc",
		"compsamples_jpeg/IMAGES/JPLY/MR1_JPLY": "b28aa522c85cd134bc11c1498ff72796ad7721a9",
		"compsamples_jpeg/IMAGES/JPLY/MR2_JPLY": "936c3d52ad951dbbf9d9aed30a0d5c6d64f9dbda",
		"compsamples_jpeg/IMAGES/JPLY/MR3_JPLY": "f0497fd70b21678bf39331c54db3dc056eb70440",
		"compsamples_jpeg/IMAGES/JPLY/MR4_JPLY": "0dc800e6f564e736480f3b5959a20de6fb40c95a",
		"compsamples_jpeg/IMAGES/JPLY/NM1_JPLY": "6d30b8fec59547cf901d71c3d18adf5d666cc22d",
		"compsamples_jpeg/IMAGES/JPLY/RG2_JPLY": "752c9109ead3fec22b5516c4317c41dd472fed16",
		"compsamples_jpeg/IMAGES/JPLY/RG3_JPLY": "8b87ecec3a97410213b7fd8d52357c02a16c9c68",
		"compsamples_jpeg/IMAGES/JPLY/SC1_JPLY": "b2f70f38b6fe500365196966140b44c79f937d37",
		"compsamples_jpeg/IMAGES/JPLY/XA1_JPLY": "14a1494ec3e8654189655d5b1d099489fe54d66d",
		"compsamples_jpegls/IMAGES/JLSL/CT1_JLSL": "5e8988303e8592377b071648ebab1a404a0e3abe",
		"compsamples_jpegls/IMAGES/JLSL/CT2_JLSL": "0fef7351beeb11710aa15e63b10d9bb1ccce7c45",
		"compsamples_jpegls/IMAGES/JLSL/MG1_JLSL": "bd639e913afdb77082033e5bb6fa4a3f73395109",
		"compsamples_jpegls/IMAGES/JLSL/MR1_JLSL": "3c789744073ff8c41570eb27c2857e42619955f9",
		"compsamples_jpegls/IMAGES/JLSL/MR2_JLSL": "03b3a386918aaf75c770a82fa957fe79de2e98d7",
		"compsamples_jpegls/IMAGES/JLSL/MR3_JLSL": "d1a99ea9e857ce469790a57f3ad5a076887bc70c",
		"compsamples_jpegls/IMAGES/JLSL/MR4_JLSL": "0fdf98d0c1b4276bc1b8c47200b84738f1c52a18",
		"compsamples_jpegls/IMAGES/JLSL/NM1_JLSL": "f67d3e484f380d9cf304cac873fca7d4e8b8b2ee",
		"compsamples_jpegls/IMAGES/JLSL/RG1_JLSL": "010ebf73d92bc2e8001f2f9898fb70ae64ff267a",
		"compsamples_jpegls/IMAGES/JLSL/RG2_JLSL": "5febb40f862dab90fadec419ea48faa5cbbb015b",
		"compsamples_jpegls/IMAGES/JLSL/RG3_JLSL": "206d2d47b8d08b2dcfdd1e9e0131ec8545aa46e5",
		"compsamples_jpegls/IMAGES/JLSL/SC1_JLSL": "d55519c49fc595a7c72503af962b59481c25c0e2",
		"compsamples_jpegls/IMAGES/JLSL/XA1_JLSL": "0f5546335ce8502bc07c1611cb223764acef7542",
		"compsamples_jpegls/IMAGES/JLSN/CT1_JLSN": "30142c720deba2a5aacbe87a16470ea2beffe597",
		"compsamples_jpegls/IMAGES/JLSN/CT2_JLSN": "fce9e66654a664e7520eb5ec71b1114a371ecd16",
		"compsamples_jpegls/IMAGES/JLSN/MG1_JLSN": "69a930948bfb4529dbe2a281974eb5807e468c12",
		"compsamples_jpegls/IMAGES/JLSN/MR1_JLSN": "2cbdf5580f40d8f9f439c43a6346c3483c39ee29",
		"compsamples_jpegls/IMAGES/JLSN/MR2_JLSN": "b31e5cab736002fbf75a0c8b1b2b97d5afe351fe",
		"compsamples_jpegls/IMAGES/JLSN/MR3_JLSN": "c275ecaa68e4476d8e5ffc84b940ce059ade9187",
		"compsamples_jpegls/IMAGES/JLSN/MR4_JLSN": "ca99a3f02eb91dfa0893a6044af3420fe284c9a4",
		"compsamples_jpegls/IMAGES/JLSN/NM1_JLSN": "1b6ba795374a9fa7f80e4fa54c53164a688f6a7c",
		"compsamples_jpegls/IMAGES/JLSN/RG1_JLSN": "4e72b2dff24b56ac152da3f04c69425ed4aca7bf",
		"compsamples_jpegls/IMAGES/JLSN/RG2_JLSN": "9a1107cf461abf5b823c4b9761a891b270f0596e",
		"compsamples_jpegls/IMAGES/JLSN/RG3_JLSN": "c5f708b89aeb65efc390280bca6110e550f8e023",
		"compsamples_jpegls/IMAGES/JLSN/SC1_JLSN": "a6abc18faa981c03fa8a8797a86d6625fe42b54a",
		"compsamples_jpegls/IMAGES/JLSN/XA1_JLSN": "45b606ec787524ec33c8d16134e4c7642fcf2fbf",
		"compsamples_refanddir/IMAGES/REF/CT1_UNC": "e82eaff60ea29cb8e053487d75d68124d24cb0a7",
		"compsamples_refanddir/IMAGES/REF/CT2_UNC": "d1a9dc9d357339152e0109421d69ada845299952",
		"compsamples_refanddir/IMAGES/REF/MG1_UNC": "f32571784f1bda0b46f95305f5b29087b6ce9b2a",
		"compsamples_refanddir/IMAGES/REF/MR1_UNC": "afe302b02519c029328b6a4cb2e744146679ba57",
		"compsamples_refanddir/IMAGES/REF/MR2_UNC": "7eb77babc268bf1ab1a7d2159f7fedb85d6d6ea1",
		"compsamples_refanddir/IMAGES/REF/MR3_UNC": "1e3b4f65b051f01249786977efe480ebee5f7544",
		"compsamples_refanddir/IMAGES/REF/MR4_UNC": "9cc266190c809261d6f6bf6acc4deed89cd19f51",
		"compsamples_refanddir/IMAGES/REF/NM1_UNC": "0b7048f2d02c3037057e2431999ed447c3e85505",
		"compsamples_refanddir/IMAGES/REF/RG1_UNC": "5045d80a9010345f10fd01d8f35f53b313f2221b",
		"compsamples_refanddir/IMAGES/REF/RG2_UNC": "6e203caf21a62cc06ef077206060af79fbeae0bb",
		"compsamples_refanddir/IMAGES/REF/RG3_UNC": "532ee0ccdafa7ae1e647409f69f6f0fb6ea87351",
		"compsamples_refanddir/IMAGES/REF/SC1_UNC": "8e40f13f760a153afdd02db9239085ccbf2a96f7",
		"compsamples_refanddir/IMAGES/REF/US1_UNC": "d4abc7ff1c267eba4a382c9a920c5b2ba307b6ba",
		"compsamples_refanddir/IMAGES/REF/VL1_UNC": "240cea2241048a9f207df9c761eaedf03d0d01a4",
		"compsamples_refanddir/IMAGES/REF/VL2_UNC": "9fa709da0da1bdce2e6045c8a3adacf6eac360ff",
		"compsamples_refanddir/IMAGES/REF/VL3_UNC": "8c386bfa150b9686627a928201d46ca6b3523d49",
		"compsamples_refanddir/IMAGES/REF/VL4_UNC": "3424e922a28a2ac770e6ac6a17c7ed2b8c85ca3e",
		"compsamples_refanddir/IMAGES/REF/VL5_UNC": "1d958d6472831cb454cd1a64e305131e50bd419f",
		"compsamples_refanddir/IMAGES/REF/VL6_UNC": "6de647f70d999ef1842286ea76117d337f4f6e20",
		"compsamples_refanddir/IMAGES/REF/XA1_UNC": "9cc2fee303846667136a3c2b711d689809e67e26",
		"compsamples_rle_20040210/IMAGES/RLE/CT1_RLE": "c8bd0e4736fb8c9c1e6a3b005a43373f41a87848",
		"compsamples_rle_20040210/IMAGES/RLE/CT2_RLE": "3127371cb05e16f6d6b6bb4e3c6ab55c078e2102",
		"compsamples_rle_20040210/IMAGES/RLE/MG1_RLE": "9895ce96ab7587278bbbf1794120ea8ed84778af",
		"compsamples_rle_20040210/IMAGES/RLE/MR1_RLE": "432b17484ba6cab913524e625a19c53dc7463e9e",
		"compsamples_rle_20040210/IMAGES/RLE/MR2_RLE": "5e74c58042dc000f4b2263ea01f55e05f4c9fcde",
		"compsamples_rle_20040210/IMAGES/RLE/MR3_RLE": "7da47caae0bddadd93d8af2e932506e776f19f6f",
		"compsamples_rle_20040210/IMAGES/RLE/MR4_RLE": "e1ef90fff70c1f383fb1476d5af84a70aba2598d",
		"compsamples_rle_20040210/IMAGES/RLE/NM1_RLE": "063ea948e9f8dd11bbdbbcdc09dde3b9fc71cba6",
		"compsamples_rle_20040210/IMAGES/RLE/RG1_RLE": "bdeea4ca4f68194a9d2e2fa46063786345ab2e3e",
		"compsamples_rle_20040210/IMAGES/RLE/RG2_RLE": "08a77ef5e4a0894e9d1c76d2d97fa1f636017ca0",
		"compsamples_rle_20040210/IMAGES/RLE/RG3_RLE": "43b20f5d0226c085ce98e22e26a52570e330bc60",
		"compsamples_rle_20040210/IMAGES/RLE/SC1_RLE": "ab1f365b35959b68731b807f6bf1f56bc1b78703",
		"compsamples_rle_20040210/IMAGES/RLE/US1_RLE": "e0b51e714c911b54025f3530b2acc5fdd79153cd",
		"compsamples_rle_20040210/IMAGES/RLE/VL1_RLE": "8cca1f49c9569c2252bab0288bf5ecf9a0c01d34",
		"compsamples_rle_20040210/IMAGES/RLE/VL2_RLE": "eeadceff6717d34a416b3408335210bb3616e8b8",
		"compsamples_rle_20040210/IMAGES/RLE/VL3_RLE": "314bde63e452ea273a34e0b037d8844b9e0a4427",
		"compsamples_rle_20040210/IMAGES/RLE/VL4_RLE": "2cea3fb4cc4f2c80cec1829de9b393d5edf8e926",
		"compsamples_rle_20040210/IMAGES/RLE/VL5_RLE": "a45c03730af4cb1bbf68cb48eeb6fe2b51f790c1",
		"compsamples_rle_20040210/IMAGES/RLE/VL6_RLE": "31e239952c997eaa6e4031089011e2c80189da34",
		"compsamples_rle_20040210/IMAGES/RLE/XA1_RLE": "df4bc02e0ca511a0c805092b8c9b218586137658",
		"multiframe/DISCIMG/IMAGES/BRMULTI": "66c750bd253f05539e97fa14e1fb7d76e2860672"
	};

	const fileKeys = Object.keys(fileNameToTagHash).sort();
	// let i = 0;
	fileKeys.forEach((key) => {
		it(`Parses file ${key} OK`, () => {
			const data = fs.readFileSync(`${path}${key}`);
			const dataView = new DataView(new Uint8Array(data).buffer);
			const image = parseImage(dataView);
			expect(image).toBeTruthy();
			expect(image.tags).toBeTruthy();
			// console.log(toJSONString(image.tags));
			// fileNameToTagHash[key] = shaFromJSON(image.tags);
			expect(shaFromJSON(image.tags)).toEqual(fileNameToTagHash[key]);
			// i += 1;
			// if (i >= fileKeys.length) {
			// 	console.log(fileNameToTagHash);
			// }
		});
	});

	const specificKey = "multiframe/DISCIMG/IMAGES/BRMULTI"; // fileKeys[1];
	it("Parses specific file OK", () => {
		const data = fs.readFileSync(`${path}${specificKey}`);
		const dataView = new DataView(new Uint8Array(data).buffer);
		const image = parseImage(dataView);
		expect(image).toBeTruthy();
		expect(image.tags).toBeTruthy();
		// console.log(toJSONString(image.tags));
		// fileNameToTagHash[key] = shaFromJSON(image.tags);
		expect(shaFromJSON(image.tags)).toEqual(fileNameToTagHash[specificKey]);
		// i += 1;
		// if (i >= fileKeys.length) {
		// 	console.log(fileNameToTagHash);
		// }
	});
});
