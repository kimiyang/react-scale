import React, { PureComponent } from 'react';

const FPS = 60;

const doAnimation = fn => {
  return window.requestAnimationFrame ? window.requestAnimationFrame(fn) : setTimeout(fn, 1000 / FPS);
}

const cancelAnimation = token => {
  return window.cancelAnimationFrame ? window.cancelAnimationFrame(token) : window.clearTimeout(token);
}

class SlidingScale extends PureComponent {

  constructor(props) {
    super(props);
    const {
      maxValue = 10,
      minValue = 1,
      step = 1,
      defaultValue = 5,
      stepsDisplay = 4,
      subSegments = 0,
      dockToSub = false,
    } = props.config;
    this.state = {
      amount: props.config.defaultValue,
    };

    // methods binding
    this.drawScale = this.drawScale.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.moveScale = this.moveScale.bind(this);
    this.brake = this.brake.bind(this);
    this.dock = this.dock.bind(this);

    
    // init vars
    this.lastPosition = -1;
    this.animationTokens = [];
    this.position = 0;
    this.STEP_WIDTH = parseInt(props.config.canvasWidth / stepsDisplay, 10);
    this.SUB_STEP_WIDTH =  dockToSub && subSegments ? this.STEP_WIDTH / subSegments : 0;
    this.moving = false;
    this.brakeToke = null;
    this.dockToken = null;

    
    this.maxPos = (maxValue - defaultValue) * this.STEP_WIDTH / step;
    this.minPos = (minValue - defaultValue) * this.STEP_WIDTH / step;
  }

  componentDidMount() {
    this.drawScale();
  }

  componentWillUnmount() {
    cancelAnimation(this.brakeToke);
    cancelAnimation(this.dockToken);
  }

  drawScale() {
    if (Math.abs(this.position - this.lastPosition) >= 0.1) {
      const { ctx, position, STEP_WIDTH } = this;
      const { defaultValue,
        minValue,
        maxValue,
        step,
        canvasWidth,
        canvasHeight,
        subSegments,
        subScaleHeight,
        scaleHeight,
        scaleStyle,
        renderIndicator
      } = this.props.config || {};
      const { 
        scaleFontSize = 16,
        scaleFont = 'PingFang SC',
        scaleFontColor = '#000000',
        scaleSelectedFontColor = '#000000',
        labelColor = '#000000',
        labelSelectedColor = '#000000' 
      } = scaleStyle || {};

      this.lastPosition = position;
      const left = Math.floor((position - canvasWidth / 2) / STEP_WIDTH ) * step + defaultValue;
      const right = Math.ceil((position + canvasWidth / 2) / STEP_WIDTH ) * step + defaultValue;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      // draw unselectable scale
      ctx.font = `${scaleFontSize}px "${scaleFont}"`;
      ctx.fillStyle = `${scaleFontColor}`;
      for (let i = left, segCounts = 0; i <= right && subSegments > 0; i+= (step / subSegments), segCounts++) {
        if (i > maxValue || i < minValue || (segCounts > 0 && segCounts % subSegments === 0)) continue;
        const posX = (i - defaultValue) / step * STEP_WIDTH - position + canvasWidth / 2;
        ctx.fillRect(posX - 0.5, 30, 1, subScaleHeight);
      }
      // draw selectable scale
      for (let i = left; i <= right; i+= step) {
        if (i > maxValue || i < minValue) continue;
        const posX = (i - defaultValue) / step * STEP_WIDTH - position + canvasWidth / 2;
        ctx.fillStyle = `${scaleFontColor}`;
        if (this.state.amount == i) {
          ctx.fillStyle = `${scaleSelectedFontColor}`;
        }
        ctx.fillRect(posX - 0.5, 30, 1, scaleHeight);

        // draw numbers
        ctx.fillStyle = `${labelColor}`;
        if (this.state.amount == i) {
          ctx.fillStyle = `${labelSelectedColor}`;
        }
        ctx.fillText(`${i}`, posX - ctx.measureText(i).width / 2, 30 + scaleHeight * 2);
      }
      if (!renderIndicator) {
        const posX = canvasWidth / 2;
        ctx.fillStyle = '#111111';
        ctx.fillRect(posX - 1, 0, 2, 30 + scaleHeight);
      }

    }
    if(this.moving) {
      doAnimation(this.drawScale);
    }
  }

