/*
 * Breach [mod_strip] keyboard_shortcuts.js
 *
 * Copyright (c) 2014, Stanislas Polu. All rights reserved.
 *
 * @author: spolu
 *
 * @log:
 * - 2014-06-04 spolu  Move to `mod_layout` module
 * - 2014-01-23 spolu  Move to mod_stack module
 * - 2013-10-23 spolu  More complete/conventional set of shortcuts
 * - 2013-09-06 spolu  Fix #60 Added "recover-page"
 * - 2013-08-22 spolu  Creation
 */
var common = require('./common.js');

var events = require('events');
var async = require('async');
var breach = require('breach_module');

// ## keyboard_shortcuts
//
// Handles keyboard events coming globally, perform some analysis (release
// order, modifier release), and emit shortcut events.
// 
// ```
// @spec { }
// ```
var keyboard_shortcuts = function(spec, my) {
  var _super = {};
  my = my || {};
  spec = spec || {};

  my.last = null;
  my.can_commit = false;

  //
  // ### _public_
  //
  var init;                      /* init(cb_); */
  var kill;                      /* kill(cb_); */

  //
  // #### _private_
  // 
  var is_last;                   /* is_last(event); */
  var handler;                   /* handler(evt); */

  //
  // #### that
  //
  var that = new events.EventEmitter();

  /****************************************************************************/
  /* PRIVATE HELPERS */
  /****************************************************************************/
  // ### is_last
  //
  // Computes whether it is the same event as last event
  // ```
  // @event {object} the event to compare to `last`
  // ```
  is_last = function(event) {
    if(my.last &&
       my.last.type === event.type &&
       my.last.modifiers === event.modifiers &&
       my.last.keycode === event.keycode) {
      return true;
    }
    return false;
  };

  // ### handler
  // 
  // Handles the session exo_browser `frame_keyboard` event
  //
  // Events: 
  // - `type`:
  //  `` RawKeyDown = 7 ``
  //  `` KeyUp      = 9 ``
  //
  // - `modifier`:
  //  `` ShiftKey   = 1 << 0 ``
  //  `` ControlKey = 1 << 1 ``
  //  `` AltKey     = 1 << 2 ``
  //  `` MetaKey    = 1 << 3 ``
  //  `` IsLeft     = 1 << 11 ``
  //  `` IsRight    = 1 << 12 ``
  // ```
  // @event {object} keyboard event
  // ```
  handler = function(evt) {
    common.log.out(JSON.stringify(evt));
    
    var ControlKey = 17;

    var ShiftMod = (1 << 0);
    var ControlMod = (1 << 1);
    var AltMod = (1 << 2);
    var MetaMod = (1 << 3);

    if(process.platform == 'darwin'){
        ControlMod = MetaMod;
        ControlKey = 91;
    }

    var ShiftControlMod = ShiftMod | ControlMod;

    if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
       evt.keycode === 84 && !is_last(evt)) {
      /* Ctrl - Shift - T ; No Repetition */
      that.emit('recover');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       evt.keycode === 84) {
      /* Ctrl - T ; Repetition OK */
      that.emit('new');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       (evt.keycode === 76 || evt.keycode === 32) && !is_last(evt)) {
      /* Ctrl - L | Space ; No Repetition */
      that.emit('go');
    }
    else if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
       evt.keycode === 74 && !is_last(evt)) {
      /* Ctrl - Shift - J ; No Repetition */
      that.emit('back');
    }
    else if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
       evt.keycode === 75 && !is_last(evt)) {
      /* Ctrl - Shift - K ; No Repetition */
      that.emit('forward');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       (evt.keycode === 74 || evt.keycode === 40)) {
      /* Ctrl - J | Down ; Repetition OK */
      that.emit('next');
      my.can_commit = true;
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       (evt.keycode === 75 || evt.keycode === 38)) {
      /* Ctrl - K | Up ; Repetition OK */
      that.emit('prev');
      my.can_commit = true;
    }
    else if(evt.type === 9 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
       (evt.keycode === 9)) {
      /* Ctrl - Shift - Tab ; Repetition OK */
      that.emit('prev');
      my.can_commit = true;
    }
    else if(evt.type === 9 && ((evt.modifiers & ControlMod) === ControlMod) && 
       (evt.keycode === 9)) {
      /* Ctrl - Tab ; Repetition OK */
      that.emit('next');
      my.can_commit = true;
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
      (evt.keycode >= 49 && evt.keycode <= 57)) {
      /* Ctrl - 1-9 ; Repetiton OK */
      that.emit('select_by_index', evt.keycode - 49);
      my.can_commit = true;
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       evt.keycode === 37 && !is_last(evt)) {
      /* Ctrl - Left ; No Repetition */
      that.emit('back');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) &&
       evt.keycode === 39 && !is_last(evt)) {
      /* Ctrl - Right ; No Repetition */
      that.emit('forward');
    }
    else if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
       evt.keycode === 72 && !is_last(evt)) {
      /* Ctrl - Shift - H ; No Repetition */
      that.emit('toggle');
    }
    else if(evt.type === 9 && evt.keycode === ControlKey) {
      /* Ctrl (Release); No Repetition */
      if(my.can_commit) {
        my.can_commit = false;
        that.emit('commit');
      }
    }
    /* CapsLock as a Ctrl case */
    else if(evt.type === 9 && ((evt.modifiers & ControlMod) === ControlMod) &&
       evt.keycode === 20) {
      /* Ctrl (Release); No Repetition */
      if(my.can_commit) {
        my.can_commit = false;
        that.emit('commit');
      }
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) && 
       evt.keycode === 87) {
      /* Ctrl - W ; Repetition OK */
      that.emit('close');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) && 
       evt.keycode === 80 && !is_last(evt)) {
      /* Ctrl - W ; No Repetition */
      that.emit('stack_pin');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) && 
       evt.keycode === 70 && !is_last(evt)) {
      /* Ctrl - F ; No Repetition */
      that.emit('find_in_page');
    }
    else if(evt.type === 7 && ((evt.modifiers & ControlMod) === ControlMod) && 
       evt.keycode === 82 && !is_last(evt)) {
      /* Ctrl - R ; No Repetition */
      that.emit('reload');
    }
    else if(evt.type === 7 && evt.keycode === 27) {
      /* ESC ; Repetition OK */
      that.emit('clear');
    }

    if(process.platform === 'darwin') {

      if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
         evt.keycode === 221) {
        /* Ctrl - } ; Repetition OK */
        that.emit('next');
        my.can_commit = true;
      }
      else if(evt.type === 7 && ((evt.modifiers & ShiftControlMod) === ShiftControlMod) &&
         evt.keycode === 219) {
        /* Ctrl - { ; Repetition OK */
        that.emit('prev');
        my.can_commit = true;
      }
    }

    my.last = evt;
  };

  /****************************************************************************/
  /* PUBLIC METHODS */
  /****************************************************************************/
  // ### init 
  //
  // Called at initialisation of the module
  // ```
  // @cb_  {function(err)} the async callback
  // ```
  init = function(cb_) {
    breach.module('core').on('tabs:keyboard', handler);
    breach.module('core').on('controls:keyboard', handler);
    return cb_();
  };

  // ### kill 
  //
  // Called at destruction of the module
  // ```
  // @cb_  {function(err)} the async callback
  // ```
  kill = function(cb_) {
    //console.log('KILL');
    return cb_();
  };


  common.method(that, 'init', init, _super);
  common.method(that, 'kill', kill, _super);

  return that;
};

exports.keyboard_shortcuts = keyboard_shortcuts;

