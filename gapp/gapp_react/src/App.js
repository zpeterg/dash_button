import React, { Component } from 'react';
import { fromJS } from 'immutable';
import axios from 'axios';
import Moment from 'moment';
import logo from './logo.svg';
import Settings from './Settings.js';
import Input from './Input.js';
import Section from './Section.js';
import Button from './Button.js';
import './App.css';

let allowServerCall = false;
let allowServerWatch = false;
let pauseServerLoad = false;                  // Used to temporarily pause loading-up server results, to wait for bot to make changes
const blockServerWatch = false;
let updatedState = [];


class App extends Component {
  constructor(props) {
    super(props);
    const Parent = this;
    const actionPrototype = {
      actionName: 'play',                         // Default name
      changeDuration: function(newValue) {
        Parent.setState({
          [this.actionName + 'Duration']: newValue,
        });
        updatedState.push(this.actionName + 'Duration');               // Flag as changed to save
      },
      changeStartedTime: function(newValue) {
        Parent.setState({
          [this.actionName + 'StartedTime']: newValue,
        });
        updatedState.push(this.actionName + 'StartedTime');        // Flag as changed to save
      },
      changeStartedTimeToNow: function() {
        var timeNow = Moment().subtract(5, 'minutes').format(Settings.timeFormat);
        return this.changeStartedTime(timeNow);
      },
    };
    const actionSpanPrototype = {
      actionName: 'thermo',                         // Default name
      changeTemp: function(newValue, which) {
        Parent.setState({
          [this.actionName + which + 'Temp']: newValue,
        });
        updatedState.push(this.actionName + which + 'Temp');               // Flag as changed to save
      },
      changeStartedTime: function(newValue, which) {            // which is started time 1 or 2
        Parent.setState({
          [this.actionName + which + 'StartedTime']: newValue,
        });
        updatedState.push(this.actionName + which + 'StartedTime');        // Flag as changed to save
      },
      changeEndedTime: function(newValue, which) {            // which is started time 1 or 2
        Parent.setState({
          [this.actionName + which + 'EndedTime']: newValue,
        });
        updatedState.push(this.actionName + which + 'EndedTime');        // Flag as changed to save
      },
      changeOnOuting: function() {
        Parent.setState({
          [this.actionName + 'OutingOn']: !Parent.state[this.actionName + 'OutingOn']
        });
        updatedState.push(this.actionName + 'OutingOn');
      },
      changeStartedTimeToNow: function() {               // which is started time 1 or 2
        Parent.setState({
          [this.actionName + 'Outing']: !Parent.state[this.actionName + 'Outing'],
        });
        updatedState.push(this.actionName + 'Outing');
      },
      changeStartedTimeToNowDate: function(which) {                    // which is "Boost", etc.
        var timeNow = Moment().subtract(5, 'minutes').format();         // standard full date output
        return this.changeStartedTime(timeNow, which);
      },
    };
    
    this.state = { 
      playDuration: 0,
      playStartedTime: '0:00',
      switch1Duration: 0,
      switch1StartedTime: '0:00',
      thermo0Temp: 71,
      thermo1Temp: 68,
      thermo1StartedTime: '0:00',
      thermo1EndedTime: '0:00',
      thermoOutingTemp: 66,
      thermoBoostTemp: 3,
      thermoBoostStartedTime: '0:00',
      thermoOutingOn: false,
    };
    this.playAction = Object.create(actionPrototype);
    this.switch1Action = Object.create(actionPrototype);
    this.switch1Action.actionName = 'switch1';
    this.thermoAction = Object.create(actionSpanPrototype);
  }
  
  componentDidMount() {
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
        Parent.changeState(res);
      })
      .catch(function (error) {
        console.log('AJAX error:', error);
      });
  }

  changeState(newState) {
    if (pauseServerLoad) return false;
    this.setState(newState);
  }
  
  
  render() {
    return (
      <div style={{ paddingLeft: "50%", textAlign: "center" }} >
        <div className="App" style={{ marginLeft: "-125px", width: "250px" }}>
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">{Settings.siteName}</h1>
          </header>
          <p className="App-intro" style={{ fontSize: '12px' }}>
            All changes automatically save in a few seconds.
          </p>
          
          {/* Thermo */}
          <br />
          <h2>Thermostat is at {this.state.thermoTemp}</h2>
          <Section>
            <p>
              Base temp:
              <Input
                type='number'
                value={this.state.thermo0Temp}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeTemp(evt.target.value, 0)}}
              />
            </p>
            <p>
              Span Start Time
              <Input 
                value={this.state.thermo1StartedTime}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeStartedTime(evt.target.value, 1)}}
              />
            </p>
            <p>
              Span End Time
              <Input 
                value={this.state.thermo1EndedTime}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeEndedTime(evt.target.value, 1)}}
              />
            </p>
            <p>
              Span Temp:
              <Input
                type='number'
                value={this.state.thermo1Temp}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeTemp(evt.target.value, 1)}}
              />
            </p>
            <p>
              Outing Temp:
              <Input
                type='number'
                value={this.state.thermoOutingTemp}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeTemp(evt.target.value, 'Outing')}}
              />
            </p>
          </Section>
          <p>
            <Button onClick={(evt) => {evt.preventDefault(); this.thermoAction.changeOnOuting()}} >
              {this.state.thermoOutingOn ? 'Coming In' : 'Going Out'}
            </Button>
          </p>
          <Section>
            <p>
              Boost By Degrees:
              <Input
                type='number'
                value={this.state.thermoBoostTemp}
                onChange={(evt) => {evt.preventDefault(); return this.thermoAction.changeTemp(evt.target.value, 'Boost')}}
              />
            </p>
          </Section>
          <p>
            <Button onClick={(evt) => this.thermoAction.changeStartedTimeToNowDate('Boost')} >
              Boost
            </Button>
          </p>
          
          
          {/* Music */}
          <br />
          <h2>Music is {this.state.playing ? 'Playing' : 'Not playing'}</h2>
          <Section>
            <p>
              Time to play:
              <Input
                type='number'
                value={this.state.playDuration}
                onChange={(evt) => {evt.preventDefault(); return this.playAction.changeDuration(evt.target.value)}}
              />
            </p>
            <p>
              Start time: 
              <Input 
                value={this.state.playStartedTime}
                onChange={(evt) => {evt.preventDefault(); return this.playAction.changeStartedTime(evt.target.value)}}
              />
            </p>
          </Section>
          <p>
            <Button onClick={(evt) => this.playAction.changeStartedTimeToNow(evt)} >Play Now</Button>
          </p>
          
          {/* Switch1 */}
          <br />
          <h2>Christmas Lights are {this.state.switch1On ? 'On' : 'Off'}</h2>
          <Section>
            <p>
              Time to stay on:
              <Input
                type='number'
                value={this.state.switch1Duration}
                onChange={(evt) => {evt.preventDefault(); return this.switch1Action.changeDuration(evt.target.value)}}
              />
            </p>
            <p>
              Turn-on time:
              <Input 
                value={this.state.switch1StartedTime} 
                onChange={(evt) => {evt.preventDefault(); return this.switch1Action.changeStartedTime(evt.target.value)}}
              />
            </p>
          </Section>
          <p>
            <Button onClick={(evt) => this.switch1Action.changeStartedTimeToNow(evt)} >Turn On Now</Button>
          </p>
          
          <p>
            <Button onClick={(evt) => this.serverCall()} >Update Server</Button>
          </p>
        </div>
      </div>
    );
  }
}

export default App;