  moveScale(deltaPos) {
    const { defaultValue, step, dockToSub = false, subSegments } = this.props.config;
    let nextPos = this.position - deltaPos;
    nextPos = Math.max(nextPos, this.minPos - this.STEP_WIDTH);
    nextPos = Math.min(nextPos, this.maxPos + this.STEP_WIDTH);
    this.position = nextPos;

    // decide to dock to sub-scale or main-scale
    const isDockToSub = dockToSub && subSegments;
    const dock_step_wdith = isDockToSub ? this.SUB_STEP_WIDTH : this.STEP_WIDTH;
    const dock_Step = isDockToSub ? step / subSegments : step;
    let nextAmount = Math.round(this.position / dock_step_wdith) * dock_Step + defaultValue;
    if (this.state.amount !== nextAmount) {
      if (isDockToSub) {
        nextAmount = nextAmount.toFixed(1);
      } else {
        nextAmount = nextAmount.toFixed(0);
      }
      this.setState({amount: nextAmount});
    }
  }

  brake(dt) {
    const now = new Date();
    const { minAcceleration = 1000 } = this.props.config;
    if (this.position === this.minPos - this.STEP_WIDTH || this.position === this.maxPos + this.STEP_WIDTH) {
      this.prevSpeed = 0;
      this.dock(now);
      return;
    }
    const seconds = (now - dt) / 1000;
    const acceleration = Math.max(Math.abs(this.prevSpeed * 4), minAcceleration);
    const deltaSpeed = acceleration * seconds;
    const nextSpeed = this.prevSpeed > 0 ? this.prevSpeed - deltaSpeed : this.prevSpeed + deltaSpeed;
    if (nextSpeed * this.prevSpeed > 0) {
      this.moveScale((this.prevSpeed + nextSpeed) * seconds / 2);
      this.prevSpeed = nextSpeed;
      this.brakeToke = doAnimation(() => this.brake(now));
    } 
    // has stopped, so next step is to dock to the right position
    else {
      this.prevSpeed = 0;
      this.dockToken = doAnimation(() => this.dock(now));
    }
  }

  dock(dt) {
    const { minAcceleration = 1000, dockToSub = false } = this.props.config;
    
    const dock_step_wdith = dockToSub ? this.SUB_STEP_WIDTH :this.STEP_WIDTH;
    let dockPos = Math.round(this.position / dock_step_wdith) * dock_step_wdith;
    dockPos = Math.max(Math.min(this.maxPos, dockPos), this.minPos);
    const dist = this.position - dockPos;
    const now = new Date();
    const seconds = (now - dt) / 1000;
    const nextSpeed = this.prevSpeed + minAcceleration * seconds;
    let deltaPos = (this.prevSpeed + nextSpeed) * seconds / 2;
    deltaPos = dist > 0 ? deltaPos : -deltaPos;
    this.dockToken = doAnimation(() => {
      if (Math.abs(deltaPos) > Math.abs(dist)) {
        this.moveScale(dist);
        this.moving = false;
      } else {
        this.moveScale(deltaPos);
        this.prevSpeed = nextSpeed;
        this.dock(now);
      }
    })
  }
 
  onTouchStart(e) {
    this.prevX = e.nativeEvent.touches[0].clientX;
    this.prevTimeStamp = e.nativeEvent.timeStamp;
    this.brakeToke && cancelAnimation(this.brakeToke);
    this.dockToken && cancelAnimation(this.dockToken);
    this.prevSpeed = 0;
    this.moving = true;
    this.drawScale();
  }

  onTouchEnd(e) {
    this.prevX = null;
    this.brake(new Date());
  }
  onTouchMove(e) {
    if (this.prevX) {
      const nextX = e.nativeEvent.touches[0].clientX;
      const nextTimeStamp = e.nativeEvent.timeStamp;
      const deltaX = nextX - this.prevX;
      this.prevSpeed = (nextX - this.prevX) / (nextTimeStamp - this.prevTimeStamp) * 1000;
      this.prevX = nextX;
      this.prevTimeStamp = nextTimeStamp;
      this.moving = true;
      this.moveScale(deltaX);
    }
  }

  render() {
    const { canvasWidth, canvasHeight, renderAmount, renderIndicator } = this.props.config || {};
    const amountNode = renderAmount && typeof renderAmount === "function" ? renderAmount(this.state.amount) : null;
    const indicatorNode = renderIndicator && typeof renderIndicator === "function" ? renderIndicator() : null;
    return (
      <div
        onTouchStart = {this.onTouchStart}
        onTouchMove = {this.onTouchMove}
        onTouchEnd = {this.onTouchEnd}
      >
        {
          amountNode || <div>{this.state.amount}</div>
        }
        {
          indicatorNode
        }
        <canvas key='scale' width={canvasWidth} height={canvasHeight} ref={
          el => {
            if(el && !this.ctx) {
              this.ctx = el.getContext('2d');
            }
          }
        }/>
      </div>
    );
  }
}

export default SlidingScale;
