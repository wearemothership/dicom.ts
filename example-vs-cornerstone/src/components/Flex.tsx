import React from "react";

interface FlexProps {
	className?: string;
	children?: React.ReactNode;
	justifyContent?: React.CSSProperties['justifyContent'];
	flexDirection?: React.CSSProperties['flexDirection'];
	flexGrow?: React.CSSProperties['flexGrow'];
	flexBasis?: React.CSSProperties['flexBasis'];
	flexShrink?: React.CSSProperties['flexShrink'];
	flexWrap?: React.CSSProperties['flexWrap'];
	flex?: React.CSSProperties['flex'];
	alignItems?: React.CSSProperties['alignItems'];
	margin?: React.CSSProperties['margin'];
	padding?: React.CSSProperties['padding'];
	width?: React.CSSProperties['width'];
	height?: React.CSSProperties['height'];
	maxWidth?: React.CSSProperties['maxWidth'];
}

const Flex: React.FC<FlexProps> = ({
	className = "",
	children = null,
	justifyContent = "flex-start",
	flexDirection = "column",
	flexGrow = 0,
	flexBasis = "auto",
	flexShrink = 1,
	flexWrap = "nowrap",
	flex = "0 1 auto",
	alignItems = "stretch",
	margin = "0",
	padding = "0",
	width = "auto",
	height = "auto",
	maxWidth = "100%"
}) => (
	<div
		className={className}
		style={{
			display: "flex",
			justifyContent,
			flexDirection,
			flexGrow,
			flexBasis,
			flexShrink,
			flexWrap,
			flex,
			alignItems,
			margin,
			padding,
			width,
			height,
			maxWidth,
		}}
	>
		{ children }
	</div>
);

export default Flex;
