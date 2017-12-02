import React, { Component } from 'react';
import { fromJS } from 'immutable';
import axios from 'axios';
import Moment from 'moment';
import logo from './logo.svg';
import Settings from './Settings.js';
import './App.css';

let allowServerCall = false;
let allowServerWatch = false;
let pauseServerLoad = false;                  // Used to temporarily pause loading-up server results, to wait for bot to make changes
const blockServerWatch = false;
let updatedState = [];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      playDuration: 0,
      playStartedTime: '0:00',
      switch1Duration: 0,
      switch1StartedTime: '0:00',
    };
  }
  
  componentDidMount() {
    console.log('mounting ---');
    allowServerCall = true;
    this.serverCall();
    allowServerWatch = true;
    this.serverWatch();
  }

  componentWillUnmount() {
    allowServerCall = false;
    allowServerWatch = false;
  }
  
  serverWatch() {
    const Parent = this;
    if (allowServerWatch && !blockServerWatch) {
      setTimeout(
        () => {
          Parent.serverCall();
          Parent.serverWatch();
          return true;
        },
        Settings.watchSeconds
      );
    }
  }
  
  serverCall() {
    const Parent = this;
    if (!allowServerCall) return false;
    if (pauseServerLoad) return false;
    const immutableState = fromJS(this.state);
    const stateToSend = {};
    updatedState.map((o) => stateToSend[o] = this.state[o]);   // Select-out only changed state to save
    if (updatedState.length > 0) {                              // If updating anything, pause any loads to give bot time
      pauseServerLoad = true;
      setTimeout(() => {
        pauseServerLoad = false;
      }, Settings.serverLoadPauseSeconds);
    }
    updatedState = [];                     // reset to prevent duplicate saving
    axios.post(Settings.dynamic_url + '/saveState', stateToSend)
      .then(function (response) {
        const res = response.data;
        console.log('response:::', res);
        Parent.changeState(res);
      })
      .catch(function (error) {
        console.log('AJAX error:', error);
      });
  }

  changeState(newState) {
    console.log('changing state ---');
    if (pauseServerLoad) return false;
    this.setState(newState);
  }
  
  ////// Music
  changeDuration(newValue) {
    console.log('changing duration to ' + newValue);
    this.setState({
      playDuration: newValue,
    });
    updatedState.push('playDuration');               // Flag as changed to save
  }
  changePlayStartedTime(newValue) {
    console.log('changing start time');
    this.setState({
      playStartedTime: newValue,
    });
    updatedState.push('playStartedTime');        // Flag as changed to save
  }
  changePlayStartedTimeToNow() {
    var timeNow = Moment().subtract(5, 'minutes').format(Settings.timeFormat);
    console.log('PLay this time:', timeNow);
    return this.changePlayStartedTime(timeNow);
  }
  
  ////// Switch1
  changeSwitch1Duration(newValue) {
    console.log('changing duration to ' + newValue);
    this.setState({
      switch1Duration: newValue,
    });
    updatedState.push('switch1Duration');               // Flag as changed to save
  }
  changeSwitch1StartedTime(newValue) {
    console.log('changing start time');
    this.setState({
      switch1StartedTime: newValue,
    });
    updatedState.push('switch1StartedTime');        // Flag as changed to save
  }
  changeSwitch1StartedTimeToNow() {
    var timeNow = Moment().subtract(5, 'minutes').format(Settings.timeFormat);
    console.log('Switch1 on this time:', timeNow);
    return this.changeSwitch1StartedTime(timeNow);
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Grander App</h1>
        </header>
        <p className="App-intro">
          Change the settings below and save to tweak.
        </p>
        <h2>Music is {this.state.playing ? 'Playing' : 'Not playing'}</h2>
        <p>
          Length of time to play:
          <input value={this.state.playDuration} onChange={(evt) => {evt.preventDefault(); return this.changeDuration(evt.target.value)}} />
        </p>
        <p>
          Start time:
          <input value={this.state.playStartedTime} onChange={(evt) => {evt.preventDefault(); return this.changePlayStartedTime(evt.target.value)}} />
        </p>
        <p>
          <button onClick={(evt) => this.changePlayStartedTimeToNow(evt)} >Play Now</button>
        </p>
        
        <h2>Christmas Lights are {this.state.switch1On ? 'On' : 'Off'}</h2>
        <p>
          Length of time to stay on:
          <input value={this.state.switch1Duration} onChange={(evt) => {evt.preventDefault(); return this.changeSwitch1Duration(evt.target.value)}} />
        </p>
        <p>
          Turn-on time:
          <input value={this.state.switch1StartedTime} onChange={(evt) => {evt.preventDefault(); return this.changeSwitch1StartedTime(evt.target.value)}} />
        </p>
        <p>
          <button onClick={(evt) => this.changeSwitch1StartedTimeToNow(evt)} >Turn On Now</button>
        </p>
        
        <p>
          <button onClick={(evt) => this.serverCall()} >Update Server</button>
        </p>
      </div>
    );
  }
}

export default App;
