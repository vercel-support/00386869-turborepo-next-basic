import Image, { type ImageProps } from "next/image";
import styles from "./page.module.css";

export default function Home() {
	return (
		<div className={styles.page}>
			<Image
				src="https://app-dmgd01saaso3ga7p003.cms.optimizely.com/globalassets/organisms/hero/csm_mmk22_a07fdb40de.jpg"
				alt="logo"
				width={3840}
				height={1080}
			/>
		</div>
	);
}
