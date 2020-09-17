import React, { PureComponent, createRef } from 'react';
import './App.css';
import DigitalScroll from './digitalScroll';

class App extends PureComponent {
  state = { number: 999 };
  private inputRef: React.RefObject<HTMLInputElement> = createRef();

  handConfrimClick = () => {
    this.setState({
      number: Number(this.inputRef.current?.value),
    });
  };

  render() {
    return (
      <div className="App">
        <input ref={this.inputRef} />
        <button onClick={this.handConfrimClick}>confirm</button>
        <DigitalScroll
          number={this.state.number}
          renderNumber={(number) => {
            return <span className="number">{number}</span>;
          }}
          stepTime={0.2}
          size={4}
        />
      </div>
    );
  }
}

export default App;
