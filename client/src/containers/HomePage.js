import React from 'react';
import Actions from './Actions';
import StockCard from '../components/StockCard';

export default class HomePage extends React.Component {
  state = {
    stock_text: "",
    stock_data: [],
    stocks: []
  };
  componentWillMount = () => {
    this.ws = new WebSocket( 'ws://localhost:8080');
    this.ws.addEventListener( 'message', this.onWsMessage);
  };
  componentWillUnmount = () => {
    this.ws.removeEventListener( 'message', this.onWsMessage);
    this.ws.close();
  };
  onWsMessage = (e) => {
    const msg = JSON.parse( e.data);
    console.log( "ws message:", msg);
    switch( msg.action){
      case "add":
        if( msg.stock){
          Actions.getStock( {code: msg.stock.code})
          .then( (response) => {
            console.log( "get stock response:", response);
            const stock_data = [...this.state.stock_data, response.data];
            const stocks = [...this.state.stocks, msg.stock];
            this.setState( {stock_data, stocks});
          });
        } else {
          console.log( "stock not found:", msg);
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
  };
  render = () => {
    const stock_cards = this.state.stocks.map( (s,i) => {
      return (
        <StockCard key={i} code={s.code} description={s.description}
          onDelete={this.onRemoveStock} />
      );
    });
    const search_style = {
      display: "flex",
      flexDirection: "row"
    };
    return (
      <div className="App">
        <h1>Stocks</h1>
        <div>
          {stock_cards}
        </div>
        <div style={search_style}>
          <input type="text" onChange={this.onMessageChanged} value={this.state.stock_text}/>
          <button type="button" onClick={this.onSendClicked}>Send</button>
        </div>
      </div>
    );
  };
}
