const config = require("../../user/configs/server_base.json");

let highcontrast;
if (config.highcontrastconsole === true) {
  highcontrast = 1;
} else {
  highcontrast = 0;
}

if (highcontrast === 1) {
  module.exports = {
    colors: {
      blue: "6CA4BC",
      yellow: "F2CA19",
      green: "87E911",
      red: "E11845",
      pink: "FF00BD",
      purple: "8931EF"
    }
  };
} else {
  module.exports = {
    colors: {
      blue: "0000FF",
      yellow: "E0E200",
      green: "008000",
      red: "BB0000",
      pink: "FFC0CB",
      purple: "8931EF"
    }
  };
}