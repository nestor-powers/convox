module.exports = function(robot) {
  robot.respond(/convox apps/, function(msg, done) {
    msg.reply("Fetching your apps from Convox");

    robot.http(process.env.CONVOX_GRID_URL + "/apps").
          header('Version', '20150911185301').
          auth('convox', process.env.CONVOX_GRID_PASSWORD).
          get()(function(err, resp, body) {
      if(resp.statusCode == 200) {
        apps = JSON.parse(body)
        for(var i in apps) {
          msg.send("* " + apps[i].name + ": " + apps[i].status);
        }
      } else {
        msg.reply("Oops, looks like there was an error")
      }
      done();
    });
  });
}
