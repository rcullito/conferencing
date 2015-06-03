/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 13:23
 */

/**
 * @namespace Namespace for all AddLive tutorials definitions.
 */

(function (w) {
  'use strict';
  var ADLT = w.ADLT || {};

// IE shim - for IE 8+ the console object is defined only if the dev tools
// are acive
  if (!window.console) {
    window.console = {
      log:function () {
      },
      error:function () {
      },
      warn:function () {
      }
    };
  }


  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  ADLT.SCOPE_ID = 'RandomScope'; // Put your scope here;

  ADLT.APP_ID = getParameterByName('appId'); // Put your app Id here;

  ADLT.API_KEY = getParameterByName('apiKey');;

  function _nop() {
  }


  /**
   * @const
   * @type {String}
   */
  ADLT.PLUGIN_CONTAINER_ID = 'pluginContainer';


  ADLT.initAddLiveLogging = function () {
    ADL.initLogging(function (lev, msg) {
      switch (lev) {
        case ADL.LogLevel.DEBUG:
          console.log('[ADL] ' + msg);
          break;
        case ADL.LogLevel.WARN:
          console.warn('[ADL] ' + msg);
          break;
        case ADL.LogLevel.ERROR:
          console.error('[ADL] ' + msg);
          break;
        case ADL.LogLevel.INFO:
          console.log('[ADL] ' + msg);
          break;
        default:
          console.warn('Got unsupported log level: ' + lev + '. Message: ' +
              msg);
      }
    }, true);
  };

  /**
   * Initializes the AddLive SDK.
   */
  ADLT.initializeAddLiveQuick = function (completeHandler, options) {
    ADLT.initAddLiveLogging();
    console.log('Initializing the AddLive SDK');
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization progress changes - just in case
    // the page has #initProgressBar progressbar
    initListener.onInitProgressChanged = function (e) {
      console.log('Platform init progress: ' + e.progress);
      var $pBar = $('#initProgressBar');
      if($pBar.length) {
        $('#initProgressBar').progressbar('value', e.progress);
      }
    };

    initListener.onInitStateChanged = function (e) {
      switch (e.state) {
        case ADL.InitState.ERROR:
          console.error('Failed to initialize the AddLive SDK');
          var msg = e.errMessage + ' (' + e.errCode + ')';
          console.error('Reason: ' + msg);
          window.alert('There was an error initialising the media plug-in: ' +
              msg + ' Please reinstall it.');
          break;
        case ADL.InitState.INITIALIZED:
          completeHandler();
          break;
        case ADL.InitState.DEVICES_INIT_BEGIN:
          console.log('Devices initialization started');
          break;
        case ADL.InitState.INSTALLATION_REQUIRED:
          console.log('AddLive Plug-in installation required');
          $('#installBtn').
              attr('href', e.installerURL).
              css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          console.log('AddLive Plug-in installation complete');
          $('#installBtn').hide();
          break;
        case ADL.InitState.BROWSER_RESTART_REQUIRED:
          // This state indicates that AddLive SDK performed auto-update and in
          // order to accomplish this process, browser needs to be restarted.
          console.log('Please restart your browser in order to complete platform auto-update');
          break;


        default:
          console.warn('Got unsupported init state: ' + e.state);
      }
    };
    ADL.initPlatform(initListener, options);
  };


  ADLT.initDevicesSelects = function () {
    $('#camSelect').change(ADLT.getDevChangedHandler('VideoCapture'));
    $('#micSelect').change(ADLT.getDevChangedHandler('AudioCapture'));
    $('#spkSelect').change(ADLT.getDevChangedHandler('AudioOutput'));
  };

  ADLT.getDevChangedHandler = function (devType) {
    return function () {
      var selectedDev = $(this).val();
      ADL.getService()['set' + devType + 'Device'](
          ADL.createResponder(),
          selectedDev);
    };
  };

  /**
   * Fills the selects with the currently plugged in devices.
   */
  ADLT.populateDevicesQuick = function () {
    ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
    ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
  };

  /**
   * Fills the audio output devices select.
   */
  ADLT.populateDevicesOfType = function (selectSelector, devType) {
    var devsResultHandler = function (devs) {
      var $select = $(selectSelector);
      $select.empty();
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });
      var getDeviceHandler = function (device) {
        $select.val(device);
      };
      ADL.getService()['get' + devType + 'Device'](
          ADL.createResponder(getDeviceHandler));
    };
    ADL.getService()['get' + devType + 'DeviceNames'](
        ADL.createResponder(devsResultHandler));
  };

  ADLT.genRandomUserId = function () {
    return Math.floor(Math.random() * 10000);
  };

  ADLT.randomString = function (len, charSet) {
    charSet = charSet ||
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      str += charSet.substring(randomPoz, randomPoz + 1);
    }
    return str;
  };


  /**
   * Generates sample authentication details. For more info about authentication,
   * please refer to: http://www.addlive.com/docs.html#authentication
   */
  ADLT.genAuth = function (scopeId, userId) {

    // New Auth API
    var dateNow = new Date();
    var now = Math.floor((dateNow.getTime() / 1000));
    var authDetails = {
      // Token valid 5 mins
      expires:now + (5 * 60),
      userId:userId,
      salt:ADLT.randomString(100)
    };
    var signatureBody =
        ADLT.APP_ID +
            scopeId +
            userId +
            authDetails.salt +
            authDetails.expires +
            ADLT.API_KEY;
    authDetails.signature =
        w.CryptoJS.SHA256(signatureBody).toString(w.CryptoJS.enc.Hex).toUpperCase();
    return authDetails;
  };

  // Export the ADLT namespace
  w.ADLT = ADLT;

})(window);
