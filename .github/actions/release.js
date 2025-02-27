const fs = require("fs");
const { promisify } = require("util");
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const child_process = require("child_process");
const commandLineArgs = require('command-line-args');
const glob = require("glob-promise");
const execSync = child_process.execSync;
const gitRev = execSync("git rev-parse HEAD").toString();

const PACKAGES = {};
const NPM_PREFIX = "@gsmlg/ui5-webcomponents";

const options = commandLineArgs([
	{ name: 'version', alias: 'v', type: String },
]);

const NEW_VERSION = options.version;

const run = async () => {
	const FILES = await glob("**/packages/**/package.json", {
		"ignore": ["**/node_modules/**/*.*", "**/dist/**/*.*", "**/playground/**/*.*"],
	});

	// Step 1: process package.json files
	const pkgs = await Promise.all(FILES.map(processPackageJSON));

	// Step 2: update package.json files
	await Promise.all(pkgs.map(updatePackageJSON));

	// Step 3: publish each package to npm
	pkgs.forEach(publishPackage);
};

const processPackageJSON = async file => {
	const folder = file.split("package.json")[0];
	const fileRead = await readFileAsync(file);
	const fileContent = JSON.parse(fileRead.toString());
	const name = fileContent.name.replace('@ui5/', '@gsmlg/ui5-');
    fileContent.name = name;

	const version = NEW_VERSION || `0.0.0-${gitRev.slice(0,9,)}`;

	PACKAGES[name] = { name, file, fileContent, version, folder };
	return PACKAGES[name];
};

const updatePackageJSON = async pkg => {
	const file = pkg.file;
	const fileContent = pkg.fileContent;
	const dependencies = fileContent.dependencies;
	const devDependencies = fileContent.devDependencies;

	fileContent.version = pkg.version;
	dependencies && getDependencies(dependencies).forEach(dep => {
		fileContent.dependencies[dep] = PACKAGES[dep].version;
	});
	devDependencies && getDependencies(devDependencies).forEach(dep => {
		fileContent.devDependencies[dep] = PACKAGES[dep].version;
	});

	return writeFileAsync(file, JSON.stringify(fileContent, null, "  "));
};

const getDependencies = (dependencies) => {
	return Object.keys(dependencies).filter(dep => dep.startsWith(NPM_PREFIX));
};

const publishPackage = pkg => {
	console.info(`Publish ${pkg.name}: ${pkg.version} ...`); // eslint-disable-line
	execSync(`npm publish ${pkg.folder} --access=public`);
};

run().catch(error => {
	console.error("Release of @latest version failed", error); // eslint-disable-line
});
