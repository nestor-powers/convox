var qs = require('qs');

module.exports = function(robot) {
  var convox = function(path) {
    return robot.http(process.env.NESTOR_CONVOX_GRID_URL + path).
                 header('Version', 'dev').
                 header('Content-Type', 'application/json').
                 auth('convox', process.env.NESTOR_CONVOX_GRID_PASSWORD)
  };

  robot.respond(/convox apps$/, function(msg, done) {
    msg.reply("Fetching your apps from Convox...").then(function() {
      convox("/apps").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var appsList = [];
          apps = JSON.parse(body)
          for(var i in apps) {
            appsList.push("* " + apps[i].name + ": " + apps[i].status);
          }
          msg.send(appsList, done);
        } else {
          msg.reply("Oops, looks like there was an error:" + body, done);
        }
      });
    });
  });

  robot.respond(/convox apps info (.*)$/, function(msg, done) {
    convox("/apps/" + msg.match[1]).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        var result = [];

        info = JSON.parse(body);
        result.push("Name: " + info.name);
        result.push("Release: " + info.release);
        result.push("Status: " + info.status);

        msg.send(result, done);
      }
    });
  });

  robot.respond(/convox builds (.*)$/, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Fetching builds for your app " + appName + " from Convox...").then(function() {
      convox("/apps" + appName + "/builds").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var buildsList = [];
          var builds = JSON.parse(body)
          for(var i in builds ) {
            var b = builds[i];
            buildsList.push("* ID:" + b.id + " Logs: " + b.logs + " Manifest: " + b.manifest + " Release: " + b.release + " Status: " + b.status + " Started At: " + b.started + " Ended At: " + b.ended);
          }
          msg.send(buildsList, done);
        } else {
          msg.reply("Oops, looks like there was an error fetching builds for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox builds (.*) build=(.*)$/, function(msg, done) {
    var appName = msg.match[1];
    var buildId = msg.match[2];

    msg.reply("Fetching build info for your app " + appName + " from Convox...").then(function() {
      convox("/apps" + appName + "/builds" + buildId).get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var b = JSON.parse(body);
          msg.send("* ID:" + b.id + " Logs: " + b.logs + " Manifest: " + b.manifest + " Release: " + b.release + " Status: " + b.status + " Started At: " + b.started + " Ended At: " + b.ended, done);
        } else {
          msg.reply("Oops, looks like there was an error fetching builds for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox builds create (.*) repo=(.*)$/, function(msg, done) {
    var appName = msg.match[1];
    var repo = msg.match[2];

    msg.reply("Creating build for your app " + appName).then(function() {
      convox("/apps" + appName + "/builds?" + qs.stringify({repo: repo})).post()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var b = JSON.parse(body);
          msg.send("* Created build ID:" + b.id + " Logs: " + b.logs + " Manifest: " + b.manifest + " Release: " + b.release + " Status: " + b.status + " Started At: " + b.started + " Ended At: " + b.ended, done);
        } else {
          msg.reply("Oops, looks like there was an error creating build for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox apps env (.*)$/, function(msg, done) {
    var name = msg.match[1];

    convox("/apps/" + name + "/environment").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        msg.send(body, done);
      }
    });
  });

  robot.respond(/convox apps delete (.*)$/, function(msg, done) {
    var name = msg.match[1];

    convox("/apps/" + name).delete()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        var result = [];
        info = JSON.parse(body);
        if(info.success == true) {
          msg.reply("App " + name + " was successfully deleted", done);
        } else {
          msg.reply("There was an error deleting app " + name, done);
        }
      }
    });
  });

  robot.respond(/convox apps create (.*)$/, function(msg, done) {
    var name = msg.match[1];

    msg.reply("Creating app " + name + "...").then(function() {
      convox("/apps?" + qs.stringify({name: name})).post()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          msg.reply("Started creating the app " + name, done);
        } else {
          error = JSON.parse(body)['error'];
          msg.reply("Oops, looks like there was an error creating your app: " + error, done);
        }
      });
    });
  });

  robot.respond(/convox formation (.*)$/, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/formation").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching formation for your app: " + name, done);
      } else {
        var formationList = [];
        var formations = JSON.parse(body);
        for(var i in formations) {
          var f = formations[i];
          formationList.push("* Balancer: " + f.balancer + " Name: " + f.name + " Count: " + f.count + " Ports: " + f.ports.join(','));
        }

        msg.send(formationList, done);
      }
    });
  });

  robot.respond(/convox formation update (\w+) process=(\w+)\s*(?:count=(\d+))*\s*(?:memory=(\d+))*/i, function(msg, done) {
    var appName = msg.match[1];
    var processId = msg.match[2];
    var count = msg.match[3];
    var memory = msg.match[4];

    var params = {};
    if(count) { params.count = count; }
    if(memory) { params.memory = memory; }

    if(params.length == 0) {
      msg.reply("You must specify either a count or memory to update the formation with", done);
    } else {
      convox("/apps" + appName + "/formation/" + processId + "?" + qs.stringify(params)).post()(function(err, resp, body) {
        if(resp.statusCode != 200) {
          msg.reply("Oops, looks like there was an error updating formation for your app: " + appName, done);
        } else {
          msg.reply("Successfully updated the formation for your process " + processId + " for app: " + appName, done);
        }
      });
    }
  });

  robot.respond(/convox processes (.*)$/, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/processes").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching processes for your app: " + name, done);
      } else {
        var processesList = [];
        var processes = JSON.parse(body);
        for(var i in processes) {
          var proc = processes[i];
          processesList.push("* ID: " + proc.id + " Name: " + proc.name + " Command: " + proc.command + " Host: " + proc.host +
                             " Memory: " + proc.memory + " CPU: " + proc.cpu + " Image: " + proc.image + " Ports: " + proc.ports.join(', ') +
                             "Release: " + proc.release);
        }

        msg.send(processesList, done);
      }
    });
  });

  robot.respond(/convox processes delete (.*) process=(.*)$/, function(msg, done) {
    var appName = msg.match[1];
    var processId = msg.match[2];

    convox("/apps" + appName + "/processes" + processId).delete()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching deleting process" + processId + " for your app: " + appName, done);
      } else {
        var info = JSON.parse(body);
        if(info.success) {
          msg.send("Successfully deleted process " + processId, done);
        } else {
          msg.send("There was an error deleting process " + processId, done);
        }
      }
    });
  });

  robot.respond(/convox processes info (.*) process=(.*)$/, function(msg, done) {
    var appName = msg.match[1];
    var processId = msg.match[2];

    convox("/apps" + appName + "/processes" + processId).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching info about process" + processId + " for your app: " + appName, done);
      } else {
        var proc = JSON.parse(body);

        msg.reply("* ID: " + proc.id + " Name: " + proc.name + " Command: " + proc.command + " Host: " + proc.host +
                  " Memory: " + proc.memory + " CPU: " + proc.cpu + " Image: " + proc.image + " Ports: " + proc.ports.join(', ') +
                  "Release: " + proc.release, done);
      }
    });
  });

  robot.respond(/convox processes run (.*) process=(.*)$/, function(msg, done) {
    var appName = msg.match[1];
    var processId = msg.match[2];

    convox("/apps" + appName + "/processes" + processId + "/run").post()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching info about process" + processId + " for your app: " + appName, done);
      } else {
        var info = JSON.parse(body);
        if(info.success) {
          msg.send("Successfully ran process " + processId, done);
        } else {
          msg.send("There was an error running process " + processId, done);
        }
      }
    });
  });

  robot.respond(/convox releases (.*)$/i, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/releases").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var releasesList = [];
        var releases = JSON.parse(body);
        for(var i in releases) {
          var rel = releases[i];
          releasesList.push("* ID: " + rel.id + " Build: " + rel.build + " Env: " + rel.env + " Manifest: " + rel.manifest + " Created: " + rel.created);
        }

        msg.send(releasesList, done);
      }
    });
  });

  robot.respond(/convox releases (.*) release=(.*)$/i, function(msg, done) {
    var appName = msg.match[1];
    var releaseId = msg.match[2];

    convox("/apps" + appName + "/releases" + releaseId).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var rel= JSON.parse(body);
        msg.reply("* ID: " + rel.id + " Build: " + rel.build + " Env: " + rel.env + " Manifest: " + rel.manifest + " Created: " + rel.created, done);
      }
    });
  });

  robot.respond(/convox releases promote (.*) release=(.*)$/i, function(msg, done) {
    var appName = msg.match[1];
    var releaseId = msg.match[2];

    convox("/apps" + appName + "/releases" + releaseId + "/promote").post()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var rel= JSON.parse(body);
        msg.reply("* Promoted Release ID: " + rel.id + " Build: " + rel.build + " Env: " + rel.env + " Manifest: " + rel.manifest + " Created: " + rel.created, done);
      }
    });
  });

  robot.respond(/convox instances$/, function(msg, done) {
    msg.reply("Fetching your instances on Convox...").then(function() {
      convox("/instances").get()(function(err, resp, body) {
        if(resp.statusCode != 200) {
          error = JSON.parse(body)['error'];
          msg.reply("Oops, looks like there was an error: " + error, done);
        } else {
          var instancesList = [];
          var instances = JSON.parse(body);
          for(var i in instances) {
            var inst = instances[i];
            instancesList.push("* ID: " + inst.id + " Memory: " + inst.memory + " Processes: " + inst.processes + " Status: " + inst.status + " IP: " + inst.ip + " Agent: " + inst.agent + " Started: " + inst.started);
          }

          msg.send(instancesList, done);
        }
      });
    });
  });

  robot.respond(/convox instances keyroll$/, function(msg, done) {
    msg.reply("Regenerating and storing EC2 Key Pairs on your instances...").then(function() {
      convox("/instances/keyroll").post()(function(err, resp, body) {
        if(resp.statusCode != 200) {
          error = JSON.parse(body)['error'];
          msg.reply("Oops, looks like there was an error: " + error, done);
        } else {
          var info = JSON.parse(body);
          if(info.success) {
            msg.send("Started the process of regenerating and storing EC2 Key Pairs on your instances", done);
          } else {
            msg.send("There was an error doing a keyroll on your instances", done);
          }
        }
      });
    });
  });

  robot.respond(/convox instances delete (.*)$/, function(msg, done) {
    var instanceId = msg.match[1];

    msg.reply("Deleting instance" + instanceId + "...").then(function() {
      convox("/instances/" + instanceId).delete()(function(err, resp, body) {
        if(resp.statusCode != 200) {
          error = JSON.parse(body)['error'];
          msg.reply("Oops, looks like there was an error: " + error, done);
        } else {
          var info = JSON.parse(body);
          if(info.success) {
            msg.send("Successfully deleted instance " + instanceId, done);
          } else {
            msg.send("There was an error deleting instance" + instanceId, done);
          }
        }
      });
    });
  });

  robot.respond(/convox services$/, function(msg, done) {
    msg.reply("Fetching your services on Convox...").then(function() {
      convox("/services").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          services = JSON.parse(body);
          if(services.length == 0) {
            msg.send("You haven't created any services on Convox yet. Create one with `convox services create (redis|postgres|mysql)`", done);
          } else {
            var servicesList = [];
            for(var i in services) {
              servicesList.push("* " + services[i].name + ", Status: " + services[i].status + ", URL: " + services[i].url);
            }
            msg.send(servicesList, done);
          }
        }
      });
    });
  });

  var random = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  robot.respond(/convox services create (mysql|postgres|redis)\s*(.*?)$/, function(msg, done) {
    var type = msg.match[1];
    var name = msg.match[2];
    if(!name || name == "") {
      name = type + "-" + random(0, 1000);
    }

    var params = qs.stringify({type: type, name: name});

    convox("/services?" + params).post()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        info = JSON.parse(body);
        msg.reply("Started creating the service " + info.name, done);
      }
    });
  });

  robot.respond(/convox services info (.*)$/, function(msg, done) {
    convox("/services/" + msg.match[1]).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        var result = [];

        info = JSON.parse(body);
        result.push("Name: " + info.name);
        result.push("Status: " + info.status);
        result.push("URL: " + info.url);

        msg.send(result, done);
      }
    });
  });

  robot.respond(/convox services delete (.*)$/, function(msg, done) {
    var name = msg.match[1];

    convox("/services/" + name).delete()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        msg.reply("Service " + name + " deletion has started", done);
      }
    });
  });

  robot.respond(/convox services link create (.*?) app=(.*)$/i, function(msg, done) {
    var serviceName = msg.match[1];
    var appName = msg.match[2];

    convox("/services/" + serviceName + "/links?" + qs.stringify({app: appName})).post()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        var info = JSON.parse(body);
        msg.reply(info, done);
      }
    });
  });

  robot.respond(/convox services link delete (.*?) app=(.*)$/i, function(msg, done) {
    var serviceName = msg.match[1];
    var appName = msg.match[2];

    convox("/services/" + serviceName + "/links/" + appName).delete()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        msg.reply("Service " + serviceName + " link deletion has started from " + appName, done);
      }
    });
  });

  robot.respond(/convox system$/, function(msg, done) {
    convox("/system").get()(function(err, resp, body) {
      if(resp.statusCode == 200) {
        info = JSON.parse(body);
        msg.reply("convox system status: " + info.status + " type: " + info.type + " version: " + info.version, done);
      }
    });
  });
}
