process.removeAllListeners('warning')
const fs = require("fs")
const Logger = require(`../core/util/logger`)
const { createWriteStream } = require('fs');
const https = require('https');
const fetch = require ('node-fetch-commonjs');
const { exec } = require('child_process');
const cliProgress = require('cli-progress');
const { Octokit } = require('@octokit/rest');
const sevenBin = require('7zip-bin')
const Seven = require('node-7z')
const config = require("../user/configs/server_base.json")
const octokit = new Octokit();
const owner = 'EFHDev';
const repo = 'Escape-From-Hell-PoC'; //????
if(config.AutoUpdateEFH == true) {
  console.log(`Auto-Update will clear any changes done to your database when updating! EX: Changing stacksize of Stims, or money. If you dont want this disable it! This will not effect profiles!`)
  checkForUpdates();
}
else {
  console.log("update is null or false!")
  const OnReadyStartServer = require(`../bin/www`)
}


/**
 * Checks for update kekw
 */
async function checkForUpdates() {
  try {
    // Get the latest release information from GitHub
    const { data: latestRelease } = await octokit.repos.getLatestRelease({ owner, repo });

    // Compare the latest release version with the current version of MTGA
    const currentVersion = process.env.npm_package_version; // Current version of MTGA
    const latestVersion = latestRelease.tag_name.replace(/^v/, ''); // Latest version of MTGA

    if (latestVersion !== currentVersion) { // Check if there is a new version of MTGA available
      console.log(`New version available: ${latestVersion}`);

      // Download and install the latest release
      const downloadUrl = latestRelease.assets[0].browser_download_url; // URL to download the latest release
      const fileType = latestRelease.assets[0].content_type; // Type of the downloaded file
      const fileName = latestRelease.assets[0].name; // Name of the downloaded file
      const fileSize = latestRelease.assets[0].size;

      await downloadAndInstallUpdate(downloadUrl, fileName, fileSize);
      console.log("\n\nDownloaded the newest EFH version.");

      await delay(3000); // Wait for 15 seconds
      const OnReadyStartServer = require(`../bin/www`)
    } else {
      console.log('\nEFH is up to date!');
      await delay(3000); // Wait for 10 seconds
      const OnReadyStartServer = require(`../bin/www`)
    }
  } catch (error) {
    //if {config.debug} {
    // console.error('\n\nError checking for update: \n\n', error);
    console.log("EFH is up to date! or error\n\n", error)
    //}
    await delay(3000); // Wait for 10 seconds
    const OnReadyStartServer = require(`../bin/www`)
  }
}
// This is an asynchronous function that downloads a file from a given URL
// and saves it to a file with the specified name
async function downloadAndInstallUpdate(downloadUrl, fileName, fileSize) {
  // Set the destination path to the current directory and the specified file name
  const destPath = `./${fileName}`;

  // Set up progress bar for download
  const downloadBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  console.log('Downloading update...');
  downloadBar.start(100, 0);
  downloadBar.setTotal(`${fileSize}`)

  // Download the release asset from GitHub
  const dest = createWriteStream(destPath);
  const response = await fetch(downloadUrl);

  // Handle errors that occur during download
  response.body.on('error', () => {
    console.log('Error while downloading update.');
    downloadBar.stop();
  });

  // Update progress bar as download progresses
  response.body.on('data', (chunk) => {
    downloadBar.increment(chunk.length);
  });

  // Save downloaded file to destination
  response.body.pipe(dest);

  // Wait for download to complete
  await new Promise((resolve) => {
    dest.on('finish', resolve);
  });

  // Stop progress bar and print message indicating download completion
  downloadBar.stop();
  console.log(`Downloaded update to ${destPath}`);

  // Extract the release asset if it is a zip, rar or 7z file
  const fileTypeT = fileName.split(".");
  await delay(1000);

  if (fileTypeT[1] === "zip" || fileTypeT[1] === "rar" || fileTypeT[1] === "7z") {
    console.log('Extracting update...');
    const extractionBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // Set up progress bar for extraction
    extractionBar.start(100, 0);
    downloadBar.setTotal(`${fileSize}`)

    // Extract the file using the 7z binary and update progress bar as extraction progresses
    const filepath = destPath;
    const sevzpath = sevenBin.path7za
    const myStream = Seven.extractFull(filepath, './', {
      $progress: true,
      $bin: sevzpath
    })

    myStream.on('progress', function (progress) {
      extractionBar.update(progress.percent);
    })

    // Stop progress bar and print message indicating extraction completion, then start the server
    myStream.on('end', function () {
      extractionBar.stop();
      console.log(`\n\nExtracted update to ./`);
      const filepathd = `./${fileName}`
      const startserverbat = `./StartServer.bat`
      fs.unlink(filepathd, (err) => {
        if (err) throw err;
      });
      fs.unlink(startserverbat, (err) => {
        if (err) throw err;
      });
    })
  }
}
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

module.exports ; checkForUpdates