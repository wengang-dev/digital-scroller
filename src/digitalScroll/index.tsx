import React, { PureComponent } from 'react';
import './style.css';

interface IDigitalScrollProps {
  renderNumber: (number: number) => React.ReactElement;
  size: number;
  number: number;
  stepTime?: number;
}
interface IDigitalScrollState {
  numbers: string[];
  curNumber: number;
  animation: any[];
}

export default class DigitalScroll extends PureComponent<
  IDigitalScrollProps,
  IDigitalScrollState
> {
  constructor(props: IDigitalScrollProps) {
    super(props);
    this.state = {
      numbers: this.handleNumbers(this.props.number, this.props.size),
      curNumber: this.props.number,
      animation: [],
    };
  }
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  private isUpdating = false;

  private finish = false;

  private isAdd = true;

  private latestTarget = this.props.number;

  private targetNumber = this.props.number;

  private numberHeight: any;
  componentDidMount() {
    this.setState({
      animation: this.initPosition(),
    });
  }

  handleNumbers(number, size) {
    let arr = (number + '').split('');
    if (size > (number + '').length) {
      arr = new Array(size - (number + '').length).fill('0').concat(arr);
    }
    return arr;
  }

  initPosition = () => {
    const arr = this.state.numbers.map((v) => {
      return {
        transform: `translateY(${
          (this.containerRef.current?.offsetHeight || 20) * -(Number(v) + 1)
        }px)`,
      };
    });
    return arr;
  };

  checkAddition(record) {
    for (let i = record.length - 1; i >= 0; i--) {
      const cur = record[i];
      const next = record[i - 1];
      if (Number(cur.time) + Number(cur.val) >= 10) {
        if (next) {
          next.time++;
        } else {
          record = record.map((v) => {
            v.index += 1;
            return v;
          });
          record.unshift({ val: 1 + '', time: 1, index: 0 });
        }
      }
    }
    return record;
  }

  run(record) {
    let animation: any[] = this.state.animation.slice();
    const timeRecord: any[] = [];
    for (let i = record.length - 1; i >= 0; i--) {
      let { time, val } = record[i];
      time = Number(time);
      val = Number(val);
      if (time !== 0) {
        // 进行动画
        timeRecord[i] = {
          duration: Math.abs(time) * (this.props?.stepTime || 0.2),
          delay:
            (timeRecord[i + 1]?.duration || 0) +
            (timeRecord[i + 1]?.delay || 0),
        };

        animation[i] = {
          transition: `all ${timeRecord[i].duration}s ${timeRecord[i].delay}s linear`,
          transform: `translateY(${-(val + time + 1) * this.numberHeight}px)`,
        };
      }
    }
    this.setState({ animation }, () => {
      this.isUpdating = true;
      this.resetPosition(record, timeRecord);
    });
    return timeRecord;
  }

  resetPosition(record, timeRecord) {
    let maxTime = -Infinity;
    const newAnimation = record.map((v, index) => {
      let { time, val } = v;
      time = Number(time);
      val = Number(val);

      if (this.isAdd && Math.abs(Number(time) + Number(val)) % 10 === 0) {
        maxTime = Math.max(
          maxTime,
          (timeRecord[index]?.duration || 0) + (timeRecord[index]?.delay || 0)
        );
        return {
          transition: `all ${0}s ${0}s linear`,
          transform: `translateY(${-this.numberHeight}px)`,
        };
      } else if (!this.isAdd && time + val === -1) {
        maxTime = Math.max(
          maxTime,
          (timeRecord[index]?.duration || 0) + (timeRecord[index]?.delay || 0)
        );
        return {
          transition: `all ${0}s ${0}s linear`,
          transform: `translateY(${
            -(this.containerRef.current?.offsetHeight || 20) * 10
          }px)`,
        };
      } else {
        return this.state.animation[index];
      }
    });
    setTimeout(() => {
      this.setState({
        animation: newAnimation,
      });
    }, maxTime * 1000);
  }

  componentDidUpdate(prevProps: IDigitalScrollProps) {
    if (this.props.number !== prevProps.number) {
      this.numberHeight = this.containerRef.current?.offsetHeight;
      this.latestTarget = this.props.number;
      this.targetNumber = this.isUpdating
        ? this.targetNumber
        : this.latestTarget;
      const nextIsAdd = this.props.number >= this.state.curNumber;
      if (nextIsAdd !== this.isAdd) {
        this.initPosition();
      }
      this.isAdd = nextIsAdd;
      if (!this.isUpdating) this.compute();
    }
  }

  compute = () => {
    const { curNumber } = this.state;
    const targetNumber = this.targetNumber;
    const { size } = this.props;
    let _curNumber = curNumber;
    const lastIndex = this.state.numbers.length - 1;

    if (targetNumber > _curNumber && this.isAdd) {
      let record = this.getRecord(
        new Array(size - curNumber.toString().length).fill(0).join() +
          curNumber.toString()
      );
      if (targetNumber - _curNumber <= 10) {
        while (_curNumber < targetNumber) {
          _curNumber++;
          record[lastIndex].time++;
        }
        this.finish = true;
      } else {
        while (_curNumber <= targetNumber) {
          _curNumber++;
          record[lastIndex].time++;
          if (_curNumber % 10 === 0) {
            break;
          }
        }
        this.finish = false;
      }
      const timeConsuming = this.run(this.checkAddition(record));
      const maxValidAnimation = timeConsuming.find((v) => v?.duration);
      const delay =
        (maxValidAnimation?.delay + maxValidAnimation?.duration || 0) * 1000;
      this.updateCurNumber(delay, _curNumber);
    } else if (targetNumber < _curNumber && !this.isAdd) {
      let record = this.getRecord(
        new Array(size - curNumber.toString().length).fill(0).join() +
          curNumber.toString()
      );
      if (_curNumber - targetNumber <= 10) {
        while (_curNumber > targetNumber) {
          _curNumber--;
          record[lastIndex].time--;
          if (_curNumber % 10 === 9) {
            break;
          }
        }
        if (_curNumber === targetNumber) this.finish = true;
      } else {
        while (_curNumber > targetNumber) {
          _curNumber--;
          record[lastIndex].time--;
          if (_curNumber % 10 === 9) {
            break;
          }
        }
        this.finish = false;
      }
      const timeConsuming = this.run(this.checkSubtraction(record));
      const maxValidAnimation = timeConsuming.find((v) => v?.duration);
      const delay =
        (maxValidAnimation?.delay + maxValidAnimation?.duration || 0) * 1000;
      this.updateCurNumber(delay, _curNumber);
    } else {
      this.setState({
        animation: this.initPosition(),
        curNumber: targetNumber,
      });
    }
  };

  checkSubtraction(record) {
    const _record = record.slice();
    for (let i = _record.length - 1; i >= 0; i--) {
      const cur = _record[i];
      const next = _record[i - 1];
      if (Number(cur.time) + Number(cur.val) < 0) {
        if (next) {
          next.time--;
        }
      }
    }
    return _record;
  }

  reversePosition(nextIsAdd) {
    const numArr = this.handleNumbers(this.state.curNumber, this.props.size);
    let translateY;
    const newPosition = numArr.map((v, index) => {
      const val = Number(v);
      if (nextIsAdd) {
        if (val === 0) translateY = -this.numberHeight;
        if (val === 9) translateY = 10 * -this.numberHeight;
        return {
          transition: `all ${0}s ${0}s linear`,
          transform: `translateY(${translateY}px)`,
        };
      } else {
        if (val === 0) translateY = 11 * -this.numberHeight;
        if (val === 9) translateY = 10 * -this.numberHeight;
        return {
          transition: `all ${0}s ${0}s linear`,
          transform: `translateY(${translateY}px)`,
        };
      }
    });
    this.setState({ animation: newPosition }, this.compute);
  }
  updateCurNumber(timeDelay, newCurNumber) {
    setTimeout(() => {
      this.setState(
        {
          curNumber: newCurNumber,
        },
        () => {
          this.isUpdating = false;
          if (!this.finish) {
            const needReverse =
              (this.latestTarget < this.state.curNumber && this.isAdd) ||
              (!this.isAdd && this.latestTarget > this.state.curNumber);
            if (needReverse) {
              this.reversePosition(!this.isAdd);
            }
            this.targetNumber = this.latestTarget;
            if (!needReverse) {
              this.compute();
            }
          }
        }
      );
    }, timeDelay);
  }

  getRecord = (curNumber: string) => {
    return curNumber.split('').map((e, index) => {
      return {
        val: e,
        time: 0,
        index,
      };
    });
  };

  render() {
    const arr = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const { animation, numbers } = this.state;
    const { renderNumber } = this.props;
    return (
      <React.Fragment>
        <div
          className="container"
          style={{ height: this.containerRef.current?.offsetHeight + 'px' }}
        >
          {numbers.map((v, index) => {
            return (
              <div
                style={animation[index] || {}}
                className="move"
                key={`number-list-${index}`}
              >
                {arr.map((v, index) => (
                  <div
                    key={`number-list${index}-item-${v}-${index}`}
                    ref={this.containerRef}
                  >
                    {renderNumber(v)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </React.Fragment>
    );
  }
}
