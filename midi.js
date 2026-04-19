/*
Apache License 2.0

Copyright 2024-2025 MIDILLI Tech

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * MIDIEngine is a singleton object that provides an interface for interacting with the Web MIDI API.
 * It allows initialization of MIDI access, enumeration of input/output ports, opening/closing ports,
 * sending MIDI messages, and handling incoming MIDI messages via a callback.
 * 
 * ## Quick Navigation
 * 
 * ### Initialization
 * - {@link MIDIEngine.init} - Initialize MIDI access
 * - {@link MIDIEngine.deinit} - Cleanup and release resources
 * - {@link MIDIEngine.refresh_devices} - Refresh device list
 * 
 * ### Input Methods
 * - {@link MIDIEngine.get_input_port_count} - Get number of input ports
 * - {@link MIDIEngine.get_input_port_name} - Get input port name by index
 * - {@link MIDIEngine.get_input_port_names} - Get all input port names
 * - {@link MIDIEngine.open_input_port} - Open input port for listening
 * - {@link MIDIEngine.close_input_port} - Close input port
 * - {@link MIDIEngine.is_input_port_open} - Check if input port is open
 * 
 * ### Output Methods
 * - {@link MIDIEngine.get_output_port_count} - Get number of output ports
 * - {@link MIDIEngine.get_output_port_name} - Get output port name by index
 * - {@link MIDIEngine.get_output_port_names} - Get all output port names
 * - {@link MIDIEngine.open_output_port} - Open output port for sending
 * - {@link MIDIEngine.close_output_port} - Close output port
 * - {@link MIDIEngine.is_output_port_open} - Check if output port is open
 * - {@link MIDIEngine.send_message} - Send MIDI message
 * 
 * @namespace MIDIEngine
 * 
 * @example
 * // Listen to MIDI messages
 * window._midi_callback = function(messageJson) {
 *   const message = JSON.parse(messageJson);
 *   console.log("MIDI received:", message.data);
 * };
 * await MIDIEngine.init();
 * MIDIEngine.open_input_port(0);
 * 
 * @example  
 * // Send MIDI messages
 * await MIDIEngine.init();
 * MIDIEngine.open_output_port(0);
 * MIDIEngine.send_message([0x90, 60, 127]);  // Note ON
 */
