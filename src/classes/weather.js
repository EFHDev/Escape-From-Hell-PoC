"use strict";

function generate() {
  let output = {};

  // set weather
  if (global._database.gameplay.location.forceWeatherEnabled) {
    output = global._database.weather[global._database.gameplay.location.forceWeatherId];
  } else {
    output = global._database.weather[utility.getRandomInt(0, global._database.weather.length - 1)];
  }

  // replace date and time
  if (global._database.gameplay.location.realTimeEnabled) {
    // Apply acceleration to time computation.
    let timeInSeconds = new Date().getTime() / 1000; // date in seconds
    let deltaSeconds = utility.getServerUptimeInSeconds() * output.acceleration;

    let newDateInSeconds = timeInSeconds + deltaSeconds;

    let newDateObj = new Date(newDateInSeconds * 1000);

    let time = utility.formatTime(newDateObj).replace("-", ":").replace("-", ":");
    let date = utility.formatDate(newDateObj);
    let datetime = `${date} ${time}`;

    output.weather.timestamp = ~~ (newDateObj / 1000);
    output.weather.date = date;
    output.weather.time = datetime;
    output.date = date;
    output.time = time;
  }

  return output;
}

module.exports.generate = generate;
