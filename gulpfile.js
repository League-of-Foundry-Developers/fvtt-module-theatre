/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-var-requires */
const gulp = require(`gulp`);
const fs = require(`fs`);
const path = require(`path`);
const archiver = require(`archiver`);
const stringify = require(`json-stringify-pretty-compact`);
const sourcemaps = require(`gulp-sourcemaps`);
const typescript = require(`typescript`);
// const createLiteral = typescript.createLiteral;
const createLiteral = typescript.factory.createStringLiteral;
const factory = typescript.factory;
const isExportDeclaration = typescript.isExportDeclaration;
const isImportDeclaration = typescript.isImportDeclaration;
const isStringLiteral = typescript.isStringLiteral;
const LiteralExpression = typescript.LiteralExpression;
const Node = typescript.Node;
const TransformationContext = typescript.TransformationContext;
const TSTransformer = typescript.Transformer;
const TransformerFactory = typescript.TransformerFactory;
const visitEachChild = typescript.visitEachChild;
const visitNode = typescript.visitNode;
const less = require(`gulp-less`);
const sass = require(`gulp-sass`)(require(`sass`));
const ts = require(`gulp-typescript`);
const git = require(`gulp-git`);
const argv = require(`yargs`).argv;
const minifyJs = require('gulp-uglify');
const concat = require('gulp-concat');
// const filter = require('gulp-filter');

const loadJson = (path) => {
	console.log(path)
	try {
		const str = fs.readFileSync(path).toString();
		return JSON.parse(str);
	} catch {
		throw Error(`Unable to load module.json`)
	}
};

function getConfig() {
	const configPath = path.resolve(process.cwd(), `foundryconfig.json`);
	let config;

	if (fs.existsSync(configPath)) {
		config = loadJson(configPath);
		return config;
	} else {
		return;
	}
}

const getManifest = () => {
	const json = {
		root: ``,
		file: {},
		name: ``
	};

	if (fs.existsSync(`src`)) {
		json.root = `src`;
	} else {
		json.root = `dist`;
	}

	const modulePath = path.join(json.root, `module.json`);
	const systemPath = path.join(json.root, `system.json`);

	if (fs.existsSync(modulePath)) {
		json.file = loadJson(modulePath);
		json.name = `module.json`;
	} else if (fs.existsSync(systemPath)) {
		json.file = loadJson(systemPath);
		json.name = `system.json`;
	} else {
		return null;
	}

	// If we can pull our version from our package - saves us having to maintain the number in different places
	if (process.env.npm_package_version) {
		json.file[`version`] = process.env.npm_package_version;
	}
	return json;
}


const createTransformer = () => {
	/**
	 * @param {typescript.Node} node
	 */
	const shouldMutateModuleSpecifier = (node) => {
		if (!isImportDeclaration(node) && !isExportDeclaration(node))
			return false;
		if (node.moduleSpecifier === undefined)
			return false;
		if (!isStringLiteral(node.moduleSpecifier))
			return false;
		if (!node.moduleSpecifier.text.startsWith(`./`) && !node.moduleSpecifier.text.startsWith(`../`))
			return false;

		return path.extname(node.moduleSpecifier.text) === ``;
	}

	return (context) => {
		return (node) => {
			function visitor(node) {
				if (shouldMutateModuleSpecifier(node)) {
					if (isImportDeclaration(node)) {
						const newModuleSpecifier = createLiteral(`${(node.moduleSpecifier).text}.js`);
						return factory.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier, undefined);
					} else if (isExportDeclaration(node)) {
						const newModuleSpecifier = createLiteral(`${(node.moduleSpecifier).text}.js`);
						return factory.updateExportDeclaration(node, node.decorators, node.modifiers, false, node.exportClause, newModuleSpecifier, undefined);
					}
				}
				return visitEachChild(node, visitor, context);
			}
			return visitNode(node, visitor);
		};
	};
}

const tsConfig = ts.createProject(`tsconfig.json`, {
	getCustomTransformers: (_program) => ({
		after: [createTransformer()],
	}),
});

/********************/
/*		BUILD		*/
/********************/

/**
 * Build TypeScript
 */
function buildTS() {

	return (
		gulp
		.src(`src/**/*.ts`)
		.pipe(tsConfig())
		.pipe(gulp.dest(`dist`))
	);
}

/**
 * Build JavaScript
 */
function buildJS() {
	return (
		gulp
		.src(`src/**/*.js`)
		.pipe(gulp.dest(`dist`))
	);
}

/**
 * Build JavaScript
 */
