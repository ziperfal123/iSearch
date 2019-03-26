import React, { Component } from "react";
import axios from "axios";
import Highlighter from "react-highlight-words";

export default class Document extends Component {

  state = {
    isActive: null
  }

  onClick = () => {
    this.props.onDocumentSelect(this.props.item.documentNumber);
  };

  toggleButton = () => {

    if (!this.state.isActive) {
      axios
        .post(`https://ir-search.herokuapp.com/activateFile`, {
          fileNumber: this.props.item.documentNumber
        })
        .then(this.setState({ isActive: true }));
    }
    else {
      axios
        .post(`https://ir-search.herokuapp.com/deactivateFile`, {
          fileNumber: this.props.item.documentNumber
        })
        .then(this.setState({ isActive: false }));
    }
  }

  componentWillMount() {
    this.setState({ isActive: this.props.item.isActive });
  }

  splitMulti = (str, tokens) => {
    var tempChar = tokens[0];
    for (var i = 1; i < tokens.length; i++) {
      str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
  };

  render() {
    if (this.props.withButton === `false`) {
      let description = `${this.props.item.description} ...`;
      let query = this.props.query;

      query = this.splitMulti(query, [` `, `-`, `&`, `|`, `(`, `)`, `!`]);

      return (
        <div className="ui segment">
          <h3>{`${this.props.item.documentNumber}- ${this.props.item.title}`}</h3>
          <h5>{this.props.item.author}</h5>
          <p><Highlighter
            searchWords={query}
            textToHighlight={description}
          /></p>
          <button className="ui button" onClick={this.onClick}>
            View Document
            </button>
        </div>
      );
    }
    else {
      return (
        <div className="ui segment">
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
            <h3>{`${this.props.item.documentNumber}- ${this.props.item.title}`}</h3>
            <button className="ui button" onClick={this.toggleButton}>
              {this.state.isActive ? "DeActivate" : "Activate"}
            </button>
          </div>
          <h5>{this.props.item.author}</h5>
          <p>{this.props.item.description} ...</p>
          <button className="ui button" onClick={this.onClick}>
            View Document
          </button>

        </div>
      )
    }
  }
}

