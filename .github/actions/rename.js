const fs = require("fs/promises");
const child_process = require("child_process");
const commandLineArgs = require('command-line-args');
const glob = require("glob-promise");
const execSync = child_process.execSync;
const gitRev = execSync("git rev-parse HEAD").toString();

const PACKAGES = {};

const run = async () => {
    let files = await glob("packages/**/*.{md,js,json,html}", {
        "ignore": ["**/node_modules/**/*.*", "**/dist/**/*.*", "**/playground/**/*.*"],
    });
    files = files.concat(await glob('packages/**/.eslintrc.js'));
    const FILES = files;

    console.log(FILES);
    // Step 1: process files
    const pkgs = await Promise.all(FILES.map(processFile));

    // Step 2: update files
    await Promise.all(pkgs.map(updateFile));
};

const processFile = async file => {
    const folder = file.split("src/")[0];
    const fileRead = await fs.readFile(file);
    const content = fileRead.toString();
    console.log('rename content of file: ', file);
    const fileContent = content.replaceAll('@ui5/', '@gsmlg/ui5-');

    PACKAGES[file] = { file, fileContent, folder };
    return PACKAGES[file];
};

const updateFile = async pkg => {
    const file = pkg.file;
    const fileContent = pkg.fileContent;

    return await fs.writeFile(file, fileContent);
};


run().catch(error => {
    console.error("Release of @next version failed", error); // eslint-disable-line
});