function buildJSMap() {
	return (
		gulp
		.src(`src/**/*.js.map`)
		.pipe(gulp.dest(`dist`))
	);
}

/**
 * Build Module JavaScript
 */
function buildMJS() {
	return (
		gulp
		.src(`src/**/*.mjs`)
		.pipe(gulp.dest(`dist`))
	);
}

/**
 * Build Css
 */
function buildCSS() {
	return gulp.src(`src/**/*.css`).pipe(gulp.dest(`dist`));
}

/**
 * Build Css
 */
function buildCSSMap() {
	return gulp.src(`src/**/*.css.map`).pipe(gulp.dest(`dist`));
}

/**
 * Build Less
 */
function buildLess() {
	return gulp.src(`src/**/*.less`).pipe(less()).pipe(gulp.dest(`dist`));
}

/**
 * Build SASS
 */
function buildSASS() {
	return gulp.src(`src/**/*.scss`).pipe(sass().on(`error`, sass.logError)).pipe(gulp.dest(`dist`));
}

const bundleModule = async () => {

    // const myFilter = filter(function (file) {
    //     let baseName = path.basename(file.path);
    //     return !baseName.endsWith(`.min.js`);
    // });

	return gulp.src(`./dist/**/*.js`)
        // .pipe(myFilter)
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		.pipe(minifyJs())
		.pipe(concat(`module.js`))
		.pipe(sourcemaps.write(`./`))
		.pipe(gulp.dest(`./dist`))
		.on('end', function() {
			recursiveFileSearch(`./dist`, (err, res) => {
				if (err) {
					throw err;
				}
				for (const file of res) {
					if (file.endsWith(`.js`) && !file.endsWith(`module.js`) && !file.endsWith(`.min.js`)) {
						const newFile = path.relative(process.cwd(), file);
						console.log(`Delete file: ` + newFile);
						fs.unlink(newFile, (err) => {
							if (err) {
								throw err;
							}
						});
					}
				}
				cleanEmptyFoldersRecursively(`./dist`);
			})
		});
}

function cleanEmptyFoldersRecursively(folder) {
	var isDir = fs.statSync(folder).isDirectory();
	if (!isDir) {
		return;
	}
	var files = fs.readdirSync(folder);
	if (files.length > 0) {
		files.forEach(function(file) {
			var fullPath = path.join(folder, file);
			cleanEmptyFoldersRecursively(fullPath);
		});

		// re-evaluate files; after deleting subfolder
		// we may have parent folder empty now
		files = fs.readdirSync(folder);
	}

	if (files.length == 0) {
		console.log("Delete empty folder: ", folder);
		fs.rmdirSync(folder);
		return;
	}
}

const recursiveFileSearch = (dir, callback) => {
	const err = callback.err;
	const res = callback.res;
	let results = [];
	fs.readdir(dir, (err, list) => {
		if (err)
			return callback(err, results);

		let pending = list.length;
		if (!pending)
			return callback(null, results);

		for (let file of list) {
			file = path.resolve(dir, file);
			fs.stat(file, (err, stat) => {
				if (stat && stat.isDirectory()) {
					recursiveFileSearch(file, (err, res) => {
						results = results.concat(res);
						if (!--pending) {
							callback(null, results);
						}
					});
				} else {
					results.push(file);
					if (!--pending) {
						callback(null, results);
					}
				}
			});
		}
	});
};

const copyFiles = async () => {
	const statics = [`lang`, `languages`, `fonts`, `assets`, `graphics`, `icons`, `templates`, `packs`, `module.json`, `system.json`, `template.json`];


	console.log(`files:` + statics);
	try {
		for (const entity of statics) {

			const p = path.join(`src`, entity);
			if (fs.existsSync(p)) {
				if (fs.lstatSync(p).isDirectory())
					recursiveFileSearch(p, (err, res) => {
						if (err)
							throw err;

						for (const file of res) {
							const newFile = path.join(`dist`, path.relative(process.cwd(), file.replace(/.*src[\/\\]/g, ``)));
							console.log(`Copying file: ` + newFile);
							const folder = path.parse(newFile).dir;
							if (!fs.existsSync(folder)) {
								fs.mkdirSync(folder, {
									recursive: true
								});
							}
							fs.copyFileSync(file, newFile);
						}
					})
				else {
					console.log(`Copying file: ` + p + ` to ` + path.join(`dist`, entity));
					fs.copyFileSync(p, path.join(`dist`, entity));
				}
			}
		}
		return Promise.resolve();
	} catch (err) {
		await Promise.reject(err);
	}
}

