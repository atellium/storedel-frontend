import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	allowedDevOrigins: ['10.222.56.149', '10.167.131.149'],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "pub-f3d16aa17c8b46af8ec3b0a6a3681646.r2.dev",
				port: "",
				pathname: "/media/stores/**",
				search: "",
			},
			{
				protocol: "https",
				hostname: "pub-f3d16aa17c8b46af8ec3b0a6a3681646.r2.dev",
				port: "",
				pathname: "/media/uploads/**",
				search: "",
			},
			{
				protocol: "https",
				hostname: "pub-f3d16aa17c8b46af8ec3b0a6a3681646.r2.dev",
				port: "",
				pathname: "/media/product_categories/**",
				search: "",
			},
			{
				protocol: "https",
				hostname: "media.storedel.com",
				port: "",
				pathname: "/**",
				search: "",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
