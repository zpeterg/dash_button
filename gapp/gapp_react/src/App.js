import React, { Component } from 'react';
import { fromJS } from 'immutable';
import axios from 'axios';
import logo from './logo.svg';
import Settings from './Settings.js';
import './App.css';

let allowServerCall = false;
let allowServerWatch = false;
const blockServerWatch = false;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      playDuration: 2,
      playing: false,
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
        5000
      );
    }
  }
  
  serverCall() {
    const Parent = this;
    if (!allowServerCall) return false;
    axios.post(Settings.dynamic_url + '/saveState', this.state)
      .then(function (response) {         //////////////////////todo: working here - make the server back-end for this, and make this parse the response
        const res = response.data;
        console.log('response:::', res);
        Parent.changeState(res);
      })
      .catch(function (error) {
        console.log('AJAX error:', error);
      });
      /*
    setTimeout(                                   // Simulate AJAX call
      () => {
        this.changeState({ playDuration: 5 });
        this.serverCall();                             // Repeat loop
      },
      2000
    );  
    */    
  }

  changeState(newState) {
    console.log('changing state ---');
    this.setState(newState);
  }
  
  changeDuration(evt) {
    console.log('changing duration -- with evt', evt);
    this.setState({
      playDuration: evt.target.value,
    });
    this.serverCall();
  }

  changePlay() {
    console.log('changing play');
    this.setState({
      playing: !this.state.playing,
    });
    this.serverCall();
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
        <p>
          Length of time to play:
          <input value={this.state.playDuration} onChange={(evt) => this.changeDuration(evt)} />
        </p>
        <p>
          {this.state.playing ? 'Playing' : 'Not playing'}
          <button onClick={(evt) => this.changePlay(evt)} >{this.state.playing ? 'Stop' : 'Play'}</button>
        </p>
      </div>
    );
  }
}

export default App;