const cleanDist = async () => {
	if (argv.dbg || argv.debug) {
		return;
	}
	console.log(`Cleaning dist file clutter`);

	const files = [];
	const getFiles = async (dir) => {
		const arr = await fs.promises.readdir(dir);
		for (const entry of arr) {
			const fullPath = path.join(dir, entry);
			const stat = await fs.promises.stat(fullPath);
			if (stat.isDirectory())
				await getFiles(fullPath);
			else
				files.push(fullPath);
		}
	}

	await getFiles(path.resolve(`./dist`));
	for (const file of files) {
		console.warn(`Cleaning ` + path.relative(process.cwd(), file));
		await fs.promises.unlink(file);
	}
}

/**
 * Watch for changes for each build step
 */
const buildWatch = () => {
	gulp.watch('src/**/*.ts', {
		ignoreInitial: false
	}, buildTS);
	gulp.watch('src/**/*.less', {
		ignoreInitial: false
	}, buildLess);
	gulp.watch('src/**/*.scss', {
		ignoreInitial: false
	}, buildSASS);
	gulp.watch('src/**/*.js', {
		ignoreInitial: false
	}, buildJS);
	gulp.watch('src/**/*.mjs', {
		ignoreInitial: false
	}, buildMJS);
	gulp.watch('src/**/*.css', {
		ignoreInitial: false
	}, buildCSS);
	gulp.watch([`src/fonts`, `src/lang`, `src/languages`, `src/templates`, `src/*.json`], {
		ignoreInitial: false
	}, copyFiles);
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
const clean = async () => {
	if (!fs.existsSync(`dist`)) {
		fs.mkdirSync(`dist`);
	}

	const name = path.basename(path.resolve(`.`));
	const files = [];

	files.push(
		`lang`,
		`languages`,
		`fonts`,
		`icons`,
		`packs`,
		`templates`,
		`assets`,
		`graphics`,
		`module`,
		`index.js`,
		`module.json`,
		`system.json`,
		`template.json`,
		`module.js`,
		`module.js.map`,
	);
	// Attempt to remove the files
	try {
		for (const filePath of files) {
			if (fs.existsSync(path.join(`dist`, filePath))) {
				fs.rmSync(path.join(`dist`, filePath), {
					recursive: true,
					force: true
				});
			}
		}
		return Promise.resolve();
	} catch (err) {
		await Promise.reject(err);
	}
}

const linkUserData = async () => {
	const name = getManifest()?.file.name;
	const config = loadJson(`foundryconfig.json`);

	let destDir;
	try {
		if (fs.existsSync(path.resolve(`.`, `dist`, `module.json`)) || fs.existsSync(path.resolve(`.`, `src`, `module.json`))) {
			destDir = `modules`;
		} else {
			throw Error(`Could not find module.json or system.json`);
		}

		let linkDir;
		if (config.dataPath) {
			if (!fs.existsSync(path.join(config.dataPath, `Data`)))
				throw Error(`User Data path invalid, no Data directory found`);

			linkDir = path.join(config.dataPath, `Data`, destDir, name);
		} else {
			throw Error(`No User Data path defined in foundryconfig.json`);
		}

		if (argv.clean || argv.c) {
			console.warn(`Removing build in ${linkDir}`);

			fs.unlinkSync(linkDir);
		} else if (!fs.existsSync(linkDir)) {
			console.log(`Copying build to ${linkDir}`);
			fs.symlinkSync(path.resolve(`./dist`), linkDir);
		}
		return Promise.resolve();
	} catch (err) {
		await Promise.reject(err);
	}
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
	const manifest = getManifest();
	if (manifest === null) {
		console.error(`Manifest file could not be loaded.`);
		throw Error();
	}

	return new Promise((resolve, reject) => {
		try {
			// Remove the package dir without doing anything else
			if (argv.clean || argv.c) {
				console.warn(`Removing all packaged files`);
				fs.rmSync(`package`, {
					force: true,
					recursive: true
				});
				return;
			}

			// Ensure there is a directory to hold all the packaged versions
			// fs.existsSync(`package`);
			if (!fs.existsSync(`package`)) {
				fs.mkdirSync(`package`, {
					recursive: true
				});
			}

			// Initialize the zip file
			const moduleJson = JSON.parse(fs.readFileSync('./src/module.json'));

			// Github
			// const zipName = `module.zip`; // `${manifest.file.name}-v${manifest.file.version}.zip`;

			// Gitlab
			const zipName = `${moduleJson.id}-v${moduleJson.version}.zip`;

			const zipFile = fs.createWriteStream(path.join(`package`, zipName));
			//@ts-ignore
			const zip = archiver(`zip`, {
				zlib: {
					level: 9
				}
			});

			zipFile.on(`close`, () => {
				console.log(zip.pointer() + ` total bytes`);
				console.log(`Zip file ${zipName} has been written`);
				return resolve(true);
			});

			zip.on(`error`, (err) => {
				throw err;
			});

			zip.pipe(zipFile);

			// Add the directory with the final code
			zip.directory(`dist/`, moduleJson.id);
			console.log(`Zip files`);

			zip.finalize();
			return resolve(`done`);
		} catch (err) {
			return reject(err);
		}
	});
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Update version and URLs in the manifest JSON
 */
const updateManifest = (cb) => {
	const packageJson = loadJson(`package.json`);
	const config = getConfig(),
		manifest = getManifest(),
		rawURL = config.rawURL,
		repoURL = config.repository,
		manifestRoot = manifest?.root;

	if (!config) {
		cb(Error(`foundryconfig.json not found`));
	}
	if (manifest === null) {
		cb(Error(`Manifest JSON not found`));
		return;
	}
	if (!rawURL || !repoURL) {
		cb(Error(`Repository URLs not configured in foundryconfig.json`));
	}
	try {
		const version = argv.update || argv.u;

		/* Update version */

		const versionMatch = /^(\d{1,}).(\d{1,}).(\d{1,})$/;
		const currentVersion = manifest?.file.version;
		let targetVersion = ``;

		if (!version) {
			cb(Error(`Missing version number`));
		}

		if (versionMatch.test(version)) {
			targetVersion = version;
		} else {
			targetVersion = currentVersion.replace(versionMatch, (substring, major, minor, patch) => {
				console.log(substring, Number(major) + 1, Number(minor) + 1, Number(patch) + 1);
				if (version === `major`) {
					return `${Number(major) + 1}.0.0`;
				} else if (version === `minor`) {
					return `${major}.${Number(minor) + 1}.0`;
				} else if (version === `patch`) {
					return `${major}.${minor}.${Number(patch) + 1}`;
				} else {
					return ``;
				}
			});
		}

		if (targetVersion === ``) {
			return cb(Error(`Error: Incorrect version arguments.`));
		}

		if (targetVersion === currentVersion) {
			return cb(Error(`Error: Target version is identical to current version.`));
		}

		console.log(`Updating version number to "${targetVersion}"`);

		packageJson.version = targetVersion;
		manifest.file.version = targetVersion;

		/* Update URLs */
		// Github
		/*
		const result = `${repoURL}/releases/download/${manifest.file.version}/module.zip`;
		manifest.file.url = repoURL;
		manifest.file.manifest = `${rawURL}/${manifest.file.version}/${manifestRoot}/${manifest.name}`;
		manifest.file.download = result;
		*/
		// Gitlab
		const result = `${rawURL}/v${manifest.file.version}/package/${manifest.file.name}-v${manifest.file.version}.zip`;
		manifest.file.url = repoURL;
		manifest.file.manifest = `${rawURL}/master/${manifestRoot}/${manifest.name}`;
		manifest.file.download = result;

		const prettyProjectJson = stringify(manifest.file, {
			maxLength: 35,
			indent: `\t`,
		});

		fs.writeFileSync(`package.json`, JSON.stringify(packageJson, null, `\t`));
		fs.writeFileSync(path.join(manifest.root, manifest.name), prettyProjectJson, `utf8`);

		return cb();
	} catch (err) {
		cb(err);
	}
}

function gitAdd() {
	return gulp.src('package').pipe(git.add({
		args: '--no-all'
	}));
}

function gitCommit() {
	return gulp.src('./*').pipe(
		git.commit(`v${getManifest().file.version}`, {
			args: '-a',
			disableAppendPaths: true,
		}),
	);
}

function gitTag() {
	const manifest = getManifest();
	return git.tag(`v${manifest.file.version}`, `Updated to ${manifest.file.version}`, (err) => {
		if (err) throw err;
	});
}

const execGit = gulp.series(gitAdd, gitCommit, gitTag);
const execBuild = gulp.parallel(buildTS, buildJS, buildJSMap, buildMJS, buildCSS, buildCSSMap, buildLess, buildSASS, copyFiles);

exports.build = gulp.series(clean, execBuild);
exports.bundle = gulp.series(clean, execBuild, bundleModule, cleanDist);
exports.watch = buildWatch;
exports.clean = clean;
exports.link = linkUserData;
exports.package = packageBuild;
exports.update = updateManifest;
exports.publish = gulp.series(clean, updateManifest, execBuild, bundleModule, cleanDist, packageBuild, execGit);
