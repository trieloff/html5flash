//from http://ejohn.org/blog/simple-javascript-inheritance/
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
    
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
    
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" && 
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
            
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
            
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
            
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
    
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
    
    // Populate our constructed prototype object
    Class.prototype = prototype;
    
    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;
    
    return Class;
  };
})();

//considered for removal in HTML5
var TimeRanges = Class.extend({
    //readonly
    length: 0,
    start: function(index) {
      return this.starts[index];
    },
    end: function(index) {
      return this.ends[index];
    },
    //private
    starts: [],
    ends: [],
    add: function(start, end) {
      this.starts.push(start);
      this.ends.push(end);
      this.length++;
    }
});

var MediaError = Class.extend({
    //readonly
    code: -1,
    init: function(code) {
      this.code = code;
    },
    
    MEDIA_ERR_ABORTED: 1,
    MEDIA_ERR_NETWORK: 2,
    MEDIA_ERR_DECODE:3,
    MEDIA_ERR_SRC_NOT_SUPPORTED: 4
});

var HTMLMediaElement = Class.extend({
  //network state
  NETWORK_EMPTY: 0,
  NETWORK_IDLE: 1,
  NETWORK_LOADING: 2,
  NETWORK_LOADED: 3,
  NETWORK_NO_SOURCE: 4,
  
  //ready state
  HAVE_NOTHING: 0,
  HAVE_METADATA: 1,
  HAVE_CURRENT_DATA: 2,
  HAVE_FUTURE_DATA: 3,
  HAVE_ENOUGH_DATA: 4,
  
  // error state
  //readonly attribute MediaError error;
  error: 0,
  
  //attribute DOMString src;
  src: null,
  //readonly attribute currentSrc
  currentSrc: null,
  //readonly attribute unsigned short networkState
  networkState: this.NETWORK_EMPTY,
  //attribute boolean autobuffer
  autobuffer: false,
  //readonly attribute TimeRanges buffered
  buffered: null,
  //readonly attribute
  readyState: this.HAVE_NOTHING,
  seeking: false,
  
  //playback state (floats)
  currentTime: 0.0,
  //readonly
  startTime: 0.0,
  //readonly
  duration: 0.0,
  paused: false,
  defaultPlaybackRate: 1.0,
  playbackRate: 1.0,
  //TimeRanges - readonly
  played: new TimeRanges(),
  seekable: new TimeRanges(),
  ended: false,
  autoplay: false,
  loop: false,
  controls: false,
  volume: 1,
  muted: false,
  listeners: {},
  
  init: function(element) {
    this.domElement = element;
    this.src = this.domElement.getAttribute("src");
    this.autobuffer = (this.domElement.getAttribute("autobuffer")!=null);
    this.autoplay = (this.domElement.getAttribute("autoplay")!=null);
    this.loop = (this.domElement.getAttribute("loop")!=null);
    this.controls = (this.domElement.getAttribute("controls")!=null);
    this.load();
  },
  
  //returns void
  load: function() {
    this.currentSrc = this.src;
    //find the right source
    var candidate = this.domElement.firstChild;
    var maybe = null;
    //loop until we have found a type that works probably
    while(candidate!=null&&this.currentSrc==null) {
      if (candidate.nodeName=="SOURCE"||candidate.nodeName=="source") {
        if (candidate.getAttribute("src")!=null) {
          if (this.canPlayType(candidate.getAttribute("type"))=="probably") {
            this.currentSrc = candidate.getAttribute("src");
          } else if (maybe==null&&this.canPlayType(candidate.getAttribute("type"))=="maybe") {
            maybe = candidate.getAttribute("src");
          }
        }
      }
      candidate = candidate.nextSibling;
    }
    //fall back to the first type that works maybe
    if (this.currentSrc==null&&maybe!=null) {
      this.currentSrc = maybe;
    }
    if (this.currentSrc==null) {
      //media selection failed
      this.error = new MediaError(MediaError.prototype.MEDIA_ERR_SRC_NOT_SUPPORTED);
    }
    //override this in concrete implementations to build the widget
  },
  
  //returns String
  canPlayType: function(type) {
    return "no";
  },
  
  play: function() {
    //TODO
    //purely abstract
  },
  
  pause: function() {
    //TODO
    //purely abstract
  },
  
  addEventListener: function(type, listener, useCapture) {
    if (this.listeners[type]) {
      this.listeners[type].push(listener);
    } else {
      this.listeners[type] = [ listener ];
    }
  },
  
  removeEventListener: function(type, listener, useCapture) {
    var newarray = [];
    if (this.listeners[type]) {
      var oldarray = this.listeners[type];
      for (var i=0;i<oldarray.length;i++) {
        if (oldarray[i]!=listener) {
          newarray.push(oldarray[i]);
        }
      }
    }
    this.listeners[type] = newarray;
  },
  
  throwEvent: function(type) {
    var that = this;
    var e = {
      type: type,
      target: that,
      currentTarget: that,
      eventPhase: 2,
      bubbles: false,
      cancelable: false,
      timeStamp: new Date(),
      stopPropagation: function() {},
      preventDefault: function() {},
      initEvent: function() {}
    };
    
    if (this.listeners[type]) {
      for (var i=0;i<this.listeners[type].length;i++) {
        var listener = this.listeners[type][i];
        try {
          listener.call(this, e);
        } catch (t) {/*go through all event listeners*/}
      }
    }
  }
  
  //returns void
  //className, id - String
  //start, end - float
  //pauseOnExit - boolean
  //enterCallback, exitCallback - function
  addCueRange: function(className, id, start, end, pauseOnExit, enterCallback, exitCallback) {
    if (!this.cueRanges[className]||this.cueRanges[className]==null) {
      this.cueRanges[className] = [];
    }
    
    var cueRange = {
      start: start,
      end: end,
      pauseOnExit: pauseOnExit,
      enterCallback: enterCallback,
      exitCallback: exitCallback,
    };
    this.cueRanges[className].push(cueRange);
  },
  
  removeCueRange: function(className) {
    //reset cue ranges
    cueRanges[className] = [];
  },
  
  //private
  cueRanges: {},
  lastPosition: 0.0,
  
  checkCueRanges: function(currentPosition) {
    try {
      var entering = new Array();
      var exititing = new Array();
      for (className in this.cueRanges) {
        if (this.cueRanges.hasOwnProperty(className)) {
          var cues = this.cueRanges[className];
          for (var i=0;i<cues.length;i++) {
            var cue = cues[i];
            if (currentPosition>this.lastPosition) {
              if (cue.start>this.lastPosition&&cue.start<currentPosition) {
                entering.push(cue);
              }
              if (cue.end>this.lastPosition&&cue.end<currentPosition) {
                exititing.push(cue);
              }
            } else if (currentPosition<this.lastPosition) {
              if (cue.end>this.lastPosition&&cue.end<currentPosition) {
                entering.push(cue);
              }
              if (cue.start>this.lastPosition&&cue.start<currentPosition) {
                exititing.push(cue);
              }
            }
          }
        }
      }
      
      //call the entering events
      for (var i=0;i<entering.length;i++) {
        if (entering[i].enterCallback) {
          entering[i].enterCallback.call(this, entering[i].id);
        }
      }
      //call the exiting events
      for (var i=0;i<exititing.length;i++) {
        if (exititing[i].exitCallback) {
          exititing[i].exitCallback.call(this, exititing[i].id);
        }
        if (exititing[i].pauseOnExit) {
          this.pause();
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.lastPosition = currentPosition;
  }
});

var HTMLVideoElement = HTMLMediaElement.extend({
    width: "0px",
    height: "0px",
    videoWidth: 0,
    videoHeight: 0,
    //poster frame
    poster: null,
    
    init: function(element) {
      this._super(element);
      this.height = this.domElement.getAttribute("height");
      this.width = this.domElement.getAttribute("width");
      this.poster = this.domElement.getAttribute("poster");
    }
});

var HTMLAudioElement = HTMLMediaElement.extend({
    id: "id" + (new Date().getTime()),
    sound: null,
    
    //no additional properties
    init: function(element) {
      this._super(element);
      
      if (this.domElement.getAttribute("id")) {
        this.id = this.domElement.getAttribute("id");
      }
      
      var that = this;
      
      this.sound = soundManager.createSound({
          id: that.id,
          url: that.currentSrc,
          autoLoad: that.autobuffer,
          autoPlay: that.autoplay,
          whileloading: that.whileloading,
          onid3: that.onid3
      });
      
      this.trowEvent("loadstart");
      
      this.sound.wrapper = this;
    },
    
    onfinish: function(e) {
      if (this.wrapper.loop) {
        this.wrapper.play();
      } else {
        this.wrapper.ended = true;
      }
    },
    
    onid3: function() {
      this.wrapper.HAVE_METADATA;
    },
    
    whileloading: function() {
      if (this.readyState==3) {
        this.wrapper.networkState = this.wrapper.NETWORK_LOADED;
        this.wrapper.duration = this.duration / 1000;
        this.wrapper.readyState = this.wrapper.HAVE_ENOUGH_DATA;
        this.wrapper.updateSeekable(this.duration / 1000);
        this.wrapper.throwEvent("load");
      } else if (this.readyState==2) {
        //error
        this.wrapper.networkState = this.wrapper.NETWORK_NO_SOURCE;
        this.wrapper.throwEvent("error");
      } else if (this.readyState==1) {
        //loading
        this.wrapper.networkState = this.wrapper.NETWORK_LOADING;
        this.wrapper.duration = this.durationEstimate;
        if (this.duration==this.position) {
          this.wrapper.readyState = this.wrapper.HAVE_CURRENT_DATA;
          this.wrapper.throwEvent("stalled");
        } else if (this.duration>this.position) {
          this.wrapper.readyState = this.wrapper.HAVE_FUTURE_DATA;
          this.wrapper.throwEvent("progress");
        }
        this.wrapper.updateSeekable(this.duration / 1000);
      } else if (this.readyState==0) {
        //uninitialized
        this.wrapper.networkState = this.wrapper.NETWORK_EMPTY;
      }
    },
    
    onload: function(success) {
      if (success) {
        this.wrapper.networkState = this.wrapper.NETWORK_LOADED;
        this.wrapper.readyState = this.wrapper.HAVE_ENOUGH_DATA;
        this.wrapper.duration = this.duration;
        this.wrapper.throwEvent("load");
      } else {
        this.wrapper.readyState = this.wrapper.HAVE_NOTHING;
        this.wrapper.networkState = this.wrapper.NETWORK_NO_SOURCE;
        this.wrapper.error = new MediaError(MediaError.prototype.NETWORK);
        this.wrapper.throwEvent("error");
      }
    },
    
    whileplaying: function() {
      this.wrapper.currentTime = this.position / 1000;
      this.wrapper.checkCueRanges(this.position / 1000);
      this.wrapper.updatePlayed(this.position / 1000);
    },
    
    //updates the played time range
    updatePlayed: function(currentTime) {
      if (this.played.length==0) {
        //create a new time range
        this.played.add(this.startTime, currentTime);
      } else {
        //extend the last time range
        this.played.ends[this.played.length-1] = currentTime;
      }
    },
    
    //updates the played time range
    updateSeekable: function(currentTime) {
      if (this.seekable.length==0) {
        //create a new time range
        this.seekable.add(this.startTime, currentTime);
      } else {
        //extend the last time range
        this.seekable.ends[this.seekable.length-1] = currentTime;
      }
    },
    
    play: function() {
      if (this.muted) {
        this.sound.setVolume(0);
      } else {
        this.sound.setVolume(Math.floor(100*Math.max(0, Math.min(1,this.volume))));
      }
      
      if (this.sound.playState==1) {
        this.sound.position = Math.floor(this.currentTime * 1000);
        this.sound.resume();
      } else {
        var that = this;
        this.sound.wrapper = this;
        this.sound.play({
            onfinish: that.onfinish,
            whileplaying: that.whileplaying,
            position: Math.floor(that.startTime * 1000),
            whileloading: that.whileloading,
            onid3: that.onid3
        });
      }
    },
    
    pause: function() {
      this.sound.pause();
    },
    
    canPlayType: function(type) {
      if (type.match(/^audio\/mp3/)) {
        return "probably";
      }
      if (type.match(/^audio\/wav/)) {
        return "probably";
      }
      if (type.match(/^audio\/(x-)?aiff/)) {
        return "probably";
      }
      if (type.match(/^audio\//)) {
        return "maybe";
      }
      return "no";
    }
});

function getHTML5Tags() {
  var audios = document.getElementsByTagName("audio");
  var videos = document.getElementsByTagName("video");
  var html5tags = [];
  for (var i=0;i<audios.length;i++) {
    if (audios[i].play) {
      html5tags.push(audios[i]);
    }
    html5tags.push(new HTMLAudioElement(audios[i]));
  }
  
  for (var i=0;i<videos.length;i++) {
    if (videos[i].play) {
      html5tags.push(videos[i]);
    }
    html5tags.push(new HTMLVideoElement(videos[i]));
  }
  return html5tags;
}
