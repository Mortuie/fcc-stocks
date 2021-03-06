import React from 'react';
import moment from 'moment';
import Actions from './Actions';
import StockChart from '../components/StockChart';
import * as d3 from 'd3';
import {genLastWeekdays, normaliseDates, weekday} from '../components/charts';

export default class HomePage extends React.Component {
  state = {
    is_loading: true,
    stock_text: "",
    stocks: []
  };
  componentWillMount = () => {
    let ws_url = 'ws://knik-fcc-stocks.herokuapp.com/:5000';
    if( process.env.NODE_ENV === 'development'){
      ws_url = "ws://localhost:5000";
    }
    this.ws = new WebSocket( ws_url);
    this.ws.onopen = () => {
      console.log( "socket is open");
    };
    this.ws.onmessage = (message) => {
      console.log( "websocket message:", message);
      const msg = JSON.parse( message.data);
      this.onWsMessage( msg);
    };
  };

  onWsMessage = (msg) => {
    // const msg = JSON.parse( e.data);
    console.log( "ws message:", msg);
    switch( msg.action){
      case "ack":
        if( msg.message === "connected"){
          console.log( "requesting stock list");
          this.ws.send( JSON.stringify( { action: "show"}));
        }
        break;
      case "add":
        if( msg.stock){
          Actions.getStock( {code: msg.stock.code})
          .then( (response) => {
            const stocks = this.state.stocks.filter( (stock) => {
              return stock.code !== msg.stock.code;
            });
            const { end_date } = response;
            const weekdays100 =
              genLastWeekdays( moment(end_date, 'YYYY-MM-DD'), 100);
            const norm = normaliseDates( response.data, weekdays100);
            // convert the dates to weekdays
            const parseTime = d3.timeParse("%Y-%m-%d");
            const data = norm.map( (p) => {
              return { date: p.date,
                weekday: weekday( parseTime( p.date)), close: +p.close};
            });
            stocks.push( {...msg.stock, data});
            this.setState( {stocks, is_loading: false});
          });
        } else {
          console.error( "stock not found:", msg);
        }
        break;
      case "remove":
        if( msg.code){
          const stocks = this.state.stocks.filter( (d) => {
            return d.code !== msg.code;
          });
          this.setState( {stocks});
        } else {
          console.err( "stock not found:", msg);
        }
        break;
      case "error":
        if( msg.message){
          // TODO: ui feedback
          this.setState( {is_loading: false});
          if( msg.message !== "no stocks displayed"){
            alert( msg.message);
          }
        }
        break;
      default:
        console.log( "unhandled ws message:", msg);
        break;
    }
  };
  onMessageChanged = (e) => {
    this.setState( {stock_text: e.target.value.toUpperCase()});
  };
  onSendClicked = (e) => {
    const msg = { action: "add", code: this.state.stock_text};
    this.ws.send( JSON.stringify( msg));
  };
  onRemoveStock = ( code) => {
    console.log( `remove stock [${code}]`);
    const msg = { action: "remove", code};
    this.ws.send( JSON.stringify( msg));
  };
  onStockTextFocus = (e) => {
    e.target.select();
  };
  render = () => {
    const width = 800, height = 400;
    const margin = { top: 20, left: 40, bottom:20, right:20};
    const search_style = {
      margin: "10px",
      display: "flex",
      flexDirection: "row"
    };
    return (
      <div className="App">
        <h1>Stocks</h1>
        {this.state.stocks.length || this.state.is_loading?
          <StockChart stocks={this.state.stocks} margin={margin}
            width={width} height={height}
            onRemoveStock={this.onRemoveStock} is_loading={this.state.is_loading} />
          : <div>
            <p>There are no stocks dislayed currently</p>
            <p>Enter a code below and click Add</p>
          </div>
        }
        <div style={search_style}>
          <input type="text" onChange={this.onMessageChanged}
            placeholder="Stock code" value={this.state.stock_text}
            onFocus={this.onStockTextFocus}/>
          <button type="button" onClick={this.onSendClicked}>Add</button>
        </div>
      </div>
    );
  };
}
