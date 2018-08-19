import React, { Component } from 'react';
import './App.css';
import SlidingScale from './sliding_scale';

class App extends Component {
  render() {
    const config = {
      minValue: 1,
      maxValue: 20,
      defaultValue: 6,
      dockToSub: true,
      step: 1,
      stepsDisplay: 4,
      canvasHeight: 100,
      canvasWidth: 320,
      subSegments: 10,
      scaleHeight: 20,
      subScaleHeight: 10,
      scaleFontColor: '#2A2A2A',
      scaleSelectedFontColor: '#0093D1',
      labelColor: '#2A2A2A',
      labelSelectedColor: '#0093D1',
      indactorColor: '#0093D1',
      amountSuffix: '%',
      amountStyle: {
        fontSize: 30,
        fontWeight: 'bold',
      }
    };
    return (
      <div className="App">
        <SlidingScale config={config}/>
      </div>
    );
  }
}

export default App;
