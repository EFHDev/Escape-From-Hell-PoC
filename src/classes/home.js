function DetectInput(data, name) {
  if (data == "true" || data == "false" || data == true || data == false) {
    let SelectedOption = data === "true" || data === true;
    return (
      "<select name='" +
      name +
      "'>" +
      "<option value='true' " +
      (SelectedOption ? "selected" : "") +
      ">true</option>" +
      "<option value='false' " +
      (!SelectedOption ? "selected" : "") +
      ">false</option>" +
      "</select>"
    );
  }
  if (typeof data === "string") return "<input type='text' size='10' name='" + name + "' value='" + data + "'/>";
  if (typeof data === "number")
    if (data.toString().match(/[.]/)) return "<input type='number' step='0.001' size='10' name='" + name + "' value='" + data + "'/>";
    else return "<input type='number' size='10' name='" + name + "' value='" + data + "'/>";

  return data;
}
function PageHeader(content) {
  return (
    '<html><head><title>JustEmuTarkov</title><link rel="stylesheet" id="style" href="style.css" type="text/css" media="all"><style>h2{font-size:16px;padding:3px 0 0 10px;margin:0;} h3{font-size:14px;padding:3px 0 0 15px;margin:0;} p{font-size:12px;padding:3px 0 0 25px;margin:0;} body{color:#fff;background:#000} table{border-bottom:1px solid #aaa;} .right{text-align:right;}</style></head><body>' +
    content +
    "</body></html>"
  );
}
module.exports.RenderHomePage = () => {
  let html = "";
  html += `<div class="container">
	<div class="row">
		<div class="twelve columns">
			<h1>Version: ${server.getVersion()}</h1>
      <h1>Node: ${server.name}</h1>
      <h2>Why are you here.</h2>
		</div>
	</div>
	</div>`;
  html += `</div>`;
  html = PageHeader(html); // adds header and footer + some stypes etc.
  return html;
};
module.exports.RenderGameplayConfigPage = (url_return) => {

};
module.exports.RenderAccountsConfigPage = (url_return) => {

};
module.exports.RenderServerConfigPage = (url_return) => {
  return fileIO.stringify(server);
};
module.exports.RenderModsConfigPage = (url_return) => {

};
module.exports.renderPage = () => {

}

module.exports.processSaveServerData = (data, fileName) => {

};
module.exports.processSaveData = (data, fileName) => {

};
module.exports.processSaveAccountsData = (data, fileName) => {

};
