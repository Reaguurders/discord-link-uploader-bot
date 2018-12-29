require("dotenv").config();
const GoogleSpreadsheet = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(process.env.DOCUMENT_KEY);
const creds = require("./credentials");

const puppeteer = require("puppeteer");

let spreadsheet = {};

doc.useServiceAccountAuth(creds, () => {
	// Haal info van de spreadsheet 1x per minuut op
	doc.getInfo((err, info) => {
		spreadsheet = info;
	});
});

async function scrape(rows) {
	for (const row of rows) {
		if (row["dumpert-link"] && row.lengte) {
			return;
		}

		const browser = await puppeteer.launch({
			headless: true,
			executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
		});
		const page = await browser.newPage();

		await page.setCookie({
			name: "cpc",
			value: "10",
			domain: ".dumpert.nl",
			path: "/"
		}, {
			name: "nsfw",
			value: "1",
			domain: ".dumpert.nl",
			path: "/"
		});

		await page.goto(row["dumpert-link"]);
		await page.waitFor(3000);

		const result = await page.evaluate(() => {
			let titel = document.querySelector(".dump-desc h1").innerText;
			let uploaddatum = document.querySelector(".dump-desc .dump-pub").innerText;
			let views = document.querySelector("body > div.dump-main > div.dump-pan > section > article > div.dump-meta > div.dump-rate > div.dump-views > div > p:nth-child(1) > span.dump-amt").innerText;
			let kudos = document.querySelector("body > div.dump-main > div.dump-pan > section > article > div.dump-meta > div.dump-rate > div.dump-kudos > p:nth-child(1) > span.dump-amt").innerText;
			let nsfw = document.querySelector("head > meta[name=\"NSFW\"]") ? "Ja" : "Nee";
			let thumbnail = document.querySelector("head > link[rel=\"image_src\"]").getAttribute("href");

			let lengte = document.querySelector(".vjs-duration-display");
			if (lengte) {
				lengte = lengte.innerText.replace("Duration Time ", "");
			} else {
				lengte = document.querySelector(".ytp-time-duration");
				if (lengte) {
					lengte = lengte.innerText;
				} else {
					lengte = "??";
				}
			}

			return {
				titel,
				uploaddatum,
				views,
				kudos,
				nsfw,
				lengte,
				thumbnail
			};
		});
		
		await browser.close();
		row.titel = result.titel;
		row.uploaddatum = result.uploaddatum;
		row.views = result.views;
		row.kudos = result.kudos;
		row.nsfw = result.nsfw;
		row.lengte = result.lengte;
		row.thumbnail = result.thumbnail;
		row.save((err) => {
			if (err) {
				console.error(err);
			}

			console.log(row.nummer + " processed");
		});
	}
}

// Check iedere 120 seconden voor rows zonder data
setInterval(() => {
	let worksheet;
	if (!spreadsheet.worksheets) {
		return;
	}

	// Pak de eerste worksheet
	worksheet = spreadsheet.worksheets[0];

	// Pak alle rows van de worksheet
	worksheet.getRows({
		offset: 1	
	}, (err, rows) => {
		if (err) {
			console.error(err);
			return;
		}

		// Filter alle rows waar de URL al bekend is en de data nog niet voor gescraped is
		scrape(rows.filter((row) => {
			return row["dumpert-link"] && row["dumpert-link"].substr(0, 8) === "https://" && !row.lengte;
		}));
	});
}, 120000);