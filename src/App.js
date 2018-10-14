import React, { Component } from 'react';
import './App.css';
import SlidingScale from './sliding_scale';

const styles = {
  amount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0093D1'
  },
  indicatorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  indicator: {
    width: 2,
    height: 50,
    background: 'red'
  }
}

class App extends Component {
  render() {
    const renderAmount = (amount) => <div style = {styles.amount}>
      { amount }%
    </div>;

    const renderIndicator = () => <div style={styles.indicatorContainer}>
      <div style={styles.indicator}></div>
    </div>

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
      scaleStyle: {
        scaleFontSize: 16,
        scaleFont: 'PingFang SC',
        scaleFontColor: '#2A2A2A',
        scaleSelectedFontColor: '#0093D1',
        labelColor: '#2A2A2A',
        labelSelectedColor: '#0093D1',
      },
      renderAmount,
      renderIndicator
    };
    return (
      <div className="App">
        <SlidingScale config={config}/>
      </div>
    );
  }
}

export default App;
