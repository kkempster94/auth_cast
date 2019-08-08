const puppeteer = require('puppeteer');

const yargs = require('yargs');

const debounce = require('debounce');

const loginUrl = yargs.default('loginUrl', '').argv.loginUrl;

const usernameInputSelector = yargs.default('usernameInputSelector', '#Username').argv.usernameInputSelector;

const username = yargs.default('username', '').argv.username;

const passwordInputSelector = yargs.default('passwordInputSelector', '#password').argv.passwordInputSelector;

const password = yargs.default('password', '').argv.password;

const submitButtonSelector = yargs.default('submitButtonSelector', '#loginMainDiv button[type=submit]').argv.submitButtonSelector;

const autoRefreshButtonSelector = yargs.default('autoRefreshButtonSelector', false).argv.autoRefreshButtonSelector;

const url = yargs.argv.url;

const device = yargs.argv.device;

const width = parseInt(yargs.default('width', '1920').argv.width);

const height = parseInt(yargs.default('height', '1080').argv.height);

const hasTwoStepLogin = yargs.default('hasTwoStepLogin', false).argv.hasTwoStepLogin;

const loginStep1ButtonSelector = yargs.default('loginStep1ButtonSelector', false).argv.loginStep1ButtonSelector;

const timeout = yargs.default('timeout', '4000').argv.timeout;

const waitSeconds = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const BrowserFetcher = require('puppeteer/lib/BrowserFetcher');

const CacheModule = require('./utils/cache');

const DEFAULT_ARGS = [
	'--enable-features=NetworkService,NetworkServiceInProcess',
	'--disable-background-timer-throttling',
	'--disable-backgrounding-occluded-windows',
	'--disable-breakpad',
	'--disable-client-side-phishing-detection',
	'--disable-dev-shm-usage',
	'--disable-features=site-per-process',
	'--disable-hang-monitor',
	'--disable-ipc-flooding-protection',
	'--disable-popup-blocking',
	'--disable-prompt-on-repost',
	'--disable-renderer-backgrounding',
	'--disable-sync',
	'--disable-translate',
	'--force-color-profile=srgb',
	'--metrics-recording-only',
	'--no-first-run',
	'--safebrowsing-disable-auto-update',
	'--enable-automation',
	'--password-store=basic',
	'--use-mock-keychain',
	// custom args
	'--start-maximized',
	// '--load-media-router-component-extension',
	// '--media-router-cast-allow-all-ips',
	`--user-data-dir=${__dirname + '\\chrome_user_data\\'}`,
	// disabled default args
	// '--disable-background-networking',
	// '--disable-default-apps',
	// '--disable-extensions',
];

const LAST_TESTED_REVISION = '641577';

async function downloadChrome () {
	const bf = new BrowserFetcher(__dirname, {});
	const {executablePath} = await bf.download(LAST_TESTED_REVISION);
	return executablePath;
}

function launchPuppeteer(executableLocation, additionalStartArgs = [], headless = false) {
	return puppeteer.launch({
		ignoreDefaultArgs: true,
		args: [
			...DEFAULT_ARGS,
			...additionalStartArgs
		],
		// executablePath: chromePath,
		executablePath: executableLocation,
		headless
	});
}

async function castPage(page) {
	const target = page._target;
	const cdpSession = await target.createCDPSession();
	let sinkName;
	let hasCasted = false;

	cdpSession.on('Cast.sinksUpdated', debounce(({ sinkNames }) => {
		sinkName = sinkNames && sinkNames.find((name => name.toLowerCase() === device.toLowerCase()));
		if (sinkNames.length && sinkName && !hasCasted) {
			hasCasted = true;
			console.log('device found. Casting to ' + sinkName);
			cdpSession.send('Cast.startTabMirroring', { sinkName });
		} else {
			console.log('device not found.');
		}
	}, 2000));

	await cdpSession.send('Cast.enable');
}

function stripUrl (url) {
	const urlWithoutQuery = url.split('?')[0];
	const urlWithoutWWW = urlWithoutQuery.replace('www.', '');
	const urlWithoutProtocol = urlWithoutWWW.replace(/https?:\/\//g, '');
	if (urlWithoutProtocol.endsWith('/')) {
		return urlWithoutProtocol.slice(0, -1);
	}
	return urlWithoutProtocol;
}

async function ensureGoToUrl(page, url) {
	let attempts = 0;
	let isAtUrl;
	while (!isAtUrl && attempts++ < 3) {
		await page.goto(url);
		const currentUrl = stripUrl(page.url());
		const desiredUrl = stripUrl(url);
		console.log(currentUrl, desiredUrl);
		isAtUrl = currentUrl === desiredUrl;
	}
}

async function main(page) {
	let isLoggedIn = false;
	try {
		if (loginUrl) {
			await page.goto(loginUrl);
			await page.type(usernameInputSelector, username);
			if (hasTwoStepLogin) {
				await page.type(usernameInputSelector, username);
				if (loginStep1ButtonSelector) {
					await page.click(loginStep1ButtonSelector);
				} else {
					await page.click(submitButtonSelector);
				}
	
				await waitSeconds(1);
			}
			
			await page.type(passwordInputSelector, password);
			await page.click(submitButtonSelector);
			await waitSeconds(5);
			isLoggedIn = true;
		}
	} catch (error) {
		// if the page url matches the logged in url, then we are logged in
		if (page.url() === url) {
			isLoggedIn = true;
		} 
	}

	if (!isLoggedIn && loginUrl) {
		console.log('could not log in. Closing session.');
		browser.close();
	}
	

	await ensureGoToUrl(page, url);

	await waitSeconds(5);

	await castPage(page);

	let refreshInterval;

	if (autoRefreshButtonSelector) {
		await page.click(autoRefreshButtonSelector);
	} else {
		refreshInterval = setInterval(() => {
			page.reload();
		}, 1000 * 60 * 5);
	}

	waitSeconds(parseInt(timeout)).then(() => {
		browser.close();
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}

	});
}

function getSelectElemByFlagNameAndSetValue (flagName, value) {
	const linkElem = document.querySelector(`a[href="#${flagName}"]`);
	const experimentContainerElem = linkElem.parentElement.parentElement;
	const select = experimentContainerElem.querySelector('select');
	select.value = value;
	select.onchange();
}
//load-media-router-component-extension
async function setFlag (page, flagName, enabled = true) {
	await page.goto(`chrome://flags/#${flagName}`);
	await page.evaluate(getSelectElemByFlagNameAndSetValue, flagName, enabled ? 'Enabled' : 'Disabled' );
}

async function initializeNewChromeDownload (execPath) {
	const browser = await launchPuppeteer(execPath);
	const page = (await browser.pages())[0];
	await page.setViewport({ width, height });
	// setting these flags allows for the cast extension to work properly
	await setFlag(page, 'load-media-router-component-extension');
	await setFlag(page, 'media-router-cast-allow-all-ips');
	await waitSeconds(15);
	await browser.close();
}

(async () => {
	const cm = new CacheModule();
	const cache = cm.get();
	let execPath;

	if (!cache.execPath) {
		cache.execPath = await downloadChrome();
		cm.set(cache);
		await initializeNewChromeDownload(execPath)
	}

	execPath = cache.execPath;
	const browser = await launchPuppeteer(execPath);
	
	const page = (await browser.pages())[0];
	await page.setViewport({ width, height });



	let attemptsLeft = 2;
	let shouldRetry = true;
	while (shouldRetry && attemptsLeft) {
		try {
			await main(page);
			shouldRetry = false;
		} catch (error) {
			console.log(error);
			attemptsLeft--;
		}
	}
})();