var MIDIEngine = (function () {
  let midiAccess = null;
  let midiInputs = [];
  let midiOutputs = [];
  let currentInput = null;
  let currentOutput = null;

  /**
   * Initializes MIDI access and populates input/output port lists.
   * @memberof MIDIEngine
   * @returns {Promise<void>} Resolves when MIDI access is granted or logs error if denied.
   */
  function init() {
    return navigator.requestMIDIAccess({ sysex: true }).then((access) => {
      console.log("✅ MIDI access granted");
      midiAccess = access;
      midiInputs = Array.from(midiAccess.inputs.values());
      midiOutputs = Array.from(midiAccess.outputs.values());
      console.log("🎹 Inputs:", midiInputs.map(i => i.name));
      console.log("📤 Outputs:", midiOutputs.map(o => o.name));
    }, (err) => {
      console.error("❌ MIDI access DENIED:", err);
    });
  }

  /**
   * Refreshes the list of available MIDI input and output devices.
   * @memberof MIDIEngine
   * @returns {void}
   */
  function refresh_devices() {
    if (midiAccess) {
      midiInputs = Array.from(midiAccess.inputs.values());
      midiOutputs = Array.from(midiAccess.outputs.values());
      console.log("🔄 Devices refreshed.");
      console.log("🎹 Inputs:", midiInputs.map(i => i.name));
      console.log("📤 Outputs:", midiOutputs.map(o => o.name));
    } else {
      console.warn("MIDI access not initialized. Call init() first.");
    }
  }

  // INPUT FUNCTIONS
  
  /**
   * Returns the number of available MIDI input ports.
   * @memberof MIDIEngine
   * @returns {number} The number of available MIDI input ports.
   */
  function get_input_port_count() {
    return midiInputs.length;
  }

  /**
   * Returns the name of the MIDI input port at the specified index.
   * @memberof MIDIEngine
   * @param {number} index - Index of the input port.
   * @returns {string} Name of the MIDI input port.
   */
  function get_input_port_name(index) {
    return midiInputs[index]?.name || "";
  }

  /**
   * Returns a JSON string array of all MIDI input port names.
   * @memberof MIDIEngine
   * @returns {string} JSON string array of all MIDI input port names.
   */
  function get_input_port_names() {
    return JSON.stringify(midiInputs.map((input) => input.name));
  }

  /**
   * Opens the MIDI input port at the specified index and assigns a message callback.
   * @memberof MIDIEngine
   * @param {number} index - Index of the input port to open.
   * @returns {void}
   */
  function open_input_port(index) {
    currentInput = midiInputs[index] || null;
    if (currentInput) {
      console.log("📤 Assigned callback");

      currentInput.onmidimessage = (event) => {
        // const dataArray = Array.from(event.data);  // e.g.: [176, 15, 0]

        // console.log("🎵 Incoming MIDI:", dataArray);

        if (typeof window._midi_callback === "function") {
          // Send to Callback as JSON string
          window._midi_callback(JSON.stringify({
            index: index,
            data: Array.from(event.data)
          }));
        } else {
          console.warn("❗️ _midi_callback function is not defined!");
        }
      };
    }
  }

  /**
   * Closes the currently open MIDI input port.
   * @memberof MIDIEngine
   * @returns {void}
   */
  function close_input_port() {
    if (currentInput) {
      currentInput.onmidimessage = null;
      currentInput = null;
    }
  }

  // OUTPUT FUNCTIONS
  /**
   * Returns the number of available MIDI output ports.
   * @memberof MIDIEngine
   * @returns {number} The number of available MIDI output ports.
   */
  function get_output_port_count() {
    return midiOutputs.length;
  }

  /**
   * Returns the name of the MIDI output port at the specified index.
   * @memberof MIDIEngine
   * @param {number} index - Index of the output port.
   * @returns {string} Name of the MIDI output port.
   */
  function get_output_port_name(index) {
    return midiOutputs[index]?.name || "";
  }

  /**
   * Returns a JSON string array of all MIDI output port names.
   * @memberof MIDIEngine
   * @returns {string} JSON string array of all MIDI output port names.
   */
  function get_output_port_names() {
    return JSON.stringify(midiOutputs.map((output) => output.name));
  }

  /**
   * Opens the MIDI output port at the specified index.
   * @memberof MIDIEngine
   * @param {number} index - Index of the output port to open.
   * @returns {void}
   */
  function open_output_port(index) {
    currentOutput = midiOutputs[index] || null;
  }

  /**
   * Closes the currently open MIDI output port.
   * @memberof MIDIEngine
   * @returns {void}
   */
  function close_output_port() {
    currentOutput = null;
  }

  /**
   * Checks if the MIDI input port at the specified index is connected.
   * @memberof MIDIEngine
   * @param {number} index - Index of the input port.
   * @returns {boolean} True if the MIDI input port is connected.
   */
  function is_input_port_open(index) {
    if (midiInputs[index]) {
  	  return midiInputs[index].state === "connected";
    }
    return false;
  }
  
  /**
   * Checks if the MIDI output port at the specified index is connected.
   * @memberof MIDIEngine
   * @param {number} index - Index of the output port.
   * @returns {boolean} True if the MIDI output port is connected.
   */
  function is_output_port_open(index) {
    if (midiOutputs[index]) {
  	  return midiOutputs[index].state === "connected";
    }
    return false;
  }

  /**
   * Sends a MIDI message (array of bytes) to the currently open output port.
   * @memberof MIDIEngine
   * @param {Array<number>} dataArray - MIDI message bytes to send.
   * @returns {void}
   */
  function send_message(dataArray) {
    if (currentOutput && typeof currentOutput.send === 'function') {
      currentOutput.send(dataArray);
    } else {
      console.log("Output port is not open or not valid.");
    }
  }

  /**
   * Deinitializes MIDI, closes ports, and releases device references.
   * @memberof MIDIEngine
   * @returns {void}
   */
  function deinit() {
    close_input_port();
    close_output_port();
    midiInputs = [];
    midiOutputs = [];
    midiAccess = null;
    console.log("🛑 MIDI deinitialized and devices released.");
  }

  return {
    // Input
    init,
    get_input_port_count,
    get_input_port_name,
    get_input_port_names,
    open_input_port,
    is_input_port_open,
    close_input_port,
    // Output
    get_output_port_count,
    get_output_port_name,
    get_output_port_names,
    open_output_port,
    close_output_port,
    is_output_port_open,
    send_message,
    // refresh_devices
    refresh_devices,
    // Deinitialize
    deinit
  };
})();
