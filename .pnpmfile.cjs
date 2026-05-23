module.exports = {
	hooks: {
		readPackage(pkg) {
			if (pkg.name === "starwind" && pkg.dependencies?.["@starwind-ui/core"]) {
				pkg.dependencies["@starwind-ui/core"] = "workspace:*";
			}
			return pkg;
		},
	},
};
