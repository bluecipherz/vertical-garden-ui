import React, { Component } from 'react';
import io from 'socket.io-client';
import './stage.css';


class App extends Component {

    host = 'http://13.228.24.181:3120';
    state = {};

    constructor(){
        super();
        this.socket = io.connect(this.host);
        this.socket.on('msg', (msg)=> {
            this.processMessage(msg)
        });
        this.emit = msg => {
            if(!this.socket)
                return;
            this.socket.emit('msg1', msg);
        };

        this.processMessage = msg => {
            if(msg.type === 'MESSAGE_FROM_AR') {
                let data = msg.data;
                let parsingFailed = false;
                let dataStr;
                data = data.split("&");
                if(data.length >= 2) {
                    data = data[data.length - 2];
                    dataStr = "";
                    try {
                        data = data.split("'").join('"');
                        data = data.split(",");
                        for(let idx=0; idx < data.length; idx++){
                            if(idx >= data.length - 1 || idx === 0) {
                                dataStr += data[idx];
                            }else{
                                dataStr += ", " + data[idx];
                            }
                        }
                        data = JSON.parse(dataStr);
                    } catch (e) {
                        parsingFailed = true;
                    }
                } else {
                    parsingFailed = true;
                }

                if(!parsingFailed) {
                    for(let key in data) {
                        this.processARMessage({ key, value:data[key]});
                    }
                    this.setState({refreshing:false});
                } else {
                    setTimeout(this.requestStatus, 1000);
                }

            } else if(msg.type === 'MESSAGE_FROM_SERVER') {
                console.log(msg.data);
            }
        };

        this.processARMessage = msg => {
            switch(msg.key) {
                case 'M':
                    this.setState({motor:msg.value});
                    break;

                case 'L':
                    this.setState({tubeLight:msg.value});
                    break;

                case 'PH':

                    let avgValue=msg.value;
                    let pHVol= avgValue*5.0/1024/6;
                    let phValue = (-5.70 * pHVol) + 21.34;

                    this.setState({phLevel:msg.value});
                    break;

                default:
                    break;
            }
        };

        this.requestStatus = () => {
            this.setState({refreshing:true});
            this.emit('e')
        }
    }

    componentDidMount() {
        this.requestStatus();
        this.requestStatus();
        setInterval(this.requestStatus, 10000);
    }

    render() {
        return (
            <div className="App">
                <div className="stage">
                    <div className="s-buttonSet">
                        {
                            this.state.motor === 1 ? (
                                <div className="sb-button active" onClick={()=>this.emit('b')}>Turn Off Motor</div>
                            ) : this.state.motor === 0 ? (
                                <div className="sb-button" onClick={()=>this.emit('a')}>Turn On Motor</div>
                            ) : null
                        }
                        {
                            this.state.tubeLight === 1 ? (
                                <div className="sb-button active" onClick={()=>this.emit('d')}>Turn Off Light</div>
                            ) : this.state.tubeLight === 0 ? (
                                <div className="sb-button" onClick={()=>this.emit('c')}>Turn On Light</div>
                            ) : null
                        }
                        <div className="sb-button ">PH : {this.state.phLevel}</div>
                        <div className={"sb-button " + (this.state.refreshing ? 'active' : '')} onClick={()=>this.requestStatus()}>
                            {this.state.refreshing ? 'Refreshing...' : 'Refresh'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
