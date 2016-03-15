var qs = require('qs');
var moment = require('moment');

module.exports = function(robot) {
  var convox = function(path) {
    return robot.http(process.env.NESTOR_CONVOX_GRID_URL + path).
                 header('Version', 'dev').
                 header('Content-Type', 'application/json').
                 auth('convox', process.env.NESTOR_CONVOX_GRID_PASSWORD)
  };

  robot.respond(/convox apps$/, { suggestions: ["convox apps"] }, function(msg, done) {
    msg.reply("Fetching your apps from Convox...").then(function() {
      convox("/apps").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var appsList = [];
          apps = JSON.parse(body)
          for(var i in apps) {
            appsList.push(msg.newRichResponse({
              title: apps[i].name,
              fields: [
                {
                  'title': 'Status',
                  'value': apps[i].status,
                  'short': true
                },
                {
                  'title': 'Release',
                  'value': apps[i].release,
                  'short': true
                }
              ]
            }));
          }

          msg.send(appsList, done);
        } else {
          msg.reply("Oops, looks like there was an error:" + body, done);
        }
      });
    });
  });

  robot.respond(/convox apps info (.*)$/, { suggestions: ["convox apps info <app-name>"] }, function(msg, done) {
    convox("/apps/" + msg.match[1]).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        info = JSON.parse(body);

        msg.send(msg.newRichResponse({
          title: info.name,
          fields: [
            {
              'title': 'Status',
              'value': info.status,
              'short': true
            },
            {
              'title': 'Release',
              'value': info.release,
              'short': true
            }
          ]
        }), done);
      }
    });
  });

  robot.respond(/convox builds (.*)$/, { suggestions: ["convox builds <app-name>"] }, function(msg, done) {
    var appName = msg.match[1];

    msg.reply("Fetching builds for your app " + appName + " from Convox...").then(function() {
      convox("/apps" + appName + "/builds").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var buildsList = [];
          var builds = JSON.parse(body)
          for(var i in builds ) {
            var b = builds[i];
            buildsList.push(msg.newRichResponse({
              title: "Build " + b.id,
              fields: [
                {
                  'title': 'Logs',
                  'value': b.logs,
                  'short': true
                },
                {
                  'title': 'Manifest',
                  'value': b.manifest,
                  'short': true
                },
                {
                  'title': 'Release',
                  'value': b.release,
                  'short': true
                },
                {
                  'title': 'Status',
                  'value': b.status,
                  'short': true
                },
                {
                  'title': 'Started',
                  'value': moment(b.started).fromNow(),
                  'short': true
                },
                {
                  'title': 'Ended',
                  'value': moment(b.ended).fromNow(),
                  'short': true
                }
              ]
            }));
          }
          msg.send(buildsList, done);
        } else {
          msg.reply("Oops, looks like there was an error fetching builds for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox builds (.*) build=(.*)$/, { suggestions: ["convox builds <app-name> build=<buildId>"] }, function(msg, done) {
    var appName = msg.match[1];
    var buildId = msg.match[2];

    msg.reply("Fetching build info for your app " + appName + " from Convox...").then(function() {
      convox("/apps" + appName + "/builds" + buildId).get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var b = JSON.parse(body);
          msg.send(msg.newRichResponse({
            title: "Build " + b.id,
            fields: [
              {
                'title': 'Logs',
                'value': b.logs,
                'short': true
              },
              {
                'title': 'Manifest',
                'value': b.manifest,
                'short': true
              },
              {
                'title': 'Release',
                'value': b.release,
                'short': true
              },
              {
                'title': 'Status',
                'value': b.status,
                'short': true
              },
              {
                'title': 'Started',
                'value': moment(b.started).fromNow(),
                'short': true
              },
              {
                'title': 'Ended',
                'value': moment(b.ended).fromNow(),
                'short': true
              }
            ]
          }), done);
        } else {
          msg.reply("Oops, looks like there was an error fetching builds for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox builds create (.*) repo=(.*)$/, { suggestions: ["convox builds create <app-name> repo=<repo-name>"] }, function(msg, done) {
    var appName = msg.match[1];
    var repo = msg.match[2];

    msg.reply("Creating build for your app " + appName).then(function() {
      convox("/apps" + appName + "/builds?" + qs.stringify({repo: repo})).post()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          var b = JSON.parse(body);
          msg.send(msg.newRichResponse({
            title: "Created Build " + b.id,
            fields: [
              {
                'title': 'Logs',
                'value': b.logs,
                'short': true
              },
              {
                'title': 'Manifest',
                'value': b.manifest,
                'short': true
              },
              {
                'title': 'Release',
                'value': b.release,
                'short': true
              },
              {
                'title': 'Status',
                'value': b.status,
                'short': true
              },
              {
                'title': 'Started',
                'value': moment(b.started).fromNow(),
                'short': true
              },
              {
                'title': 'Ended',
                'value': moment(b.ended).fromNow(),
                'short': true
              }
            ]
          }), done);
        } else {
          msg.reply("Oops, looks like there was an error creating build for your app: " + appName, done);
        }
      });
    });
  });

  robot.respond(/convox apps env (.*)$/, { suggestions: ["convox apps env <app-name>"] }, function(msg, done) {
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

  robot.respond(/convox apps delete (.*)$/, { suggestions: ["convox apps delete <app-name>"] }, function(msg, done) {
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

  robot.respond(/convox apps create (.*)$/, { suggestions: ["convox apps create <app-name>"] }, function(msg, done) {
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

  robot.respond(/convox formation (.*)$/, { suggestions: ["convox formation <app-name>"] }, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/formation").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching formation for your app: " + name, done);
      } else {
        var formationList = [];
        var formations = JSON.parse(body);
        for(var i in formations) {
          var f = formations[i];
          formationList.push(msg.newRichResponse({
            title: f.name,
            fields: [
              {
                'title': 'Balancer',
                'value': f.balancer,
                'short': true
              },
              {
                'title': 'Count',
                'value': f.count,
                'short': true
              },
              {
                'title': 'Ports',
                'value': f.ports.join(','),
                'short': true
              }
            ]
          }));
        }

        msg.send(formationList, done);
      }
    });
  });

  robot.respond(/convox formation update (\w+) process=(\w+)\s*(?:count=(\d+))*\s*(?:memory=(\d+))*/i, { suggestions: ["convox formation update <app-name> process=<process-id> [count=count] [memory=memory]"] }, function(msg, done) {
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

  robot.respond(/convox processes (.*)$/, { suggestions: ["convox processes <app-name>"] }, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/processes").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching processes for your app: " + name, done);
      } else {
        var processesList = [];
        var processes = JSON.parse(body);
        for(var i in processes) {
          var proc = processes[i];
          processesList.push(msg.newRichResponse({
            title: proc.name,
            fields: [
              {
                'title': 'ID',
                'value': proc.id,
                'short': true
              },
              {
                'title': 'Command',
                'value': "`" + proc.command + "`",
                'short': true
              }
            ]
          }));
        }

        msg.send(processesList, done);
      }
    });
  });

  robot.respond(/convox processes delete (.*) process=(.*)$/, { suggestions: ["convox processes delete <app-name> process=<process-id>"] }, function(msg, done) {
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

  robot.respond(/convox processes info (.*) process=(.*)$/, { suggestions: ["convox processes info <app-name> process=<process-id>"] }, function(msg, done) {
    var appName = msg.match[1];
    var processId = msg.match[2];

    convox("/apps" + appName + "/processes" + processId).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching info about process" + processId + " for your app: " + appName, done);
      } else {
        var proc = JSON.parse(body);

        msg.reply(msg.newRichResponse({
          title: proc.name,
          fields: [
            {
              'title': 'ID',
              'value': proc.id,
              'short': true
            },
            {
              'title': 'Command',
              'value': "`" + proc.command + "`",
              'short': true
            },
            {
              'title': 'Host',
              'value': proc.host,
              'short': true
            },
            {
              'title': 'Memory',
              'value': proc.memory,
              'short': true
            },
            {
              'title': 'CPU',
              'value': proc.cpu,
              'short': true
            },
            {
              'title': 'Image',
              'value': proc.image,
              'short': true
            },
            {
              'title': 'Ports',
              'value': proc.ports.join(','),
              'short': true
            },
            {
              'title': 'Release',
              'value': proc.release,
              'short': true
            }
          ]
        }), done);
      }
    });
  });

  robot.respond(/convox processes run (.*) process=(.*)$/, { suggestions: ["convox processes run <app-name> process=<process-id>"] }, function(msg, done) {
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

  robot.respond(/convox releases (.*)$/i, { suggestions: ["convox releases <app-name>"] }, function(msg, done) {
    var name = msg.match[1];

    convox("/apps" + name + "/releases").get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var releasesList = [];
        var releases = JSON.parse(body);
        for(var i in releases) {
          var rel = releases[i];
          releasesList.push(msg.newRichResponse({
            title: "Release " + rel.id,
            fields: [
              {
                'title': 'Build',
                'value': rel.build,
                'short': true
              },
              {
                'title': 'Environment',
                'value': rel.env,
                'short': true
              },
              {
                'title': 'Manifest',
                'value': ref.manifest,
                'short': true
              },
              {
                'title': 'Created',
                'value': moment(rel.created).fromNow(),
                'short': true
              }
            ]
          }));
        }

        msg.send(releasesList, done);
      }
    });
  });

  robot.respond(/convox releases (.*) release=(.*)$/i, { suggestions: ["convox releases <app-name> release=<release-id>"] }, function(msg, done) {
    var appName = msg.match[1];
    var releaseId = msg.match[2];

    convox("/apps" + appName + "/releases" + releaseId).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var rel= JSON.parse(body);
        msg.reply(msg.newRichResponse({
          title: "Release " + rel.id,
          fields: [
            {
              'title': 'Build',
              'value': rel.build,
              'short': true
            },
            {
              'title': 'Environment',
              'value': rel.env,
              'short': true
            },
            {
              'title': 'Manifest',
              'value': ref.manifest,
              'short': true
            },
            {
              'title': 'Created',
              'value': moment(rel.created).fromNow(),
              'short': true
            }
          ]
        }), done);
      }
    });
  });

  robot.respond(/convox releases promote (.*) release=(.*)$/i, { suggestions: ["convox releases promote <app-name> release=<release-id>"] }, function(msg, done) {
    var appName = msg.match[1];
    var releaseId = msg.match[2];

    convox("/apps" + appName + "/releases" + releaseId + "/promote").post()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        msg.reply("Oops, looks like there was an error fetching releases for your app: " + name, done);
      } else {
        var rel= JSON.parse(body);
        msg.reply(msg.newRichResponse({
          title: "Promoted Release " + rel.id,
          fields: [
            {
              'title': 'Build',
              'value': rel.build,
              'short': true
            },
            {
              'title': 'Environment',
              'value': rel.env,
              'short': true
            },
            {
              'title': 'Manifest',
              'value': ref.manifest,
              'short': true
            },
            {
              'title': 'Created',
              'value': moment(rel.created).fromNow(),
              'short': true
            }
          ]
        }), done);
      }
    });
  });

  robot.respond(/convox instances$/, { suggestions: ["convox instances"] }, function(msg, done) {
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
            instancesList.push(msg.newRichResponse({
              title: "Instance " + inst.id,
              fields: [
                {
                  'title': 'Memory',
                  'value': inst.memory,
                  'short': true
                },
                {
                  'title': 'Processes',
                  'value': inst.processes,
                  'short': true
                },
                {
                  'title': 'Status',
                  'value': inst.status,
                  'short': true
                },
                {
                  'title': 'IP',
                  'value': inst.ip,
                  'short': true
                },
                {
                  'title': 'Agent',
                  'value': inst.agent,
                  'short': true
                },
                {
                  'title': 'Started',
                  'value': moment(inst.started).fromNow(),
                  'short': true
                }
              ]
            }));
          }

          msg.send(instancesList, done);
        }
      });
    });
  });

  robot.respond(/convox instances keyroll$/, { suggestions: ["convox instances keyroll"] }, function(msg, done) {
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

  robot.respond(/convox instances delete (.*)$/, { suggestions: ["convox instances delete <instance-id>"] }, function(msg, done) {
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

  robot.respond(/convox services$/, { suggestions: ["convox services"] }, function(msg, done) {
    msg.reply("Fetching your services on Convox...").then(function() {
      convox("/services").get()(function(err, resp, body) {
        if(resp.statusCode == 200) {
          services = JSON.parse(body);
          if(services.length == 0) {
            msg.send("You haven't created any services on Convox yet. Create one with `convox services create (redis|postgres|mysql)`", done);
          } else {
            var servicesList = [];
            for(var i in services) {
              var service = services[i];
              servicesList.push(msg.newRichResponse({
                title: service.name,
                fields: [
                  {
                    'title': 'Status',
                    'value': service.status,
                    'short': true
                  },
                  {
                    'title': 'URL',
                    'value': service.url,
                    'short': true
                  }
                ]
              }));
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

  robot.respond(/convox services create (mysql|postgres|redis)\s*(.*?)$/, { suggestions: ["convox services create <mysql|postgres|redis>"] }, function(msg, done) {
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

  robot.respond(/convox services info (.*)$/, { suggestions: ["convox services info <service-id>"] }, function(msg, done) {
    convox("/services/" + msg.match[1]).get()(function(err, resp, body) {
      if(resp.statusCode != 200) {
        error = JSON.parse(body)['error'];
        msg.reply("Oops, looks like there was an error: " + error, done);
      } else {
        var result = [];

        service = JSON.parse(body);
        msg.send(msg.newRichResponse({
          title: service.name,
          fields: [
            {
              'title': 'Status',
              'value': service.status,
              'short': true
            },
            {
              'title': 'URL',
              'value': service.url,
              'short': true
            }
          ]
        }), done);
      }
    });
  });

  robot.respond(/convox services delete (.*)$/, { suggestions: ["convox services delete <service-id>"] }, function(msg, done) {
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

  robot.respond(/convox services link create (.*?) app=(.*)$/i, { suggestions: ["convox services link create <service-id> app=<app-name>"] }, function(msg, done) {
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

  robot.respond(/convox services link delete (.*?) app=(.*)$/i, { suggestions: ["convox services link delete <service-id> app=<app-name>"] }, function(msg, done) {
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

  robot.respond(/convox system$/, { suggestions: ["convox system"] }, function(msg, done) {
    convox("/system").get()(function(err, resp, body) {
      if(resp.statusCode == 200) {
        info = JSON.parse(body);
        msg.reply(msg.newRichResponse({
          title: 'System Status',
          fields: [
            {
              'title': 'Status',
              'value': info.status,
              'short': true
            },
            {
              'title': 'Type',
              'value': info.type,
              'short': true
            },
            {
              'title': 'Version',
              'value': info.version,
              'short': true
            }
          ]
        }), done);
      }
    });
  });
};
