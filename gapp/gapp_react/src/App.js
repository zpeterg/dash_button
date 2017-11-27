import React, { Component } from 'react';
import { fromJS } from 'immutable';
import logo from './logo.svg';
import './App.css';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = { playDuration: 2 };
  }
  
  componentDidMount() {
    console.log('mounting ---');
    setTimeout(
      () => this.changeState(),
      2000
    );
  }

  componentWillUnmount() {
    
  }

  changeState() {
    console.log('changing state ---');
    this.setState({
      playDuration: 5,
    });
  }
  
  changeDuration(evt) {
    console.log('changing duration -- with evt', evt);
    this.setState({
      playDuration: evt.target.val,
    });
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
          Length of time to play: --{this.state.playDuration}--
          <input value={this.state.playDuration} onChange={(evt) => this.changeDuration(evt)} />
        </p>
      </div>
    );
  }
}

export default App;
